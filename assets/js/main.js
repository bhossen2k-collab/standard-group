/* ==========================================================================
   STANDARD GROUP — site logic
   Everything reads from /assets/data/products.json — add a product there
   and it will automatically show up on products.html and get its own
   detail page at product.html?id=your-id
   ========================================================================== */

const DATA_URL = "assets/data/products.json";

// Resolve the data path correctly whether the page is at the site root
// or nested — all our HTML files live at root, so this is a no-op today,
// kept here so future subfolders don't break the fetch.
function dataUrl() {
  return DATA_URL;
}

async function loadProducts() {
  const res = await fetch(dataUrl());
  if (!res.ok) throw new Error("Could not load products.json");
  return res.json();
}

// Department display order on the homepage. Add a new department name here
// (matching what you type in products.json) to control where it appears.
const DEPARTMENT_ORDER = ["Men", "Women", "Kids", "Development"];

// How each department's section heading should read. If a department isn't
// listed here, it falls back to "{Department} Capability".
const DEPARTMENT_LABELS = {
  "Men": "Men's Capability",
  "Women": "Women's Capability",
  "Kids": "Kids' Capability",
  "Development": "Development for the Presentation"
};

function departmentLabel(dept) {
  return DEPARTMENT_LABELS[dept] || `${dept} Capability`;
}

function departmentsOf(products) {
  const set = [...new Set(products.map(p => p.department))];
  // Known departments first, in the order above; anything new/unlisted
  // still shows up, appended at the end, so nothing silently disappears.
  const known = DEPARTMENT_ORDER.filter(d => set.includes(d));
  const unknown = set.filter(d => !DEPARTMENT_ORDER.includes(d));
  return [...known, ...unknown];
}

function categoriesOf(products, department) {
  return [...new Set(
    products.filter(p => p.department === department).map(p => p.category)
  )];
}

/* --------------------------- product card ------------------------------- */
function productCardHTML(p) {
  const selected = isSelected(p.id);
  return `
    <a class="product-card" href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb">
        <span class="badge">${p.category}</span>
        <button class="select-btn select-btn--on-image ${selected ? "is-selected" : ""}" data-select-id="${p.id}" aria-label="Add to selection">${selected ? "✓" : "+"}</button>
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
      </div>
      <div class="info">
        <div class="cat">${p.department} — Autumn 27</div>
        <h4>${p.name}</h4>
        <div class="spec">
          <span>${p.fit} Fit</span>
          <span>${p.fabric}</span>
        </div>
      </div>
    </a>
  `;
}

/* --------------------------- homepage capability grid -------------------- */
async function renderHomeCapabilities() {
  const mount = document.getElementById("capability-departments");
  if (!mount) return;
  const products = await loadProducts();
  const depts = departmentsOf(products);

  mount.innerHTML = depts.map(dept => {
    const cats = categoriesOf(products, dept);
    const cards = cats.map(cat => {
      const sample = products.find(p => p.category === cat);
      return `
        <a class="cat-card" href="products.html?department=${encodeURIComponent(dept)}&category=${encodeURIComponent(cat)}">
          <span class="tag">${dept}</span>
          <h4>${cat}</h4>
          <span class="go">Explore <span class="arrow">→</span></span>
        </a>
      `;
    }).join("");

    return `
      <div class="dept">
        <div class="dept-title">
          <h3>${departmentLabel(dept)}</h3>
          <span class="count">${String(cats.length).padStart(2, "0")} lines</span>
        </div>
        <div class="cat-grid">
          ${cards}
          <a class="cat-card more" href="products.html?department=${encodeURIComponent(dept)}">
            <span class="tag">And more</span>
            <h4>View full ${dept} range</h4>
            <span class="go">All lines <span class="arrow">→</span></span>
          </a>
        </div>
      </div>
    `;
  }).join("");
}

/* --------------------------- products / catalog page ---------------------- */
async function renderCatalog() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  const products = await loadProducts();
  const params = new URLSearchParams(window.location.search);
  let activeDept = params.get("department") || "All";
  let activeCat = params.get("category") || "All";

  const deptBar = document.getElementById("filter-department");
  const catBar = document.getElementById("filter-category");

  function buildDeptChips() {
    const depts = ["All", ...departmentsOf(products)];
    deptBar.innerHTML = depts.map(d =>
      `<button class="chip ${d === activeDept ? "is-active" : ""}" data-dept="${d}">${d}</button>`
    ).join("");
  }

  function buildCatChips() {
    let cats;
    if (activeDept === "All") {
      cats = [...new Set(products.map(p => p.category))];
    } else {
      cats = categoriesOf(products, activeDept);
    }
    catBar.innerHTML = `<button class="chip ${activeCat === "All" ? "is-active" : ""}" data-cat="All">All lines</button>` +
      cats.map(c =>
        `<button class="chip ${c === activeCat ? "is-active" : ""}" data-cat="${c}">${c}</button>`
      ).join("");
  }

  function renderGrid() {
    let filtered = products;
    if (activeDept !== "All") filtered = filtered.filter(p => p.department === activeDept);
    if (activeCat !== "All") filtered = filtered.filter(p => p.category === activeCat);

    grid.innerHTML = filtered.length
      ? filtered.map(productCardHTML).join("")
      : `<div class="empty-state">No products in this line yet — check back soon, or browse another category above.</div>`;
  }

  function updateURL() {
    const p = new URLSearchParams();
    if (activeDept !== "All") p.set("department", activeDept);
    if (activeCat !== "All") p.set("category", activeCat);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  buildDeptChips();
  buildCatChips();
  renderGrid();

  deptBar.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeDept = btn.dataset.dept;
    activeCat = "All";
    buildDeptChips();
    buildCatChips();
    renderGrid();
    updateURL();
  });

  catBar.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    buildCatChips();
    renderGrid();
    updateURL();
  });
}

function getYouTubeId(url) {

  // If only the ID is stored in JSON
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }

  return null;
}

function renderVideoEmbed(videoField, posterImage) {
  const raw = videoField.trim();

  // If someone pastes a full <iframe> embed code by mistake, pull the src out of it.
  const iframeSrcMatch = raw.match(/src="([^"]+)"/);
  const url = iframeSrcMatch ? iframeSrcMatch[1] : raw;

  const ytId = getYouTubeId(url);
  if (ytId) {
    return `
      <div class="pd-video-embed">
        <iframe
          src="https://www.youtube.com/embed/${ytId}"
          title="Product video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
    `;
  }

  // Otherwise treat it as a direct .mp4 (or similar) file link.
  return `<video src="${url}" controls playsinline poster="${posterImage}"></video>`;
}

/* --------------------------- product detail page --------------------------- */
async function renderProductDetail() {
  const mount = document.getElementById("pd-root");
  if (!mount) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const products = await loadProducts();
  const p = products.find(prod => prod.id === id) || products[0];

  if (!p) {
    mount.innerHTML = `<div class="empty-state">Product not found.</div>`;
    return;
  }

  document.title = `${p.name} — Standard Group`;
  const crumb = document.getElementById("pd-crumb-current");
  if (crumb) crumb.textContent = p.name;

  let images = [...p.images];
  const hasVideo = Boolean(p.video);

  const thumbsHTML = images.map((src, i) =>
    `<div class="pd-thumb ${i === 0 ? "is-active" : ""}" data-index="${i}"><img src="${src}" alt="${p.name} view ${i + 1}"></div>`
  ).join("");

  const specRows = [
    ["Style Code", p.styleCode],
    ["Buyer", p.buyer],
    ["Fit", p.fit],
    ["Fabric", p.fabric],
    ["Wash", p.wash],
    ["Season", p.season],
    ["Size Range", p.sizeRange]
  ].filter(([, v]) => Boolean(v)).map(([k, v]) => `
    <div class="spec-row">
      <span class="k">${k}</span>
      <span class="v">${v}</span>
    </div>
  `).join("");

  const colorsHTML = p.colors && p.colors.length
    ? `
      <div class="pd-colors">
        <span class="filter-label">Colour options</span>
        <div class="swatches" id="pd-swatches">
          ${p.colors.map((c, i) => `<span class="swatch ${i === 0 ? "is-active" : ""}" style="background:${c.hex}" data-name="${c.name}" data-color-index="${i}"></span>`).join("")}
        </div>
      </div>
    `
    : "";

  // The video sits in its own block, always visible alongside the images —
  // not hidden behind a thumbnail swap. Supports either a direct .mp4 link
  // or a YouTube link (any format: youtube.com/watch?v=, youtu.be/, or
  // youtube.com/embed/).
  const videoBlockHTML = hasVideo ? `
    <div class="pd-video-block">
      <span class="filter-label" style="display:block; margin-bottom:10px;">Product video</span>
      ${renderVideoEmbed(p.video, images[0])}
    </div>
  ` : "";

  const selected = isSelected(p.id);

  mount.innerHTML = `
    <div class="pd-grid">
      <div class="pd-gallery">
        <div class="pd-gallery-main can-lens" id="pd-gallery-main">
          <img src="${images[0]}" alt="${p.name}" id="pd-main-img">
          <div class="pd-lens" id="pd-lens"></div>
          <span class="pd-zoom-icon" id="pd-zoom-hint" title="Click to zoom">🔍</span>
          <button class="select-btn select-btn--on-image ${selected ? "is-selected" : ""}" data-select-id="${p.id}" aria-label="Add to selection">${selected ? "✓" : "+"}</button>
        </div>
        <div class="pd-thumbs" id="pd-thumbs">${thumbsHTML}</div>
        ${videoBlockHTML}
      </div>
      <div class="pd-info">
        <h1>${p.name}</h1>
        <div class="pd-meta">${p.category} · Designed by <span class="name">${p.designer}</span></div>
        ${colorsHTML}
        <div class="spec-sheet">${specRows}</div>
        <div class="pd-details">
          <h4>Details</h4>
          <p>${p.details}</p>
        </div>
        <div class="pd-actions">
          <a class="btn btn-primary" href="mailto:info@standardargroup.com?subject=${encodeURIComponent("Enquiry: " + p.name)}">Request this line <span class="btn-arrow">→</span></a>
          <button class="btn btn-select ${selected ? "is-selected" : ""}" data-select-id="${p.id}">
            <span class="dot">${selected ? "✓" : "+"}</span> ${selected ? "Added to selection" : "Add to PPT selection"}
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox: click-to-enlarge, scroll/pinch to zoom, drag to pan -->
    <div class="pd-lightbox" id="pd-lightbox">
      <div class="pd-lightbox-caption" id="pd-lightbox-caption"></div>
      <button class="pd-lightbox-close" id="pd-lightbox-close" aria-label="Close">✕</button>
      <button class="pd-lightbox-nav prev" id="pd-lightbox-prev" aria-label="Previous image">‹</button>
      <button class="pd-lightbox-nav next" id="pd-lightbox-next" aria-label="Next image">›</button>
      <div class="pd-lightbox-stage" id="pd-lightbox-stage">
        <img id="pd-lightbox-img" src="" alt="">
      </div>
      <div class="pd-lightbox-zoomctl">
        <button id="pd-zoom-out" aria-label="Zoom out">−</button>
        <span class="pct" id="pd-zoom-pct">100%</span>
        <button id="pd-zoom-in" aria-label="Zoom in">+</button>
        <button id="pd-zoom-reset" aria-label="Reset zoom" title="Reset">⤾</button>
      </div>
    </div>
  `;

  bindGallery(p, images);

  // related products — same category, excluding current
  const relatedMount = document.getElementById("pd-related-grid");
  if (relatedMount) {
    const related = products.filter(r => r.category === p.category && r.id !== p.id).slice(0, 3);
    relatedMount.innerHTML = related.length
      ? related.map(productCardHTML).join("")
      : `<div class="empty-state">More ${p.category} styles coming soon.</div>`;
  }
}

/* --------------------------- gallery: thumbs + magnifier + lightbox --------- */
function bindGallery(p, images) {
  const mainWrap = document.getElementById("pd-gallery-main");
  const mainImg = document.getElementById("pd-main-img");
  const lens = document.getElementById("pd-lens");
  const thumbs = document.getElementById("pd-thumbs");
  let currentIndex = 0;

  function setActiveThumb(i) {
    thumbs.querySelectorAll(".pd-thumb").forEach(t => t.classList.remove("is-active"));
    const t = thumbs.querySelector(`.pd-thumb[data-index="${i}"]`);
    if (t) t.classList.add("is-active");
  }

  function showImage(i) {
    currentIndex = (i + images.length) % images.length;
    mainImg.src = images[currentIndex];
    setActiveThumb(currentIndex);
  }

  thumbs.addEventListener("click", e => {
    const t = e.target.closest(".pd-thumb");
    if (!t) return;
    showImage(Number(t.dataset.index));
  });

  // ---- colour swatches swap the gallery to that colour's photos ----
  const swatchWrap = document.getElementById("pd-swatches");
  if (swatchWrap) {
    swatchWrap.addEventListener("click", e => {
      const sw = e.target.closest(".swatch");
      if (!sw) return;
      const color = p.colors[Number(sw.dataset.colorIndex)];
      if (!color || !color.images || !color.images.length) return;

      images = color.images;
      thumbs.innerHTML = images.map((src, i) =>
        `<div class="pd-thumb ${i === 0 ? "is-active" : ""}" data-index="${i}"><img src="${src}" alt="${p.name} ${color.name} view ${i + 1}"></div>`
      ).join("");
      currentIndex = 0;
      mainImg.src = images[0];

      swatchWrap.querySelectorAll(".swatch").forEach(s => s.classList.remove("is-active"));
      sw.classList.add("is-active");
    });
  }

  // ---- hover magnifier lens (desktop only, css also gates this) ----
  mainWrap.addEventListener("mousemove", e => {
    const rect = mainWrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const lensSize = 160;
    let lx = x - lensSize / 2;
    let ly = y - lensSize / 2;
    lx = Math.max(-lensSize / 4, Math.min(lx, rect.width - lensSize * 0.75));
    ly = Math.max(-lensSize / 4, Math.min(ly, rect.height - lensSize * 0.75));
    lens.style.left = `${lx}px`;
    lens.style.top = `${ly}px`;

    const zoom = 2.6;
    lens.style.backgroundImage = `url("${images[currentIndex]}")`;
    lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
    const bgX = -(x * zoom - lensSize / 2);
    const bgY = -(y * zoom - lensSize / 2);
    lens.style.backgroundPosition = `${bgX}px ${bgY}px`;
  });

  // ---- click main image or thumbnail to open lightbox ----
  mainWrap.addEventListener("click", () => openLightbox(currentIndex));
  thumbs.addEventListener("dblclick", e => {
    const t = e.target.closest(".pd-thumb");
    if (t) openLightbox(Number(t.dataset.index));
  });

  /* ---------------- lightbox ---------------- */
  const lightbox = document.getElementById("pd-lightbox");
  const stage = document.getElementById("pd-lightbox-stage");
  const lbImg = document.getElementById("pd-lightbox-img");
  const caption = document.getElementById("pd-lightbox-caption");
  const zoomPct = document.getElementById("pd-zoom-pct");
  let lbIndex = 0;
  let scale = 1, panX = 0, panY = 0;
  let dragging = false, dragStartX = 0, dragStartY = 0, startPanX = 0, startPanY = 0;

  function applyTransform() {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    zoomPct.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetZoom() {
    scale = 1; panX = 0; panY = 0;
    applyTransform();
  }

  function openLightbox(i) {
    lbIndex = i;
    lbImg.src = images[lbIndex];
    caption.textContent = `${p.name} — ${lbIndex + 1} / ${images.length}`;
    resetZoom();
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function nav(delta) {
    lbIndex = (lbIndex + delta + images.length) % images.length;
    lbImg.src = images[lbIndex];
    caption.textContent = `${p.name} — ${lbIndex + 1} / ${images.length}`;
    resetZoom();
    showImage(lbIndex);
  }

  document.getElementById("pd-lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("pd-lightbox-prev").addEventListener("click", () => nav(-1));
  document.getElementById("pd-lightbox-next").addEventListener("click", () => nav(1));
  lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") nav(-1);
    if (e.key === "ArrowRight") nav(1);
    if (e.key === "+") zoomBy(0.25);
    if (e.key === "-") zoomBy(-0.25);
  });

  function zoomBy(delta) {
    scale = Math.max(1, Math.min(4, scale + delta));
    if (scale === 1) { panX = 0; panY = 0; }
    applyTransform();
  }

  document.getElementById("pd-zoom-in").addEventListener("click", () => zoomBy(0.35));
  document.getElementById("pd-zoom-out").addEventListener("click", () => zoomBy(-0.35));
  document.getElementById("pd-zoom-reset").addEventListener("click", resetZoom);

  // scroll wheel to zoom
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.2 : -0.2);
  }, { passive: false });

  // drag to pan when zoomed in
  lbImg.addEventListener("mousedown", e => {
    if (scale === 1) return;
    dragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    startPanX = panX; startPanY = panY;
  });
  window.addEventListener("mousemove", e => {
    if (!dragging) return;
    panX = startPanX + (e.clientX - dragStartX);
    panY = startPanY + (e.clientY - dragStartY);
    applyTransform();
  });
  window.addEventListener("mouseup", () => { dragging = false; });

  // double-click image in lightbox to toggle zoom
  lbImg.addEventListener("dblclick", () => {
    if (scale === 1) { scale = 2; applyTransform(); }
    else resetZoom();
  });

  // basic touch: pinch to zoom, drag to pan
  let touchStartDist = null, touchStartScale = 1;
  stage.addEventListener("touchstart", e => {
    if (e.touches.length === 2) {
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      dragging = true;
      dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
      startPanX = panX; startPanY = panY;
    }
  }, { passive: true });
  stage.addEventListener("touchmove", e => {
    if (e.touches.length === 2 && touchStartDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = Math.max(1, Math.min(4, touchStartScale * (dist / touchStartDist)));
      applyTransform();
    } else if (e.touches.length === 1 && dragging) {
      panX = startPanX + (e.touches[0].clientX - dragStartX);
      panY = startPanY + (e.touches[0].clientY - dragStartY);
      applyTransform();
    }
  }, { passive: true });
  stage.addEventListener("touchend", () => { dragging = false; touchStartDist = null; });
}

/* --------------------------- mobile nav ------------------------------------ */
function bindMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* --------------------------- init ------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  bindMobileNav();
  renderHomeCapabilities();
  renderCatalog();
  renderProductDetail();
});
