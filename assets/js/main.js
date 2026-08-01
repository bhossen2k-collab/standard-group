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

function departmentsOf(products) {
  const order = ["Men", "Women", "Kids"];
  const set = [...new Set(products.map(p => p.department))];
  return order.filter(d => set.includes(d));
}

function categoriesOf(products, department) {
  return [...new Set(
    products.filter(p => p.department === department).map(p => p.category)
  )];
}

/* --------------------------- product card ------------------------------- */
function productCardHTML(p) {
  return `
    <a class="product-card" href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb">
        <span class="badge">${p.category}</span>
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
      </div>
      <div class="info">
        <div class="cat">${p.department} — Autumn 27</div>
        <h4>${p.name}</h4>
        <div class="spec">
          <span>${p.fit} Fit · ${p.fabric.split(",")[0]}</span>
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
          <h3>${dept}'s Capability</h3>
          <span class="count">${String(cats.length).padStart(2, "0")} lines</span>
        </div>
        <div class="cat-grid">
          ${cards}
          <a class="cat-card more" href="products.html?department=${encodeURIComponent(dept)}">
            <span class="tag">And more</span>
            <h4>View full ${dept}'s range</h4>
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

  const media = [...p.images];
  const hasVideo = Boolean(p.video);

  const thumbsHTML = media.map((src, i) =>
    `<div class="pd-thumb ${i === 0 ? "is-active" : ""}" data-type="image" data-src="${src}"><img src="${src}" alt="${p.name} view ${i + 1}"></div>`
  ).join("") + (hasVideo
    ? `<div class="pd-thumb is-video" data-type="video" data-src="${p.video}"><img src="${media[0]}" alt="${p.name} video"></div>`
    : "");

  const specRows = [
    ["Buyer", p.buyer],
    ["Fit", p.fit],
    ["Fabric", p.fabric],
    ["Wash", p.wash],
    ["Season", p.season],
    ["Size Range", p.sizeRange]
  ].map(([k, v]) => `
    <div class="spec-row">
      <span class="k">${k}</span>
      <span class="v">${v}</span>
    </div>
  `).join("");

  const colorsHTML = p.colors && p.colors.length
    ? `
      <div class="pd-colors">
        <span class="filter-label">Colour options</span>
        <div class="swatches">
          ${p.colors.map(c => `<span class="swatch" style="background:${c.hex}" data-name="${c.name}"></span>`).join("")}
        </div>
      </div>
    `
    : "";

  mount.innerHTML = `
    <div class="pd-grid">
      <div class="pd-gallery">
        <div class="pd-gallery-main" id="pd-gallery-main">
          <img src="${media[0]}" alt="${p.name}">
        </div>
        <div class="pd-thumbs">${thumbsHTML}</div>
      </div>
      <div class="pd-info">
        <span class="eyebrow">${p.category}</span>
        <h1>${p.name}</h1>
        <div class="pd-designer">Designed by <span class="name">${p.designer}</span></div>
        ${colorsHTML}
        <div class="spec-sheet">${specRows}</div>
        <div class="pd-details">
          <h4>Details</h4>
          <p>${p.details}</p>
        </div>
        <div class="pd-actions">
          <a class="btn btn-primary" href="mailto:hello@standardgroup.example?subject=${encodeURIComponent("Enquiry: " + p.name)}">Request this line <span class="btn-arrow">→</span></a>
          <a class="btn btn-ghost" href="products.html">Back to catalog</a>
        </div>
      </div>
    </div>
  `;

  const galleryMain = document.getElementById("pd-gallery-main");
  mount.querySelectorAll(".pd-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      mount.querySelectorAll(".pd-thumb").forEach(t => t.classList.remove("is-active"));
      thumb.classList.add("is-active");
      const type = thumb.dataset.type;
      const src = thumb.dataset.src;
      galleryMain.innerHTML = type === "video"
        ? `<video src="${src}" controls autoplay muted playsinline></video>`
        : `<img src="${src}" alt="${p.name}">`;
    });
  });

  // related products — same category, excluding current
  const relatedMount = document.getElementById("pd-related-grid");
  if (relatedMount) {
    const related = products.filter(r => r.category === p.category && r.id !== p.id).slice(0, 3);
    relatedMount.innerHTML = related.length
      ? related.map(productCardHTML).join("")
      : `<div class="empty-state">More ${p.category} styles coming soon.</div>`;
  }
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
