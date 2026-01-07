# Phase 3: AI & Dynamic Analysis Implementation Plan

## Goal
Integrate client-side AI analysis to detect and block explicit content (images) that slips through the domain blocklist.

## User Review Required
> [!IMPORTANT]
> **Performance Impact**: AI analysis interacts with the GPU. We will use **IntersectionObserver** to only scan images as they scroll into view to minimize lag.
> **Model Storage**: We will download the **NSFWJS (MobileNet v2)** model (~4MB) and bundle it with the extension to ensure **Offline Privacy**. No images are sent to any server.

## Proposed Changes

### 1. Library & Model Setup
*   **Location**: `extension/lib/tf.min.js`, `extension/lib/nsfwjs.min.js`.
*   **Model**: `extension/models/quantized/*`.
*   **Method**: Download pre-trained models and scripts manually (simulated via script) into the extension folder.

### 2. Content Script Upgrades (`content.js`)
*   **Initialization**: Load TFJS engine and NSFW Model on startup.
*   **Scanning Strategy**:
    1.  Observe DOM for new `<img>` elements.
    2.  Use `IntersectionObserver` to trigger scan when image enters viewport.
    3.  Check image against model.
*   **Action**:
    *   If `probability.Porn > 0.6` OR `probability.Hentai > 0.6`:
        *   Apply CSS `filter: blur(30px)`.
        *   Overlay a specific warning icon.

### 3. Text/DOM Analysis
*   Scan `<title>`, `<meta name="description">`, and `<h1>` tags for keywords (e.g., "xxx", "porn", "betting").
*   If keyword density is high -> Redirect to Blocked Page immediately.

## Verification Plan

### Manual Testing
1.  Visit a safe site (Google Images) -> Ensure no lag/false positives.
2.  Visit a test site -> Ensure explicit images are blurred.
3.  Check Console logs for "Model Loaded" and "Image Scanned".

### 4. Performance Optimization
*   **WASM Backend**: Switch from CPU to `tf-backend-wasm` for substantial speedup (10x-20x) on image inference.
*   **Web Workers**: (Optional) Move inference to a background thread to prevent UI freezing.

## Phase 4: Fake News & Misinformation Detection (New)

### Goal
Alert users when they visit known misinformation sources or view articles with high "clickbait/fake" probability.

### Proposed Changes

#### 1. Domain Reputation System (Static)
*   **Database**: Integrate open-source lists of low-credibility domains (e.g., IFFY, OpenSources).
*   **Mechanism**:
    *   Check `window.location.hostname` against the bundled blocklist.
    *   If matched -> Show a "Low Credibility Source" warning banner (dismissible).
    *   **Vietnamese Blacklist**: Integrate lists from **tinnhiemmang.vn** (NCSC) and **ChongLuadao**.

#### 2. AI Text Analysis (Dynamic)
*   **Training Guide**: See detailed instructions in [`docs/tfjs_training_guide.md`](file:///d:/Sample/anti18plus/docs/tfjs_training_guide.md).
*   **Model**:
    *   **Option A (Lightweight)**: Custome LSTM/Embedding trained on VFND/ReINTEL datasets.
    *   **Option B**: DistilBERT (quantized) converted to TFJS (higher accuracy, larger download ~30MB).
    *   *Recommendation*: Option A (Custom LSTM) for optimal performance/size balance.
*   **Workflow**:
    1.  Extract Article Title (`<h1>`, `<title>`) and Content (`<article>` or `p` tags).
    2.  Run inference in `content.js` (or Web Worker).
    3.  If `FakeScore > 0.8` -> Alert user: "This article shows signs of misleading content."

### Verification
1.  **Unit Tests**: Test text classifier with known true/fake headlines.
2.  **Integration**: Visit known satire sites (e.g., The Onion) -> Verify warning appears.

## Verification Plan

### Manual Testing
1.  Visit a safe site (Google Images) -> Ensure no lag/false positives.
2.  Visit a test site -> Ensure explicit images are blurred.
3.  Check Console logs for "Model Loaded" and "Image Scanned".

### Resources
*   TF.js Graph Model (MobileNet V2)
*   [NSFWJS GitHub](https://github.com/infinitered/nsfwjs) - Original model source and training data.
*   **Fake News Resources**:
    *   [Fake News Detector (Extension)](https://github.com/topics/fake-news-detector-extension)
    *   [Newsful Extension](https://github.com/centille/newsful)
    *   [Detect-Fake-News-TFJS](https://github.com/tensorflow/tfjs-examples/tree/master/sentiment) (Sentiment example can be adapted)
    *   [Kaggle Fake News Dataset](https://www.kaggle.com/c/fake-news/data) for training custom models.
    *   **Vietnamese Datasets**:
        *   [VFND (Vietnamese Fake News Dataset)](https://github.com/WhySchools/VFND-vietnamese-fake-news-datasets)
        *   ReINTEL Dataset (Social Listening).
    *   **Vietnamese Blacklists**:
        *   [Tin Nhiệm Mạng (NCSC)](https://tinnhiemmang.vn/website-lua-dao)
        *   [ChongLuaDao](https://chongluadao.vn/)
