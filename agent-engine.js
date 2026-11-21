// ============================================================================
// DATAMIND AI — ENGINE AGENT ĐỌC BỐI CẢNH, PHÂN TÍCH DỮ LIỆU & ĐỀ XUẤT GIẢI PHÁP
// Hoạt động độc lập với mọi bài toán & tập dữ liệu doanh nghiệp bất kỳ
// ============================================================================

class EnterpriseSolutionAgentEngine {
  constructor() {
    this.defaultApiKey = "AQ.Ab8RN6LlTt916N-uJPIVXMrS9Raqh6qQvS22nJ_s5JqapdulDw";
    this.geminiCandidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemma-4-31b-it"
    ];
  }

  normalizeText(str) {
    if (!str) return "";
    return str
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async callGeminiWithFallback(promptText, apiKey) {
    const effectiveKey = (apiKey || this.defaultApiKey || "").trim();
    let lastError = null;

    for (const modelId of this.geminiCandidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(
        effectiveKey
      )}`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.25 }
          })
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          lastError = new Error(`Model ${modelId} HTTP ${response.status}: ${errBody}`);
          continue;
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const textOut = parts
          .map((p) => p.text || "")
          .join("\n")
          .trim();
        if (textOut) {
          return { text: textOut, modelUsed: modelId };
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Không thể kết nối tới Gemini API.");
  }

  // --------------------------------------------------------------------------
  // BƯỚC 3 (DIAMOND NODE): KIỂM TRA DỮ LIỆU THÔ & CHẨN ĐOÁN VỊ TRÍ LỖI (NHÁNH NO)
  // --------------------------------------------------------------------------
  validateAndDiagnoseRawData(contextText, rawDataText) {
    const errors = [];
    const ctx = (contextText || "").trim();
    const raw = (rawDataText || "").trim();

    if (!ctx || ctx.length < 15) {
      errors.push({
        location: "Mục 1A: Bối cảnh & Vấn đề Doanh nghiệp",
        field: "Bối cảnh (Context)",
        rawValue: ctx || "(Trống)",
        errorType: "Thiếu bối cảnh bài toán",
        howItFailed: "Agent chưa nhận đủ mô tả bối cảnh và vấn đề doanh nghiệp đang gặp phải (tối thiểu 15 ký tự).",
        suggestedFix: "Nhập mô tả bối cảnh, nỗi đau/vấn đề của doanh nghiệp và mục tiêu cần giải quyết."
      });
    }

    if (!raw) {
      errors.push({
        location: "Cột phải: Dữ liệu thô (.xlsx, .csv, .json)",
        field: "Tệp dữ liệu / Số liệu đầu vào",
        rawValue: "(Chưa có dữ liệu - 0 dòng)",
        errorType: "Chưa cung cấp dữ liệu số để phân tích",
        howItFailed: "Bạn chưa tải tệp dữ liệu (.xlsx, .csv, .json) và chưa dán bảng số liệu nào. Agent không thể tự suy diễn hoặc phân tích khi chưa có dữ liệu số thực tế.",
        suggestedFix: "Hãy nhấn 'Chọn tệp dữ liệu từ máy' để tải file lên, hoặc nhấn 'Dán CSV/JSON' để nhập bảng số liệu (hoặc bấm nút '✨ Chạy thử Mẫu BI' trên đầu trang nếu muốn nạp bộ số liệu mẫu)."
      });
      return { canProcess: false, errors };
    }

    // Kiểm tra nếu là file nhị phân .xlsx chưa được giải mã
    if (raw.startsWith("PK\u0003\u0004")) {
      errors.push({
        location: "Tệp Excel (.xlsx)",
        field: "Định dạng nhị phân",
        rawValue: "PK\\x03\\x04 (Binary ZIP/XLSX)",
        errorType: "Không đọc được cấu trúc bảng",
        howItFailed: "Tệp tải lên đang ở dạng nhị phân chưa chuyển đổi sang bảng dữ liệu.",
        suggestedFix: "Vui lòng chọn lại tệp .xlsx hoặc lưu dưới dạng .csv (UTF-8)."
      });
      return { canProcess: false, errors };
    }

    // Kiểm tra nếu là JSON
    if (raw.startsWith("{") || raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 0) {
          errors.push({
            location: "File JSON (Dòng 1)",
            field: "Root Array",
            rawValue: "[]",
            errorType: "Mảng JSON rỗng",
            howItFailed: "Cú pháp JSON hợp lệ nhưng không có bản ghi nào bên trong.",
            suggestedFix: "Thêm ít nhất 1 đối tượng dữ liệu vào mảng JSON."
          });
        }
      } catch (e) {
        errors.push({
          location: "File dữ liệu JSON",
          field: "Cú pháp JSON",
          rawValue: raw.slice(0, 100) + "...",
          errorType: "Lỗi cú pháp JSON (SyntaxError)",
          howItFailed: `Không thể đọc cấu trúc JSON: ${e.message}`,
          suggestedFix: "Kiểm tra lại dấu ngoặc nhọn {}, dấu phẩy và dấu nháy kép."
        });
      }
      return { canProcess: errors.length === 0, errors };
    }

    // Kiểm tra nếu là bảng CSV
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2 || !lines[0].includes(",")) {
      errors.push({
        location: "Nội dung Dữ liệu thô (Dòng 1)",
        field: "Cấu trúc bảng số liệu",
        rawValue: lines[0] ? lines[0].slice(0, 90) : "(Trống)",
        errorType: "Chưa có bảng dữ liệu số hợp lệ",
        howItFailed: "Dữ liệu đầu vào không phải là bảng CSV/Excel hoặc JSON có các cột số liệu (cần tối thiểu 1 dòng tiêu đề cột và 1 dòng số liệu phân tách bằng dấu phẩy).",
        suggestedFix: "Tải tệp Excel (.xlsx), CSV (.csv), JSON (.json) có chứa các cột số liệu thực tế (VD: Doanh thu, Chi phí, Số lượng...)."
      });
      return { canProcess: false, errors };
    }

    if (lines.length >= 2 && lines[0].includes(",")) {
      const headers = lines[0].split(",").map((h) => h.trim());
      if (headers.length < 3) {
        errors.push({
          location: "Dòng 1 (Tiêu đề cột CSV)",
          field: "Header",
          rawValue: lines[0],
          errorType: "Thiếu cột dữ liệu",
          howItFailed: `Dòng tiêu đề chỉ có ${headers.length} cột, không đủ chiều thông tin để phân tích.`,
          suggestedFix: "Cung cấp bảng dữ liệu có tối thiểu 3 cột phân tách bằng dấu phẩy (,)."
        });
      }

      // Xác định các cột có tên mang tính định lượng (Doanh thu, Chi phí, Tồn kho, Số lượng, Tỷ lệ...)
      const isNumericHeaderName = (h) =>
        /doanh_thu|doanh_so|chi_phi|ton_kho|so_luong|so_nhan_su|ty_le|phan_tram|kpi|no_|ngan_sach|gia_tri|cam_ket|loi_nhuan|gia_|don_gia|thanh_tien|revenue|cost|profit|sales|quantity|amount|price|cong_no/i.test(
          (h || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_")
        );
      const expectedNumericCols = headers.filter((h) => isNumericHeaderName(h));

      // Xác định cột tên hoặc định danh chính của đối tượng
      const nameColKey =
        headers.find((h) => /ten_|name|kenh|don_vi|chi_nhanh|showroom|doi_tac/i.test(h)) ||
        headers[1] ||
        headers[0];

      for (let i = 1; i < lines.length; i++) {
        const rowNum = i + 1;
        const line = lines[i];
        const cols = line.split(",").map((c) => c.trim());

        if (cols.length < Math.min(3, headers.length)) {
          errors.push({
            location: `Dòng ${rowNum} trong bảng dữ liệu`,
            field: "Cấu trúc phân tách cột",
            rawValue: line,
            errorType: "Dòng dữ liệu bị hỏng cấu trúc",
            howItFailed: `Dòng ${rowNum} chỉ có ${cols.length} trường trong khi tiêu đề bảng có ${headers.length} cột.`,
            suggestedFix: `Xóa dòng hỏng tại Dòng ${rowNum} hoặc bổ sung đầy đủ dấu phẩy phân cách cột.`
          });
          continue;
        }

        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] !== undefined ? cols[idx] : "";
        });

        // Kiểm tra cột định danh/tên đơn vị (Bắt buộc không được để trống)
        if (nameColKey && (!rowObj[nameColKey] || !rowObj[nameColKey].trim())) {
          errors.push({
            location: `Dòng ${rowNum}, Cột "${nameColKey}"`,
            field: nameColKey,
            rawValue: `(Trống) tại bản ghi ${rowObj[headers[0]] || "#" + i}`,
            errorType: "Bỏ trống trường tên/định danh bắt buộc",
            howItFailed: `Cột "${nameColKey}" tại Dòng ${rowNum} bị bỏ trống khiến Agent không thể xác định đối tượng phân tích.`,
            suggestedFix: `Điền tên đơn vị/đối tượng vào Cột "${nameColKey}" ở Dòng ${rowNum}.`
          });
        }

        // Kiểm tra các cột số học
        for (const numCol of expectedNumericCols) {
          const rawVal = rowObj[numCol];
          const numVal = Number(String(rawVal ?? "").replace(/,/g, ""));
          if (rawVal === "" || isNaN(numVal)) {
            errors.push({
              location: `Dòng ${rowNum}, Cột "${numCol}"`,
              field: numCol,
              rawValue: rawVal || "(Trống)",
              errorType: "Sai kiểu dữ liệu (Nhập chữ vào cột số)",
              howItFailed: `Cột chỉ số "${numCol}" yêu cầu giá trị số nhưng tại Dòng ${rowNum} lại chứa "${rawVal}".`,
              suggestedFix: `Sửa giá trị "${rawVal}" tại Dòng ${rowNum}, Cột "${numCol}" thành con số hợp lệ.`
            });
          } else if (numVal < 0) {
            errors.push({
              location: `Dòng ${rowNum}, Cột "${numCol}"`,
              field: numCol,
              rawValue: String(rawVal),
              errorType: "Giá trị âm bất hợp lý",
              howItFailed: `Chỉ số "${numCol}" tại Dòng ${rowNum} có giá trị âm (${numVal}), không hợp lệ về mặt nghiệp vụ.`,
              suggestedFix: `Chuyển giá trị tại Dòng ${rowNum}, Cột "${numCol}" thành số dương (>= 0).`
            });
          }
        }
      }

      // Kiểm tra xem toàn bảng có ít nhất 1 cột chứa dữ liệu số thực sự hay không
      let hasAnyNumericColumn = false;
      for (let cIdx = 0; cIdx < headers.length; cIdx++) {
        let validNumCount = 0;
        for (let rIdx = 1; rIdx < lines.length; rIdx++) {
          const cells = lines[rIdx].split(",");
          const cellVal = (cells[cIdx] || "").trim();
          const num = Number(cellVal.replace(/,/g, ""));
          if (cellVal !== "" && !isNaN(num) && !/^0[0-9]{8,11}$/.test(cellVal)) {
            validNumCount++;
          }
        }
        if (validNumCount >= Math.max(1, Math.ceil((lines.length - 1) * 0.5))) {
          hasAnyNumericColumn = true;
          break;
        }
      }

      if (!hasAnyNumericColumn && errors.length === 0) {
        errors.push({
          location: "Toàn bộ các cột trong bảng dữ liệu",
          field: headers.join(", "),
          rawValue: lines[1] || "",
          errorType: "Thiếu dữ liệu số định lượng (No Numeric Data)",
          howItFailed: "Bảng dữ liệu chỉ chứa văn bản chữ, không có bất kỳ cột số liệu nào (như Doanh thu, Chi phí, Số lượng, Tỷ lệ...) để Agent tính toán thống kê.",
          suggestedFix: "Bổ sung ít nhất 1 cột chứa số liệu định lượng vào bảng dữ liệu."
        });
      }
    }

    return {
      canProcess: errors.length === 0,
      errors
    };
  }

  // Tự động làm sạch & sửa sạch 100% lỗi dữ liệu thô khi người dùng nhấn nút "Tự động sửa lỗi"
  autoFixCorruptedRawData(rawDataText) {
    let text = (rawDataText || "").trim();
    if (!text) {
      // Nếu dữ liệu trống hoàn toàn, sử dụng mẫu dữ liệu chuẩn
      return typeof presets !== "undefined" && presets.DEFAULT_BI_SAMPLE
        ? presets.DEFAULT_BI_SAMPLE.rawData
        : "";
    }

    // 1. Nếu là định dạng JSON
    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        let parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) parsed = [parsed];
        if (parsed.length === 0) {
          return typeof presets !== "undefined" && presets.DEFAULT_BI_SAMPLE
            ? presets.DEFAULT_BI_SAMPLE.rawData
            : "";
        }
        const keys = Object.keys(parsed[0] || {});
        parsed.forEach((obj, idx) => {
          keys.forEach((k) => {
            if (/doanh_thu|chi_phi|so_luong|gia|ty_le|ton_kho|kpi/i.test(k)) {
              let n = parseFloat(String(obj[k]).replace(/,/g, ""));
              obj[k] = isNaN(n) ? 1000 : Math.abs(n);
            } else if (!obj[k]) {
              obj[k] = `Đơn vị #${idx + 1}`;
            }
          });
        });
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Nếu lỗi JSON cú pháp nặng, chuyển sang bộ số liệu mẫu
        return typeof presets !== "undefined" && presets.DEFAULT_BI_SAMPLE
          ? presets.DEFAULT_BI_SAMPLE.rawData
          : "";
      }
    }

    // 2. Nhận diện dấu phân cách: dấu phẩy (,), chấm phẩy (;), hoặc tab (\t)
    let rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (rawLines.length === 0) {
      return typeof presets !== "undefined" && presets.DEFAULT_BI_SAMPLE
        ? presets.DEFAULT_BI_SAMPLE.rawData
        : "";
    }

    let delimiter = ",";
    const firstLine = rawLines[0] || "";
    if (firstLine.includes(";") && !firstLine.includes(",")) {
      delimiter = ";";
    } else if (firstLine.includes("\t") && !firstLine.includes(",")) {
      delimiter = "\t";
    }

    // Chuẩn hóa delimiter sang dấu phẩy
    if (delimiter !== ",") {
      rawLines = rawLines.map((line) => line.split(delimiter).map((c) => c.trim()).join(","));
    }

    let headers = rawLines[0].split(",").map((h) => h.trim());

    // Nếu tiêu đề bị thiếu cột (ít hơn 3 cột), bổ sung các cột chuẩn BI
    if (headers.length < 3) {
      headers = [
        "Ky_Thang",
        "Ma_Kenh",
        "Ten_Kenh_Ban_Hang",
        "Khu_Vuc",
        "Trang_Thai_Don",
        "Doanh_Thu_Trieu",
        "Chi_Phi_Trieu",
        "Ty_Le_Huy_Don_Pct"
      ];
    }

    // Hàm nhận diện tên cột số học
    const isNumericColName = (colName) => {
      const norm = (colName || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");
      return /doanh_thu|doanh_so|chi_phi|ton_kho|so_luong|so_nhan_su|ty_le|phan_tram|kpi|no_|ngan_sach|gia_tri|cam_ket|loi_nhuan|gia_|don_gia|thanh_tien|revenue|cost|profit|sales|quantity|amount|price|cong_no/i.test(
        norm
      );
    };

    // Xác định các cột số học theo header
    let numericHeaderIndices = new Set();
    headers.forEach((h, idx) => {
      if (isNumericColName(h)) numericHeaderIndices.add(idx);
    });

    // Nếu tiêu đề chưa có cột số, quét các dòng dưới để tìm cột chứa số thực tế
    if (numericHeaderIndices.size === 0) {
      for (let cIdx = 0; cIdx < headers.length; cIdx++) {
        let numCount = 0;
        for (let rIdx = 1; rIdx < rawLines.length; rIdx++) {
          const cells = rawLines[rIdx].split(",");
          const val = Number((cells[cIdx] || "").replace(/,/g, "").trim());
          if (!isNaN(val) && cells[cIdx] && !/^0[0-9]{8,11}$/.test(cells[cIdx])) {
            numCount++;
          }
        }
        if (numCount >= Math.max(1, Math.ceil((rawLines.length - 1) * 0.4))) {
          numericHeaderIndices.add(cIdx);
        }
      }
    }

    // Nếu vẫn chưa có bất kỳ cột số nào, tự động bổ sung cột Doanh thu & Chi phí vào tiêu đề
    if (numericHeaderIndices.size === 0) {
      headers.push("Doanh_Thu_Trieu", "Chi_Phi_Trieu");
      numericHeaderIndices.add(headers.length - 2);
      numericHeaderIndices.add(headers.length - 1);
    }

    // Tìm cột tên đơn vị hoặc định danh chính
    let nameColIndex = headers.findIndex((h) =>
      /ten_|name|kenh|don_vi|chi_nhanh|showroom|doi_tac/i.test(h)
    );
    if (nameColIndex === -1 && headers.length > 1) nameColIndex = 1;

    const fixedLines = [headers.join(",")];
    const minColsExpected = Math.max(2, Math.floor(headers.length * 0.4));

    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      let cols = line.split(",").map((c) => c.trim());

      // Nếu dòng quá ngắn (bị gãy cấu trúc dòng CSV, ví dụ chỉ có 1 trường hoặc < minColsExpected), bỏ qua
      if (cols.length < minColsExpected) {
        continue;
      }

      // Pad thêm ô nếu dòng thiếu cột so với header
      while (cols.length < headers.length) {
        const missingIdx = cols.length;
        if (numericHeaderIndices.has(missingIdx)) {
          cols.push("500");
        } else {
          cols.push("");
        }
      }

      // Nếu dòng thừa cột, cắt cho bằng header
      if (cols.length > headers.length) {
        cols = cols.slice(0, headers.length);
      }

      // Làm sạch từng ô dữ liệu
      for (let cIdx = 0; cIdx < headers.length; cIdx++) {
        const headerName = headers[cIdx];
        let val = cols[cIdx];

        if (numericHeaderIndices.has(cIdx)) {
          // Cột số học: làm sạch ký tự lạ, chuyển số âm thành dương, sửa chữ thành số
          let cleanVal = String(val || "").replace(/[^\d.-]/g, "");
          let num = parseFloat(cleanVal);
          if (isNaN(num)) {
            // Giá trị mặc định hợp lý cho chỉ số
            cols[cIdx] = /ty_le|phan_tram/i.test(headerName) ? "2.5" : "1500";
          } else {
            // Chuẩn hóa số âm thành số dương hợp lệ
            cols[cIdx] = String(Math.abs(num));
          }
        } else {
          // Cột phân loại / tên / định danh
          const isBlank =
            !val ||
            val === "(Trống)" ||
            val.toLowerCase() === "null" ||
            val.toLowerCase() === "undefined";

          if (isBlank) {
            if (cIdx === nameColIndex || /ten|name|don_vi|kenh|chi_nhanh|showroom/i.test(headerName)) {
              cols[cIdx] = `Chi nhánh / Kênh #${i}`;
            } else if (/ma|code|id/i.test(headerName)) {
              cols[cIdx] = `CN-AUTO-${String(i).padStart(2, "0")}`;
            } else if (/khu_vuc|vung|mien|region/i.test(headerName)) {
              cols[cIdx] = i % 3 === 0 ? "Miền Nam" : i % 2 === 0 ? "Miền Trung" : "Miền Bắc";
            } else if (/trang_thai|status/i.test(headerName)) {
              cols[cIdx] = "Hợp lệ";
            } else if (/ky|thang|date|time/i.test(headerName)) {
              cols[cIdx] = "2026-10";
            } else {
              cols[cIdx] = `Đơn vị #${i}`;
            }
          }
        }
      }

      fixedLines.push(cols.join(","));
    }

    // Nếu không còn dòng nào hợp lệ, trả về mẫu chuẩn
    if (fixedLines.length < 2) {
      return typeof presets !== "undefined" && presets.DEFAULT_BI_SAMPLE
        ? presets.DEFAULT_BI_SAMPLE.rawData
        : "";
    }

    return fixedLines.join("\n");
  }

  // --------------------------------------------------------------------------
  // BƯỚC 2 & 4 (NHÁNH YES): ĐỌC BỐI CẢNH, PHÂN TÍCH DỮ LIỆU & ĐỀ XUẤT GIẢI PHÁP
  // --------------------------------------------------------------------------
  analyzeContextAndData(contextText, rawDataText, feedbackHistory = []) {
    const raw = (rawDataText || "").trim();
    const ctx = (contextText || "").trim();

    let columns = [];
    let rows = [];
    let dataType = "TEXT";

    if (raw.startsWith("[") || raw.startsWith("{")) {
      dataType = "JSON";
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length > 0 && typeof arr[0] === "object") {
        columns = Object.keys(arr[0]);
        rows = arr.map((r, i) => ({ _rowIndex: i + 1, ...r }));
      }
    } else {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length >= 2 && lines[0].includes(",")) {
        dataType = "CSV";
        columns = lines[0].split(",").map((h) => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(",").map((c) => c.trim());
          const obj = { _rowIndex: i };
          columns.forEach((col, cIdx) => {
            obj[col] = vals[cIdx] !== undefined ? vals[cIdx] : "";
          });
          rows.push(obj);
        }
      } else {
        dataType = "TEXT";
        const paragraphs = raw.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        columns = ["Ma_Muc", "Noi_Dung_Du_Lieu", "So_Ky_Tu"];
        rows = paragraphs.map((p, idx) => ({
          _rowIndex: idx + 1,
          Ma_Muc: `MUC-0${idx + 1}`,
          Noi_Dung_Du_Lieu: p.trim().replace(/\s+/g, " "),
          So_Ky_Tu: p.trim().length
        }));
      }
    }

    // 1. Đọc & Bóc tách Bối cảnh Doanh nghiệp
    const contextObjectives = [];
    const contextPainPoints = [];
    const ctxLines = ctx.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    for (const line of ctxLines) {
      if (/mục tiêu|yêu cầu|cần|giải quyết|đề xuất|tối ưu|nâng cao/i.test(line)) {
        contextObjectives.push(line.replace(/^[-•*0-9.)+\s]+/, ""));
      } else if (/vấn đề|sụt giảm|tồn kho|vượt|cao|thấp|chênh lệch|nghỉ việc|nợ|quá tải|lỗi|khó khăn/i.test(line)) {
        contextPainPoints.push(line.replace(/^[-•*0-9.)+\s]+/, ""));
      }
    }
    if (contextPainPoints.length === 0 && ctxLines.length > 0) {
      contextPainPoints.push(...ctxLines.slice(0, 3));
    }
    if (contextObjectives.length === 0) {
      contextObjectives.push("Phân tích dữ liệu thực tế để xác định nguyên nhân gốc rễ và đề xuất giải pháp cải thiện hiệu quả vận hành.");
    }

    // 2. Tự động phân loại Cột Định lượng (Numeric KPIs) vs Cột Phân nhóm (Dimensions)
    const numericCols = [];
    const categoryCols = [];
    const idCol = columns[0] || "ID";
    const nameCol = columns[1] || columns[0] || "Name";

    columns.forEach((col) => {
      if (col === "_rowIndex") return;
      const validNums = rows
        .map((r) => Number(String(r[col] ?? "").replace(/,/g, "")))
        .filter((v) => !isNaN(v) && String(rows[0]?.[col] ?? "").trim() !== "");
      const looksLikePhoneOrTax = rows.some((r) => /^0[0-9]{8,11}$/.test(String(r[col] || "").trim()));

      if (!looksLikePhoneOrTax && validNums.length >= Math.max(1, Math.ceil(rows.length * 0.6))) {
        numericCols.push(col);
      } else {
        categoryCols.push(col);
      }
    });

    // 3. Tính toán thống kê từng cột chỉ số
    const metricStats = numericCols.map((col) => {
      const vals = rows.map((r) => ({
        row: r,
        val: Number(String(r[col] ?? "0").replace(/,/g, "")) || 0
      }));
      const nums = vals.map((v) => v.val);
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = nums.length > 0 ? sum / nums.length : 0;
      const sorted = [...vals].sort((a, b) => b.val - a.val);
      const maxItem = sorted[0];
      const minItem = sorted[sorted.length - 1];

      return {
        column: col,
        sum: Math.round(sum * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        max: maxItem ? maxItem.val : 0,
        maxLabel: maxItem ? `${maxItem.row[idCol]} (${maxItem.row[nameCol] || ""})` : "",
        min: minItem ? minItem.val : 0,
        minLabel: minItem ? `${minItem.row[idCol]} (${minItem.row[nameCol] || ""})` : ""
      };
    });

    // 4. Đánh giá từng bản ghi & Sinh đề xuất giải pháp cụ thể cho từng đối tượng
    const appliedAdjustments = [];
    let processedRecords = rows.map((r, idx) => {
      const rowId = String(r[idCol] || `#${idx + 1}`);
      const rowName = String(r[nameCol] || `Bản ghi #${idx + 1}`);
      const groupCol = categoryCols.find((c) => c !== idCol && c !== nameCol) || "";
      const rowGroup = groupCol ? `${r[groupCol]}` : `Nhóm #${idx + 1}`;

      const metricSummaryParts = numericCols.map((c) => `${c}: ${Number(r[c] || 0).toLocaleString("vi-VN")}`);
      const notesCol = columns.find((c) => /ghi_chu|note|nhan_xet|mo_ta|ket_qua/i.test(c));
      const noteText = notesCol ? String(r[notesCol] || "") : "";

      let score = 82;
      const issues = [];
      const solutions = [];

      // Phân tích tương quan các cột số trên dòng hiện tại
      metricStats.forEach((ms) => {
        const val = Number(String(r[ms.column] ?? "0").replace(/,/g, "")) || 0;
        const colNameLower = ms.column.toLowerCase();

        // Nếu là cột phản ánh Chi phí / Tồn kho / Lỗi / Nghỉ việc / Nợ quá hạn (Càng cao càng rủi ro)
        if (/ton_kho|chi_phi|hoan_don|loi|nghi_viec|no_qua_han|cac/i.test(colNameLower)) {
          if (val > ms.avg * 1.35) {
            score -= 24;
            issues.push(`Chỉ số "${ms.column}" ở mức cao đáng báo động (${val.toLocaleString("vi-VN")} so với mức TB hệ thống là ${ms.avg.toLocaleString("vi-VN")}).`);
            if (/ton_kho/i.test(colNameLower)) {
              solutions.push(`Triển khai chương trình xả hàng chậm luân chuyển và điều chuyển tồn kho từ "${rowName}" sang các chi nhánh có sức mua cao.`);
            } else if (/chi_phi/i.test(colNameLower)) {
              solutions.push(`Rà soát và cắt giảm tối thiểu 15-20% chi phí vận hành/quảng cáo kém hiệu quả tại "${rowName}".`);
            } else if (/nghi_viec/i.test(colNameLower)) {
              solutions.push(`Bổ sung quản lý cấp trung, điều chỉnh lại cơ chế phụ cấp và phỏng vấn giữ chân nhân sự chủ chốt tại "${rowName}".`);
            } else if (/no_qua_han/i.test(colNameLower)) {
              solutions.push(`Tạm khóa cấp mới hạn mức tín dụng, lập tổ thu hồi nợ quá hạn (${val.toLocaleString("vi-VN")}) và gắn thưởng KPI trực tiếp với dòng tiền thực thu.`);
            } else {
              solutions.push(`Kiểm toán quy trình vận hành tại "${rowName}" để kéo giảm chỉ số "${ms.column}" về dưới mức ${ms.avg.toLocaleString("vi-VN")}.`);
            }
          }
        }

        // Nếu là cột phản ánh Doanh thu / Doanh số / KPI / Chuyển đổi (Càng cao càng tốt)
        if (/doanh_thu|doanh_so|kpi|chuyen_doi|loi_nhuan/i.test(colNameLower)) {
          if (val < ms.avg * 0.65) {
            score -= 20;
            issues.push(`Hiệu suất "${ms.column}" thấp (${val.toLocaleString("vi-VN")}, thấp hơn nhiều mức TB ${ms.avg.toLocaleString("vi-VN")}).`);
            solutions.push(`Tái cơ cấu danh mục sản phẩm/khách hàng mục tiêu và tăng cường đào tạo chuyển đổi cho "${rowName}".`);
          } else if (val >= ms.avg * 1.25) {
            score += 8;
            solutions.push(`Mô hình điểm sáng ("${ms.column}" đạt ${val.toLocaleString("vi-VN")}): Đề xuất ưu tiên tăng ngân sách/nguồn lực và chuẩn hóa quy trình của "${rowName}" để nhân rộng.`);
          }
        }
      });

      // Kiểm tra tỷ lệ Chi phí / Doanh thu hoặc Tồn kho / Doanh thu nếu có cả 2 cột
      const revCol = numericCols.find((c) => /doanh_thu|doanh_so/i.test(c));
      const invCol = numericCols.find((c) => /ton_kho/i.test(c));
      const costCol = numericCols.find((c) => /chi_phi/i.test(c));

      if (revCol && invCol) {
        const rev = Number(r[revCol] || 0);
        const inv = Number(r[invCol] || 0);
        if (rev > 0 && inv / rev > 0.5) {
          score -= 15;
          issues.push(`Tỷ lệ Tồn kho / Doanh thu lên tới ${Math.round((inv / rev) * 100)}% (vượt ngưỡng an toàn 50%).`);
          solutions.push(`Ngưng nhập mới các mã hàng tồn > 60 ngày tại "${rowName}", áp dụng chiết khấu thanh lý nhanh.`);
        }
      }

      if (revCol && costCol) {
        const rev = Number(r[revCol] || 0);
        const cost = Number(r[costCol] || 0);
        if (rev > 0 && cost / rev > 0.2) {
          score -= 15;
          issues.push(`Tỷ lệ Chi phí / Doanh thu chiếm ${Math.round((cost / rev) * 100)}% (vượt định mức chuẩn).`);
        }
      }

      if (noteText && /cảnh báo|khủng hoảng|lỗ nặng|sụt giảm|vượt trần|quá tải|thiếu/i.test(noteText)) {
        score -= 12;
        if (issues.length === 0) issues.push(noteText);
      }

      score = Math.max(18, Math.min(98, Math.round(score)));

      let statusLabel = "Hiệu quả Tốt / Nhân rộng";
      let badgeClass = "badge-success";
      let priorityGroup = "OPTIMAL";

      if (score < 55) {
        statusLabel = "Cảnh báo Đỏ / Cần tái cơ cấu gấp";
        badgeClass = "badge-danger";
        priorityGroup = "CRITICAL";
      } else if (score < 76 || issues.length > 0) {
        statusLabel = "Cần tối ưu / Kiểm soát điều kiện";
        badgeClass = "badge-warning";
        priorityGroup = "WARNING";
      }

      if (solutions.length === 0) {
        solutions.push(`Duy trì đà tăng trưởng hiện tại của "${rowName}" và giao chỉ tiêu mở rộng thêm 15% trong kỳ tới.`);
      }

      return {
        rawRow: r,
        id: rowId,
        name: rowName,
        group: rowGroup,
        keyMetricsSummary: metricSummaryParts.join(" • "),
        noteText,
        score,
        statusLabel,
        badgeClass,
        priorityGroup,
        issues,
        solutions,
        feedbackNotes: []
      };
    });

    // 5. Áp dụng Phản hồi của Người dùng (Human-in-the-Loop Feedback) để xử lý lại
    if (feedbackHistory && feedbackHistory.length > 0) {
      for (const fb of feedbackHistory) {
        const fbLower = fb.text.toLowerCase();
        let matchedSpecific = false;

        // 5.1 Kiểm tra nếu phản hồi nhắc đến mã đơn vị / tên đơn vị cụ thể
        processedRecords.forEach((rec) => {
          if (
            fbLower.includes(rec.id.toLowerCase()) ||
            fbLower.includes(rec.name.toLowerCase())
          ) {
            matchedSpecific = true;
            if (/cảnh báo|loại|cắt giảm|dừng|rủi ro|tái cơ cấu|kém/i.test(fb.text)) {
              rec.priorityGroup = "CRITICAL";
              rec.statusLabel = "Cảnh báo Đỏ / Tái cơ cấu (Theo Phản hồi)";
              rec.badgeClass = "badge-danger";
              rec.score = Math.min(rec.score, 42);
              rec.solutions.unshift(`[Giải pháp theo Phản hồi #${fb.version}]: ${fb.text}`);
            } else if (/tốt|ưu tiên|đạt chuẩn|nhân rộng|tăng ngân sách/i.test(fb.text)) {
              rec.priorityGroup = "OPTIMAL";
              rec.statusLabel = "Hiệu quả Tốt / Ưu tiên (Theo Phản hồi)";
              rec.badgeClass = "badge-success";
              rec.score = Math.max(rec.score, 88);
              rec.solutions.unshift(`[Giải pháp theo Phản hồi #${fb.version}]: ${fb.text}`);
            } else {
              rec.solutions.unshift(`[Cập nhật theo Phản hồi #${fb.version}]: ${fb.text}`);
            }
            rec.feedbackNotes.push(`Phản hồi #${fb.version}: ${fb.text}`);
            appliedAdjustments.push(`Đã xử lý lại bản ghi [${rec.id}] ${rec.name} theo phản hồi người dùng.`);
          }
        });

        // 5.2 Kiểm tra nếu phản hồi yêu cầu lọc theo Khu vực / Phân khúc
        const regionFilterMatch = fb.text.match(/chỉ\s+(?:lấy|giữ|phân tích|xét)\s+([^\.,;]+)/i);
        if (regionFilterMatch) {
          const keyword = this.normalizeText(regionFilterMatch[1]);
          const filtered = processedRecords.filter(
            (r) =>
              this.normalizeText(r.group).includes(keyword) ||
              this.normalizeText(r.name).includes(keyword)
          );
          if (filtered.length > 0) {
            processedRecords = filtered;
            matchedSpecific = true;
            appliedAdjustments.push(`Đã lọc bảng dữ liệu chỉ giữ lại nhóm "${regionFilterMatch[1].trim()}" (${filtered.length} bản ghi).`);
          }
        }

        // 5.3 Nếu là phản hồi bổ sung giải pháp hoặc điều chỉnh tiêu chí chung
        if (!matchedSpecific) {
          processedRecords.forEach((rec) => {
            if (rec.priorityGroup !== "OPTIMAL") {
              rec.solutions.unshift(`[Giải pháp bổ sung theo Phản hồi #${fb.version}]: ${fb.text}`);
              rec.feedbackNotes.push(`Đã áp dụng phản hồi #${fb.version}`);
            }
          });
          appliedAdjustments.push(`Đã tích hợp yêu cầu phản hồi "${fb.text}" vào toàn bộ phương án giải pháp.`);
        }
      }
    }

    // 6. Tổng hợp Báo cáo Phân tích & Đề xuất Giải pháp Chiến lược
    const optimalList = processedRecords.filter((r) => r.priorityGroup === "OPTIMAL");
    const warningList = processedRecords.filter((r) => r.priorityGroup === "WARNING");
    const criticalList = processedRecords.filter((r) => r.priorityGroup === "CRITICAL");

    const structuredSolutionReport = `====================================================================
BÁO CÁO PHÂN TÍCH DỮ LIỆU & ĐỀ XUẤT GIẢI PHÁP DOANH NGHIỆP
====================================================================

I. ĐỌC HIỂU BỐI CẢNH & CHẨN ĐOÁN VẤN ĐỀ TRỌNG TÂM
1. Các vấn đề / nỗi đau cốt lõi doanh nghiệp đang gặp phải:
${contextPainPoints.map((p) => `   • ${p}`).join("\n")}
2. Mục tiêu trọng tâm cần giải quyết:
${contextObjectives.map((o) => `   → ${o}`).join("\n")}

II. PHÂN TÍCH ĐỊNH LƯỢNG & PHÁT HIỆN TỪ DỮ LIỆU (${processedRecords.length} bản ghi)
${
  metricStats.length > 0
    ? metricStats
        .map(
          (m) =>
            `   • Chỉ số [${m.column}]: Tổng = ${m.sum.toLocaleString("vi-VN")} | Trung bình = ${m.avg.toLocaleString(
              "vi-VN"
            )} | Cao nhất = ${m.max.toLocaleString("vi-VN")} (${m.maxLabel}) | Thấp nhất = ${m.min.toLocaleString(
              "vi-VN"
            )} (${m.minLabel})`
        )
        .join("\n")
    : `   • Đã xử lý ${processedRecords.length} bản ghi dữ liệu.`
}
   • Phân nhóm sức khỏe vận hành từ dữ liệu:
     - 🟢 Nhóm Hiệu quả Tốt / Điểm sáng (${optimalList.length} đơn vị): ${optimalList.map((r) => `${r.name} [${r.id}]`).join(", ") || "Không có"}
     - 🟡 Nhóm Cần Tối ưu / Kiểm soát Điều kiện (${warningList.length} đơn vị): ${warningList.map((r) => `${r.name} [${r.id}]`).join(", ") || "Không có"}
     - 🔴 Nhóm Cảnh báo Đỏ / Điểm nghẽn Nghiêm trọng (${criticalList.length} đơn vị): ${criticalList.map((r) => `${r.name} [${r.id}]`).join(", ") || "Không có"}
${
  appliedAdjustments.length > 0
    ? `\n   • CẬP NHẬT THEO PHẢN HỒI CỦA NGƯỜI DÙNG (HUMAN-IN-THE-LOOP):\n${appliedAdjustments
        .map((a) => `     ↺ ${a}`)
        .join("\n")}`
    : ""
}

III. HỆ THỐNG ĐỀ XUẤT GIẢI PHÁP HÀNH ĐỘNG (ACTIONABLE SOLUTIONS)

1. Giải pháp Ngắn hạn (Xử lý dứt điểm các điểm nghẽn trong 1 - 4 tuần tới):
   • Đối với Nhóm Cảnh báo Đỏ (${criticalList.map((r) => r.id).join(", ") || "Không có"}):
${
  criticalList.length > 0
    ? criticalList.map((r) => `     - [${r.id} - ${r.name}]: ${r.solutions[0]}`).join("\n")
    : "     - Hiện không có đơn vị nào trong vùng nguy hiểm."
}
   • Đối với Nhóm Cần Tối ưu (${warningList.map((r) => r.id).join(", ") || "Không có"}):
${
  warningList.length > 0
    ? warningList.map((r) => `     - [${r.id} - ${r.name}]: ${r.solutions[0]}`).join("\n")
    : "     - Các đơn vị đều đã đạt chuẩn."
}
   • Đối với Nhóm Điểm sáng (${optimalList.map((r) => r.id).join(", ") || "Không có"}):
     - Ưu tiên phân bổ nguồn lực/ngân sách và đúc kết quy trình chuẩn từ (${optimalList.map((r) => r.name).join(", ")}) để nhân rộng cho các đơn vị yếu hơn.

2. Giải pháp Chiến lược Trung & Dài hạn (Cải tiến hệ thống & quy trình):
   • Thiết lập Dashboard cảnh báo sớm tự động khi các chỉ số rủi ro (tồn kho, chi phí, nợ quá hạn, tỷ lệ lỗi/nghỉ việc) vượt ngưỡng trung bình 20%.
   • Gắn kết chặt chẽ KPI đánh giá hiệu suất với hiệu quả thực chất (biên lợi nhuận ròng, vòng quay vốn và chất lượng dịch vụ) thay vì chỉ chạy theo quy mô bề nổi.
   • Thực hiện rà soát định kỳ hàng tháng bằng AI Agent để phát hiện sớm sai lệch và điều chỉnh phân bổ nguồn lực kịp thời.`;

    return {
      dataType,
      columns,
      numericCols,
      metricStats,
      contextObjectives,
      contextPainPoints,
      processedRecords,
      appliedAdjustments,
      structuredSolutionReport
    };
  }

  async generateDeepSolutionReportWithGemini(contextText, analysisResult, feedbackHistory, apiKey) {
    const feedbackStr =
      feedbackHistory && feedbackHistory.length > 0
        ? feedbackHistory.map((f) => `- Phản hồi #${f.version} (${f.time}): "${f.text}"`).join("\n")
        : "Chưa có phản hồi chỉnh sửa.";

    const compactSummary = analysisResult.processedRecords.map((r) => ({
      id: r.id,
      ten: r.name,
      nhom: r.group,
      chiSo: r.keyMetricsSummary,
      diem: r.score,
      phanLoai: r.statusLabel,
      vanDePhatHien: r.issues,
      giaiPhapDeXuat: r.solutions,
      phanHoiDaApDung: r.feedbackNotes
    }));

    const prompt = `Bạn là "Chuyên gia AI Phân tích Dữ liệu & Tư vấn Giải pháp Doanh nghiệp" (Enterprise Data & Strategy AI Agent).
Hãy đọc kỹ BỐI CẢNH DOANH NGHIỆP, phân tích KẾT QUẢ XỬ LÝ DỮ LIỆU và viết BÁO CÁO ĐỀ XUẤT GIẢI PHÁP sâu sắc, thực tế, có số liệu dẫn chứng cụ thể.

1. BỐI CẢNH & VẤN ĐỀ DOANH NGHIỆP:
${contextText}

2. THỐNG KÊ CHỈ SỐ ĐỊNH LƯỢNG:
${JSON.stringify(analysisResult.metricStats)}

3. KẾT QUẢ PHÂN TÍCH TỪNG ĐƠN VỊ / BẢN GHI:
${JSON.stringify(compactSummary)}

4. PHẢN HỒI CỦA NGƯỜI DÙNG (BẮT BUỘC PHẢI TUÂN THỦ VÀ ĐIỀU CHỈNH BÁO CÁO THEO PHẢN HỒI NÀY NẾU CÓ):
${feedbackStr}

Hãy trình bày BÁO CÁO ĐỀ XUẤT GIẢI PHÁP bằng tiếng Việt gồm 4 mục:
- MỤC 1: CHẨN ĐOÁN NGUYÊN NHÂN GỐC RỄ (Dẫn chứng trực tiếp các con số và mã đơn vị từ dữ liệu).
- MỤC 2: GIẢI PHÁP XỬ LÝ NGẮN HẠN TRÊN TỪNG NHÓM ĐỐI TƯỢNG (Chỉ rõ đơn vị nào cần cắt giảm/tái cơ cấu, đơn vị nào cần tối ưu điều kiện gì, đơn vị nào cần nhân rộng).
- MỤC 3: GIẢI PHÁP CHIẾN LƯỢC DÀI HẠN & CẢI TIẾN QUY TRÌNH QUẢN TRỊ.
- MỤC 4: LỘ TRÌNH HÀNH ĐỘNG & CHỈ SỐ ĐO LƯỜNG (KPIs).`;

    const res = await this.callGeminiWithFallback(prompt, apiKey);
    return `🤖 [PHÂN TÍCH & ĐỀ XUẤT GIẢI PHÁP CHUYÊN SÂU TỪ GOOGLE GEMINI (${res.modelUsed})]:\n\n${res.text}`;
  }

  async answerUserQuestionOnCurrentData(questionText, contextText, analysisResult, apiKey) {
    if (!analysisResult || !analysisResult.processedRecords || analysisResult.processedRecords.length === 0) {
      return "⚠️ Chưa có dữ liệu phân tích. Vui lòng bấm '▷ Chạy phân tích BI' trước khi đặt câu hỏi.";
    }

    // 1. Phân tích nội bộ deterministic từ dữ liệu số thực tế (luôn sẵn sàng & chuẩn xác 100%)
    const localInsight = this.generateLocalCopilotInsight(questionText, contextText, analysisResult);

    // 2. Thử gọi Gemini AI nếu có API Key để câu trả lời phong phú, đa chiều và có góc nhìn tư vấn cấp cao
    const keyToUse = apiKey || this.defaultApiKey;
    if (keyToUse) {
      try {
        const compactData = analysisResult.processedRecords.slice(0, 16).map((r) => ({
          ma: r.id,
          ten: r.name,
          khuVuc: r.group,
          chiSo: r.keyMetricsSummary,
          diemSucKhoe: r.score,
          phanLoai: r.statusLabel,
          vanDeChinh: r.issues?.[0] || "Hoạt động bình thường",
          giaiPhapDeXuat: r.solutions?.[0] || "Duy trì quy trình"
        }));

        const prompt = `Bạn là DataMind AI Copilot — chuyên gia tư vấn chiến lược và phân tích dữ liệu kinh doanh cấp cao.
BỐI CẢNH DOANH NGHIỆP:
${contextText || "Doanh nghiệp bán lẻ đa kênh tại Việt Nam"}

TỔNG QUAN CÁC CHỈ SỐ ĐỊNH LƯỢNG (METRICS):
${JSON.stringify(analysisResult.metricStats || [])}

DỮ LIỆU ĐÃ LÀM SẠCH VÀ PHÂN TÍCH TỪNG KÊNH / ĐƠN VỊ:
${JSON.stringify(compactData)}

CÂU HỎI CỦA NGƯỜI DÙNG:
"${questionText}"

HƯỚNG DẪN TRẢ LỜI:
1. Trả lời trực tiếp, rõ ràng, gãy gọn bằng tiếng Việt.
2. Dẫn chứng con số chính xác từ dữ liệu trên (tên kênh, doanh thu, chi phí, tỷ lệ, điểm sức khỏe).
3. Sử dụng gạch đầu dòng hoặc bảng Markdown ngắn gọn để người dùng dễ theo dõi.
4. Đưa ra 2-3 đề xuất hành động thực tiễn (Actionable Recommendations) cho doanh nghiệp.
5. Tuyệt đối không bịa số liệu nằm ngoài bảng dữ liệu.`;

        const res = await this.callGeminiWithFallback(prompt, keyToUse);
        if (res && res.text) {
          return `### 💡 Phân tích từ DataMind AI (${res.modelUsed})\n\n${res.text}`;
        }
      } catch (err) {
        console.warn("Gemini Copilot fallback to local engine:", err.message);
      }
    }

    // Trả về câu trả lời phân tích định lượng trực tiếp từ dữ liệu
    return localInsight;
  }

  // Bộ phân tích dữ liệu chuyên sâu cục bộ (Zero-latency & Chuẩn xác 100%)
  generateLocalCopilotInsight(questionText, contextText, analysisResult) {
    const q = this.normalizeText(questionText);
    const records = analysisResult?.processedRecords || [];
    const stats = analysisResult?.metricStats || [];
    const painPoints = analysisResult?.contextPainPoints || [];

    // Helper an toàn để lấy giá trị số của cột trên bản ghi
    const getVal = (rec, col) => {
      if (!rec || !col) return 0;
      const v = rec.rawRow ? rec.rawRow[col] : rec[col];
      return Number(String(v ?? "0").replace(/,/g, "")) || 0;
    };

    const revStat = stats.find((s) => /doanh_thu|doanh_so|revenue|sales/i.test(s.column)) || stats[0];
    const costStat = stats.find((s) => /chi_phi|cost/i.test(s.column)) || stats[1];
    const cancelStat = stats.find((s) => /huy|cancel/i.test(s.column));

    // 1. Câu hỏi về Doanh thu / Chi phí / Hủy đơn cao nhất - thấp nhất
    if (/cao nhat|thap nhat|lon nhat|nho nhat|top|dan dau|kem nhat|tot nhat/i.test(q)) {
      if (/chi phi/i.test(q) && costStat) {
        const sorted = [...records].sort(
          (a, b) => getVal(b, costStat.column) - getVal(a, costStat.column)
        );
        const topCost = sorted[0];
        const lowCost = sorted[sorted.length - 1];
        return `### 💸 Phân tích Chi phí Vận hành Cao / Thấp nhất:

- **Chi phí cao nhất:** **${topCost.name}** (${topCost.id}, ${topCost.group}) với chi phí **${getVal(
          topCost,
          costStat.column
        ).toLocaleString("vi-VN")} triệu VNĐ**.
  - *Đánh giá:* Kênh này đang tạo áp lực lớn lên dòng tiền. ${topCost.issues?.[0] || ""}
  - *Giải pháp:* ${topCost.solutions?.[0] || "Cắt giảm tối thiểu 15% ngân sách marketing kém hiệu quả."}

- **Chi phí thấp nhất:** **${lowCost.name}** (${lowCost.id}, ${lowCost.group}) với mức chi phí **${getVal(
          lowCost,
          costStat.column
        ).toLocaleString("vi-VN")} triệu VNĐ**.

*Mức chi phí trung bình toàn hệ thống là **${costStat.avg.toLocaleString("vi-VN")} triệu VNĐ**.*`;
      }

      if (/huy/i.test(q) && cancelStat) {
        const sorted = [...records].sort(
          (a, b) => getVal(b, cancelStat.column) - getVal(a, cancelStat.column)
        );
        const topCancel = sorted[0];
        const lowCancel = sorted[sorted.length - 1];
        return `### 🚨 Phân tích Tỷ lệ Hủy đơn Cao / Thấp nhất:

- **Tỷ lệ hủy đơn cao nhất:** **${topCancel.name}** (${topCancel.id}, ${topCancel.group}) với tỷ lệ hủy **${getVal(
          topCancel,
          cancelStat.column
        )}%**.
  - *Nguy cơ:* Gây thất thoát chi phí đóng gói, hoàn hàng và tồn kho ảo.
  - *Khắc phục:* Áp dụng gọi điện xác nhận đơn tức thì và đặt cọc với đơn hàng giá trị cao.

- **Tỷ lệ hủy đơn thấp nhất (An toàn nhất):** **${lowCancel.name}** (${lowCancel.id}, ${lowCancel.group}) với tỷ lệ hủy chỉ **${getVal(
          lowCancel,
          cancelStat.column
        )}%**.`;
      }

      if (revStat) {
        const sorted = [...records].sort(
          (a, b) => getVal(b, revStat.column) - getVal(a, revStat.column)
        );
        const topRev = sorted[0];
        const bottomRev = sorted[sorted.length - 1];
        const totalRev = revStat.sum;
        const topPct =
          totalRev > 0 ? ((getVal(topRev, revStat.column) / totalRev) * 100).toFixed(1) : 0;
        const botPct =
          totalRev > 0 ? ((getVal(bottomRev, revStat.column) / totalRev) * 100).toFixed(1) : 0;

        return `### 🏆 Phân tích Doanh thu Cao nhất & Thấp nhất:

1. **Kênh dẫn đầu doanh thu:** **${topRev.name}** (${topRev.id} • ${topRev.group})
   - **Doanh thu đạt:** **${getVal(topRev, revStat.column).toLocaleString(
     "vi-VN"
   )} triệu VNĐ** (chiếm **${topPct}%** tổng doanh thu toàn hệ thống).
   - **Đánh giá sức khỏe:** Đạt **${topRev.score}/100 điểm** (${topRev.statusLabel}).
   - **Hành động:** Tiếp tục duy trì nguồn hàng và nhân rộng kinh nghiệm sang các kênh khác.

2. **Kênh doanh thu thấp nhất:** **${bottomRev.name}** (${bottomRev.id} • ${bottomRev.group})
   - **Doanh thu chỉ đạt:** **${getVal(bottomRev, revStat.column).toLocaleString(
     "vi-VN"
   )} triệu VNĐ** (chiếm **${botPct}%** tổng số).
   - **Vấn đề nhận diện:** ${bottomRev.issues?.[0] || "Sức mua tại điểm bán này đang thấp."}
   - **Đề xuất khắc phục:** ${bottomRev.solutions?.[0] || "Tổ chức chương trình khuyến mãi kích cầu hoặc xem xét điều chuyển nguồn lực."}

*Tổng doanh thu toàn hệ thống: **${totalRev.toLocaleString("vi-VN")} triệu VNĐ** (Trung bình: **${revStat.avg.toLocaleString(
          "vi-VN"
        )} triệu VNĐ/đơn vị**).*`;
      }
    }

    // 2. So sánh theo Khu vực / Miền (Bắc, Trung, Nam)
    if (/khu vuc|mien|vung|bac|trung|nam|so sanh/i.test(q)) {
      const regionMap = {};
      records.forEach((r) => {
        const reg = r.group || "Chưa phân nhóm";
        if (!regionMap[reg]) {
          regionMap[reg] = { name: reg, count: 0, revenue: 0, cost: 0, cancelSum: 0 };
        }
        regionMap[reg].count++;
        if (revStat) regionMap[reg].revenue += getVal(r, revStat.column);
        if (costStat) regionMap[reg].cost += getVal(r, costStat.column);
        if (cancelStat) regionMap[reg].cancelSum += getVal(r, cancelStat.column);
      });

      const regionList = Object.values(regionMap).sort((a, b) => b.revenue - a.revenue);
      const totalRev = regionList.reduce((acc, cur) => acc + cur.revenue, 0);

      let tableMd = `| Khu Vực / Miền | Số Kênh | Doanh Thu (Tr.đ) | Tỷ Trọng % | Chi Phí (Tr.đ) | Tỷ Lệ Hủy TB |\n| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
      regionList.forEach((reg) => {
        const share = totalRev > 0 ? ((reg.revenue / totalRev) * 100).toFixed(1) : 0;
        const avgCancel = reg.count > 0 ? (reg.cancelSum / reg.count).toFixed(1) : 0;
        tableMd += `| **${reg.name}** | ${reg.count} đơn vị | ${reg.revenue.toLocaleString(
          "vi-VN"
        )} | **${share}%** | ${reg.cost.toLocaleString("vi-VN")} | ${avgCancel}% |\n`;
      });

      const bestReg = regionList[0];
      return `### 🗺️ Bảng So Sánh Hiệu Quả Kinh Doanh Theo Khu Vực:

${tableMd}

**Nhận định chiến lược:**
- Khu vực **${bestReg.name}** đang đóng vai trò đầu tàu tăng trưởng, đóng góp **${
        totalRev > 0 ? ((bestReg.revenue / totalRev) * 100).toFixed(1) : 0
      }%** tổng doanh số.
- Doanh nghiệp nên rà soát lại chi phí vận hành tại các khu vực có tỷ trọng doanh thu thấp để bảo toàn biên lợi nhuận.`;
    }

    // 3. Tỷ lệ Hủy đơn & Cảnh báo Rủi ro
    if (/huy|ty le huy|hoan|rui ro|canh bao|nguy hiem|can thiep/i.test(q)) {
      if (cancelStat) {
        const atRiskRecords = records
          .filter((r) => getVal(r, cancelStat.column) > 3.0)
          .sort((a, b) => getVal(b, cancelStat.column) - getVal(a, cancelStat.column));

        if (atRiskRecords.length > 0) {
          let rowsMd = atRiskRecords
            .map(
              (r, i) =>
                `${i + 1}. **${r.name}** (${r.id} • ${r.group}): Tỷ lệ hủy **${getVal(
                  r,
                  cancelStat.column
                )}%** ➔ *${r.solutions?.[0] || "Cần rà soát quy trình"}*`
            )
            .join("\n");
          return `### 🚨 Danh Sách Các Kênh Có Tỷ Lệ Hủy Đơn Vượt Ngưỡng An Toàn (> 3%):

Hệ thống phát hiện **${atRiskRecords.length} đơn vị** đang có tỷ lệ hủy đơn cao:

${rowsMd}

**Giải pháp hành động đề xuất:**
- Tích hợp hệ thống kiểm tra và xác thực số điện thoại khách hàng trước khi xuất kho.
- Với các đơn hàng giá trị cao (> 1 triệu VNĐ), yêu cầu đặt cọc tối thiểu 10% để giảm tỷ lệ hoàn đơn.`;
        }
      }
    }

    // 4. Tổng quan Tài chính & Lợi nhuận
    if (/tong|tai chinh|loi nhuan|toan he thong|bao nhieu|trung binh|tong quan/i.test(q)) {
      const totalRev = revStat ? revStat.sum : 0;
      const totalCost = costStat ? costStat.sum : 0;
      const estProfit = totalRev - totalCost;
      const profitMargin = totalRev > 0 ? ((estProfit / totalRev) * 100).toFixed(1) : 0;
      const avgScore =
        records.length > 0
          ? (records.reduce((acc, r) => acc + r.score, 0) / records.length).toFixed(1)
          : 80;

      return `### 📊 Báo Cáo Tổng Hợp Tài Chính Toàn Hệ Thống:

- **Tổng doanh thu:** **${totalRev.toLocaleString("vi-VN")} triệu VNĐ**
- **Tổng chi phí vận hành:** **${totalCost.toLocaleString("vi-VN")} triệu VNĐ**
- **Lợi nhuận gộp ước tính:** **${estProfit.toLocaleString("vi-VN")} triệu VNĐ**
- **Biên lợi nhuận:** **${profitMargin}%**
- **Điểm sức khỏe trung bình hệ thống:** **${avgScore}/100 điểm** (${records.length} kênh bán hàng)

**Đánh giá:**
Hệ thống duy trì biên lợi nhuận **${profitMargin}%**. Để nâng cao chỉ số này, ưu tiên hàng đầu là kiểm soát chi phí vận hành và kéo tỷ lệ hủy đơn về dưới ngưỡng 2.5%.`;
    }

    // 5. Tìm kiếm đơn vị cụ thể (VD: Showroom Hà Nội, Shopee, TikTok...)
    const matchedRecord = records.find((r) => {
      const normName = this.normalizeText(r.name);
      const normId = this.normalizeText(r.id);
      return (normName && q.includes(normName)) || (normId && q.includes(normId));
    });

    if (matchedRecord) {
      const metricLines = stats
        .map((s) => `- **${s.column}:** ${getVal(matchedRecord, s.column).toLocaleString("vi-VN")}`)
        .join("\n");
      return `### 🔍 Thông Tin Chi Tiết Về Đơn Vị: **${matchedRecord.name}** (${matchedRecord.id})

- **Khu vực:** ${matchedRecord.group}
- **Điểm đánh giá sức khỏe:** **${matchedRecord.score}/100 điểm** (${matchedRecord.statusLabel})
${metricLines}

**Chẩn đoán vấn đề:**
${matchedRecord.issues?.map((iss) => `- ⚠️ ${iss}`).join("\n") || "- Hoạt động ổn định, không ghi nhận rủi ro lớn."}

**Giải pháp đề xuất cho đơn vị này:**
${matchedRecord.solutions?.map((sol) => `- 💡 ${sol}`).join("\n") || "- Tiếp tục duy trì quy trình hiện tại."}`;
    }

    // 6. Câu hỏi chung khác: Trả lời tóm tắt toàn diện
    const bestRecord = revStat
      ? [...records].sort(
          (a, b) => getVal(b, revStat.column) - getVal(a, revStat.column)
        )[0]
      : null;
    return `### 💡 Phân Tích Dữ Liệu Nhanh:

Dựa trên dữ liệu **${records.length} bản ghi** đã làm sạch:
- **Doanh thu toàn hệ thống:** **${revStat ? revStat.sum.toLocaleString("vi-VN") : 0} triệu VNĐ**
- **Kênh dẫn đầu:** **${bestRecord ? `${bestRecord.name} (${getVal(bestRecord, revStat.column).toLocaleString("vi-VN")} tr.đ)` : "N/A"}**
- **Vấn đề trọng tâm:** ${painPoints.slice(0, 2).join("; ") || "Cần cân đối chi phí và hạn chế đơn hủy."}

*Gợi ý: Bạn có thể chọn các câu hỏi nhanh phía trên (🏆 Kênh cao nhất, 🗺️ So sánh 3 miền, 🚨 Kênh rủi ro...) để xem phân tích chi tiết!*`;
  }

  // ==========================================================================
  // BỔ SUNG CÁC PHÂN HỆ CHUYÊN SÂU:
  // 1. Trao đổi Phạm vi Phân tích với AI (AI Scope Discovery)
  // 2. Làm sạch & Kiểm định Chất lượng Dữ liệu (Cleaning Rules & Audit)
  // 3. Khám phá Nhóm Dữ liệu Tương tác & Hồ sơ Cột (Interactive Group-By & Column Profile)
  // 4. Dashboard KPI Điều hành (Biểu đồ Xu hướng Tháng + Cơ cấu Donut + Trả lời Câu hỏi)
  // ==========================================================================

  proposeAnalysisScope(businessContext, problemToSolve, rawDataText) {
    const ctx = (businessContext || "Doanh nghiệp đa kênh").trim();
    const questions = (problemToSolve || "")
      .split(/\r?\n/)
      .map((q) => q.trim())
      .filter(Boolean);

    const lines = (rawDataText || "").trim().split(/\r?\n/).filter(Boolean);
    const cols = lines.length > 0 && lines[0].includes(",") ? lines[0].split(",").map((c) => c.trim()) : [];

    return {
      interpretation: `Agent xác định bạn đang vận hành "${ctx}" với tập dữ liệu gồm ${Math.max(
        0,
        lines.length - 1
      )} dòng bản ghi và ${cols.length} trường thông tin (${cols.slice(0, 6).join(", ")}${
        cols.length > 6 ? "..." : ""
      }). Trọng tâm là làm sạch sai lệch dữ liệu, giải quyết ${
        questions.length || 1
      } câu hỏi bài toán và đề xuất giải pháp tối ưu hiệu quả hoạt động.`,
      suggestions: [
        "Đối chiếu tỷ lệ Chi phí / Doanh thu và Tồn kho / Doanh thu theo từng kênh để phát hiện điểm rò rỉ lợi nhuận.",
        "Tách biệt các bản ghi 'Đơn hủy' và các dòng trùng lặp trước khi tính trung bình để không làm méo số liệu BI.",
        "Phân tích xu hướng biến động qua các kỳ (Tháng) kết hợp cơ cấu đóng góp theo Khu vực để phân bổ lại nguồn lực."
      ],
      followups: [
        "Ngưỡng tỷ lệ Chi phí / Doanh thu tối đa mà doanh nghiệp bạn cho phép là bao nhiêu % (Mặc định: 20%)?",
        "Bạn muốn ưu tiên giải pháp cắt giảm chi phí ngắn hạn hay mở rộng các kênh có biên lợi nhuận cao?"
      ]
    };
  }

  cleanAndAuditDataset(rawDataText, cleaningConfig = { trim: true, empty: true, duplicates: true, filterCanceled: true }) {
    const raw = (rawDataText || "").trim();
    const rawLines = raw.split(/\r?\n/);

    let emptyRemoved = 0;
    const nonEmptyLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      if (!rawLines[i].trim()) {
        if (cleaningConfig.empty) emptyRemoved++;
      } else {
        nonEmptyLines.push(rawLines[i]);
      }
    }

    if (nonEmptyLines.length < 2 || !nonEmptyLines[0].includes(",")) {
      return {
        columns: ["Noi_Dung"],
        rows: nonEmptyLines.map((l, idx) => ({ _rowIndex: idx + 1, Noi_Dung: l })),
        audit: {
          originalRows: Math.max(0, rawLines.length - 1),
          cleanedRows: nonEmptyLines.length,
          removedRows: 0,
          emptyRemoved,
          duplicatesRemoved: 0,
          canceledRemoved: 0,
          trimmedCells: 0,
          remainingMissingCells: 0
        }
      };
    }

    const columns = nonEmptyLines[0].split(",").map((h) => h.trim());
    const originalDataLines = nonEmptyLines.slice(1);
    const seenSignatures = new Set();

    let duplicatesRemoved = 0;
    let canceledRemoved = 0;
    let trimmedCells = 0;
    let remainingMissingCells = 0;
    const cleanedRows = [];

    for (let i = 0; i < originalDataLines.length; i++) {
      const rawCols = originalDataLines[i].split(",");
      const rowValues = columns.map((_, cIdx) => {
        const val = rawCols[cIdx] !== undefined ? rawCols[cIdx] : "";
        if (cleaningConfig.trim && val !== val.trim()) {
          trimmedCells++;
          return val.trim();
        }
        return val.trim();
      });

      const signature = rowValues.join("|").toLowerCase();
      if (cleaningConfig.duplicates && seenSignatures.has(signature)) {
        duplicatesRemoved++;
        continue;
      }
      seenSignatures.add(signature);

      const rowObj = { _rowIndex: cleanedRows.length + 1 };
      columns.forEach((col, cIdx) => {
        rowObj[col] = rowValues[cIdx];
      });

      const statusVal = String(rowObj.Trang_Thai_Don || rowObj.Trang_Thai || "");
      if (cleaningConfig.filterCanceled && /đơn hủy|hủy bỏ|canceled/i.test(statusVal)) {
        canceledRemoved++;
        continue;
      }

      columns.forEach((col) => {
        if (rowObj[col] === "" || rowObj[col] == null) remainingMissingCells++;
      });

      cleanedRows.push(rowObj);
    }

    return {
      columns,
      rows: cleanedRows,
      audit: {
        originalRows: originalDataLines.length,
        cleanedRows: cleanedRows.length,
        removedRows: originalDataLines.length - cleanedRows.length,
        emptyRemoved,
        duplicatesRemoved,
        canceledRemoved,
        trimmedCells,
        remainingMissingCells
      }
    };
  }

  profileColumns(columns, rows) {
    return columns
      .filter((c) => c !== "_rowIndex")
      .map((col) => {
        let missing = 0;
        const distinctSet = new Set();
        const numVals = [];

        rows.forEach((r) => {
          const v = r[col];
          if (v === undefined || v === null || String(v).trim() === "") {
            missing++;
          } else {
            distinctSet.add(String(v).trim());
            const n = Number(String(v).replace(/,/g, ""));
            if (!isNaN(n) && !/^0[0-9]{8,11}$/.test(String(v).trim())) {
              numVals.push(n);
            }
          }
        });

        const isNumeric = numVals.length >= Math.max(1, Math.ceil(rows.length * 0.6));
        const sum = isNumeric ? numVals.reduce((a, b) => a + b, 0) : null;
        const mean = isNumeric && numVals.length > 0 ? sum / numVals.length : null;
        const min = isNumeric && numVals.length > 0 ? Math.min(...numVals) : null;
        const max = isNumeric && numVals.length > 0 ? Math.max(...numVals) : null;

        return {
          name: col,
          numeric: isNumeric,
          kindLabel: isNumeric ? "Số định lượng" : "Văn bản / Phân nhóm",
          missing,
          distinct: distinctSet.size,
          sum: sum !== null ? Math.round(sum * 100) / 100 : null,
          mean: mean !== null ? Math.round(mean * 100) / 100 : null,
          min: min !== null ? Math.round(min * 100) / 100 : null,
          max: max !== null ? Math.round(max * 100) / 100 : null
        };
      });
  }

  computeGroupByBreakdown(columns, rows, groupCol, metricCol, aggMode = "sum") {
    const gCol = groupCol || columns[0];
    const map = new Map();

    rows.forEach((r) => {
      const key = String(r[gCol] || "Chưa phân loại").trim();
      if (!map.has(key)) {
        map.set(key, { label: key, count: 0, sum: 0 });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (metricCol && aggMode !== "count") {
        const val = Number(String(r[metricCol] ?? "0").replace(/,/g, "")) || 0;
        entry.sum += val;
      }
    });

    const groups = Array.from(map.values()).map((item) => {
      let value = item.count;
      if (aggMode === "sum") value = Math.round(item.sum * 100) / 100;
      if (aggMode === "mean") value = item.count > 0 ? Math.round((item.sum / item.count) * 100) / 100 : 0;
      return {
        label: item.label,
        value,
        count: item.count
      };
    });

    groups.sort((a, b) => b.value - a.value);
    const totalVal = groups.reduce((acc, g) => acc + Math.max(0, g.value), 0) || 1;
    groups.forEach((g) => {
      g.sharePct = Math.round((Math.max(0, g.value) / totalVal) * 1000) / 10;
    });

    const leader = groups[0];
    const tail = groups[groups.length - 1];
    const modeLabel = aggMode === "sum" ? "Tổng" : aggMode === "mean" ? "Trung bình" : "Số bản ghi";

    const autoFindings = [];
    if (leader) {
      autoFindings.push(
        `Nhóm "${leader.label}" dẫn đầu về ${modeLabel.toLowerCase()} "${metricCol || "bản ghi"}" với giá trị ${leader.value.toLocaleString("vi-VN")} (chiếm ${leader.sharePct}% toàn bộ ${groups.length} nhóm).`
      );
    }
    if (tail && groups.length > 1) {
      autoFindings.push(
        `Nhóm "${tail.label}" ghi nhận mức thấp nhất là ${tail.value.toLocaleString("vi-VN")} (${tail.sharePct}%), chênh lệch ${(leader.value - tail.value).toLocaleString("vi-VN")} so với nhóm dẫn đầu.`
      );
    }

    return {
      groupCol: gCol,
      metricCol,
      aggMode,
      modeLabel,
      groups,
      autoFindings
    };
  }

  buildExecutiveDashboardData(columns, rows) {
    const revCol = columns.find((c) => /doanh_thu|doanh_so|revenue/i.test(c)) || columns.find((c) => /gia_tri|cam_ket/i.test(c));
    const costCol = columns.find((c) => /chi_phi|cost|ngan_sach/i.test(c));
    const invCol = columns.find((c) => /ton_kho|inventory/i.test(c));
    const periodCol = columns.find((c) => /ky_thang|thang|ngay|period|date/i.test(c));
    const regionCol = columns.find((c) => /khu_vuc|phan_khuc|nhom|region/i.test(c)) || columns[1] || columns[0];

    let totalRevenue = 0;
    let totalCost = 0;
    let totalInventory = 0;

    rows.forEach((r) => {
      if (revCol) totalRevenue += Number(String(r[revCol] ?? "0").replace(/,/g, "")) || 0;
      if (costCol) totalCost += Number(String(r[costCol] ?? "0").replace(/,/g, "")) || 0;
      if (invCol) totalInventory += Number(String(r[invCol] ?? "0").replace(/,/g, "")) || 0;
    });

    const netProfit = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10 : 0;

    // Chuỗi thời gian theo tháng (nếu có cột Ky_Thang)
    const periodMap = new Map();
    if (periodCol && revCol) {
      rows.forEach((r) => {
        const p = String(r[periodCol] || "Kỳ khác").trim();
        if (!periodMap.has(p)) periodMap.set(p, { period: p, revenue: 0, cost: 0, count: 0 });
        const item = periodMap.get(p);
        item.revenue += Number(String(r[revCol] ?? "0").replace(/,/g, "")) || 0;
        if (costCol) item.cost += Number(String(r[costCol] ?? "0").replace(/,/g, "")) || 0;
        item.count += 1;
      });
    }
    const timeSeries = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));

    // Cơ cấu đóng góp theo Khu vực / Phân nhóm cho biểu đồ Donut
    const revenueByRegion = revCol
      ? this.computeGroupByBreakdown(columns, rows, regionCol, revCol, "sum").groups
      : [];
    const costByRegion = costCol
      ? this.computeGroupByBreakdown(columns, rows, regionCol, costCol, "sum").groups
      : [];

    return {
      revCol,
      costCol,
      invCol,
      periodCol,
      regionCol,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalInventory: Math.round(totalInventory * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      marginPct,
      timeSeries,
      revenueByRegion,
      costByRegion
    };
  }
}

window.EnterpriseSolutionAgentEngine = EnterpriseSolutionAgentEngine;
