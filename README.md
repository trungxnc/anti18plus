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
    H --> I([Kết thúc quy trình])a