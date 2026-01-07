# Hướng dẫn Huấn luyện & Tích hợp Model AI (TensorFlow.js)

Tài liệu này hướng dẫn chi tiết quy trình xây dựng model AI phát hiện tin giả (Fake News Detection) cho Tiếng Việt, sau đó chuyển đổi để chạy trực tiếp trên Browser Extension (Client-side).

## Quy trình Tổng quan

1.  **Chuẩn bị Dữ liệu (Data Preparation)**: Thu thập dataset tin thật/giả tiếng Việt.
2.  **Huấn luyện Model (Training)**: Dùng Python (TensorFlow/Keras) để train model.
3.  **Chuyển đổi (Conversion)**: Convert model sang format `layers/graph model` của TF.js.
4.  **Tích hợp (Integration)**: Load và chạy model trong `content.js` của extension.

---

## Bước 1: Chuẩn bị Dữ liệu (Dataset)

Bạn cần dataset gồm 2 nhãn: `gán nhãn 0 (tin thật)` và `gán nhãn 1 (tin giả)`.

### Nguồn dữ liệu đề xuất:
*   **VN Fake News Dataset (VFND)**: [GitHub Link](https://github.com/WhySchools/VFND-vietnamese-fake-news-datasets)
*   **ReINTEL Dataset**: Dữ liệu từ cuộc thi phân loại tin giả trên mạng xã hội Việt Nam.
*   **Tự thu thập**:
    *   *Tin giả*: Copy nội dung từ các trang trong "Blacklist" (xem file `implementation_plan.md`).
    *   *Tin thật*: Crawl từ các báo chính thống (VnExpress, TuoiTre, DanTri).

### Định dạng dữ liệu (CSV):
```csv
text,label
"Bắt được nàng tiên cá tại Quảng Nam...",1
"Chính phủ ban hành nghị định mới về...",0
```

---

## Bước 2: Huấn luyện Model (Python)

Chúng ta sẽ dùng kiến trúc **LSTM** hoặc **Bi-LSTM** kết hợp với **Embedding** đơn giản để model nhẹ (< 5MB), phù hợp cho extension.

**File: `train_model.py`**

```python
import pandas as pd
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import json

# 1. Load Data
data = pd.read_csv('vietnamese_news.csv')
sentences = data['text'].astype(str).tolist()
labels = data['label'].tolist()

# 2. Preprocessing
# Cấu hình
VOCAB_SIZE = 10000  # Số lượng từ vựng phổ biến nhất
MAX_LENGTH = 100    # Độ dài tối đa của câu
OOV_TOK = "<OOV>"
EMBEDDING_DIM = 32

tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token=OOV_TOK)
tokenizer.fit_on_texts(sentences)
word_index = tokenizer.word_index

sequences = tokenizer.texts_to_sequences(sentences)
padded = pad_sequences(sequences, maxlen=MAX_LENGTH, padding='post', truncating='post')

# Lưu từ điển (tokenizer) để dùng trong extension (quan trọng!)
with open('tokenizer_word_index.json', 'w', encoding='utf-8') as f:
    json.dump(word_index, f, ensure_ascii=False)

# 3. Build Model
model = tf.keras.Sequential([
    tf.keras.layers.Embedding(VOCAB_SIZE, EMBEDDING_DIM, input_length=MAX_LENGTH),
    tf.keras.layers.GlobalAveragePooling1D(), # Hoặc dùng LSTM(32) nếu muốn chính xác hơn nhưng nặng hơn
    tf.keras.layers.Dense(24, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid') # Binary classification
])

model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# 4. Train
model.fit(padded, labels, epochs=10, validation_split=0.2)

# 5. Save Keras Model
model.save('my_fake_news_model.h5')
print("Model created and saved!")
```

---

## Bước 3: Chuyển đổi sang TensorFlow.js

Sử dụng thư viện `tensorflowjs` để convert model `.h5` sang định dạng web.

**Cài đặt:**
```bash
pip install tensorflowjs
```

**Lệnh convert:**
```bash
tensorflowjs_converter --input_format=keras \
                       --output_format=tfjs_layers_model \
                       my_fake_news_model.h5 \
                       ./tfjs_model_folder
```

**Kết quả (`./tfjs_model_folder`) sẽ chứa:**
*   `model.json`: Cấu trúc model.
*   `group1-shard1of1.bin`: Trọng số (weights) của model.

---

## Bước 4: Tích hợp vào Extension

### 4.1 Cấu trúc thư mục
Copy `tfjs_model_folder` và file `tokenizer_word_index.json` vào extension:
```
extension/
  ├── models/
  │   └── fake_news/
  │       ├── model.json
  │       └── group1-shard1of1.bin
  ├── list/
  │   └── tokenizer_word_index.json
  ├── lib/
  │   └── tf.min.js
  └── content.js
```

### 4.2 Code `content.js`

Bạn cần viết hàm tiền xử lý (preprocessing) bằng JS giống hệt Python (Tokenize -> Pad).

```javascript
// Load Model & Tokenizer
let model;
let wordIndex;
const MAX_LENGTH = 100;
const VOCAB_SIZE = 10000;

async function loadAssets() {
    // Lưu ý: Đường dẫn file cần khai báo trong web_accessible_resources của manifest.json
    model = await tf.loadLayersModel(chrome.runtime.getURL('models/fake_news/model.json'));
    const response = await fetch(chrome.runtime.getURL('list/tokenizer_word_index.json'));
    wordIndex = await response.json();
    console.log("Fake News Model Loaded");
}

function preprocess(text) {
    // 1. Lowercase & Split (Đơn giản hóa)
    // Trong thực tế cần tách từ tiếng Việt tốt hơn (ví dụ: dùng thư viện tách từ JS hoặc Regex đơn giản)
    const words = text.toLowerCase().split(/\s+/); 
    
    // 2. Tokenize & Pad
    const sequence = [];
    for (let i = 0; i < MAX_LENGTH; i++) {
        if (i < words.length) {
            const word = words[i];
            sequence.push(wordIndex[word] || 1); // 1 is <OOV> index usually (check tokenizer config)
        } else {
            sequence.push(0); // Padding
        }
    }
    return tf.tensor2d([sequence], [1, MAX_LENGTH]);
}

async function checkArticle() {
    const title = document.querySelector('h1')?.innerText || "";
    const content = document.querySelector('p')?.innerText || ""; // Lấy đoạn đầu
    const textToCheck = title + " " + content;

    if (textToCheck.length < 50) return;

    const inputTensor = preprocess(textToCheck);
    const prediction = model.predict(inputTensor);
    const score = (await prediction.data())[0];

    inputTensor.dispose(); // Giải phóng bộ nhớ

    if (score > 0.8) {
        // Có thể gửi message về background để hiện thông báo đẹp hơn
        alert("Cảnh báo: Bài viết này có dấu hiệu là tin giả/lừa đảo (Score: " + score.toFixed(2) + ")");
    }
}

// Init
loadAssets().then(() => {
    // Chạy check khi trang load xong, hoặc khi user scroll
    checkArticle();
});
```
