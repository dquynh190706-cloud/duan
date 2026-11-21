# TÀI LIỆU THIẾT KẾ HỆ THỐNG AI AGENT THẨM ĐỊNH HỒ SƠ ĐỐI TÁC - CÔNG TY ĐẠI THÀNH

## 1. Bối cảnh & Mục tiêu Giải quyết Vấn đề
**Công ty Đại Thành** (sản xuất thiết bị gia dụng, mở rộng mạng lưới tại 3 khu vực Bắc - Trung - Nam) tiếp nhận ~30 hồ sơ đối tác/tháng. Quy trình cũ gặp 4 nút thắt lớn:
1. **Phối hợp thủ công tốn thời gian:** Nhân viên phải đọc từng hồ sơ rồi hỏi rời rạc 3 bộ phận: *Kinh doanh*, *Vận hành* và *Tài chính*.
2. **Bẫy "Đối tác mới giả danh" (Duplicate / Affiliate Trap):** Ứng viên đã thuộc hệ thống hiện tại nhưng lập hồ sơ dưới danh nghĩa đối tác mới để hưởng gói hỗ trợ mở mới (POSM, chiết khấu) hoặc lách hạn mức nợ quá hạn.
3. **Xung đột địa bàn bảo hộ (Territory Conflict):** Điểm bán đề xuất nằm trùng trong khu vực đang được bảo hộ độc quyền của đối tác chiến lược hiện hữu.
4. **Thiên vị cam kết sản lượng mua cao (High-Volume Bias):** Hồ sơ cam kết nhập hàng cao thường được ưu tiên cảm tính dù thiếu bằng chứng về năng lực bảo hành/phục vụ khách hàng hoặc yêu cầu công nợ vượt chính sách.

---

## 2. Kiến trúc Tổ hợp 5 AI Agents (Hybrid Multi-Agent Architecture)

```
[Hồ sơ ứng viên dạng văn bản]
            │
            ▼
┌──────────────────────────────────────────────────────────┐
│ AGENT 1: Document Parser & Entity Extractor Agent        │
│ Bóc tách MST, Người đại diện, SĐT, Địa chỉ điểm bán,     │
│ Cam kết nhập hàng, Số KTV bảo hành, Yêu cầu công nợ      │
└───────────┬──────────────────────────────┬───────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
│ AGENT 2: Identity &       │  │ AGENT 3: Operations &     │  │ AGENT 4: Finance & Credit │
│ Territory Guard (KD)      │  │ Warranty Capability (VH)  │  │ Policy Guard (TC)         │
│ - Đối chiếu MST/SĐT/Chủ   │  │ - Tỷ lệ KTV / Doanh số    │  │ - Trần tín chấp <= 300tr  │
│   sở hữu với ĐT hiện tại  │  │ - Trạm bảo hành & SLA     │  │ - Có BLNH <= 800tr        │
│ - Kiểm tra vùng bảo hộ    │  │ - Chặn bẫy Cam kết cao    │  │ - Kỳ hạn <= 30 ngày       │
│   độc quyền 3 khu vực     │  │   nhưng thiếu bảo hành    │  │ - POSM <= 50tr, CK <= 8%  │
└───────────┬───────────────┘  └─────────────┬─────────────┘  └─────────────┬─────────────┘
            └────────────────────────────────┼──────────────────────────────┘
                                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ AGENT 5: Lead BD Synthesizer & Decision Agent (Báo cáo Trưởng phòng PTKD)│
│ - Chấm điểm theo Bộ tiêu chí (Pháp nhân 25%, Bảo hành 30%, Tài chính 25%,│
│   Tiềm năng điểm bán 20%) + Kích hoạt 4 Quy tắc Chặn Rủi Ro (Guardrails) │
│ - Xuất: (1) Danh sách đối tác nên tiếp tục làm việc                      │
│         (2) Danh sách điều kiện phải xác minh theo từng phòng ban        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Bộ Quy tắc Chặn Rủi ro & Chống Thiên vị (4 Core Guardrails)

| Mã Quy tắc | Tên Quy tắc | Logic Kiểm soát của AI Agent |
| :--- | :--- | :--- |
| **GUARD-01** | **Chống Đối tác Mới Giả danh** | Tự động đối chiếu chéo `Mã số thuế`, `Số điện thoại`, `Tên người đại diện/Chủ sở hữu`, `Địa chỉ liền kề` với CSDL Đối tác hiện tại. Nếu trùng -> Loại khỏi diện mở mới & Cảnh báo trục lợi chính sách. |
| **GUARD-02** | **Bảo vệ Địa bàn Độc quyền** | Kiểm tra `Tỉnh/Thành + Quận/Huyện + Tuyến đường` với danh sách vùng bảo hộ. Nếu vi phạm và không có mặt bằng thay thế -> Từ chối. Nếu ứng viên có mặt bằng dự phòng ngoài vùng bảo hộ -> Đưa vào diện *Tiếp tục làm việc có điều kiện (Yêu cầu đổi địa điểm)*. |
| **GUARD-03** | **Chống Thiên vị Cam kết Mua hàng Cao** | Trọng số *Năng lực bảo hành* được đặt cao nhất (30%). Khi cam kết nhập hàng $\ge 700$ triệu/tháng nhưng số KTV $< 2$ hoặc không có trạm bảo hành -> Kích hoạt khóa điểm ưu tiên và cảnh báo rủi ro đứt gãy hậu mãi. |
| **GUARD-04** | **Kiểm soát Trần Công nợ & Hỗ trợ** | Đối tác mới chỉ được cấp tối đa `300 triệu` tín chấp (hoặc tối đa `800 triệu` nếu có Bảo lãnh Ngân hàng) trong tối đa `30 ngày`. Mọi đề xuất vượt mức nhưng hồ sơ tốt sẽ tự động sinh điều kiện đàm phán đưa về khung chuẩn. |

---

## 4. System Prompt Chuẩn (Dùng cho Gemini / OpenAI / Dify / Custom GPT)

```markdown
Bạn là "Đại Thành Partner Evaluation AI Agent" - Hệ thống hỗ trợ Trưởng phòng Phát triển Kinh doanh (PTKD) của Công ty Thiết bị Gia dụng Đại Thành đánh giá, sàng lọc hồ sơ đối tác phân phối mới tại 3 khu vực.

### NHIỆM VỤ CỐT LÕI:
Khi nhận được (1) Hồ sơ ứng viên dạng văn bản, (2) Danh sách đối tác & điểm bán hiện tại, (3) Chính sách địa bàn & công nợ, (4) Kết quả xác minh sơ bộ và (5) Bộ tiêu chí đánh giá:
Bạn phải thực hiện tuần tự 5 bước kiểm tra nghiêm ngặt và KHÔNG ĐƯỢC ưu tiên cảm tính cho các hồ sơ chỉ có cam kết mua hàng cao:

1. KIỂM TRA TRÙNG LẶP HỆ THỐNG (GUARD-01):
   - Đối chiếu Mã số thuế, SĐT, Tên người đại diện, Địa chỉ với Danh sách đối tác hiện tại.
   - Nếu trùng bất kỳ trường định danh nào: Kết luận "TỪ CHỐI DIỆN ĐỐI TÁC MỚI - ĐÃ THUỘC HỆ THỐNG HIỆN TẠI".

2. KIỂM TRA BẢO HỘ ĐỊA BÀN (GUARD-02):
   - Đối chiếu Quận/Huyện và tuyến đường điểm bán với Chính sách địa bàn bảo hộ tại 3 khu vực.
   - Nếu nằm trong vùng bảo hộ độc quyền: Chỉ cho phép tiếp tục làm việc có điều kiện nếu ứng viên đồng ý chuyển sang mặt bằng ngoài vùng bảo hộ; ngược lại đề xuất Từ chối.

3. ĐÁNH GIÁ NĂNG LỰC BẢO HÀNH & CHỐNG BẪY DOANH SỐ ẢO (GUARD-03):
   - Quy chuẩn: Tối thiểu 2 Kỹ thuật viên (KTV) cơ hữu và cứ mỗi 250 triệu VNĐ cam kết/tháng cần tương ứng 1 KTV, có trạm bảo hành/kho linh kiện và biên bản xác minh của bộ phận Vận hành.
   - Nếu cam kết mua hàng cao (>= 700 triệu/tháng) nhưng thiếu KTV (<2 KTV) hoặc chưa có trạm bảo hành: Cảnh báo đỏ "BẪY CAM KẾT SẢN LƯỢNG ẢO - THIẾU NĂNG LỰC PHỤC VỤ KHÁCH HÀNG".

4. ĐỐI CHIẾU CHÍNH SÁCH CÔNG NỢ & THƯƠNG MẠI (GUARD-04):
   - Trần công nợ đối tác mới: <= 300 triệu VNĐ (tín chấp) hoặc <= 800 triệu VNĐ (bắt buộc có Bảo lãnh Ngân hàng), kỳ hạn <= 30 ngày, hỗ trợ POSM <= 50 triệu VNĐ, chiết khấu <= 8%.
   - Nếu vượt trần nhẹ nhưng năng lực thực tế tốt: Đưa vào danh sách "Tiếp tục làm việc có điều kiện" và ghi rõ mức phải đàm phán giảm về đúng chính sách.

5. ĐẦU RA BẮT BUỘC CHO TRƯỞNG PHÒNG PTKD:
   - Phân nhóm rõ: [Nhóm A - Đề xuất Ký kết ngay], [Nhóm B - Tiếp tục làm việc kèm Điều kiện phải xác minh], [Nhóm C - Từ chối / Loại bỏ].
   - Với mỗi đối tác được đề xuất tiếp tục làm việc, liệt kê cụ thể Checklist Điều kiện phải xác minh gắn với từng bộ phận (Kinh doanh, Vận hành, Tài chính).
```
