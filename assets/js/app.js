/* ==========================================================================
   NegociosPR — main app
   Single-page app with i18n, filters, Leaflet map, view routing.
   ========================================================================== */

// Category emoji + key map (shared between languages — emojis are universal)
const CATEGORY_META = {
  restaurant:    { emoji: "🍴", color: "#e74c3c" },
  chinchorro:    { emoji: "🍺", color: "#f39c12" },
  cafe:          { emoji: "☕", color: "#8b5a3c" },
  carniceria:    { emoji: "🥩", color: "#c0392b" },
  agricola:      { emoji: "🌾", color: "#27ae60" },
  ferreteria:    { emoji: "🔨", color: "#7f8c8d" },
  colmado:       { emoji: "🛒", color: "#16a085" },
  farmacia:      { emoji: "💊", color: "#2980b9" },
  barberia:      { emoji: "💇", color: "#9b59b6" },
  boutique:      { emoji: "🏪", color: "#e91e63" },
  taller:        { emoji: "🔧", color: "#34495e" },
  libreria:      { emoji: "📚", color: "#795548" },
  artesania:     { emoji: "🎨", color: "#ff5722" },
  panaderia:     { emoji: "🍞", color: "#d4a574" },
  heladeria:     { emoji: "🍦", color: "#00bcd4" },
  food_truck:    { emoji: "🚚", color: "#ff9800" },
  hospedaje:     { emoji: "🏨", color: "#3f51b5" },
  tours:         { emoji: "🏖️", color: "#03a9f4" },
  mascotas:      { emoji: "🐾", color: "#8bc34a" },
  foto:          { emoji: "📷", color: "#607d8b" },
  tecnico:       { emoji: "💻", color: "#009688" },
  envio:         { emoji: "📦", color: "#ffc107" },
  gimnasio:      { emoji: "🏋️", color: "#ff5252" },
  clases:        { emoji: "🎓", color: "#673ab7" },
  eventos:       { emoji: "🎉", color: "#e91e63" }
};

const PAYMENT_META = { cash: "💵", ath: "📱", card: "💳" };
const SERVICE_META = { delivery: "🛵", pickup: "🛍️", dine_in: "🍽️" };
const ACCESS_META = { ramp: "♿", parking: "🅿️", accessible_bathroom: "🚻" };
const LANG_META = { es: "🇪🇸 ES", en: "🇺🇸 EN" };

/* ----- i18n ----- */
let i18n = { es: null, en: null };
let currentLang = "es";
let currentTheme = "auto"; // auto / light / dark

function applyTheme() {
  // Set data-theme on <html> so CSS variables pick it up
  if (currentTheme === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }
  // Update theme switch buttons
  document.querySelectorAll(".theme-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === currentTheme);
  });
  // Re-render map tile filter if needed (Leaflet uses CSS for its own UI)
  if (typeof map !== "undefined" && map) {
    setTimeout(() => map.invalidateSize(), 50);
  }
}

async function loadI18n() {
  const [es, en] = await Promise.all([
    fetch("assets/i18n/es-PR.json").then(r => r.json()),
    fetch("assets/i18n/en.json").then(r => r.json())
  ]);
  i18n.es = es; i18n.en = en;

  // Restore from localStorage
  const saved = localStorage.getItem("negociospr-lang");
  if (saved && i18n[saved]) currentLang = saved;
}

function t(path) {
  const parts = path.split(".");
  let v = i18n[currentLang];
  for (const p of parts) v = v?.[p];
  return v ?? path;
}

/* ----- Data ----- */
let businesses = [];
let municipalities = [];

async function loadData() {
  const [biz, muni] = await Promise.all([
    fetch("assets/data/sample-businesses.json").then(r => r.json()),
    fetch("assets/data/municipalities.json").then(r => r.json())
  ]);
  businesses = biz;
  municipalities = muni;
}

/* ----- Helpers ----- */

function categoryLabel(cat) {
  return t(`category.${cat}`) || cat;
}

function isOpenNow(b) {
  if (b.open_24h) return true;
  const days = ["sun","mon","tue","wed","thu","fri","sat"];
  const now = new Date();
  const day = days[now.getDay()];
  const range = b.hours?.[day];
  if (!range || range.toLowerCase() === "closed") return false;
  const m = range.match(/(\d{1,2}):(\d{2})\s*(am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!m) return false;
  function toMin(h, mm, ap) {
    h = parseInt(h); mm = parseInt(mm);
    if (ap) {
      ap = ap.toLowerCase();
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
    }
    return h * 60 + mm;
  }
  const open = toMin(m[1], m[2], m[3]);
  const close = toMin(m[4], m[5], m[6]);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= open && cur <= close;
}

function applyI18n() {
  document.documentElement.lang = currentLang === "es" ? "es-PR" : "en";
  document.title = `${t("site.name")} — ${t("site.tagline")}`;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  // Update lang switch
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
  // Re-render the current view's dynamic content (not all views).
  // For explore we need to re-render filter chips too (in case language
  // changed and the chip labels need updating, or if the chips were
  // never populated due to a navigation path that bypassed renderAll).
  if (currentView === "explore") {
    renderFilterChips();
    renderList();
  }
  else if (currentView === "detail") renderDetail();
  else if (currentView === "submit") renderForm();
}

/* ----- View routing ----- */
let currentView = "explore";
let currentDetailId = null;

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${name}`)?.classList.add("active");
  document.querySelectorAll(".subnav a").forEach(a => a.classList.remove("active"));
  document.querySelector(`.subnav a[data-view="${name}"]`)?.classList.add("active");
  currentView = name;
  // Sync URL hash + history state for shareability / back-button
  if (name === "explore" && location.hash && !location.hash.startsWith("#/explorar")) {
    history.pushState({ view: "explore" }, "", "#/explorar");
  } else if (name === "submit" && location.hash !== "#/someter") {
    history.pushState({ view: "submit" }, "", "#/someter");
  } else if (name === "about" && location.hash !== "#/acerca") {
    history.pushState({ view: "about" }, "", "#/acerca");
  }
  // close mobile menu + filter drawer
  document.getElementById("subnav").classList.remove("open");
  document.getElementById("filters").classList.remove("open");
  document.body.classList.remove("drawer-open");
  document.body.classList.remove("drawer-subnav-open");
  document.body.classList.remove("drawer-filters-open");
  document.getElementById("modal-overlay")?.classList.remove("active");
  // Reset the hamburger button to the closed state (☰ + open_menu
  // aria-label). Without this, picking a destination from the menu
  // leaves the icon as ✕ because showView() closes the subnav via
  // class manipulation rather than going through the toggle handler.
  const menuBtn = document.getElementById("menu-toggle");
  if (menuBtn) {
    menuBtn.textContent = "☰";
    menuBtn.setAttribute("aria-label", t("nav.open_menu"));
  }
  if (name === "explore") renderList();
  if (name === "detail") renderDetail();
  if (name === "submit") renderForm();
  window.scrollTo(0, 0);
}

function showDetail(id) {
  currentDetailId = id;
  // Update URL hash for shareable links
  history.pushState({ view: "detail", id }, "", `#/negocio/${id}`);
  showView("detail");
}

function showExplore() {
  // showView() handles URL/state sync
  showView("explore");
}

window.addEventListener("popstate", e => {
  if (e.state?.view === "detail" && e.state.id) {
    currentDetailId = e.state.id;
    showView("detail");
  } else {
    showView("explore");
  }
});

/* ----- Filters ----- */
const state = {
  query: "",
  categories: new Set(),
  municipalities: new Set(),
  price: new Set(),
  payments: new Set(),
  services: new Set(),
  access: new Set(),
  languages: new Set(),
  openNow: false,
  weekend: false,
  verified: false
};

function readFilters() {
  return state;
}

function applyFilters() {
  const q = state.query.toLowerCase().trim();
  return businesses.filter(b => {
    if (state.categories.size && !state.categories.has(b.category)) return false;
    if (state.municipalities.size && !state.municipalities.has(b.municipality)) return false;
    if (state.price.size && !state.price.has(b.price)) return false;
    if (state.payments.size && ![...state.payments].some(p => b.payment?.includes(p))) return false;
    if (state.services.size && ![...state.services].some(s => b.services?.includes(s))) return false;
    if (state.access.size && ![...state.access].some(a => b.accessibility?.includes(a))) return false;
    if (state.languages.size && ![...state.languages].some(l => b.languages?.includes(l))) return false;
    if (state.openNow && !isOpenNow(b)) return false;
    if (state.weekend) {
      const sat = b.hours?.sat?.toLowerCase();
      const sun = b.hours?.sun?.toLowerCase();
      if ((!sat || sat === "closed") && (!sun || sun === "closed")) return false;
    }
    if (state.verified && !b.verified) return false;
    if (q) {
      const hay = [b.name, b.municipality, b.address, b.description_es, b.description_en,
                   b.products_es, b.products_en, b.owner].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/* ----- Filter UI rendering ----- */

function renderFilterChips() {
  // Categories
  const catEl = document.getElementById("filter-categories");
  catEl.innerHTML = Object.entries(CATEGORY_META).map(([key, m]) => `
    <span class="chip ${state.categories.has(key) ? "active" : ""}" data-cat="${key}">
      <span class="emoji">${m.emoji}</span>${categoryLabel(key)}
    </span>
  `).join("");
  catEl.querySelectorAll(".chip").forEach(c => {
    c.addEventListener("click", () => {
      const k = c.dataset.cat;
      if (state.categories.has(k)) state.categories.delete(k);
      else state.categories.add(k);
      renderAll();
    });
  });

  // Municipality is now a searchable combobox (rendered in bindMunicipalityCombo)
  renderMunicipalityCombo();

  // Price
  document.getElementById("filter-price").innerHTML = ["cheap","moderate","expensive"].map(p => `
    <span class="chip ${state.price.has(p) ? "active" : ""}" data-price="${p}">${t(`price.${p}`)}</span>
  `).join("");
  document.querySelectorAll("#filter-price .chip").forEach(c => {
    c.addEventListener("click", () => {
      const k = c.dataset.price;
      if (state.price.has(k)) state.price.delete(k);
      else state.price.add(k);
      renderAll();
    });
  });

  // Payments
  document.getElementById("filter-payment").innerHTML = Object.entries(PAYMENT_META).map(([k, emoji]) => `
    <span class="chip ${state.payments.has(k) ? "active" : ""}" data-pay="${k}">${emoji} ${t(`filters.${k}`)}</span>
  `).join("");
  document.querySelectorAll("#filter-payment .chip").forEach(c => {
    c.addEventListener("click", () => {
      const k = c.dataset.pay;
      if (state.payments.has(k)) state.payments.delete(k);
      else state.payments.add(k);
      renderAll();
    });
  });

  // Services
  document.getElementById("filter-services").innerHTML = Object.entries(SERVICE_META).map(([k, emoji]) => `
    <span class="chip ${state.services.has(k) ? "active" : ""}" data-svc="${k}">${emoji} ${t(`filters.${k}`)}</span>
  `).join("");
  document.querySelectorAll("#filter-services .chip").forEach(c => {
    c.addEventListener("click", () => {
      const k = c.dataset.svc;
      if (state.services.has(k)) state.services.delete(k);
      else state.services.add(k);
      renderAll();
    });
  });

  // Access
  document.getElementById("filter-access").innerHTML = Object.entries(ACCESS_META).map(([k, emoji]) => `
    <span class="chip ${state.access.has(k) ? "active" : ""}" data-acc="${k}">${emoji} ${t(`filters.${k}`)}</span>
  `).join("");
  document.querySelectorAll("#filter-access .chip").forEach(c => {
    c.addEventListener("click", () => {
      const k = c.dataset.acc;
      if (state.access.has(k)) state.access.delete(k);
      else state.access.add(k);
      renderAll();
    });
  });

  // Languages
  document.getElementById("filter-languages").innerHTML = Object.entries(LANG_META).map(([k, label]) => `
    <span class="chip ${state.languages.has(k) ? "active" : ""}" data-lang="${k}">${label}</span>
  `).join("");
  document.querySelectorAll("#filter-languages .chip").forEach(c => {
    c.addEventListener("click", () => {
      const k = c.dataset.lang;
      if (state.languages.has(k)) state.languages.delete(k);
      else state.languages.add(k);
      renderAll();
    });
  });
}

function bindFilterCheckboxes() {
  document.getElementById("check-open-now").addEventListener("change", e => {
    state.openNow = e.target.checked; renderAll();
  });
  document.getElementById("check-verified").addEventListener("change", e => {
    state.verified = e.target.checked; renderAll();
  });
}

/* ----- Searchable municipality combobox ----- */
let muniFocusIdx = -1;

function renderMunicipalityCombo() {
  const input = document.getElementById("municipality-input");
  const list = document.getElementById("municipality-list");
  const combo = document.getElementById("municipality-combo");
  if (!input) return;

  const query = input.value.toLowerCase().trim();
  // Show only the selected one if there is one, otherwise filter by query
  let items;
  if (state.municipalities.size === 1) {
    const sel = [...state.municipalities][0];
    items = [sel];
    input.value = sel;
    combo.classList.add("has-value");
  } else {
    items = municipalities;
    if (query) {
      // accent-insensitive search (strip diacritics)
      const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const q = norm(query);
      items = items.filter(m => norm(m).includes(q));
    }
  }

  if (items.length === 0) {
    list.innerHTML = `<div class="combo-empty">—</div>`;
  } else {
    list.innerHTML = items.map((m, i) =>
      `<div class="combo-item" data-muni="${m}" data-idx="${i}">${m}</div>`
    ).join("");
  }
  muniFocusIdx = -1;
}

function positionComboList() {
  const input = document.getElementById("municipality-input");
  const list = document.getElementById("municipality-list");
  if (!input || !list) return;
  const r = input.getBoundingClientRect();
  // The dropdown uses position:fixed. To make this work correctly on
  // mobile (where the combo sits inside the filters drawer, which is
  // also position:fixed), we temporarily move the list to <body> when
  // open. This escapes the drawer's containing-block chain so the
  // fixed positioning is relative to the viewport.
  // If the dropdown would overflow the bottom of the viewport, flip it
  // above the input instead of below.
  const spaceBelow = window.innerHeight - r.bottom;
  const listMaxH = 280;
  if (spaceBelow < listMaxH && r.top > listMaxH) {
    list.style.top = (r.top - listMaxH - 2) + "px";
    list.style.bottom = "auto";
  } else {
    list.style.top = (r.bottom + 2) + "px";
    list.style.bottom = "auto";
  }
  list.style.left = r.left + "px";
  list.style.width = r.width + "px";
}

function bindMunicipalityCombo() {
  const input = document.getElementById("municipality-input");
  const list = document.getElementById("municipality-list");
  const combo = document.getElementById("municipality-combo");
  const clear = document.getElementById("municipality-clear");
  if (!input) return;

  function open() {
    // Portal: temporarily move the list to <body> so position:fixed is
    // relative to the viewport (not the filters drawer's containing
    // block). Restore it on close.
    if (list.parentElement !== document.body) {
      list._origParent = list.parentElement;
      list._origNext = list.nextSibling;
      document.body.appendChild(list);
    }
    list.classList.add("open");
    renderMunicipalityCombo();
    positionComboList();
  }
  function close() {
    list.classList.remove("open");
    // Restore the list to its original DOM location so it doesn't get
    // re-positioned globally.
    if (list._origParent) {
      list._origParent.insertBefore(list, list._origNext);
      list._origParent = null;
      list._origNext = null;
    }
  }
  function selectItem(m) {
    state.municipalities = new Set([m]);
    input.value = m;
    combo.classList.add("has-value");
    close();
    renderList();
  }

  input.addEventListener("focus", open);
  input.addEventListener("input", () => {
    // If the user is typing and something was already selected, clear the selection
    if (state.municipalities.size && input.value !== [...state.municipalities][0]) {
      state.municipalities.clear();
      combo.classList.remove("has-value");
    }
    open();
  });
  input.addEventListener("keydown", e => {
    const items = list.querySelectorAll(".combo-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      muniFocusIdx = Math.min(muniFocusIdx + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle("focused", i === muniFocusIdx));
      items[muniFocusIdx]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      muniFocusIdx = Math.max(muniFocusIdx - 1, 0);
      items.forEach((it, i) => it.classList.toggle("focused", i === muniFocusIdx));
      items[muniFocusIdx]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[muniFocusIdx >= 0 ? muniFocusIdx : 0];
      if (it) selectItem(it.dataset.muni);
    } else if (e.key === "Escape") {
      close();
    }
  });
  list.addEventListener("click", e => {
    const it = e.target.closest(".combo-item");
    if (it) selectItem(it.dataset.muni);
  });
  clear.addEventListener("click", () => {
    state.municipalities.clear();
    input.value = "";
    combo.classList.remove("has-value");
    close();
    renderList();
  });
  // Close when clicking outside
  document.addEventListener("click", e => {
    if (!combo.contains(e.target)) close();
  });
  // Reposition on scroll/resize while open
  window.addEventListener("scroll", () => { if (list.classList.contains("open")) positionComboList(); }, true);
  window.addEventListener("resize", () => { if (list.classList.contains("open")) positionComboList(); });
}

function resetFilters() {
  state.query = "";
  state.categories.clear();
  state.municipalities.clear();
  state.price.clear();
  state.payments.clear();
  state.services.clear();
  state.access.clear();
  state.languages.clear();
  state.openNow = false;
  state.weekend = false;
  state.verified = false;
  document.getElementById("search-input").value = "";
  document.getElementById("check-open-now").checked = false;
  document.getElementById("check-verified").checked = false;
  const muniInput = document.getElementById("municipality-input");
  const muniCombo = document.getElementById("municipality-combo");
  if (muniInput) {
    muniInput.value = "";
    muniCombo?.classList.remove("has-value");
  }
  renderAll();
}

/* ----- Cards + Map rendering ----- */

function cardHTML(b) {
  const meta = CATEGORY_META[b.category] || { emoji: "🏢", color: "#888" };
  const open = isOpenNow(b);
  const desc = currentLang === "es" ? b.description_es : b.description_en;
  return `
    <article class="card" data-id="${b.id}" tabindex="0">
      <div class="photo" style="background: linear-gradient(135deg, ${meta.color}33, ${meta.color}11); --photo-color: ${meta.color}22;">
        <span class="photo-emoji">${meta.emoji}</span>
        ${b.verified ? `<span class="verified-badge">✓ ${t("card.verified")}</span>` : ""}
      </div>
      <div class="body">
        <div class="cat">${categoryLabel(b.category)}</div>
        <div class="name">${escapeHTML(b.name)}</div>
        <div class="meta">📍 ${escapeHTML(b.municipality)}</div>
      </div>
      <div class="footer">
        <span class="status ${open ? "open" : "closed"}">
          ${open ? t("card.open_now") : t("card.closed")}
        </span>
        <span class="price">${t(`price.${b.price}`)}</span>
      </div>
    </article>
  `;
}

function escapeHTML(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[c]);
}

function renderList() {
  const filtered = applyFilters();
  document.getElementById("results-count").innerHTML = `<strong>${filtered.length}</strong> ${t("filters.results")}`;
  // Update hero stat
  const statEl = document.getElementById("stat-count");
  if (statEl) statEl.textContent = businesses.length;
  const list = document.getElementById("list-pane");
  if (filtered.length === 0) {
    list.innerHTML = `<div class="no-results"><h3>${t("filters.no_results_title") || t("filters.no_results")}</h3><p>${currentLang === "es" ? "Prueba ajustando los filtros o limpiándolos." : "Try adjusting or clearing your filters."}</p></div>`;
  } else {
    list.innerHTML = filtered.map(cardHTML).join("");
    list.querySelectorAll(".card").forEach(c => {
      c.addEventListener("click", () => showDetail(c.dataset.id));
      c.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showDetail(c.dataset.id); }
      });
    });
  }
  updateMap(filtered);
}

/* ----- Map (Leaflet) ----- */
let map = null;
let markersLayer = null;
let mapInitialized = false;

function initMap() {
  if (mapInitialized) return;
  const el = document.getElementById("map-pane");
  if (!el) return;  // not in DOM (different view)
  // On mobile, disable drag/wheel-zoom/tap on the Leaflet map so the
  // page scroll feels natural: vertical swipes scroll the page, not
  // pan the map. We use a matchMedia listener so the setting flips
  // live when the user rotates their device or resizes the window.
  // touch-action: pan-x on the container still allows horizontal
  // swipes to pan (Leaflet respects touch-action).
  const mql = window.matchMedia("(max-width: 768px)");
  const applyMobileSettings = () => {
    const isMobile = mql.matches;
    if (map) {
      if (isMobile) {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.tap?.disable();
      } else {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.tap?.enable();
      }
    }
  };
  map = L.map("map-pane", {
    scrollWheelZoom: !mql.matches,
    dragging: !mql.matches,
    tap: !mql.matches
  }).setView([18.2208, -66.5901], 9);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  mapInitialized = true;
  // Re-apply mobile/desktop settings when the viewport crosses the breakpoint
  mql.addEventListener("change", applyMobileSettings);
}

function updateMap(filtered) {
  if (!mapInitialized) initMap();
  markersLayer.clearLayers();
  filtered.forEach(b => {
    const meta = CATEGORY_META[b.category] || { emoji: "🏢", color: "#888" };
    const icon = L.divIcon({
      className: "biz-marker",
      html: `<div style="
        background: ${meta.color}; color: white;
        width: 32px; height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
      "><span style="transform: rotate(45deg); font-size: 14px;">${meta.emoji}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
    const m = L.marker([b.lat, b.lng], { icon }).addTo(markersLayer);
    m.bindPopup(`
      <strong>${escapeHTML(b.name)}</strong>
      <small>${categoryLabel(b.category)} · ${escapeHTML(b.municipality)}</small>
      <a href="#/negocio/${b.id}" onclick="event.preventDefault(); showDetail('${b.id}');">${t("card.view_details")}</a>
    `);
  });
}

/* ----- Detail view ----- */

function renderDetail() {
  const b = businesses.find(x => x.id === currentDetailId);
  if (!b) { showExplore(); return; }
  const meta = CATEGORY_META[b.category] || { emoji: "🏢", color: "#888" };
  const open = isOpenNow(b);
  const desc = currentLang === "es" ? b.description_es : b.description_en;
  const products = currentLang === "es" ? b.products_es : b.products_en;
  const menu = currentLang === "es" ? b.menu_es : b.menu_en;
  const days = ["mon","tue","wed","thu","fri","sat","sun"];

  const photoHTML = b.photos.map((p, i) => `
    <div class="photo" style="background: linear-gradient(135deg, ${meta.color}33, ${meta.color}11);">
      <span>${meta.emoji}</span>
    </div>
  `).join("") || `<div class="photo"><span>${meta.emoji}</span></div>`;

  const html = `
    <button class="back" onclick="showExplore()">← ${t("nav.explore")}</button>

    <div class="gallery">${photoHTML}</div>

    <div class="info-grid">
      <div>
        <h1>${escapeHTML(b.name)}</h1>
        <div class="cat-row">
          <span class="badge">${meta.emoji} ${categoryLabel(b.category)}</span>
          <span>📍 ${escapeHTML(b.municipality)}</span>
          ${b.verified ? `<span style="color: var(--success);">✓ ${t("card.verified")}</span>` : ""}
          <span class="status ${open ? "open" : "closed"}">
            ${open ? "● " + t("card.open_now") : "● " + t("card.closed")}
          </span>
        </div>

        <p class="description" style="font-size: 1rem; line-height: 1.6;">${escapeHTML(desc)}</p>

        <div class="actions">
          ${b.phone ? `<a href="tel:${b.phone}" class="btn primary">📞 ${t("detail.call")}</a>` : ""}
          ${b.phone ? `<a href="sms:${b.phone}" class="btn">💬 ${t("detail.message")}</a>` : ""}
          <a href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}" target="_blank" rel="noopener" class="btn accent">🧭 ${t("detail.open_directions")}</a>
          <button class="btn" onclick="shareBusiness('${b.id}')">↗ ${t("detail.share")}</button>
        </div>

        ${products ? `
          <div class="section">
            <h2>${t("detail.products")}</h2>
            <div class="product-chips">
              ${products.split(",").map(p => `<span class="chip">${escapeHTML(p.trim())}</span>`).join("")}
            </div>
          </div>` : ""}

        ${menu ? `
          <div class="section">
            <h2>${t("detail.menu")}</h2>
            <div class="menu-list">${escapeHTML(menu)}</div>
          </div>` : `
          <div class="section">
            <h2>${t("detail.menu")}</h2>
            <p style="color: var(--text-muted);">${t("detail.no_menu")}</p>
          </div>`}

        <div class="section">
          <h2>${t("detail.hours")}</h2>
          <div class="hours-table">
            ${days.map(d => `
              <div class="day">${t(`days.${d}`)}</div>
              <div class="time ${b.hours[d]?.toLowerCase() === 'closed' ? 'closed-now' : ''}">
                ${b.hours[d] || "—"}
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div>
        <div class="section">
          <h2>${t("detail.contact")}</h2>
          <div class="contact-card">
            ${b.owner ? `<div class="contact-item"><div class="icon">👤</div><div><div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">${t("detail.owner")}</div><div style="font-weight: 500;">${escapeHTML(b.owner)}</div></div></div>` : ""}
            ${b.phone ? `<div class="contact-item"><div class="icon">📞</div><a href="tel:${b.phone}" style="font-weight: 500;">${b.phone}</a></div>` : ""}
            ${b.email ? `<div class="contact-item"><div class="icon">✉️</div><a href="mailto:${b.email}" style="word-break: break-all; font-weight: 500;">${escapeHTML(b.email)}</a></div>` : ""}
            ${b.website ? `<div class="contact-item"><div class="icon">🌐</div><a href="${b.website}" target="_blank" rel="noopener" style="font-weight: 500;">${escapeHTML(b.website)}</a></div>` : ""}
            <div class="contact-item"><div class="icon">📍</div><div style="font-weight: 500;">${escapeHTML(b.address)}</div></div>
          </div>
        </div>

        ${b.payment?.length ? `
          <div class="section">
            <h2>${t("filters.payment")}</h2>
            <div class="product-chips">
              ${b.payment.map(p => `<span class="chip">${PAYMENT_META[p] || ""} ${t(`filters.${p}`)}</span>`).join("")}
            </div>
          </div>` : ""}

        ${b.services?.length ? `
          <div class="section">
            <h2>${t("filters.services")}</h2>
            <div class="product-chips">
              ${b.services.map(s => `<span class="chip">${SERVICE_META[s] || ""} ${t(`filters.${s}`)}</span>`).join("")}
            </div>
          </div>` : ""}

        ${b.languages?.length ? `
          <div class="section">
            <h2>${t("filters.languages")}</h2>
            <div class="product-chips">
              ${b.languages.map(l => `<span class="chip">${LANG_META[l] || l}</span>`).join("")}
            </div>
          </div>` : ""}

        <div class="section">
          <h2>${t("detail.location")}</h2>
          <div id="detail-map" class="detail-map"></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById("view-detail").innerHTML = html;
  // Init detail mini-map
  setTimeout(() => {
    const dm = L.map("detail-map").setView([b.lat, b.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(dm);
    L.marker([b.lat, b.lng]).addTo(dm);
  }, 50);
}

function shareBusiness(id) {
  const b = businesses.find(x => x.id === id);
  const url = `${location.origin}${location.pathname}#/negocio/${id}`;
  if (navigator.share) {
    navigator.share({ title: b.name, text: t("site.tagline"), url });
  } else {
    navigator.clipboard.writeText(url);
    alert(currentLang === "es" ? "Enlace copiado" : "Link copied");
  }
}

/* ----- Submit form ----- */

function renderForm() {
  const catSelect = document.getElementById("form-category");
  catSelect.innerHTML = `<option value="">${t("submit.category_ph")}</option>` +
    Object.keys(CATEGORY_META).map(k =>
      `<option value="${k}">${CATEGORY_META[k].emoji} ${categoryLabel(k)}</option>`
    ).join("");

  const muniSelect = document.getElementById("form-municipality");
  muniSelect.innerHTML = `<option value="">${t("submit.municipality_ph")}</option>` +
    municipalities.map(m => `<option value="${m}">${m}</option>`).join("");

  // Payment, services, languages as chip groups
  const payGroup = document.getElementById("form-payment");
  payGroup.innerHTML = Object.entries(PAYMENT_META).map(([k, emoji]) => `
    <label class="chip"><input type="checkbox" name="payment" value="${k}" style="display:none;">${emoji} ${t(`filters.${k}`)}</label>
  `).join("");
  payGroup.querySelectorAll(".chip").forEach(c => {
    c.addEventListener("click", e => {
      e.preventDefault();
      const cb = c.querySelector("input");
      cb.checked = !cb.checked;
      c.classList.toggle("active", cb.checked);
    });
  });

  const svcGroup = document.getElementById("form-services");
  svcGroup.innerHTML = Object.entries(SERVICE_META).map(([k, emoji]) => `
    <label class="chip"><input type="checkbox" name="services" value="${k}" style="display:none;">${emoji} ${t(`filters.${k}`)}</label>
  `).join("");
  svcGroup.querySelectorAll(".chip").forEach(c => {
    c.addEventListener("click", e => {
      e.preventDefault();
      const cb = c.querySelector("input");
      cb.checked = !cb.checked;
      c.classList.toggle("active", cb.checked);
    });
  });

  const langGroup = document.getElementById("form-languages");
  langGroup.innerHTML = Object.entries(LANG_META).map(([k, label]) => `
    <label class="chip"><input type="checkbox" name="languages" value="${k}" style="display:none;">${label}</label>
  `).join("");
  langGroup.querySelectorAll(".chip").forEach(c => {
    c.addEventListener("click", e => {
      e.preventDefault();
      const cb = c.querySelector("input");
      cb.checked = !cb.checked;
      c.classList.toggle("active", cb.checked);
    });
  });
}

function bindSubmitForm() {
  const form = document.getElementById("form-submit");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    const data = new FormData(form);
    if (!data.get("name") || !data.get("owner") || !data.get("email") ||
        !data.get("category") || !data.get("municipality")) {
      status.className = "form-status error";
      status.textContent = t("submit.error_required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get("email"))) {
      status.className = "form-status error";
      status.textContent = t("submit.error_email");
      return;
    }
    // Stub: in production this posts to Supabase
    status.className = "form-status success";
    status.textContent = t("submit.success");
    form.reset();
    document.querySelectorAll("#form-submit .chip").forEach(c => c.classList.remove("active"));
  });

  // Photo upload preview
  const photoInput = document.getElementById("form-photos");
  const preview = document.getElementById("form-photos-preview");
  photoInput.addEventListener("change", e => {
    preview.innerHTML = "";
    [...e.target.files].slice(0, 6).forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        const div = document.createElement("div");
        div.className = "thumb";
        div.innerHTML = `<img src="${ev.target.result}" alt="">`;
        preview.appendChild(div);
      };
      reader.readAsDataURL(f);
    });
  });
}

/* ----- Boot ----- */

function renderAll() {
  renderFilterChips();
  renderList();
  if (currentView === "detail") renderDetail();
  if (currentView === "submit") renderForm();
}

async function boot() {
  await Promise.all([loadI18n(), loadData()]);

  // Restore theme + lang from localStorage
  const savedLang = localStorage.getItem("negociospr-lang");
  if (savedLang && i18n[savedLang]) currentLang = savedLang;
  const savedTheme = localStorage.getItem("negociospr-theme");
  if (savedTheme && ["auto", "light", "dark"].includes(savedTheme)) currentTheme = savedTheme;

  // Bind search
  document.getElementById("search-input").addEventListener("input", e => {
    state.query = e.target.value;
    renderList();
  });

  // Bind nav
  document.querySelectorAll(".subnav a").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      const view = a.dataset.view;
      if (view === "explore") showExplore();
      else showView(view);
    });
  });

  // Mobile menu toggle (hamburger)
  document.getElementById("menu-toggle").addEventListener("click", () => {
    const subnav = document.getElementById("subnav");
    const filters = document.getElementById("filters");
    const isOpen = subnav.classList.contains("open");
    const menuBtn = document.getElementById("menu-toggle");
    // Close any other open drawer first (mutual exclusion)
    filters.classList.remove("open");
    // Toggle subnav
    if (isOpen) {
      closeDrawer();
      menuBtn.textContent = "☰";
      menuBtn.setAttribute("aria-label", t("nav.open_menu"));
    } else {
      openDrawer("subnav");
      menuBtn.textContent = "✕";
      menuBtn.setAttribute("aria-label", t("nav.close_menu"));
    }
  });

  // Close button inside the subnav (visible on mobile when subnav is open)
  document.getElementById("subnav-close")?.addEventListener("click", () => {
    closeDrawer();
  });

  // Lang switch
  document.querySelectorAll(".lang-switch button").forEach(b => {
    b.addEventListener("click", () => {
      currentLang = b.dataset.lang;
      localStorage.setItem("negociospr-lang", currentLang);
      applyI18n();
    });
  });

  // Theme switch
  document.querySelectorAll(".theme-switch button").forEach(b => {
    b.addEventListener("click", () => {
      currentTheme = b.dataset.theme;
      localStorage.setItem("negociospr-theme", currentTheme);
      applyTheme();
    });
  });

  // Reset filters
  document.getElementById("reset-filters").addEventListener("click", resetFilters);

  // Toggle all filter groups (one button, both actions)
  const toggleAllBtn = document.getElementById("toggle-all-filters");
  const toggleAllIcon = toggleAllBtn.querySelector(".toggle-icon");
  const toggleAllLabel = toggleAllBtn.querySelector(".toggle-label");

  function syncToggleAllBtn() {
    const groups = document.querySelectorAll(".filter-group");
    const allOpen = [...groups].every(g => g.hasAttribute("open"));
    // aria-expanded drives the icon: true = all open (show −), false = collapsed (show +)
    toggleAllBtn.setAttribute("aria-expanded", allOpen ? "true" : "false");
    // Label: when all open, action is collapse; otherwise action is expand
    toggleAllLabel.textContent = allOpen ? t("filters.collapse_all") : t("filters.expand_all");
  }

  toggleAllBtn.addEventListener("click", () => {
    const groups = document.querySelectorAll(".filter-group");
    const allOpen = [...groups].every(g => g.hasAttribute("open"));
    groups.forEach(g => {
      if (allOpen) g.removeAttribute("open");
      else g.setAttribute("open", "");
    });
    syncToggleAllBtn();
  });

  // Sync the button label/icon whenever the user toggles a group individually
  document.querySelectorAll(".filter-group").forEach(g => {
    g.addEventListener("toggle", syncToggleAllBtn);
  });

  // Filter toggle (mobile)
  document.getElementById("filter-toggle").addEventListener("click", () => {
    const filters = document.getElementById("filters");
    const subnav = document.getElementById("subnav");
    const isOpen = filters.classList.contains("open");
    // Close any other open drawer first (mutual exclusion)
    subnav.classList.remove("open");
    // Toggle filters
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer("filters");
    }
  });

  // Close button inside the filter drawer (visible on mobile)
  document.getElementById("filters-close")?.addEventListener("click", () => {
    closeDrawer();
  });

  // Swipe down on the filter drawer drag handle to close it
  // (only triggers when starting near the top of the drawer, where the
  // ::before handle is rendered)
  (() => {
    const filters = document.getElementById("filters");
    if (!filters) return;
    let startY = 0, startT = 0, dragging = false;
    filters.addEventListener("touchstart", (e) => {
      // Only start drag if the touch is in the top 32px (where the handle is)
      const rect = filters.getBoundingClientRect();
      const touchY = e.touches[0].clientY - rect.top;
      if (touchY < 32) {
        startY = e.touches[0].clientY;
        startT = Date.now();
        dragging = true;
      }
    }, { passive: true });
    filters.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      const dy = e.touches[0].clientY - startY;
      // As the user drags down, slide the sheet with their finger
      if (dy > 0) {
        filters.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });
    filters.addEventListener("touchend", (e) => {
      if (!dragging) return;
      const dy = (e.changedTouches[0].clientY - startY);
      const dt = Date.now() - startT;
      // Close if dragged more than 80px down OR fast downward swipe
      if (dy > 80 || (dy > 30 && dt < 250)) {
        closeDrawer();
      } else {
        // Snap back to open position
        filters.style.transform = '';
      }
      dragging = false;
    });
  })();

  // Open a drawer with body scroll-lock that preserves the current scroll position
  // (iOS/macOS don't honor overflow:hidden for body scroll, so we use position:fixed)
  function openDrawer(which) {
    const scrollY = window.scrollY;
    document.body.dataset.scrollY = String(scrollY);
    document.body.classList.add("drawer-open");
    // Tag which drawer is open so the hamburger can show the "active"
    // teal state only when the subnav (its own drawer) is open, not
    // when the filters drawer is open.
    if (which === "subnav") {
      document.body.classList.add("drawer-subnav-open");
    } else {
      document.body.classList.add("drawer-filters-open");
    }
    document.getElementById(which).classList.add("open");
    // Only show the modal overlay for the filter drawer. The subnav
    // is full-screen so there is no "outside" to tap.
    if (which === "filters") {
      document.getElementById("modal-overlay").classList.add("active");
    } else {
      document.getElementById("modal-overlay").classList.remove("active");
    }
  }

  // Close any open drawer (called by overlay tap, close buttons, Escape, swipe-down)
  function closeDrawer() {
    document.getElementById("subnav").classList.remove("open");
    document.getElementById("filters").classList.remove("open");
    document.getElementById("filters").style.transform = "";
    document.body.classList.remove("drawer-open");
    document.body.classList.remove("drawer-subnav-open");
    document.body.classList.remove("drawer-filters-open");
    document.getElementById("modal-overlay").classList.remove("active");
    const menuBtn = document.getElementById("menu-toggle");
    menuBtn.textContent = "☰";
    menuBtn.setAttribute("aria-label", t("nav.open_menu"));
    // Restore scroll position
    const scrollY = document.body.dataset.scrollY;
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY, 10));
      delete document.body.dataset.scrollY;
    }
  }

  // Tap outside the drawer to close it
  document.getElementById("modal-overlay").addEventListener("click", closeDrawer);

  // The topbar is z:100, above the modal overlay (z:95), so taps on the
  // topbar don't reach the overlay. To make tap-outside work, also
  // close the drawer when the user taps anywhere on the topbar (except
  // the menu-toggle, which toggles the subnav).
  document.querySelector(".topbar")?.addEventListener("click", (e) => {
    if (document.body.classList.contains("drawer-open") &&
        !e.target.closest("#menu-toggle")) {
      closeDrawer();
    }
  });

  // Escape key closes the active drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("drawer-open")) {
      closeDrawer();
    }
  });

  // View toggle (list / map)
  document.querySelectorAll(".view-toggle button").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".view-toggle button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const view = b.dataset.view;
      const mapPane = document.getElementById("map-pane");
      const listPane = document.getElementById("list-pane");
      if (view === "map") {
        mapPane.classList.remove("hidden");
        listPane.classList.remove("visible");
        setTimeout(() => map?.invalidateSize(), 100);
      } else {
        mapPane.classList.add("hidden");
        listPane.classList.add("visible");
      }
    });
  });

  bindFilterCheckboxes();
  bindMunicipalityCombo();
  bindSubmitForm();

  applyI18n();
  applyTheme();
  initMap();

  // Handle initial URL
  const hash = location.hash;
  if (hash.startsWith("#/negocio/")) {
    currentDetailId = hash.split("/")[2];
    showView("detail");
  } else {
    showView("explore");
  }
}

document.addEventListener("DOMContentLoaded", boot);
