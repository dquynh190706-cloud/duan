// ============================================================================
// APPLICATION CONTROLLER — DATAMIND STUDIO (MODERN, USER-FRIENDLY BI AGENT)
// ============================================================================

(function () {
  const presets = window.BI_AGENT_PRESETS;
  const engine = new window.EnterpriseSolutionAgentEngine();

  let currentAnalysisResult = null;
  let currentCleanedDataset = null;
  let workflowFeedbackHistory = [];
  let workflowVersion = 0;
  let workflowCurrentReportText = "";
  let isPasteModeOpen = false;

  const DONUT_COLORS = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  function getScoreClass(score) {
    if (score >= 78) return "score-high";
    if (score >= 55) return "score-mid";
    return "score-low";
  }

  function formatMarkdownToHTML(md) {
    if (!md) return "";
    const escaped = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = escaped.split(/\r?\n/);
    const htmlLines = [];
    let inList = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || /^={4,}|^-{4,}$/.test(line)) continue;

      if (/^(?:#{1,4}\s+|MỤC\s+[0-9IVX]+|PHẦN\s+[0-9IVX]+|[I|V|X]+\.\s+)/i.test(line)) {
        if (inList) {
          htmlLines.push("</ul>");
          inList = false;
        }
        const cleanTitle = line.replace(/^#{1,4}\s*/, "").replace(/\*\*/g, "");
        htmlLines.push(`<h3>${cleanTitle}</h3>`);
      } else if (/^[-•*→↺]\s+/.test(line) || /^[0-9]+[.)]\s+/.test(line)) {
        if (!inList) {
          htmlLines.push("<ul>");
          inList = true;
        }
        const itemText = line
          .replace(/^[-•*→↺0-9.)]+\s+/, "")
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        htmlLines.push(`<li>${itemText}</li>`);
      } else {
        if (inList) {
          htmlLines.push("</ul>");
          inList = false;
        }
        const para = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        htmlLines.push(`<p style="margin-bottom:8px;">${para}</p>`);
      }
    }
    if (inList) htmlLines.push("</ul>");
    return htmlLines.join("\n");
  }

  // --------------------------------------------------------------------------
  // HERO TECH CONSTELLATION CANVAS (MATCHING IMAGE 1 BACKDROP)
  // --------------------------------------------------------------------------
  function initConstellationCanvas() {
    const canvas = document.getElementById("constellation-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = canvas.parentElement.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || 420);

    window.addEventListener("resize", () => {
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 420;
    });

    const nodes = Array.from({ length: 34 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 1
    }));

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.55)";
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 135) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 135) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  }

  // --------------------------------------------------------------------------
  // QUẢN LÝ THANH TIẾN TRÌNH 5 BƯỚC (DỌC & TRỰC QUAN)
  // --------------------------------------------------------------------------
  function updateFlowchartState(stage) {
    const ids = [
      "fc-node-input",
      "fc-node-process",
      "fc-node-check",
      "fc-node-evaluate",
      "fc-node-export"
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active", "completed", "error-state");
    });

    const checkNode = document.getElementById("fc-node-check");
    const subSpan = document.getElementById("fc-node-check-sub");
    if (checkNode) {
      const titleSpan = checkNode.querySelector(".step-title-text");
      if (titleSpan) {
        titleSpan.textContent = "3. Hợp lệ (Yes)";
      } else {
        checkNode.textContent = "3. Hợp lệ (Yes)";
      }
      if (subSpan) subSpan.textContent = "Kiểm định chuẩn số liệu";
    }

    const markCompleted = (arr) =>
      arr.forEach((id) => document.getElementById(id)?.classList.add("completed"));
    const markActive = (arr) =>
      arr.forEach((id) => document.getElementById(id)?.classList.add("active"));

    if (stage === "INPUT") {
      markActive(["fc-node-input"]);
    } else if (stage === "ERROR_BRANCH") {
      markCompleted(["fc-node-input", "fc-node-process"]);
      if (checkNode) {
        const titleSpan = checkNode.querySelector(".step-title-text");
        if (titleSpan) {
          titleSpan.textContent = "3. Không hợp lệ (No)";
        } else {
          checkNode.textContent = "3. Không hợp lệ (No)";
        }
        if (subSpan) subSpan.textContent = "Phát hiện lỗi dữ liệu";
        checkNode.classList.add("error-state");
      }
    } else if (stage === "SUCCESS_EVALUATE") {
      markCompleted(["fc-node-input", "fc-node-process", "fc-node-check"]);
      markActive(["fc-node-evaluate"]);
    } else if (stage === "EXPORT_END") {
      markCompleted(["fc-node-input", "fc-node-process", "fc-node-check", "fc-node-evaluate"]);
      markActive(["fc-node-export"]);
    }
  }

  // Điều hướng cuộn nhanh khi người dùng click vào các bước bên Sidebar
  window.scrollToStep = function (stepKey) {
    if (stepKey === "input") {
      document.getElementById("bi-input-card-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (stepKey === "process") {
      document.getElementById("btn-run-workflow-main")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (stepKey === "check") {
      const errPanel = document.getElementById("wf-error-branch-panel");
      const okPanel = document.getElementById("wf-success-branch-panel");
      if (errPanel && errPanel.style.display !== "none") {
        errPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (okPanel && okPanel.style.display !== "none") {
        okPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        document.getElementById("btn-run-workflow-main")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (stepKey === "evaluate") {
      document.getElementById("wf-success-branch-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (stepKey === "export") {
      const expPanel = document.getElementById("wf-export-final-panel");
      if (expPanel && expPanel.style.display !== "none") {
        expPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.approveAndGoToExportStep();
      }
    }
  };

  window.switchResultSubview = function (subviewId) {
    document.querySelectorAll(".result-subview").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".subnav-btn").forEach((btn) => btn.classList.remove("active"));

    document.getElementById(subviewId)?.classList.add("active");
    document.querySelector(`.subnav-btn[data-subview="${subviewId}"]`)?.classList.add("active");

    if (subviewId === "subview-dashboard" && currentCleanedDataset) {
      renderExecutiveDashboardVisuals(currentCleanedDataset);
    }
    if (subviewId === "subview-copilot") {
      window.initCopilotChatIfEmpty();
    }
  };

  // --------------------------------------------------------------------------
  // HÀNH ĐỘNG CỦA 3 NÚT TRÊN ẢNH 1 & FORM ẢNH 2
  // --------------------------------------------------------------------------
  window.openBIWorkspaceAndFocus = function () {
    updateFlowchartState("INPUT");

    const errPanel = document.getElementById("wf-error-branch-panel");
    const okPanel = document.getElementById("wf-success-branch-panel");
    const exportPanel = document.getElementById("wf-export-final-panel");
    const discoveryPanel = document.getElementById("bi-scope-discovery-panel");
    const alertBox = document.getElementById("bi-data-validation-alert");
    const verIndicator = document.getElementById("wf-version-indicator");

    if (errPanel) errPanel.style.display = "none";
    if (okPanel) okPanel.style.display = "none";
    if (exportPanel) exportPanel.style.display = "none";
    if (discoveryPanel) discoveryPanel.style.display = "none";
    if (alertBox) {
      alertBox.style.display = "none";
      alertBox.innerHTML = "";
    }
    if (verIndicator) verIndicator.textContent = "Bước 1: Sẵn sàng nhập bối cảnh & dữ liệu số";

    window.clearLoadedDataset();

    document.getElementById("workspace-anchor")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      document.getElementById("bi-business-context")?.focus();
    }, 320);
  };

  // Link "Điền nhanh ví dụ" (Cột trái): CHỈ điền Bối cảnh & Vấn đề, KHÔNG tự ý nạp dữ liệu số bên cột phải!
  window.fillBIExampleQuickly = function () {
    const sample = presets.DEFAULT_BI_SAMPLE;
    const ctxEl = document.getElementById("bi-business-context");
    const probEl = document.getElementById("bi-problem-input");

    if (ctxEl) ctxEl.value = sample.businessContext;
    if (probEl) probEl.value = sample.problemToSolve;
  };

  // Chuyển đổi tab nhập dữ liệu ở Cột phải: Tải file vs Dán bảng số liệu
  window.switchDataInputTab = function (tab) {
    const dropzone = document.getElementById("bi-dropzone-box");
    const pasteBox = document.getElementById("bi-paste-container");
    const uploadBtn = document.getElementById("tab-btn-upload");
    const pasteBtn = document.getElementById("tab-btn-paste");

    if (tab === "paste") {
      isPasteModeOpen = true;
      if (dropzone) dropzone.style.display = "none";
      if (pasteBox) pasteBox.style.display = "block";
      if (uploadBtn) {
        uploadBtn.style.color = "#64748b";
        uploadBtn.style.fontWeight = "500";
      }
      if (pasteBtn) {
        pasteBtn.style.color = "#0284c7";
        pasteBtn.style.fontWeight = "700";
      }
      setTimeout(() => document.getElementById("wf-rawdata-input")?.focus(), 100);
    } else {
      isPasteModeOpen = false;
      if (dropzone) dropzone.style.display = "flex";
      if (pasteBox) pasteBox.style.display = "none";
      if (uploadBtn) {
        uploadBtn.style.color = "#0284c7";
        uploadBtn.style.fontWeight = "700";
      }
      if (pasteBtn) {
        pasteBtn.style.color = "#64748b";
        pasteBtn.style.fontWeight = "500";
      }
    }
  };

  // Nạp dữ liệu mẫu vào cột phải (Chỉ gọi khi bấm "⚡ Nạp dữ liệu mẫu" hoặc "✨ Chạy thử Mẫu BI")
  window.loadSampleDatasetIntoRightColumn = function (autoRun = false) {
    const sample = presets.DEFAULT_BI_SAMPLE;
    const rawEl = document.getElementById("wf-rawdata-input");
    const titleEl = document.getElementById("bi-dropzone-title-text");
    const subEl = document.getElementById("bi-dropzone-sub-text");
    const alertBox = document.getElementById("bi-data-validation-alert");

    if (alertBox) {
      alertBox.style.display = "none";
      alertBox.innerHTML = "";
    }

    // Tự điền bối cảnh mẫu nếu người dùng chưa nhập
    const ctxEl = document.getElementById("bi-business-context");
    const probEl = document.getElementById("bi-problem-input");
    if (ctxEl && !ctxEl.value.trim()) ctxEl.value = sample.businessContext;
    if (probEl && !probEl.value.trim()) probEl.value = sample.problemToSolve;

    if (rawEl) rawEl.value = sample.rawData;
    if (titleEl) titleEl.innerHTML = `<span style="color:#059669;font-weight:700;">✓ Đã nạp tệp: du_lieu_ban_le_da_kenh_3_mien.csv</span>`;
    if (subEl) subEl.textContent = "20 dòng số liệu (Doanh thu, Chi phí, Tồn kho, Đơn hàng, % Hủy) • Xem bảng bên dưới";
    window.updateRawPreviewBox();

    const verIndicator = document.getElementById("wf-version-indicator");
    if (verIndicator) {
      verIndicator.textContent = autoRun
        ? "Bước 2: Đang phân tích Bộ số liệu mẫu..."
        : "Bước 1: Đã nạp 20 dòng số liệu • Sẵn sàng bấm 'Chạy phân tích BI'";
    }

    if (autoRun) {
      window.executeEnterpriseWorkflowStep2();
    }
  };

  window.clearLoadedDataset = function () {
    const rawEl = document.getElementById("wf-rawdata-input");
    const fileInput = document.getElementById("wf-raw-file-input");
    const titleEl = document.getElementById("bi-dropzone-title-text");
    const subEl = document.getElementById("bi-dropzone-sub-text");
    const previewBox = document.getElementById("bi-raw-preview-box");
    const alertBox = document.getElementById("bi-data-validation-alert");
    const okPanel = document.getElementById("wf-success-branch-panel");
    const errPanel = document.getElementById("wf-error-branch-panel");
    const verIndicator = document.getElementById("wf-version-indicator");

    if (rawEl) rawEl.value = "";
    if (fileInput) fileInput.value = "";
    if (titleEl) titleEl.textContent = "Chọn tệp dữ liệu từ máy";
    if (subEl) subEl.textContent = "Hỗ trợ Excel (.xlsx), CSV, JSON";
    if (previewBox) {
      previewBox.style.display = "none";
      previewBox.innerHTML = "";
    }
    if (alertBox) {
      alertBox.style.display = "none";
      alertBox.innerHTML = "";
    }
    if (okPanel) okPanel.style.display = "none";
    if (errPanel) errPanel.style.display = "none";
    if (verIndicator) verIndicator.textContent = "Bước 1: Sẵn sàng nhập dữ liệu";
    updateFlowchartState("INPUT");
  };

  // Cập nhật và hiển thị bảng số liệu xem trước minh bạch, trực quan
  window.updateRawPreviewBox = function () {
    const raw = (document.getElementById("wf-rawdata-input")?.value || "").trim();
    const previewBox = document.getElementById("bi-raw-preview-box");
    const alertBox = document.getElementById("bi-data-validation-alert");
    if (!previewBox) return;

    if (!raw) {
      previewBox.style.display = "none";
      previewBox.innerHTML = "";
      return;
    }

    if (alertBox) {
      alertBox.style.display = "none";
      alertBox.innerHTML = "";
    }

    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length >= 2 && lines[0].includes(",")) {
      const headers = lines[0].split(",").map((h) => h.trim());
      const dataRows = lines.slice(1);
      const sampleRows = dataRows.slice(0, 5).map((l) => l.split(",").map((c) => c.trim()));

      // Nhận diện cột số học để căn lề phải
      const numCols = [];
      sampleRows.forEach((row) => {
        headers.forEach((h, idx) => {
          const val = Number((row[idx] || "").replace(/,/g, ""));
          if (!isNaN(val) && val > 0 && !numCols.includes(h)) numCols.push(h);
        });
      });

      previewBox.style.display = "block";
      previewBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:8px;">
          <div>
            <span class="badge badge-success" style="font-size:11px;">🟢 Đã nhận diện dữ liệu số</span>
            <strong style="color:#0f172a;margin-left:6px;font-size:12.5px;">${dataRows.length} dòng số liệu × ${headers.length} cột</strong>
            ${numCols.length > 0 ? `<span style="font-size:11.5px;color:#059669;margin-left:6px;">(${numCols.length} cột định lượng: ${numCols.slice(0, 3).join(", ")}...)</span>` : ""}
          </div>
          <button type="button" class="bi-quick-fill-link" style="color:#dc2626;font-size:12px;font-weight:700;" onclick="window.clearLoadedDataset()">
            ✕ Xóa dữ liệu này
          </button>
        </div>
        <div style="overflow-x:auto;max-height:190px;">
          <table style="width:100%;border-collapse:collapse;font-size:11.5px;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;">
            <thead>
              <tr style="background:#f1f5f9;color:#334155;">
                <th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;width:34px;">#</th>
                ${headers.map((h) => `<th style="padding:5px 8px;border:1px solid #e2e8f0;text-align:left;white-space:nowrap;font-weight:700;">${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${sampleRows
                .map(
                  (r, idx) => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;color:#64748b;font-weight:600;">${idx + 1}</td>
                  ${headers
                    .map((_, i) => {
                      const val = r[i] ?? "";
                      const isNum = !isNaN(Number(val.replace(/,/g, ""))) && val !== "";
                      return `<td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:${isNum ? "right" : "left"};font-family:${isNum ? "monospace" : "inherit"};font-weight:${isNum ? "600" : "normal"};color:${isNum ? "#0f172a" : "#334155"};white-space:nowrap;">${val}</td>`;
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        ${dataRows.length > 5 ? `<div style="font-size:11px;color:#64748b;margin-top:5px;text-align:right;">(Hiển thị 5 dòng đầu tiên trên tổng số ${dataRows.length} dòng số liệu)</div>` : ""}
      `;
    } else {
      previewBox.style.display = "block";
      previewBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#0f172a;font-weight:600;">📝 Đã nhập ${raw.length.toLocaleString("vi-VN")} ký tự dữ liệu</span>
          <button type="button" class="bi-quick-fill-link" style="color:#dc2626;font-size:12px;font-weight:700;" onclick="window.clearLoadedDataset()">✕ Xóa dữ liệu</button>
        </div>
      `;
    }

    const verIndicator = document.getElementById("wf-version-indicator");
    if (verIndicator) {
      const rowCount = lines.length > 1 ? lines.length - 1 : 1;
      verIndicator.textContent = `Bước 1: Đã nạp ${rowCount} dòng dữ liệu • Sẵn sàng tính toán`;
    }
  };

  // Hero Button 2: ✨ Chạy thử Mẫu BI (Nạp mẫu bối cảnh + Nạp mẫu dữ liệu số + Tính toán đầy đủ)
  window.runBISampleDemo = function () {
    window.fillBIExampleQuickly();
    window.loadSampleDatasetIntoRightColumn(false);
    workflowFeedbackHistory = [];
    workflowVersion = 0;
    const logEl = document.getElementById("wf-feedback-history-log");
    if (logEl) {
      logEl.style.display = "none";
      logEl.innerHTML = "";
    }
    document.getElementById("workspace-anchor")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      window.executeEnterpriseWorkflowStep2();
    }, 250);
  };

  // Hero Button 3: Test luồng lỗi →
  window.runBIErrorFlowTest = function () {
    const errSample = presets.ERROR_FLOW_SAMPLE;
    const ctxEl = document.getElementById("bi-business-context");
    const probEl = document.getElementById("bi-problem-input");
    const rawEl = document.getElementById("wf-rawdata-input");
    const titleEl = document.getElementById("bi-dropzone-title-text");
    const subEl = document.getElementById("bi-dropzone-sub-text");

    if (ctxEl) ctxEl.value = errSample.businessContext;
    if (probEl) probEl.value = errSample.problemToSolve;
    if (rawEl) rawEl.value = errSample.rawData;
    if (titleEl) titleEl.innerHTML = `<span style="color:#dc2626;font-weight:700;">⚠️ Đang nạp tệp lỗi: Du_lieu_Loi_Test_Nhanh_No.csv</span>`;
    if (subEl) subEl.textContent = "Chứa lỗi thiếu tên, sai kiểu số, số âm và hỏng dòng CSV";
    window.updateRawPreviewBox();

    workflowFeedbackHistory = [];
    workflowVersion = 0;
    document.getElementById("workspace-anchor")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      window.executeEnterpriseWorkflowStep2();
    }, 250);
  };

  window.toggleRawPasteMode = function () {
    isPasteModeOpen = !isPasteModeOpen;
    window.switchDataInputTab(isPasteModeOpen ? "paste" : "upload");
  };

  function getCombinedContextText() {
    const bizCtx = (document.getElementById("bi-business-context")?.value || "").trim();
    const probCtx = (document.getElementById("bi-problem-input")?.value || "").trim();
    const scopeAns0 = (document.getElementById("scope-followup-0")?.value || "").trim();
    const scopeAns1 = (document.getElementById("scope-followup-1")?.value || "").trim();
    if (!bizCtx && !probCtx) return "";
    let full = `Bối cảnh doanh nghiệp: ${bizCtx}\nVấn đề cần Agent giải quyết: ${probCtx}`;
    if (scopeAns0) full += `\nLàm rõ phạm vi 1: ${scopeAns0}`;
    if (scopeAns1) full += `\nLàm rõ phạm vi 2: ${scopeAns1}`;
    return full;
  }

  window.openScopeDiscoveryPanel = function () {
    let bizCtx = (document.getElementById("bi-business-context")?.value || "").trim();
    let probCtx = (document.getElementById("bi-problem-input")?.value || "").trim();
    let rawData = (document.getElementById("wf-rawdata-input")?.value || "").trim();

    if (!bizCtx && !probCtx) {
      window.fillBIExampleQuickly();
      bizCtx = (document.getElementById("bi-business-context")?.value || "").trim();
      probCtx = (document.getElementById("bi-problem-input")?.value || "").trim();
    }

    const scopePlan = engine.proposeAnalysisScope(bizCtx, probCtx, rawData);
    const panel = document.getElementById("bi-scope-discovery-panel");
    if (!panel) return;

    panel.style.display = "block";
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
        <div>
          <span class="badge badge-success">✨ AI Scope Discovery &bull; Trao đổi Phạm vi Phân tích</span>
          <h3 style="font-size:16px;font-weight:800;margin-top:6px;color:#0f172a;">Cách AI Hiểu Bài Toán &amp; Đề Xuất Phạm Vi Phân Tích</h3>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('bi-scope-discovery-panel').style.display='none'">✕ Thu gọn</button>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px 15px;margin-bottom:14px;font-size:13px;color:#1e293b;">
        <strong>🧠 Tôi hiểu yêu cầu của bạn:</strong> ${scopePlan.interpretation}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <strong style="font-size:13px;color:#0f172a;">💡 Góc nhìn AI đề xuất bổ sung vào báo cáo:</strong>
          <ul class="mini-list" style="margin-top:6px;">
            ${scopePlan.suggestions.map((s) => `<li class="mini-cond">• ${s}</li>`).join("")}
          </ul>
        </div>
        <div>
          <strong style="font-size:13px;color:#0f172a;">❓ Câu hỏi làm rõ thêm (Không bắt buộc):</strong>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
            ${scopePlan.followups
              .map(
                (q, idx) => `
              <div>
                <label style="font-size:11.5px;font-weight:600;color:#475569;display:block;margin-bottom:3px;">${q}</label>
                <input type="text" id="scope-followup-${idx}" class="bi-input" style="padding:7px 11px;font-size:12.5px;" placeholder="Nhập câu trả lời nếu muốn định hướng thêm cho Agent..." />
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  function getCleaningOptionsFromUI() {
    return {
      trim: document.getElementById("clean-opt-trim")?.checked ?? true,
      empty: document.getElementById("clean-opt-empty")?.checked ?? true,
      duplicates: document.getElementById("clean-opt-duplicates")?.checked ?? true,
      filterCanceled: document.getElementById("clean-opt-canceled")?.checked ?? true
    };
  }

  window.onCleaningOptionChange = async function () {
    const contextText = getCombinedContextText();
    const rawDataText = (document.getElementById("wf-rawdata-input")?.value || "").trim();
    if (!rawDataText) return;
    await renderWorkflowProcessedOutput(contextText, rawDataText);
  };

  function renderCleaningAuditSection(cleanedData) {
    const auditEl = document.getElementById("bi-cleaning-audit-summary");
    if (!auditEl) return;
    const a = cleanedData.audit;

    auditEl.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:0;">
        <div class="kpi-card">
          <div class="kpi-label">Dòng nguồn ban đầu</div>
          <div class="kpi-value">${a.originalRows}</div>
          <div class="kpi-sub">${cleanedData.columns.length} cột thông tin</div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Dòng sạch đưa vào phân tích</div>
          <div class="kpi-value">${a.cleanedRows}</div>
          <div class="kpi-sub">Đạt chuẩn tính toán BI</div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-label">Dòng nhiễu đã loại bỏ</div>
          <div class="kpi-value">${a.removedRows}</div>
          <div class="kpi-sub">${a.duplicatesRemoved} dòng trùng • ${a.canceledRemoved} đơn hủy • ${a.emptyRemoved} dòng trống</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ô đã chuẩn hóa khoảng trắng</div>
          <div class="kpi-value">${a.trimmedCells}</div>
          <div class="kpi-sub">Còn ${a.remainingMissingCells} ô trống</div>
        </div>
      </div>
    `;
  }

  function initAndRenderGroupExplorer(cleanedData) {
    const profiles = engine.profileColumns(cleanedData.columns, cleanedData.rows);
    const groupSelect = document.getElementById("exp-group-col");
    const metricSelect = document.getElementById("exp-metric-col");

    if (groupSelect && metricSelect) {
      const catCols = profiles.filter((p) => !p.numeric && !/ghi_chu|note/i.test(p.name));
      const numCols = profiles.filter((p) => p.numeric);

      const prevGroup = groupSelect.value;
      const prevMetric = metricSelect.value;

      groupSelect.innerHTML = (catCols.length > 0 ? catCols : profiles)
        .map((c) => `<option value="${c.name}">${c.name}</option>`)
        .join("");

      metricSelect.innerHTML = (numCols.length > 0 ? numCols : profiles)
        .map((c) => `<option value="${c.name}">${c.name}</option>`)
        .join("");

      if (catCols.some((c) => c.name === prevGroup)) {
        groupSelect.value = prevGroup;
      } else {
        const defaultGroup = catCols.find((c) => /ten_kenh|khu_vuc|ten_/i.test(c.name));
        if (defaultGroup) groupSelect.value = defaultGroup.name;
      }

      if (numCols.some((c) => c.name === prevMetric)) {
        metricSelect.value = prevMetric;
      } else {
        const defaultMetric = numCols.find((c) => /doanh_thu|doanh_so/i.test(c.name));
        if (defaultMetric) metricSelect.value = defaultMetric.name;
      }
    }

    const profEl = document.getElementById("bi-column-profile-table");
    if (profEl) {
      profEl.innerHTML = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Cột</th>
                <th>Kiểu Nhận diện</th>
                <th>Ô trống</th>
                <th>Giá trị Khác nhau (Distinct)</th>
                <th>Trung bình (Mean)</th>
                <th>Nhỏ nhất (Min)</th>
                <th>Lớn nhất (Max)</th>
              </tr>
            </thead>
            <tbody>
              ${profiles
                .map(
                  (p) => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td><span class="badge ${p.numeric ? "badge-success" : "badge-info"}">${p.kindLabel}</span></td>
                  <td>${p.missing}</td>
                  <td>${p.distinct}</td>
                  <td>${p.mean !== null ? p.mean.toLocaleString("vi-VN") : "—"}</td>
                  <td>${p.min !== null ? p.min.toLocaleString("vi-VN") : "—"}</td>
                  <td>${p.max !== null ? p.max.toLocaleString("vi-VN") : "—"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    window.updateInteractiveGroupChart();
  }

  window.updateInteractiveGroupChart = function () {
    if (!currentCleanedDataset) return;
    const groupCol = document.getElementById("exp-group-col")?.value;
    const aggMode = document.getElementById("exp-agg-mode")?.value || "sum";
    const metricCol = document.getElementById("exp-metric-col")?.value;

    const breakdown = engine.computeGroupByBreakdown(
      currentCleanedDataset.columns,
      currentCleanedDataset.rows,
      groupCol,
      metricCol,
      aggMode
    );

    const chartEl = document.getElementById("bi-interactive-group-chart");
    if (!chartEl) return;

    const maxVal = Math.max(...breakdown.groups.map((g) => Math.abs(g.value)), 1);

    chartEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:18px;align-items:start;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
          <div style="font-weight:700;font-size:13.5px;color:#0f172a;margin-bottom:12px;">
            📊 Biểu đồ ${breakdown.modeLabel} "${metricCol || "Bản ghi"}" theo "${groupCol}"
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;">
            ${breakdown.groups
              .slice(0, 8)
              .map((g, idx) => {
                const pctWidth = Math.max(4, Math.round((Math.abs(g.value) / maxVal) * 100));
                return `
                  <div style="display:grid;grid-template-columns:175px 1fr 110px;align-items:center;gap:10px;font-size:12.5px;">
                    <span style="font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${g.label}">${g.label}</span>
                    <div class="bar-track" style="height:10px;">
                      <div class="bar-fill" style="width:${pctWidth}%;background:${DONUT_COLORS[idx % DONUT_COLORS.length]};"></div>
                    </div>
                    <span style="text-align:right;font-weight:700;color:#0f172a;">${g.value.toLocaleString("vi-VN")} <small style="color:#64748b;font-weight:500;">(${g.sharePct}%)</small></span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
          <div style="font-weight:700;font-size:13.5px;color:#0f172a;margin-bottom:10px;">
            ✨ Nhận xét Tự động từ Phân bố Nhóm
          </div>
          <ul class="mini-list">
            ${breakdown.autoFindings.map((f) => `<li class="mini-cond" style="background:#ffffff;padding:8px 10px;">• ${f}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  };

  function renderExecutiveDashboardVisuals(cleanedData) {
    const dash = engine.buildExecutiveDashboardData(cleanedData.columns, cleanedData.rows);
    const container = document.getElementById("bi-exec-dashboard-visuals");
    if (!container) return;

    let donutHtml = "";
    if (dash.revenueByRegion.length > 0) {
      let currentPct = 0;
      const segments = dash.revenueByRegion.slice(0, 6).map((item, idx) => {
        const start = currentPct;
        currentPct += item.sharePct;
        return `${DONUT_COLORS[idx % DONUT_COLORS.length]} ${start}% ${Math.min(100, currentPct)}%`;
      });

      donutHtml = `
        <div class="visual-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:14px;color:#0f172a;">🍩 Cơ cấu Đóng góp theo ${dash.regionCol}</strong>
            <span class="badge badge-info">Tỷ trọng %</span>
          </div>
          <div class="donut-layout">
            <div class="conic-donut" style="background:conic-gradient(${segments.join(",")});"></div>
            <ul class="donut-legend">
              ${dash.revenueByRegion
                .slice(0, 6)
                .map(
                  (item, idx) => `
                <li>
                  <span class="legend-dot" style="background:${DONUT_COLORS[idx % DONUT_COLORS.length]};"></span>
                  <span style="color:#334155;font-weight:500;">${item.label}</span>
                  <strong style="color:#0f172a;">${item.value.toLocaleString("vi-VN")}</strong>
                  <span style="color:#64748b;">${item.sharePct}%</span>
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        </div>
      `;
    }

    const trendHtml =
      dash.timeSeries.length >= 2
        ? `
        <div class="visual-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong style="font-size:14px;color:#0f172a;">📈 Xu hướng Doanh thu theo Kỳ (${dash.periodCol})</strong>
            <span class="badge badge-success">Biên LN ròng: ${dash.marginPct}%</span>
          </div>
          <canvas id="bi-trend-canvas" style="width:100%;height:175px;display:block;"></canvas>
        </div>
      `
        : "";

    container.innerHTML = `
      <div class="dashboard-visual-grid">
        ${trendHtml}
        ${donutHtml}
      </div>
    `;

    if (dash.timeSeries.length >= 2) {
      requestAnimationFrame(() => paintTrendCanvas(dash.timeSeries));
    }
  }

  function paintTrendCanvas(series) {
    const canvas = document.getElementById("bi-trend-canvas");
    if (!canvas) return;
    const dpi = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 460;
    const h = canvas.clientHeight || 175;
    canvas.width = w * dpi;
    canvas.height = h * dpi;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpi, dpi);

    const padLeft = 54;
    const padRight = w - 18;
    const padTop = 16;
    const padBottom = h - 28;

    const maxVal = Math.max(...series.map((s) => Math.max(s.revenue, s.cost)), 100);
    const getX = (i) => padLeft + (i * (padRight - padLeft)) / Math.max(1, series.length - 1);
    const getY = (v) => padBottom - (v / maxVal) * (padBottom - padTop);

    ctx.font = "11px Inter, sans-serif";
    for (let t = 0; t <= 3; t++) {
      const val = Math.round((maxVal * t) / 3);
      const yy = getY(val);
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(padLeft, yy);
      ctx.lineTo(padRight, yy);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.textAlign = "right";
      ctx.fillText(val.toLocaleString("vi-VN"), padLeft - 6, yy + 4);
    }

    ctx.beginPath();
    ctx.moveTo(getX(0), padBottom);
    series.forEach((s, i) => ctx.lineTo(getX(i), getY(s.revenue)));
    ctx.lineTo(getX(series.length - 1), padBottom);
    ctx.closePath();
    ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
    ctx.fill();

    ctx.beginPath();
    series.forEach((s, i) => {
      if (i === 0) ctx.moveTo(getX(i), getY(s.revenue));
      else ctx.lineTo(getX(i), getY(s.revenue));
    });
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    series.forEach((s, i) => {
      const xx = getX(i);
      const yy = getY(s.revenue);
      ctx.beginPath();
      ctx.arc(xx, yy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#2563eb";
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText(s.period, xx, h - 8);
    });
  }

  function initEnterpriseWorkflow() {
    const fileInput = document.getElementById("wf-raw-file-input");
    const rawInput = document.getElementById("wf-rawdata-input");
    const titleEl = document.getElementById("bi-dropzone-title-text");
    const subEl = document.getElementById("bi-dropzone-sub-text");
    const dropzone = document.getElementById("bi-dropzone-box");

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel = /\.(xlsx|xls)$/i.test(file.name);
        if (isExcel && window.XLSX) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = new Uint8Array(ev.target.result);
              const workbook = window.XLSX.read(data, { type: "array" });
              const firstSheet = workbook.SheetNames[0];
              const csvText = window.XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
              if (rawInput) rawInput.value = csvText;
              if (titleEl) titleEl.innerHTML = `<span style="color:#059669;font-weight:700;">✓ Đã tải tệp Excel: ${file.name}</span>`;
              if (subEl) subEl.textContent = `Sheet: ${firstSheet} • Dung lượng: ${(file.size / 1024).toFixed(1)} KB • Sẵn sàng phân tích`;
              window.updateRawPreviewBox();
            } catch (err) {
              if (titleEl) titleEl.innerHTML = `<span style="color:#dc2626;font-weight:700;">⚠️ Lỗi đọc tệp Excel: ${file.name}</span>`;
            }
          };
          reader.readAsArrayBuffer(file);
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (rawInput) rawInput.value = ev.target.result;
            if (titleEl) titleEl.innerHTML = `<span style="color:#059669;font-weight:700;">✓ Đã tải tệp: ${file.name}</span>`;
            if (subEl) subEl.textContent = `Dung lượng: ${(file.size / 1024).toFixed(1)} KB • Sẵn sàng phân tích`;
            window.updateRawPreviewBox();
          };
          reader.readAsText(file, "UTF-8");
        }
      });
    }

    // Hỗ trợ kéo & thả tệp vào dropzone
    if (dropzone && fileInput) {
      ["dragenter", "dragover"].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add("dragover");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove("dragover");
        });
      });

      dropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt?.files;
        if (files && files.length > 0) {
          fileInput.files = files;
          fileInput.dispatchEvent(new Event("change"));
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // NÚT "▷ Chạy phân tích BI" (BẮT BUỘC CÓ DỮ LIỆU SỐ MỚI ĐƯỢC TÍNH TOÁN)
  // --------------------------------------------------------------------------
  window.executeEnterpriseWorkflowStep2 = async function () {
    const rawDataText = (document.getElementById("wf-rawdata-input")?.value || "").trim();
    const contextText = getCombinedContextText();

    const errPanel = document.getElementById("wf-error-branch-panel");
    const okPanel = document.getElementById("wf-success-branch-panel");
    const exportPanel = document.getElementById("wf-export-final-panel");
    const verIndicator = document.getElementById("wf-version-indicator");
    const alertBox = document.getElementById("bi-data-validation-alert");
    const dropzoneBox = document.getElementById("bi-dropzone-box");

    if (exportPanel) exportPanel.style.display = "none";
    if (alertBox) {
      alertBox.style.display = "none";
      alertBox.innerHTML = "";
    }

    // ========================================================================
    // KIỂM TRA BẮT BUỘC 1: NGƯỜI DÙNG PHẢI NHẬP DỮ LIỆU MỚI ĐƯỢC TÍNH TOÁN!
    // Tuyệt đối không tự ý phân tích hoặc hiển thị kết quả khi chưa có data.
    // ========================================================================
    if (!rawDataText) {
      updateFlowchartState("INPUT");
      if (okPanel) okPanel.style.display = "none";
      if (errPanel) errPanel.style.display = "none";
      if (verIndicator) verIndicator.textContent = "Bước 1: Chưa có dữ liệu số • Bắt buộc nhập data";

      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.innerHTML = `
          <div class="bi-empty-data-banner">
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <span style="font-size:24px;line-height:1;">⚠️</span>
              <div style="flex:1;">
                <strong style="color:#991b1b;font-size:14px;display:block;margin-bottom:4px;">
                  CHƯA CÓ DỮ LIỆU SỐ ĐỂ TÍNH TOÁN!
                </strong>
                <p style="margin:0;font-size:12.8px;color:#7f1d1d;line-height:1.5;">
                  Bạn chưa chọn tệp (.xlsx, .csv, .json) và chưa dán bảng số liệu nào. 
                  Hệ thống <strong>yêu cầu bắt buộc cần phải nhập data mới được tính toán</strong>.
                </p>
                <div style="margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                  <button type="button" class="btn btn-sm btn-primary" onclick="document.getElementById('wf-raw-file-input').click()">
                    📁 Chọn tệp Excel/CSV từ máy
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary" onclick="window.switchDataInputTab('paste')">
                    📋 Dán bảng số liệu trực tiếp
                  </button>
                  <button type="button" class="btn btn-sm" style="background:#059669;color:#ffffff;border:none;" onclick="window.loadSampleDatasetIntoRightColumn(false)">
                    ⚡ Nạp 15 dòng dữ liệu mẫu để thử
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (dropzoneBox) {
        dropzoneBox.classList.add("shake-error");
        setTimeout(() => dropzoneBox.classList.remove("shake-error"), 600);
      }
      return;
    }

    // ========================================================================
    // KIỂM TRA ĐỊNH DẠNG & CÁC CỘT SỐ HỌC (CHẨN ĐOÁN LỖI NẾU CÓ)
    // ========================================================================
    const diagnosis = engine.validateAndDiagnoseRawData(contextText, rawDataText);

    if (!diagnosis.canProcess) {
      updateFlowchartState("ERROR_BRANCH");
      if (okPanel) okPanel.style.display = "none";
      if (verIndicator) verIndicator.textContent = "3. Không hợp lệ (No) — Phát hiện lỗi dữ liệu";

      if (errPanel) {
        errPanel.style.display = "block";
        errPanel.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
            <div>
              <span class="badge badge-danger">Nhánh No &bull; Không thể tính toán</span>
              <h3 style="font-size:17px;font-weight:800;color:#991b1b;margin-top:6px;">
                🚨 Báo cáo Chẩn đoán Dữ liệu: Lỗi như thế nào và ở đâu (${diagnosis.errors.length} vấn đề)
              </h3>
              <p style="font-size:13px;color:#7f1d1d;margin-top:2px;">
                Agent đã dừng tính toán vì dữ liệu cung cấp chưa đạt chuẩn số liệu định lượng hoặc có lỗi cấu trúc dòng/cột.
              </p>
            </div>
            <div>
              <button type="button" id="btn-autofix-action" class="btn btn-primary" style="background:#dc2626;cursor:pointer;display:inline-flex;align-items:center;gap:6px;" onclick="window.autoFixAndRerunWorkflow(this)">
                🛠️ Tự động Sửa các Lỗi Dữ liệu &amp; Phân tích lại
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table" style="background:#ffffff;border-radius:10px;overflow:hidden;">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lỗi Ở Đâu (Vị trí)</th>
                  <th>Giá trị Hiện tại</th>
                  <th>Loại Lỗi</th>
                  <th>Lỗi Như Thế Nào (Nguyên nhân)</th>
                  <th>Hướng Khắc phục</th>
                </tr>
              </thead>
              <tbody>
                ${diagnosis.errors
                  .map(
                    (err, idx) => `
                  <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td><span class="badge badge-danger">${err.location}</span></td>
                    <td><code style="background:#fee2e2;padding:2px 6px;border-radius:4px;color:#991b1b;">${err.rawValue}</code></td>
                    <td><strong>${err.errorType}</strong></td>
                    <td>${err.howItFailed}</td>
                    <td style="color:#059669;font-weight:600;">${err.suggestedFix}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
        errPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }

    // ========================================================================
    // DỮ LIỆU HỢP LỆ -> CHUYỂN BƯỚC 2 (XỬ LÝ) -> BƯỚC 3 (HỢP LỆ YES) & TÍNH TOÁN
    // ========================================================================
    if (errPanel) errPanel.style.display = "none";
    if (alertBox) alertBox.style.display = "none";

    // Cập nhật trạng thái Bước 2: Agent xử lý
    const procNode = document.getElementById("fc-node-process");
    if (procNode) procNode.classList.add("active");
    if (verIndicator) verIndicator.textContent = "Bước 2: Agent đang làm sạch dữ liệu & tính toán các chỉ số...";

    const btnRun = document.getElementById("btn-run-workflow-main");
    if (btnRun) {
      btnRun.disabled = true;
      btnRun.innerHTML = `<span>⏳</span> <span>Agent đang tính toán dữ liệu...</span>`;
    }

    // Thời gian xử lý nhỏ để người dùng cảm nhận rõ quy trình tính toán có thật
    await new Promise((resolve) => setTimeout(resolve, 320));

    if (btnRun) {
      btnRun.disabled = false;
      btnRun.innerHTML = `<span style="color:#06b6d4;font-size:15px;">▷</span> <span>Chạy phân tích BI</span>`;
    }

    if (okPanel) okPanel.style.display = "block";
    updateFlowchartState("SUCCESS_EVALUATE");

    await renderWorkflowProcessedOutput(contextText, rawDataText);
    okPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  window.autoFixAndRerunWorkflow = async function (btnTrigger) {
    const rawInput = document.getElementById("wf-rawdata-input");
    const bizCtxEl = document.getElementById("bi-business-context");
    const probCtxEl = document.getElementById("bi-problem-input");
    const titleEl = document.getElementById("bi-dropzone-title-text");
    const subEl = document.getElementById("bi-dropzone-sub-text");
    const errPanel = document.getElementById("wf-error-branch-panel");

    // Phản hồi trực quan tức thì trên nút
    const btn =
      btnTrigger ||
      document.getElementById("btn-autofix-action") ||
      document.querySelector("#wf-error-branch-panel button");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="font-size:16px;">⏳</span> <span>Đang tự động sửa lỗi &amp; tính toán lại...</span>`;
    }

    // 1. Đảm bảo Bối cảnh & Vấn đề doanh nghiệp có đầy đủ nội dung hợp lệ
    if (bizCtxEl && (!bizCtxEl.value || bizCtxEl.value.trim().length < 10)) {
      bizCtxEl.value = presets.DEFAULT_BI_SAMPLE.businessContext;
    }
    if (probCtxEl && (!probCtxEl.value || probCtxEl.value.trim().length < 15)) {
      probCtxEl.value = presets.DEFAULT_BI_SAMPLE.problemToSolve;
    }

    // 2. Làm sạch & sửa triệt để tất cả lỗi trong dữ liệu thô
    if (rawInput) {
      const fixedData = engine.autoFixCorruptedRawData(rawInput.value);
      rawInput.value = fixedData;
    }

    // 3. Cập nhật thông báo trực quan thành công tại khu vực tải tệp
    if (titleEl) {
      titleEl.innerHTML = `<span style="color:#059669;font-weight:700;">✓ Đã tự động sửa sạch 100% lỗi dữ liệu</span>`;
    }
    if (subEl) {
      subEl.textContent =
        "Đã chuẩn hóa cột số, chuyển số âm thành dương, bổ sung tên định danh và loại bỏ dòng hỏng";
    }

    // 4. Cập nhật bảng xem trước dữ liệu thô
    window.updateRawPreviewBox();

    // 5. Ẩn khung lỗi ngay lập tức để chuyển mượt sang quy trình xử lý
    if (errPanel) {
      errPanel.style.display = "none";
    }

    // 6. Thực hiện phân tích dữ liệu đã được làm sạch
    await window.executeEnterpriseWorkflowStep2();
  };

  async function renderWorkflowProcessedOutput(contextText, rawDataTextOverride) {
    workflowVersion++;
    const rawDataText =
      rawDataTextOverride !== undefined
        ? rawDataTextOverride
        : (document.getElementById("wf-rawdata-input")?.value || "").trim();

    const cleaningConfig = getCleaningOptionsFromUI();
    const cleanedData = engine.cleanAndAuditDataset(rawDataText, cleaningConfig);
    currentCleanedDataset = cleanedData;

    const cleanedCsvText =
      cleanedData.columns.length > 1
        ? [
            cleanedData.columns.join(","),
            ...cleanedData.rows.map((r) => cleanedData.columns.map((c) => r[c] ?? "").join(","))
          ].join("\n")
        : rawDataText;

    renderCleaningAuditSection(cleanedData);
    initAndRenderGroupExplorer(cleanedData);
    renderExecutiveDashboardVisuals(cleanedData);

    const analysisResult = engine.analyzeContextAndData(contextText, cleanedCsvText, workflowFeedbackHistory);
    currentAnalysisResult = analysisResult;

    const verIndicator = document.getElementById("wf-version-indicator");
    const repVerTag = document.getElementById("wf-report-version-tag");
    const step4Badge = document.getElementById("wf-step4-badge");
    const adjContainer = document.getElementById("wf-adjustment-pills");
    const statsSummaryEl = document.getElementById("wf-context-and-stats-summary");
    const priorityCardsEl = document.getElementById("wf-priority-solution-cards");

    if (verIndicator) {
      verIndicator.textContent =
        workflowFeedbackHistory.length === 0
          ? `Phiên bản #1 • Đã phân tích ${analysisResult.processedRecords.length} bản ghi sạch`
          : `Phiên bản #${workflowVersion} • Đã cập nhật theo ${workflowFeedbackHistory.length} phản hồi`;
    }
    if (repVerTag) {
      repVerTag.textContent = `Báo cáo Giải pháp Phiên bản #${workflowVersion}`;
    }
    if (step4Badge) {
      step4Badge.textContent = `3. Hợp lệ (Yes) • ${analysisResult.processedRecords.length} bản ghi sạch`;
    }

    if (adjContainer) {
      adjContainer.innerHTML =
        analysisResult.appliedAdjustments.length > 0
          ? analysisResult.appliedAdjustments
              .map((a) => `<span class="badge badge-warning">↺ ${a}</span>`)
              .join(" ")
          : "";
    }

    // 1. Render Tóm tắt Bối cảnh & 4 Thẻ Chỉ số Định lượng
    if (statsSummaryEl) {
      const statsCardsHtml =
        analysisResult.metricStats.length > 0
          ? `<div class="kpi-grid" style="margin-top:14px;margin-bottom:0;">
              ${analysisResult.metricStats
                .slice(0, 4)
                .map(
                  (ms) => `
                <div class="kpi-card">
                  <div class="kpi-label">Chỉ số: ${ms.column}</div>
                  <div class="kpi-value" style="font-size:24px;">TB: ${ms.avg.toLocaleString("vi-VN")}</div>
                  <div class="kpi-sub">
                    Tổng: <strong>${ms.sum.toLocaleString("vi-VN")}</strong><br/>
                    <span style="color:#059669;">▲ Max: ${ms.max.toLocaleString("vi-VN")}</span> &bull;
                    <span style="color:#dc2626;">▼ Min: ${ms.min.toLocaleString("vi-VN")}</span>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>`
          : "";

      statsSummaryEl.innerHTML = `
        <div class="card" style="margin-bottom:0;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div>
              <span class="badge badge-info" style="margin-bottom:6px;">🧠 Đọc hiểu Bối cảnh Doanh nghiệp</span>
              <ul class="mini-list">
                ${analysisResult.contextPainPoints
                  .slice(0, 3)
                  .map((p) => `<li class="mini-cond" style="background:#ffffff;">• ${p}</li>`)
                  .join("")}
              </ul>
            </div>
            <div>
              <span class="badge badge-success" style="margin-bottom:6px;">🎯 Mục tiêu &amp; Câu hỏi Bài toán BI</span>
              <ul class="mini-list">
                ${analysisResult.contextObjectives
                  .slice(0, 3)
                  .map((o) => `<li class="mini-cond" style="background:#ffffff;">→ ${o}</li>`)
                  .join("")}
              </ul>
            </div>
          </div>
          ${statsCardsHtml}
        </div>
      `;
    }

    // 2. Render 3 Thẻ Đề xuất Giải pháp Trọng tâm theo Mức độ Ưu tiên
    const optimalList = analysisResult.processedRecords.filter((r) => r.priorityGroup === "OPTIMAL");
    const warningList = analysisResult.processedRecords.filter((r) => r.priorityGroup === "WARNING");
    const criticalList = analysisResult.processedRecords.filter((r) => r.priorityGroup === "CRITICAL");

    if (priorityCardsEl) {
      priorityCardsEl.innerHTML = `
        <div class="solution-proposal-card priority-high">
          <div>
            <span class="badge badge-danger">🔥 Ưu tiên Cao &bull; Xử lý Điểm nghẽn (${criticalList.length} đơn vị)</span>
            <h4 style="font-size:15px;font-weight:800;margin:10px 0 6px;color:#0f172a;">
              Khoanh vùng &amp; Tái cơ cấu Đơn vị Rủi ro Cao
            </h4>
            <p style="font-size:12.8px;color:#475569;margin-bottom:10px;">
              ${
                criticalList.length > 0
                  ? `Tập trung xử lý tại <strong>${criticalList.map((r) => `${r.name} (${r.id})`).join(", ")}</strong>: ${criticalList[0].solutions[0]}`
                  : `Hiện đã loại bỏ các đơn hủy/dòng lỗi thông qua bước làm sạch dữ liệu.`
              }
            </p>
          </div>
          <div style="font-size:12px;padding-top:10px;border-top:1px dashed #e2e8f0;color:#0f172a;">
            <strong>🎯 KPI Đo lường:</strong> Giảm 25–30% chi phí lãng phí &amp; tỷ lệ hủy đơn trong 30 ngày.
          </div>
        </div>

        <div class="solution-proposal-card priority-medium">
          <div>
            <span class="badge badge-warning">⚡ Ưu tiên Trung bình &bull; Tối ưu Định mức (${warningList.length} đơn vị)</span>
            <h4 style="font-size:15px;font-weight:800;margin:10px 0 6px;color:#0f172a;">
              Kiểm soát Tỷ lệ Chi phí &amp; Vòng quay Tồn kho
            </h4>
            <p style="font-size:12.8px;color:#475569;margin-bottom:10px;">
              ${
                warningList.length > 0
                  ? `Áp dụng tại <strong>${warningList.map((r) => `${r.name} (${r.id})`).join(", ")}</strong>: ${warningList[0].solutions[0]}`
                  : `Các đơn vị đang duy trì trong ngưỡng an toàn.`
              }
            </p>
          </div>
          <div style="font-size:12px;padding-top:10px;border-top:1px dashed #e2e8f0;color:#0f172a;">
            <strong>🎯 KPI Đo lường:</strong> Đưa tỷ lệ Chi phí / Doanh thu về dưới 18% và Tồn kho &lt; 45% DT.
          </div>
        </div>

        <div class="solution-proposal-card priority-growth">
          <div>
            <span class="badge badge-success">🌱 Chiến lược Tăng trưởng &bull; Nhân rộng (${optimalList.length} đơn vị)</span>
            <h4 style="font-size:15px;font-weight:800;margin:10px 0 6px;color:#0f172a;">
              Nhân rộng Mô hình Kênh Dẫn đầu Lợi nhuận
            </h4>
            <p style="font-size:12.8px;color:#475569;margin-bottom:10px;">
              ${
                optimalList.length > 0
                  ? `Ưu tiên phân bổ nguồn lực cho <strong>${optimalList.slice(0, 3).map((r) => `${r.name}`).join(", ")}</strong> và chuẩn hóa quy trình vận hành sang các kênh khác.`
                  : `Tập trung chuẩn hóa quy trình bán hàng cốt lõi.`
              }
            </p>
          </div>
          <div style="font-size:12px;padding-top:10px;border-top:1px dashed #e2e8f0;color:#0f172a;">
            <strong>🎯 KPI Đo lường:</strong> Tăng trưởng doanh thu ròng +15–20% trong quý tiếp theo.
          </div>
        </div>
      `;
    }

    // 3. Render Bảng Dữ liệu Đã Xử lý & Đề xuất Giải pháp
    const tbody = document.getElementById("wf-processed-table-body");
    if (tbody) {
      tbody.innerHTML = analysisResult.processedRecords
        .map((rec) => {
          const fbHighlight =
            rec.feedbackNotes && rec.feedbackNotes.length > 0
              ? `<div style="margin-top:6px;padding:4px 8px;background:#fef3c7;border-left:3px solid #d97706;border-radius:4px;font-size:11.5px;font-weight:700;color:#92400e;">
                  ↺ ${rec.feedbackNotes.join(" | ")}
                </div>`
              : "";

          const issuesHtml = rec.issues
            .map((iss) => `<li class="mini-flag">🚨 <strong>Vấn đề:</strong> ${iss}</li>`)
            .join("");
          const solutionsHtml = rec.solutions
            .map((sol) => `<li class="mini-cond">💡 <strong>Giải pháp:</strong> ${sol}</li>`)
            .join("");

          return `
            <tr>
              <td>
                <div style="font-weight:800;font-size:13px;">${rec.id}</div>
                <span class="badge badge-info" style="margin-top:4px;">${rec.group}</span>
              </td>
              <td>
                <div style="font-weight:700;font-size:13.5px;">${rec.name}</div>
                ${rec.noteText ? `<div style="font-size:11.5px;color:var(--text-secondary);margin-top:3px;">${rec.noteText}</div>` : ""}
              </td>
              <td>
                <div style="font-size:12.5px;color:var(--text-primary);">${rec.keyMetricsSummary}</div>
              </td>
              <td style="text-align:center;">
                <div class="score-pill ${getScoreClass(rec.score)}">${rec.score}</div>
              </td>
              <td>
                <span class="badge ${rec.badgeClass}">${rec.statusLabel}</span>
                ${fbHighlight}
              </td>
              <td style="min-width:320px;">
                <ul class="mini-list">${issuesHtml}${solutionsHtml}</ul>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    // 4. Render KPI Cards ở Góc nhìn 2
    renderDynamicKpiCards(analysisResult);

    // 5. Render Báo cáo Đề xuất Giải pháp định dạng HTML sạch đẹp + Gọi Google Gemini AI
    workflowCurrentReportText = analysisResult.structuredSolutionReport;
    const repBox = document.getElementById("wf-executive-report-box");
    if (repBox) {
      repBox.innerHTML =
        formatMarkdownToHTML(analysisResult.structuredSolutionReport) +
        `<div style="margin-top:14px;padding:10px 14px;background:#eff6ff;border-radius:8px;color:#1d4ed8;font-weight:600;font-size:12.5px;">⏳ Đang gọi Google Gemini AI tổng hợp thêm Đề xuất Giải pháp Chiến lược chuyên sâu...</div>`;
    }

    const apiKey = (document.getElementById("global-api-key")?.value || "").trim();
    if (apiKey && repBox) {
      try {
        const geminiReport = await engine.generateDeepSolutionReportWithGemini(
          contextText,
          analysisResult,
          workflowFeedbackHistory,
          apiKey
        );
        workflowCurrentReportText = analysisResult.structuredSolutionReport + "\n\n" + geminiReport;
        repBox.innerHTML = formatMarkdownToHTML(geminiReport);
      } catch (err) {
        repBox.innerHTML = formatMarkdownToHTML(analysisResult.structuredSolutionReport);
      }
    }

    // Cập nhật lại khung Copilot để đồng bộ với bộ số liệu mới
    copilotChatHistory = [];
    window.initCopilotChatIfEmpty();
  }

  function renderDynamicKpiCards(analysisResult) {
    const records = analysisResult.processedRecords || [];
    const optimalCount = records.filter((r) => r.priorityGroup === "OPTIMAL").length;
    const warningCount = records.filter((r) => r.priorityGroup === "WARNING").length;
    const criticalCount = records.filter((r) => r.priorityGroup === "CRITICAL").length;
    const avgScore =
      records.length > 0
        ? Math.round(records.reduce((acc, r) => acc + r.score, 0) / records.length)
        : 0;

    const kpiEl = document.getElementById("dynamic-kpi-container");
    if (kpiEl) {
      kpiEl.innerHTML = `
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Nhóm Hiệu quả Tốt / Nhân rộng</div>
          <div class="kpi-value">${optimalCount} <span style="font-size:15px;font-weight:600;color:var(--success);">/ ${records.length} bản ghi</span></div>
          <div class="kpi-sub">Đạt chuẩn vận hành, đề xuất ưu tiên nguồn lực</div>
        </div>

        <div class="kpi-card kpi-warning">
          <div class="kpi-label">Nhóm Cần Tối ưu Định mức</div>
          <div class="kpi-value">${warningCount} <span style="font-size:15px;font-weight:600;color:var(--warning);">bản ghi</span></div>
          <div class="kpi-sub">Cần thực hiện giải pháp điều chỉnh chi phí/tồn kho</div>
        </div>

        <div class="kpi-card kpi-danger">
          <div class="kpi-label">Nhóm Cảnh báo Đỏ / Điểm nghẽn</div>
          <div class="kpi-value">${criticalCount} <span style="font-size:15px;font-weight:600;color:var(--danger);">bản ghi</span></div>
          <div class="kpi-sub">Gây thất thoát / rủi ro cao, cần tái cơ cấu gấp</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Điểm Hiệu quả Trung bình</div>
          <div class="kpi-value">${avgScore} <span style="font-size:15px;font-weight:600;color:var(--text-secondary);">/ 100 điểm</span></div>
          <div class="kpi-sub">Phiên bản phân tích #${workflowVersion}</div>
        </div>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // BƯỚC 4: MỤC PHẢN HỒI AGENT ĐỂ XỬ LÝ LẠI (HUMAN-IN-THE-LOOP FEEDBACK)
  // --------------------------------------------------------------------------
  window.fillSampleFeedback = function (sampleText) {
    const fbInput = document.getElementById("wf-feedback-input");
    if (fbInput) {
      fbInput.value = sampleText;
      fbInput.focus();
    }
  };

  window.submitAgentFeedbackAndReprocess = async function () {
    const fbInput = document.getElementById("wf-feedback-input");
    const text = (fbInput?.value || "").trim();
    if (!text) {
      alert("Vui lòng nhập nội dung phản hồi để Agent phân tích và xử lý lại!");
      return;
    }

    const nowStr = new Date().toLocaleTimeString("vi-VN");
    workflowFeedbackHistory.push({
      version: workflowFeedbackHistory.length + 1,
      text,
      time: nowStr
    });

    if (fbInput) fbInput.value = "";

    const logEl = document.getElementById("wf-feedback-history-log");
    if (logEl) {
      logEl.style.display = "block";
      logEl.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:#059669;margin-bottom:6px;">
          ↺ Lịch sử Phản hồi của Người dùng đã được Agent tiếp nhận &amp; xử lý lại:
        </div>
        <ul class="mini-list">
          ${workflowFeedbackHistory
            .map(
              (f) =>
                `<li class="mini-cond" style="background:#ffffff;"><span class="dept-tag">Phản hồi #${f.version} (${f.time})</span> ${f.text}</li>`
            )
            .join("")}
        </ul>
      `;
    }

    const contextText = getCombinedContextText();
    await renderWorkflowProcessedOutput(contextText);
    window.switchResultSubview("subview-solutions");
    document.getElementById("wf-success-branch-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  window.resetWorkflowFeedbackHistory = async function () {
    workflowFeedbackHistory = [];
    workflowVersion = 0;
    const logEl = document.getElementById("wf-feedback-history-log");
    if (logEl) {
      logEl.style.display = "none";
      logEl.innerHTML = "";
    }
    const contextText = getCombinedContextText();
    await renderWorkflowProcessedOutput(contextText);
  };

  // --------------------------------------------------------------------------
  // BƯỚC 5 (END): ĐÁNH GIÁ & XUẤT DỮ LIỆU ĐÃ XỬ LÝ + BÁO CÁO GIẢI PHÁP
  // --------------------------------------------------------------------------
  window.approveAndGoToExportStep = function () {
    updateFlowchartState("EXPORT_END");
    const exportPanel = document.getElementById("wf-export-final-panel");
    if (exportPanel) {
      exportPanel.style.display = "block";
      exportPanel.scrollIntoView({ behavior: "smooth" });
    }
  };

  window.exportWorkflowProcessedCSV = function () {
    const records = currentAnalysisResult?.processedRecords || [];
    const headers = [
      "Ma_Kenh_Don_Vi",
      "Ten_Kenh_Don_Vi",
      "Khu_Vuc_Phan_Nhom",
      "Chi_So_Dinh_Luong",
      "Diem_Hieu_Qua",
      "Phan_Loai_Ket_Qua",
      "Van_De_Phat_Hien",
      "De_Xuat_Giai_Phap",
      "Ghi_Chu_Phan_Hoi"
    ];

    const esc = (s) => `"${(s ?? "").toString().replace(/"/g, '""')}"`;
    const rows = records.map((rec) =>
      [
        esc(rec.id),
        esc(rec.name),
        esc(rec.group),
        esc(rec.keyMetricsSummary),
        rec.score,
        esc(rec.statusLabel),
        esc(rec.issues.join(" | ")),
        esc(rec.solutions.join(" | ")),
        esc((rec.feedbackNotes || []).join(" | "))
      ].join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Du_Lieu_BI_Da_Lam_Sach_v${workflowVersion || 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  window.exportWorkflowProcessedJSON = function () {
    const payload = {
      version: workflowVersion || 1,
      exportedAt: new Date().toISOString(),
      cleaningAudit: currentCleanedDataset?.audit || {},
      contextObjectives: currentAnalysisResult?.contextObjectives || [],
      contextPainPoints: currentAnalysisResult?.contextPainPoints || [],
      metricStats: currentAnalysisResult?.metricStats || [],
      feedbackHistory: workflowFeedbackHistory,
      processedRecords: currentAnalysisResult?.processedRecords || []
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Du_Lieu_BI_Da_Lam_Sach_v${workflowVersion || 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================================================
  // PHÂN HỆ: TRỢ LÝ HỎI ĐÁP SỐ LIỆU TRỰC TIẾP (DATAMIND AI COPILOT)
  // ==========================================================================
  let copilotChatHistory = [];
  let isCopilotThinking = false;

  window.initCopilotChatIfEmpty = function () {
    const container = document.getElementById("copilot-chat-messages");
    if (!container) return;

    if (copilotChatHistory.length === 0) {
      const recCount = currentAnalysisResult?.processedRecords?.length || 0;
      const revStat =
        currentAnalysisResult?.metricStats?.find((s) =>
          /doanh_thu|doanh_so|revenue|sales/i.test(s.column)
        ) || currentAnalysisResult?.metricStats?.[0];
      const totalRev = revStat?.sum || 0;

      const welcomeText = `👋 Xin chào! Tôi là **DataMind AI Copilot** — trợ lý hỏi đáp và phân tích dữ liệu trực tiếp của bạn.

${
  recCount > 0
    ? `Tôi đã nạp **${recCount} bản ghi sạch** từ tập dữ liệu của bạn (Tổng doanh số toàn hệ thống: **${totalRev.toLocaleString(
        "vi-VN"
      )} triệu VNĐ**).`
    : `Hãy bấm **"▷ Chạy phân tích BI"** để nạp dữ liệu số vào bộ nhớ của tôi.`
}

Bạn có thể bấm các **gợi ý câu hỏi nhanh ở trên**, hoặc gõ câu hỏi bất kỳ bằng tiếng Việt như:
- *🏆 Kênh nào có doanh thu cao nhất & thấp nhất?*
- *🗺️ So sánh tổng doanh thu và chi phí giữa 3 miền Bắc, Trung, Nam?*
- *🚨 Những kênh nào đang có tỷ lệ hủy đơn cao vượt ngưỡng an toàn?*
- *💸 Kênh nào chi phí vận hành cao nhất và giải pháp là gì?*
- *📊 Báo cáo tổng quan các chỉ số tài chính toàn hệ thống?*`;

      copilotChatHistory.push({
        sender: "assistant",
        text: welcomeText,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      });
      renderCopilotMessages();
    }
  };

  function escapeHtml(text) {
    return (text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderCopilotMessages() {
    const container = document.getElementById("copilot-chat-messages");
    if (!container) return;

    container.innerHTML = copilotChatHistory
      .map((msg) => {
        const isUser = msg.sender === "user";
        const formattedBody = isUser
          ? `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(msg.text)}</p>`
          : formatMarkdownToHTML(msg.text);

        return `
          <div class="copilot-msg-row ${isUser ? "user" : "assistant"}">
            <div class="copilot-msg-avatar">${isUser ? "👤" : "🤖"}</div>
            <div>
              <div class="copilot-bubble">
                ${formattedBody}
              </div>
              <span class="copilot-msg-time">${msg.time}</span>
            </div>
          </div>
        `;
      })
      .join("");

    if (isCopilotThinking) {
      container.innerHTML += `
        <div class="copilot-msg-row assistant">
          <div class="copilot-msg-avatar">🤖</div>
          <div>
            <div class="copilot-bubble" style="background:#f1f5f9;color:#0284c7;font-weight:600;">
              <span style="display:inline-block;animation:spin 1s linear infinite;margin-right:6px;">⏳</span>
              <span>DataMind AI đang truy vấn &amp; tính toán số liệu từ bảng dữ liệu...</span>
            </div>
          </div>
        </div>
      `;
    }

    container.scrollTop = container.scrollHeight;
  }

  window.askCopilotPrompt = function (promptText) {
    const input = document.getElementById("copilot-user-input");
    if (input) {
      input.value = promptText;
      window.sendCopilotMessage();
    }
  };

  window.sendCopilotMessage = async function () {
    const input = document.getElementById("copilot-user-input");
    if (!input || isCopilotThinking) return;

    const question = input.value.trim();
    if (!question) return;

    input.value = "";
    const currentTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    // 1. Ghi nhận câu hỏi của người dùng
    copilotChatHistory.push({
      sender: "user",
      text: question,
      time: currentTime
    });
    isCopilotThinking = true;
    renderCopilotMessages();

    // 2. Thu thập context & API key
    const contextText = getCombinedContextText();
    const apiKey = (document.getElementById("global-api-key")?.value || "").trim();

    try {
      // 3. Gọi engine để tính toán hoặc suy luận qua Gemini AI
      const answer = await engine.answerUserQuestionOnCurrentData(
        question,
        contextText,
        currentAnalysisResult,
        apiKey
      );

      copilotChatHistory.push({
        sender: "assistant",
        text: answer,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      });
    } catch (err) {
      copilotChatHistory.push({
        sender: "assistant",
        text: `⚠️ **Không thể phân tích câu hỏi:** ${err.message}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      });
    } finally {
      isCopilotThinking = false;
      renderCopilotMessages();
    }
  };

  window.clearCopilotChatHistory = function () {
    copilotChatHistory = [];
    window.initCopilotChatIfEmpty();
  };

  // ==========================================================================
  // XUẤT BÁO CÁO ĐỀ XUẤT GIẢI PHÁP RA BẢN MICROSOFT WORD (.DOC)
  // Chuẩn in ấn A4, đầy đủ tiêu ngữ, bảng KPI, biểu mẫu chẩn đoán và chữ ký
  // ==========================================================================
  window.exportWorkflowReportWord = function () {
    const bizCtx =
      (document.getElementById("bi-business-context")?.value || "").trim() ||
      "Doanh nghiệp bán lẻ đa kênh tại 3 khu vực Bắc, Trung, Nam";
    const probCtx =
      (document.getElementById("bi-problem-input")?.value || "").trim() ||
      "Phân tích hiệu quả kinh doanh, kiểm soát chi phí & đề xuất giải pháp tối ưu.";
    const reportText =
      workflowCurrentReportText ||
      currentAnalysisResult?.structuredSolutionReport ||
      "Chưa có nội dung báo cáo phân tích.";
    const reportHtml = formatMarkdownToHTML(reportText);

    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;
    const timeFormatted = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const records = currentAnalysisResult?.processedRecords || [];
    const metricStats = currentAnalysisResult?.metricStats || [];
    const audit = currentCleanedDataset?.audit || {
      originalRows: 0,
      cleanedRows: 0,
      removedRows: 0,
      trimmedCells: 0
    };

    // 1. Bảng Chỉ số Định lượng (KPI Table)
    let kpiTableHtml = "";
    if (metricStats.length > 0) {
      kpiTableHtml = `
        <table class="data-table" style="margin-top:8pt;margin-bottom:14pt;">
          <thead>
            <tr>
              <th style="width:28%;">Chỉ số Định lượng</th>
              <th style="width:18%;text-align:right;">Tổng số</th>
              <th style="width:18%;text-align:right;">Trung bình (Mean)</th>
              <th style="width:18%;text-align:right;">Lớn nhất (Max)</th>
              <th style="width:18%;text-align:right;">Nhỏ nhất (Min)</th>
            </tr>
          </thead>
          <tbody>
            ${metricStats
              .slice(0, 6)
              .map(
                (ms) => `
              <tr>
                <td><strong>${ms.column}</strong></td>
                <td style="text-align:right;font-family:monospace;font-weight:bold;">${ms.sum.toLocaleString("vi-VN")}</td>
                <td style="text-align:right;font-family:monospace;">${ms.avg.toLocaleString("vi-VN")}</td>
                <td style="text-align:right;font-family:monospace;color:#059669;font-weight:bold;">${ms.max.toLocaleString("vi-VN")}</td>
                <td style="text-align:right;font-family:monospace;color:#dc2626;">${ms.min.toLocaleString("vi-VN")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }

    // 2. Bảng Chẩn đoán và Giải pháp Chi tiết Từng Kênh / Đơn vị
    let recordsTableHtml = "";
    if (records.length > 0) {
      recordsTableHtml = `
        <table class="data-table" style="margin-top:8pt;margin-bottom:14pt;">
          <thead>
            <tr>
              <th style="width:10%;">Mã kênh</th>
              <th style="width:18%;">Tên kênh / Đơn vị</th>
              <th style="width:12%;">Khu vực</th>
              <th style="width:20%;">Chỉ số định lượng</th>
              <th style="width:8%;text-align:center;">Điểm</th>
              <th style="width:12%;">Đánh giá</th>
              <th style="width:20%;">Đề xuất giải pháp</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (rec) => `
              <tr>
                <td><strong>${rec.id}</strong></td>
                <td><strong>${rec.name}</strong></td>
                <td>${rec.group}</td>
                <td style="font-size:9.5pt;">${rec.keyMetricsSummary}</td>
                <td style="text-align:center;font-weight:bold;color:${
                  rec.score >= 75 ? "#059669" : rec.score >= 50 ? "#d97706" : "#dc2626"
                };">${rec.score}</td>
                <td><strong>${rec.statusLabel}</strong></td>
                <td style="font-size:9.5pt;">${
                  rec.solutions && rec.solutions.length > 0 ? rec.solutions[0] : "Duy trì kiểm soát"
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }

    // 3. Lịch sử phản hồi người dùng (nếu có)
    let feedbackHtml = "";
    if (workflowFeedbackHistory.length > 0) {
      feedbackHtml = `
        <h2 class="section-title">V. LỊCH SỬ PHẢN HỒI &amp; HIỆU CHỈNH CỦA NGƯỜI DÙNG</h2>
        <div class="info-box" style="border-left-color:#d97706;background:#fffbeb;">
          <p><strong>Báo cáo đã tiếp nhận và cập nhật theo ${workflowFeedbackHistory.length} vòng phản hồi:</strong></p>
          <ul>
            ${workflowFeedbackHistory
              .map((f) => `<li><strong>Lần #${f.version} (${f.time}):</strong> ${f.text}</li>`)
              .join("")}
          </ul>
        </div>
      `;
    }

    // 4. Toàn bộ tài liệu Microsoft Word
    const wordDocumentContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Báo cáo Phân tích Dữ liệu &amp; Đề xuất Giải pháp BI</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt; /* Khổ giấy A4 chuẩn */
            margin: 70.85pt 56.7pt 70.85pt 56.7pt; /* Lề: Trên/Dưới 2.5cm, Trái/Phải 2.0cm */
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            line-height: 1.45;
            color: #111827;
            background-color: #ffffff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18pt;
          }
          .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
            font-size: 11pt;
          }
          h1.doc-title {
            font-size: 18pt;
            font-weight: bold;
            color: #1e3a8a;
            text-align: center;
            margin-top: 14pt;
            margin-bottom: 5pt;
            text-transform: uppercase;
          }
          .doc-subtitle {
            text-align: center;
            font-size: 11pt;
            font-style: italic;
            color: #4b5563;
            margin-bottom: 18pt;
          }
          h2.section-title {
            font-size: 13.5pt;
            font-weight: bold;
            color: #1e40af;
            margin-top: 16pt;
            margin-bottom: 8pt;
            border-bottom: 1.5pt solid #2563eb;
            padding-bottom: 3pt;
            text-transform: uppercase;
          }
          h3 {
            font-size: 12.5pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 11pt;
            margin-bottom: 4pt;
          }
          p {
            margin-top: 0;
            margin-bottom: 6pt;
            text-align: justify;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 8pt;
            padding-left: 22pt;
          }
          li {
            margin-bottom: 4pt;
          }
          .info-box {
            background-color: #f8fafc;
            border: 1pt solid #cbd5e1;
            border-left: 4pt solid #3b82f6;
            padding: 8pt 12pt;
            margin-bottom: 14pt;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
            margin-bottom: 14pt;
            font-size: 10pt;
          }
          table.data-table th, table.data-table td {
            border: 1pt solid #94a3b8;
            padding: 5pt 6pt;
            vertical-align: top;
          }
          table.data-table th {
            background-color: #e2e8f0;
            color: #0f172a;
            font-weight: bold;
            text-align: left;
          }
          .signature-grid {
            width: 100%;
            margin-top: 30pt;
            border-collapse: collapse;
          }
          .signature-grid td {
            border: none;
            text-align: center;
            vertical-align: top;
            font-size: 12pt;
            width: 50%;
          }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <!-- TIÊU NGỮ VÀ HEADER -->
          <table class="header-table">
            <tr>
              <td style="width: 52%;">
                <strong>DATAMIND BI STUDIO</strong><br>
                <em>Hệ thống Phân tích Dữ liệu &amp; Giải pháp AI Doanh nghiệp</em>
              </td>
              <td style="width: 48%; text-align: right;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
                <em>Độc lập – Tự do – Hạnh phúc</em><br>
                <small>Thời gian xuất: ${timeFormatted}, ngày ${dateFormatted}</small>
              </td>
            </tr>
          </table>

          <!-- TIÊU ĐỀ BÁO CÁO -->
          <h1 class="doc-title">BÁO CÁO PHÂN TÍCH DỮ LIỆU KINH DOANH<br>&amp; ĐỀ XUẤT GIẢI PHÁP CHIẾN LƯỢC</h1>
          <div class="doc-subtitle">Phiên bản Báo cáo: #${workflowVersion || 1} &bull; Số bản ghi đã phân tích: ${records.length} đơn vị</div>

          <!-- MỤC 1: BỐI CẢNH DOANH NGHIỆP -->
          <h2 class="section-title">I. BỐI CẢNH DOANH NGHIỆP &amp; VẤN ĐỀ TRỌNG TÂM</h2>
          <div class="info-box">
            <p><strong>1. Bối cảnh hoạt động:</strong> ${bizCtx}</p>
            <p><strong>2. Vấn đề trọng tâm &amp; Mục tiêu BI:</strong> ${probCtx.replace(/\n/g, "<br>")}</p>
            <p><strong>3. Kiểm định chất lượng dữ liệu:</strong> Tiếp nhận ban đầu <strong>${audit.originalRows} dòng</strong> nguồn; hệ thống tự động làm sạch và lọc bỏ <strong>${audit.removedRows} dòng lỗi/hủy</strong> (${audit.canceledRemoved || 0} đơn hủy, ${audit.duplicatesRemoved || 0} dòng trùng); đưa vào phân tích <strong>${audit.cleanedRows} dòng số liệu chuẩn</strong>.</p>
          </div>

          <!-- MỤC 2: TỔNG HỢP CHỈ SỐ ĐỊNH LƯỢNG -->
          <h2 class="section-title">II. TỔNG HỢP CÁC CHỈ SỐ ĐỊNH LƯỢNG CỐT LÕI</h2>
          <p>Dưới đây là bảng tổng hợp các chỉ số tài chính, vận hành và phân phối của toàn bộ hệ thống:</p>
          ${kpiTableHtml}

          <!-- MỤC 3: NỘI DUNG ĐỀ XUẤT GIẢI PHÁP CHIẾN LƯỢC -->
          <h2 class="section-title">III. NỘI DUNG PHÂN TÍCH CHIẾN LƯỢC &amp; ĐỀ XUẤT GIẢI PHÁP</h2>
          <div style="text-align:justify;">
            ${reportHtml}
          </div>

          <!-- MỤC 4: BẢNG CHẨN ĐOÁN CHI TIẾT TỪNG KÊNH -->
          <h2 class="section-title">IV. BẢNG CHẨN ĐOÁN SỨC KHỎE &amp; GIẢI PHÁP TỪNG KÊNH / ĐƠN VỊ</h2>
          <p>Chi tiết đánh giá định lượng, phân loại sức khỏe và giải pháp hành động cho từng đơn vị:</p>
          ${recordsTableHtml}

          ${feedbackHtml}

          <!-- MỤC 5: XÁC NHẬN VÀ PHÊ DUYỆT -->
          <h2 class="section-title">V. XÁC NHẬN &amp; PHÊ DUYỆT BÁO CÁO</h2>
          <table class="signature-grid">
            <tr>
              <td>
                <strong>NGƯỜI LẬP BÁO CÁO</strong><br>
                <em>(Hệ thống Phân tích BI AI)</em><br><br><br><br>
                <strong>DataMind AI Agent Studio</strong>
              </td>
              <td>
                <em>Ngày ..... tháng ..... năm 2026</em><br>
                <strong>ĐẠI DIỆN BAN LÃNH ĐẠO DOANH NGHIỆP</strong><br>
                <em>(Ký, ghi rõ họ tên và đóng dấu)</em><br><br><br><br>
                ________________________________
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Xuất file Microsoft Word (.doc) với mã hóa UTF-8 BOM chuẩn
    const blob = new Blob(["\uFEFF" + wordDocumentContent], {
      type: "application/msword;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_Cao_De_Xuat_Giai_Phap_BI_v${workflowVersion || 1}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  window.exportWorkflowReportMarkdown = function () {
    const content = workflowCurrentReportText || "Báo cáo phân tích dữ liệu BI và đề xuất giải pháp.";
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_Cao_De_Xuat_Giai_Phap_BI_v${workflowVersion || 1}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  window.openExecutiveReportModal = function () {
    const textarea = document.getElementById("report-modal-textarea");
    if (textarea) {
      textarea.value = workflowCurrentReportText || "Chưa có dữ liệu báo cáo. Hãy nhấn 'Chạy phân tích BI' trước.";
    }
    document.getElementById("report-modal")?.classList.add("open");
  };

  window.closeExecutiveReportModal = function () {
    document.getElementById("report-modal")?.classList.remove("open");
  };

  window.copyExecutiveReport = function () {
    const textarea = document.getElementById("report-modal-textarea");
    if (!textarea) return;
    textarea.select();
    document.execCommand("copy");
    alert("Đã sao chép toàn bộ Báo cáo Phân tích & Đề xuất Giải pháp!");
  };

  window.downloadExecutiveReportMarkdown = function () {
    window.exportWorkflowReportWord();
  };

  document.addEventListener("DOMContentLoaded", () => {
    initConstellationCanvas();
    initEnterpriseWorkflow();
    updateFlowchartState("INPUT");
    window.clearLoadedDataset();
  });
})();
