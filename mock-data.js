// ============================================================================
// BỘ DỮ LIỆU MẪU ĐA CHIỀU CHO HỆ THỐNG BI & SOLUTION AI AGENT
// Có đầy đủ kỳ thời gian (Tháng), kênh bán hàng, khu vực, dòng trùng/trống/hủy
// để kiểm nghiệm trọn vẹn: Kết nối -> Làm sạch -> Phân tích -> Báo cáo Giải pháp
// ============================================================================

window.BI_AGENT_PRESETS = {
  DEFAULT_BI_SAMPLE: {
    businessContext: "Doanh nghiệp bán lẻ đa kênh tại 3 khu vực Bắc, Trung, Nam",
    problemToSolve:
      "Doanh thu theo kênh và khu vực nào đạt hiệu quả cao nhất?\nChi phí vận hành & marketing ở kênh nào đang vượt ngưỡng an toàn?\nĐề xuất giải pháp giảm tỷ lệ hủy đơn và tối ưu hóa lợi nhuận ròng?",
    rawData: `Ky_Thang,Ma_Kenh,Ten_Kenh_Ban_Hang,Khu_Vuc,Trang_Thai_Don,Doanh_Thu_Trieu,Chi_Phi_Trieu,Ton_Kho_Trieu,So_Don_Hang,Ty_Le_Huy_Don_Pct,Ghi_Chu_Thuc_Te
2026-08,CH-01,Showroom Flagship Hà Nội,Miền Bắc,Hợp lệ,2850,340,480,1420,1.4,Doanh thu dẫn đầu miền Bắc; vòng quay kho nhanh
2026-09,CH-01,Showroom Flagship Hà Nội,Miền Bắc,Hợp lệ,3120,360,460,1560,1.3,Tăng trưởng ổn định; khách mua trực tiếp tỷ lệ hủy thấp
2026-10,CH-01,Showroom Flagship Hà Nội,Miền Bắc,Hợp lệ,3450,390,510,1710,1.2,Đạt đỉnh doanh số quý; biên lợi nhuận cao
2026-08,CH-02,Sàn TMĐT Shopee/Tiktok Bắc,Miền Bắc,Hợp lệ,1920,540,820,3800,8.2,Chi phí sàn và quảng cáo cao; hoàn đơn COD nhiều
2026-09,CH-02,Sàn TMĐT Shopee/Tiktok Bắc,Miền Bắc,Hợp lệ,2180,610,890,4150,8.9,Chi phí marketing chiếm 28% doanh thu; cần kiểm soát hoàn đơn
2026-10,CH-02,Sàn TMĐT Shopee/Tiktok Bắc,Miền Bắc,Hợp lệ,2180,610,890,4150,8.9,Chi phí marketing chiếm 28% doanh thu; cần kiểm soát hoàn đơn
2026-09,CH-03,Đại lý Phân phối Sỉ Hải Phòng,Miền Bắc,Đơn hủy,950,190,1150,120,19.5,Lô hàng sỉ bị hủy hợp đồng; tồn kho ứ đọng cao vượt doanh thu
2026-08,CH-04,Showroom Trung tâm Đà Nẵng,Miền Trung,Hợp lệ,1750,220,390,890,1.7,Vận hành chuẩn mực; chi phí logistics tối ưu
2026-09,CH-04,Showroom Trung tâm Đà Nẵng,Miền Trung,Hợp lệ,1940,240,410,960,1.6,Tỷ lệ giữ chân khách hàng cũ đạt 68%
2026-10,CH-04,Showroom Trung tâm Đà Nẵng,Miền Trung,Hợp lệ,2080,250,430,1020,1.5,Doanh thu tăng đều qua các tháng; chi phí trong hạn mức
2026-08,CH-05,Telesales & Social Miền Trung,Miền Trung,Hợp lệ,780,290,620,950,8.8,Chi phí chạy ads Facebook cao; chốt đơn qua điện thoại tỷ lệ hủy lớn
2026-09,CH-05,Telesales & Social Miền Trung,Miền Trung,Hợp lệ,810,305,650,1020,9.1,Cần thẩm định địa chỉ trước khi giao để giảm đơn hoàn
2026-10,CH-05,Telesales & Social Miền Trung,Miền Trung,Hợp lệ,840,310,670,1100,9.4,Chi phí quảng cáo chiếm 36.9% doanh thu; khách hủy COD cao
2026-08,CH-06,Showroom Flagship TP.HCM,Miền Nam,Hợp lệ,3980,450,640,2100,1.1,Hiệu suất sinh lời cao nhất toàn hệ thống
2026-09,CH-06,Showroom Flagship TP.HCM,Miền Nam,Hợp lệ,4250,470,660,2280,1.0,Mô hình mẫu cần nhân rộng quy trình bán hàng
2026-10,CH-06,Showroom Flagship TP.HCM,Miền Nam,Hợp lệ,4620,510,690,2490,1.1,Dẫn đầu tuyệt đối về doanh thu và kiểm soát chi phí
2026-08,CH-07,Website & App Bán lẻ Miền Nam,Miền Nam,Hợp lệ,2350,300,410,1720,2.3,Khách hàng trung thành mua lại qua ứng dụng di động
2026-09,CH-07,Website & App Bán lẻ Miền Nam,Miền Nam,Hợp lệ,2480,315,425,1840,2.2,Tỷ lệ cài app mới tăng 18%; biên lợi nhuận ổn định
2026-10,CH-07,Website & App Bán lẻ Miền Nam,Miền Nam,Hợp lệ,2620,330,440,1950,2.1,Kênh D2C biên lợi nhuận tốt; chi phí marketing chỉ 12.6%
2026-10,CH-08,Kênh Phân phối Tỉnh ĐBSCL,Miền Nam,Cần rà soát,1280,295,940,640,6.2,Tồn kho hàng chậm luân chuyển cao (73% DT); cần xả hàng`
  },

  ERROR_FLOW_SAMPLE: {
    businessContext: "Doanh nghiệp bán lẻ đa kênh tại 3 khu vực Bắc, Trung, Nam",
    problemToSolve:
      "Làm sạch số liệu tiền tệ hỗn hợp, lọc đơn hủy và phân tích doanh thu theo kênh để đề xuất giải pháp.",
    rawData: `Ky_Thang,Ma_Kenh,Ten_Kenh_Ban_Hang,Khu_Vuc,Trang_Thai_Don,Doanh_Thu_Trieu,Chi_Phi_Trieu,Ty_Le_Huy_Don_Pct
2026-10,CH-ERR-01,Showroom Hà Nội,Miền Bắc,Hợp lệ,2500,310,1.5
2026-10,CH-ERR-02,,Miền Bắc,Hợp lệ,CHU_KHONG_PHAI_SO,420,5.2
2026-10,CH-ERR-03,Kênh Đà Nẵng,Miền Trung,Hợp lệ,-1200,250,-4.5
DONG_BI_LOI_CAU_TRUC_KHONG_DU_COT_CSV`
  }
};
