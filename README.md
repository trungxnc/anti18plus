
# 🛡️ Project: Web Shield 18+ (Ultimate Content Filter)

**Web Shield 18+** là một Browser Extension thế hệ mới, được thiết kế để bảo vệ người dùng khỏi các nội dung không phù hợp. Dự án tập trung vào 3 trụ cột: **Hiệu suất cực cao**, **Bảo mật quyền riêng tư** và **Trí tuệ nhân tạo (Local AI)**.

---

## 🏗️ 1. Kiến trúc hệ thống (Architecture)

Hệ thống sử dụng mô hình **Multi-Layer Filtering** (Lọc đa lớp) để đảm bảo không một nội dung xấu nào lọt qua mà vẫn giữ được tốc độ duyệt web mượt mà.

### Quy trình xử lý (Logic Flow)

```mermaid
graph TD
    A[Người dùng nhập URL/Click link] --> B{Lớp 1: Static Filter<br/>DNR Engine}
    B -- "Match Blacklist" --> C[Chặn ngay lập tức & Redirect]
    B -- "No Match" --> D[Cho phép tải trang & Inject Content Script]
    
    D --> E{Lớp 2: Content Scan<br/>DOM Analysis}
    E -- "Chứa từ khóa nhạy cảm" --> C
    E -- "Nội dung nghi vấn" --> F{Lớp 3: Dynamic AI<br/>Vision Analysis}
    
    F -- "Xác nhận 18+" --> G[Làm mờ ảnh & Chặn trang]
    F -- "An toàn" --> H[Hiển thị trang đầy đủ]
    
    G --> C
    H --> I([Kết thúc quy trình])

```

---

## 🗄️ 2. Mô hình dữ liệu (Database Schema)

Dự án sử dụng cơ chế đồng bộ giữa Backend (Oracle/PostgreSQL) và bộ nhớ tạm thời tại trình duyệt (IndexedDB).

### Sơ đồ thực thể quan hệ (ERD)

```mermaid
erDiagram
    USER ||--o{ CONFIG : "quản lý"
    USER ||--o{ VIOLATION_LOG : "phát hiện"
    CATEGORY ||--o{ DOMAIN_LIST : "phân loại"
    
    USER {
        int user_id PK
        string username
        string password_hash
        string role "Parent/Admin"
    }
    DOMAIN_LIST {
        int domain_id PK
        string domain_name UK "Indexed"
        int category_id FK
        string source "Community/System"
    }
    VIOLATION_LOG {
        int log_id PK
        int user_id FK
        string url
        string reason "Keyword/Domain/AI"
        datetime event_time
    }

```

---

## 🛠️ 3. Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Mục đích |
| --- | --- | --- |
| **Extension** | JavaScript (Manifest V3) | Tối ưu hóa hiệu suất và bảo mật trình duyệt. |
| **AI Engine** | TensorFlow.js (NSFW-JS) | Nhận diện ảnh 18+ trực tiếp trên GPU máy khách. |
| **Backend** | Node.js (Fastify) | Siêu nhẹ, tiêu tốn ít RAM (<100MB), xử lý JSON cực nhanh. |
| **Database** | PostgreSQL + Redis | Lưu trữ bền vững kết hợp với Cache để tăng tốc truy xuất. |
| **DevOps** | Docker, GitHub Actions | Triển khai nhanh chóng và tự động hóa. |

---

## 📅 4. Lộ trình phát triển (Project Roadmap)

### Giai đoạn 1: Nền tảng & Chặn tĩnh (Tuần 1-2)

* [ ] Khởi tạo Boilerplate Extension với Manifest V3.
* [ ] Xây dựng file `rules.json` ban đầu (hơn 10,000 domain).
* [ ] Thiết kế giao diện trang `blocked.html`.
* [ ] Triển khai tính năng Whitelist/Blacklist thủ công.

### Giai đoạn 2: Backend & Đồng bộ hóa (Tuần 3-4)

* [ ] Xây dựng Spring Boot API quản lý danh sách domain.
* [ ] Viết script Crawler tự động lấy dữ liệu từ các nguồn cộng đồng.
* [ ] Cơ chế Sync: Extension tải các bản cập nhật mới (Incremental Update).

### Giai đoạn 3: Trí tuệ nhân tạo & Phân tích động (Tuần 5-6)

* [ ] Tích hợp **TensorFlow.js** vào Content Script.
* [ ] Phát triển logic quét DOM: phân tích Title, Meta Tags và mật độ từ khóa.
* [ ] Tính năng "Safe Blur": Làm mờ ảnh nhạy cảm trước khi hiển thị.

### Giai đoạn 4: Tối ưu & Kiểm thử (Tuần 7-8)

* [ ] Triển khai thuật toán **Bloom Filter** để tối ưu bộ nhớ Local.
* [ ] Kiểm thử hiệu năng (Load Test) bằng **Vegeta**.
* [ ] Đóng gói Docker và phát hành bản thử nghiệm (Beta).

---

## 🚀 5. Giải pháp tối ưu hóa chuyên sâu

1. **Hiệu suất:** Tận dụng API `declarativeNetRequest` để trình duyệt tự động chặn ở mức network, không gây lag CPU.
2. **Dữ liệu lớn:** Sử dụng **Bloom Filter** để nén danh sách 1 triệu domain xuống chỉ còn vài MB, giúp tra cứu với độ trễ gần như bằng 0.
3. **Quyền riêng tư:** Mọi quá trình phân tích hình ảnh/văn bản đều diễn ra **Local** trên máy người dùng, không gửi dữ liệu về Server.

---

## 💻 6. Hướng dẫn cài đặt nhanh

1. **Extension:**
* Truy cập `chrome://extensions/`.
* Bật **Developer mode**.
* Chọn **Load unpacked** và dẫn tới thư mục `/extension`.


2. **Backend:**
* Yêu cầu: JDK 21, Docker.
* Chạy lệnh: `docker-compose up -d`.


3. **Database:**
* Thực thi các script trong thư mục `/database/setup.sql`.



---

**Đóng góp:** Mọi Pull Request đều được chào đón nhằm xây dựng môi trường mạng an toàn hơn.
**Ngày khởi tạo:** 06/01/2026