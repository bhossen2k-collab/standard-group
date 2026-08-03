/* ==========================================================================
   STANDARD GROUP — selection & export
   Lets a buyer tap "+" on any product to add it to a shortlist, then export
   that shortlist as a PowerPoint and/or PDF presentation — first 2 images
   per product, full spec sheet, company logo on every page.
   Selection is stored in the browser's localStorage, so it persists across
   pages but is private to that visitor's browser (nothing is uploaded).
   ========================================================================== */

const SELECTION_KEY = "sg_ppt_selection";
const LOGO_PATH = "assets/images/logo/logo.svg";

/* --------------------------- selection state --------------------------- */
function getSelection() {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveSelection(ids) {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Could not save selection", e);
  }
}

function isSelected(id) {
  return getSelection().includes(id);
}

function toggleSelection(id) {
  let ids = getSelection();
  const wasSelected = ids.includes(id);
  ids = wasSelected ? ids.filter(x => x !== id) : [...ids, id];
  saveSelection(ids);
  syncSelectButtons();
  renderFloatingBar();
  showToast(wasSelected ? "Removed from selection" : "Added to selection");
  return !wasSelected;
}

// Keep every "+"/"✓" button on the page in sync with the saved selection
// (a product can appear as both a grid card and, on its own page, the
// gallery button + the "Add to PPT selection" button).
function syncSelectButtons() {
  const ids = getSelection();
  document.querySelectorAll("[data-select-id]").forEach(btn => {
    const id = btn.dataset.selectId;
    const on = ids.includes(id);
    btn.classList.toggle("is-selected", on);
    if (btn.classList.contains("select-btn--on-image")) {
      btn.textContent = on ? "✓" : "+";
    } else if (btn.classList.contains("btn-select")) {
      btn.innerHTML = `<span class="dot">${on ? "✓" : "+"}</span> ${on ? "Added to selection" : "Add to PPT selection"}`;
    }
  });
}

/* --------------------------- toast ------------------------------------- */
let toastTimer = null;
function showToast(message) {
  let toast = document.getElementById("sg-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "sg-toast";
    toast.className = "sg-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

/* --------------------------- floating selection bar --------------------- */
function renderFloatingBar() {
  const ids = getSelection();
  let bar = document.getElementById("sg-selection-bar");

  if (!ids.length) {
    if (bar) bar.remove();
    return;
  }

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "sg-selection-bar";
    bar.className = "sg-selection-bar";
    document.body.appendChild(bar);
    bar.addEventListener("click", e => {
      if (e.target.closest("#sg-open-export")) openExportModal();
      if (e.target.closest("#sg-clear-selection")) {
        saveSelection([]);
        syncSelectButtons();
        renderFloatingBar();
        showToast("Selection cleared");
      }
    });
  }

  bar.innerHTML = `
    <span class="sg-bar-count">${ids.length} selected</span>
    <button class="sg-bar-clear" id="sg-clear-selection" aria-label="Clear selection">Clear</button>
    <button class="sg-bar-export" id="sg-open-export">Export <span class="btn-arrow">→</span></button>
  `;
}

/* --------------------------- export modal ------------------------------- */
async function openExportModal() {
  const ids = getSelection();
  if (!ids.length) return;

  const products = await loadProducts();
  const selectedProducts = ids
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  let modal = document.getElementById("sg-export-modal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "sg-export-modal";
  modal.className = "sg-modal";
  modal.innerHTML = `
    <div class="sg-modal-card">
      <button class="sg-modal-close" id="sg-modal-close" aria-label="Close">✕</button>
      <span class="eyebrow">${selectedProducts.length} Product${selectedProducts.length > 1 ? "s" : ""} Selected</span>
      <h3>Export your shortlist</h3>
      <div class="sg-modal-list">
        ${selectedProducts.map(p => `
          <div class="sg-modal-item">
            <img src="${p.images[0]}" alt="${p.name}">
            <div class="sg-modal-item-info">
              <div class="name">${p.name}</div>
              <div class="cat">${p.category}</div>
            </div>
            <button class="sg-modal-item-remove" data-select-id="${p.id}" aria-label="Remove ${p.name}">✕</button>
          </div>
        `).join("")}
      </div>
      <p class="sg-modal-note">Each product exports with its first 2 photos and full spec sheet.</p>
      <div class="sg-modal-actions">
        <button class="btn btn-primary" id="sg-export-pptx">Download PPTX</button>
        <button class="btn btn-ghost" id="sg-export-pdf">Download PDF</button>
        <button class="btn btn-ghost" id="sg-export-both">Download Both</button>
      </div>
      <div class="sg-modal-status" id="sg-modal-status"></div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("is-open"));

  modal.addEventListener("click", e => {
    if (e.target === modal) closeExportModal();
    if (e.target.closest("#sg-modal-close")) closeExportModal();

    const removeBtn = e.target.closest(".sg-modal-item-remove");
    if (removeBtn) {
      toggleSelection(removeBtn.dataset.selectId);
      openExportModal(); // rebuild the list
    }
  });

  document.getElementById("sg-export-pptx").addEventListener("click", () => runExport(selectedProducts, "pptx"));
  document.getElementById("sg-export-pdf").addEventListener("click", () => runExport(selectedProducts, "pdf"));
  document.getElementById("sg-export-both").addEventListener("click", () => runExport(selectedProducts, "both"));
}

function closeExportModal() {
  const modal = document.getElementById("sg-export-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  setTimeout(() => modal.remove(), 200);
}

async function runExport(products, format) {
  const status = document.getElementById("sg-modal-status");
  if (status) status.textContent = "Preparing your files — this can take a moment for many products…";

  try {
    const logoDataUrl = await loadImageAsDataURL(LOGO_PATH).catch(() => null);

    // Pre-load the first 2 images for every product once, share across formats.
    const productImages = {};
    for (const p of products) {
      const two = p.images.slice(0, 2);
      productImages[p.id] = await Promise.all(
        two.map(src => loadImageAsDataURL(src).catch(() => null))
      );
    }

    if (format === "pptx" || format === "both") {
      if (status) status.textContent = "Building PowerPoint…";
      await buildPPTX(products, productImages, logoDataUrl);
    }
    if (format === "pdf" || format === "both") {
      if (status) status.textContent = "Building PDF…";
      buildPDF(products, productImages, logoDataUrl);
    }

    if (status) status.textContent = "Done — check your downloads.";
    showToast("Export ready — check your downloads");
  } catch (err) {
    console.error(err);
    if (status) status.textContent = "Something went wrong preparing the export. Please try again.";
  }
}

/* --------------------------- image loading ------------------------------ */
// Converts any image URL (same-origin file or a CORS-friendly remote image)
// into a base64 data URL so it can be embedded into a generated PPTX/PDF.
function loadImageAsDataURL(url, maxWidth = 1400, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Scale down large photos — presentation/print doesn't need
        // full camera resolution, and this is what keeps file size small.
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", quality),
          width: w,
          height: h
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/*function loadImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* --------------------------- PPTX build --------------------------------- */
async function buildPPTX(products, productImages, logoDataUrl) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "SG_WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "SG_WIDE";

  products.forEach(p => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };

    if (logoDataUrl) {
      slide.addImage({ data: logoDataUrl.dataUrl, x: 11.2, y: 0.35, w: 1.7, h: 1.7 * (logoDataUrl.height / logoDataUrl.width) });
    }

    const imgs = productImages[p.id] || [];
    const imgW = 2.9, imgH = imgW * (4 / 3); // 3:4 ratio
    if (imgs[0]) slide.addImage({ data: imgs[0].dataUrl, x: 0.5, y: 0.9, w: imgW, h: imgH, sizing: { type: "cover", w: imgW, h: imgH } });
    if (imgs[1]) slide.addImage({ data: imgs[1].dataUrl, x: 0.5 + imgW + 0.2, y: 0.9, w: imgW, h: imgH, sizing: { type: "cover", w: imgW, h: imgH } });

    const specLines = [
      ["Style Code", p.styleCode],
      ["Buyer", p.buyer],
      ["Fit", p.fit],
      ["Fabric", p.fabric],
      ["Colours", (p.colors || []).map(c => c.name).join(", ")],
      ["Wash", p.wash],
      ["Season", p.season],
      ["Size Range", p.sizeRange]
    ].filter(([, v]) => Boolean(v));

    const textRuns = [
      { text: p.name, options: { fontSize: 22, bold: true, color: "17181C", breakLine: true, fontFace: "Georgia" } },
      { text: p.category, options: { fontSize: 11, color: "93949C", breakLine: true, fontFace: "Arial" } },
      { text: " ", options: { fontSize: 6, breakLine: true } }
    ];
    specLines.forEach(([k, v]) => {
      textRuns.push({ text: `${k}:  `, options: { fontSize: 11, bold: true, color: "5B5D66", fontFace: "Arial" } });
      textRuns.push({ text: `${v}`, options: { fontSize: 11, color: "17181C", breakLine: true, fontFace: "Arial" } });
    });
    if (p.details) {
      textRuns.push({ text: " ", options: { fontSize: 6, breakLine: true } });
      textRuns.push({ text: "Details:  ", options: { fontSize: 11, bold: true, color: "5B5D66", breakLine: true, fontFace: "Arial" } });
      textRuns.push({ text: p.details, options: { fontSize: 10.5, color: "5B5D66", fontFace: "Arial" } });
    }

    slide.addText(textRuns, { x: 6.9, y: 0.75, w: 6.0, h: 6.3, valign: "top", lineSpacingMultiple: 1.3 });
  });

  pptx.writeFile({ fileName: "Standard-Group-Shortlist.pptx" });
}

/* --------------------------- PDF build ----------------------------------- */
function buildPDF(products, productImages, logoDataUrl) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "in", format: [13.33, 7.5] });

  products.forEach((p, idx) => {
    if (idx > 0) doc.addPage([13.33, 7.5], "landscape");
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 13.33, 7.5, "F");

    if (logoDataUrl) {
      const w = 1.7, h = w * (logoDataUrl.height / logoDataUrl.width);
      doc.addImage(logoDataUrl.dataUrl, "PNG", 11.2, 0.35, w, h);
    }

    const imgs = productImages[p.id] || [];
    const imgW = 2.9, imgH = imgW * (4 / 3);
    if (imgs[0]) doc.addImage(imgs[0].dataUrl, "PNG", 0.5, 0.9, imgW, imgH);
    if (imgs[1]) doc.addImage(imgs[1].dataUrl, "PNG", 0.5 + imgW + 0.2, 0.9, imgW, imgH);

    let y = 1.1;
    const xText = 6.9;
    const maxW = 6.0;

    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(23, 24, 28);
    doc.text(p.name, xText, y, { maxWidth: maxW });
    y += 0.35;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(147, 148, 156);
    doc.text(p.category, xText, y);
    y += 0.35;

    const specLines = [
      ["Style Code", p.styleCode],
      ["Buyer", p.buyer],
      ["Fit", p.fit],
      ["Fabric", p.fabric],
      ["Colours", (p.colors || []).map(c => c.name).join(", ")],
      ["Wash", p.wash],
      ["Season", p.season],
      ["Size Range", p.sizeRange]
    ].filter(([, v]) => Boolean(v));

    doc.setFontSize(10.5);
    specLines.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(91, 93, 102);
      doc.text(`${k}:`, xText, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(23, 24, 28);
      const lines = doc.splitTextToSize(String(v), maxW - 1.3);
      doc.text(lines, xText + 1.3, y);
      y += 0.26 * Math.max(1, lines.length);
    });

    if (p.details) {
      y += 0.15;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(91, 93, 102);
      doc.text("Details:", xText, y);
      y += 0.24;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(91, 93, 102);
      const detailLines = doc.splitTextToSize(p.details, maxW);
      doc.text(detailLines, xText, y);
    }
  });

  doc.save("Standard-Group-Shortlist.pdf");
}

/* --------------------------- init ---------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderFloatingBar();

  // Event delegation: works for buttons that exist now AND ones rendered
  // later by main.js (product cards, gallery button, etc).
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-select-id]");
    if (!btn || btn.closest(".sg-modal-item")) return; // modal remove-buttons handled separately
    e.preventDefault();
    e.stopPropagation();
    toggleSelection(btn.dataset.selectId);
  });
});
