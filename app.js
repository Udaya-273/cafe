// Basic configuration and state
const STORAGE_KEYS = {
  MENU: "restaurant_menu",
  BILLS: "restaurant_bills",
  SETTINGS: "restaurant_settings",
};

const DEFAULT_SETTINGS = {
  currencySymbol: "₹",
  restaurantName: "Udaya's Cafe",
};

const FIXED_ITEM_IMAGES = {
  idly: "https://i.pinimg.com/564x/31/17/79/3117798277633d30993e40fdb344e789.jpg",
  dosai:
    "https://i.pinimg.com/564x/78/1c/68/781c6867d971c5fa7a704c992dc755c3.jpg",
  vadai:
    "https://i.pinimg.com/564x/9b/51/f2/9b51f2f4d27151e50a8bde49a54281aa.jpg",
  pongal:
    "https://i.pinimg.com/736x/e9/bd/1d/e9bd1d72950e3aa98445c15c4bcb74e9.jpg",
  poori:
    "https://i.pinimg.com/564x/68/1f/b1/681fb1ee4ab97b380a2c9ce25ae80e3e.jpg",
  tea: "https://i.pinimg.com/564x/1a/ad/74/1aad744890154a9ce05ab8445f9a132f.jpg",
  coffee:
    "https://i.pinimg.com/564x/fa/a7/e0/faa7e092bddb69a1381dcc5c8d96e1d6.jpg",
};

let menuItems = [];
let cartItems = [];
let bills = [];

// ---------- LocalStorage helpers ----------
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadSettings() {
  const settings = loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  return settings;
}

const appSettings = loadSettings();

// ---------- Seed menu ----------
function getDefaultMenu() {
  return [
    {
      id: "idly",
      name: "Idly",
      category: "Breakfast",
      price: 20,
      imageUrl: FIXED_ITEM_IMAGES.idly,
      isActive: true,
    },
    {
      id: "dosai",
      name: "Dosai",
      category: "Breakfast",
      price: 40,
      imageUrl: FIXED_ITEM_IMAGES.dosai,
      isActive: true,
    },
    {
      id: "vadai",
      name: "Vadai",
      category: "Snacks",
      price: 15,
      imageUrl: FIXED_ITEM_IMAGES.vadai,
      isActive: true,
    },
    {
      id: "poori",
      name: "Poori",
      category: "Breakfast",
      price: 35,
      imageUrl: FIXED_ITEM_IMAGES.poori,
      isActive: true,
    },
    {
      id: "pongal",
      name: "Pongal",
      category: "Breakfast",
      price: 35,
      imageUrl: FIXED_ITEM_IMAGES.pongal,
      isActive: true,
    },
    {
      id: "tea",
      name: "Tea",
      category: "Beverages",
      price: 15,
      imageUrl: FIXED_ITEM_IMAGES.tea,
      isActive: true,
    },
    {
      id: "coffee",
      name: "Coffee",
      category: "Beverages",
      price: 20,
      imageUrl: FIXED_ITEM_IMAGES.coffee,
      isActive: true,
    },
  ];
}

function migrateMenuImages(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  let changed = false;

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const fixed = FIXED_ITEM_IMAGES[item.id];
    if (!fixed) return;
    if (item.imageUrl !== fixed) {
      item.imageUrl = fixed;
      changed = true;
    }
  });

  if (changed) saveToStorage(STORAGE_KEYS.MENU, items);
  return items;
}

function loadMenu() {
  const stored = loadFromStorage(STORAGE_KEYS.MENU, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    const defaults = getDefaultMenu();
    saveToStorage(STORAGE_KEYS.MENU, defaults);
    return defaults;
  }
  return migrateMenuImages(stored);
}

function saveMenu() {
  saveToStorage(STORAGE_KEYS.MENU, menuItems);
}

function loadBills() {
  return loadFromStorage(STORAGE_KEYS.BILLS, []);
}

function saveBills() {
  saveToStorage(STORAGE_KEYS.BILLS, bills);
}

// ---------- UI helpers ----------
function formatCurrency(amount) {
  return `${appSettings.currencySymbol}${amount.toFixed(2)}`;
}

function $(selector) {
  return document.querySelector(selector);
}

function createEl(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

// ---------- Menu rendering ----------
function renderMenuGrid() {
  const container = $("#menu-grid");
  container.innerHTML = "";
  const activeItems = menuItems.filter((item) => item.isActive);

  if (activeItems.length === 0) {
    const p = createEl("p", "muted-text");
    p.textContent = "No active menu items. Please add items in Manage Menu.";
    container.appendChild(p);
    return;
  }

  activeItems.forEach((item) => {
    const card = createEl("div", "menu-card");

    const img = document.createElement("img");
    img.src =
      item.imageUrl ||
      "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600";
    img.alt = item.name;

    const body = createEl("div", "menu-card-body");
    const title = createEl("div", "menu-card-title");
    title.textContent = item.name;
    const price = createEl("div", "menu-card-price");
    price.textContent = formatCurrency(item.price);

    const addBtn = createEl("button", "menu-card-add");
    addBtn.type = "button";
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(item.id);
    });

    card.addEventListener("click", () => addToCart(item.id));

    body.appendChild(title);
    body.appendChild(price);
    body.appendChild(addBtn);

    card.appendChild(img);
    card.appendChild(body);
    container.appendChild(card);
  });
}

// ---------- Cart logic ----------
function addToCart(menuItemId) {
  const item = menuItems.find((m) => m.id === menuItemId);
  if (!item) return;

  const existing = cartItems.find((c) => c.menuItemId === menuItemId);
  if (existing) {
    existing.quantity += 1;
    existing.lineTotal = existing.quantity * existing.unitPrice;
  } else {
    cartItems.push({
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity: 1,
      lineTotal: item.price,
    });
  }

  updateCartUI();
}

function changeCartQty(menuItemId, delta) {
  const line = cartItems.find((c) => c.menuItemId === menuItemId);
  if (!line) return;

  line.quantity += delta;
  if (line.quantity <= 0) {
    cartItems = cartItems.filter((c) => c.menuItemId !== menuItemId);
  } else {
    line.lineTotal = line.quantity * line.unitPrice;
  }

  updateCartUI();
}

function removeFromCart(menuItemId) {
  cartItems = cartItems.filter((c) => c.menuItemId !== menuItemId);
  updateCartUI();
}

function clearCart() {
  if (cartItems.length === 0) return;
  const ok = window.confirm("Clear all items from the cart?");
  if (!ok) return;
  cartItems = [];
  updateCartUI();
}

function calculateTotals() {
  const subtotal = cartItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const total = subtotal;
  return { subtotal, total };
}

function updateCartUI() {
  const container = $("#cart-items");
  container.innerHTML = "";

  if (cartItems.length === 0) {
    const p = createEl("p", "empty-cart-text");
    p.textContent = "No items added yet.";
    container.appendChild(p);
  } else {
    cartItems.forEach((line) => {
      const row = createEl("div", "cart-item-row");

      const name = createEl("div", "cart-item-name");
      name.textContent = line.name;

      const qty = createEl("div", "cart-qty-controls");
      const minusBtn = createEl("button", "qty-btn");
      minusBtn.type = "button";
      minusBtn.textContent = "-";
      minusBtn.addEventListener("click", () => changeCartQty(line.menuItemId, -1));

      const qtyVal = document.createElement("span");
      qtyVal.textContent = line.quantity;

      const plusBtn = createEl("button", "qty-btn");
      plusBtn.type = "button";
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", () => changeCartQty(line.menuItemId, 1));

      qty.appendChild(minusBtn);
      qty.appendChild(qtyVal);
      qty.appendChild(plusBtn);

      const amount = createEl("div");
      amount.textContent = formatCurrency(line.lineTotal);

      const removeBtn = createEl("button", "cart-remove-btn");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => removeFromCart(line.menuItemId));

      row.appendChild(name);
      row.appendChild(qty);
      row.appendChild(amount);
      row.appendChild(removeBtn);

      container.appendChild(row);
    });
  }

  const { subtotal, total } = calculateTotals();
  $("#subtotal-amount").textContent = formatCurrency(subtotal);
  $("#total-amount").textContent = formatCurrency(total);

  const hasItems = cartItems.length > 0;
  $("#pay-now-btn").disabled = !hasItems;
  $("#print-bill-btn").disabled = !hasItems;
  $("#clear-cart-btn").disabled = !hasItems;
}

// ---------- Billing / Bills ----------
function generateBillId() {
  const now = new Date();
  return `B${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}-${now.getTime()}`;
}

function finalizeBill() {
  if (cartItems.length === 0) {
    alert("Cart is empty. Add items before billing.");
    return null;
  }

  const { subtotal, total } = calculateTotals();
  const bill = {
    id: generateBillId(),
    dateTime: new Date().toISOString(),
    items: cartItems.map((c) => ({ ...c })),
    subtotal,
    total,
  };

  bills.push(bill);
  saveBills();
  return bill;
}

// ---------- QR Modal ----------
function openQrModal() {
  const bill = finalizeBill();
  if (!bill) return;

  $("#qr-total-amount").textContent = formatCurrency(bill.total);

  const upiId = "udayakey27-2@oksbi";
  const upiName = "Udaya M";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${bill.total.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  
  const qrContainer = $("#qr-code-container");
  qrContainer.innerHTML = `<img src="${qrUrl}" alt="UPI QR Code" style="width:180px; height:180px; border-radius:0.75rem; border:2px solid #e5e7eb;" />`;

  const modal = $("#qr-modal");
  modal.dataset.currentBillId = bill.id;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeQrModal() {
  const modal = $("#qr-modal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("data-current-bill-id");
}

function handleMarkPaid() {
  if (cartItems.length > 0) {
    // Cart was finalized when opening modal; after marking paid, clear it
    clearCartWithoutConfirm();
  }
  closeQrModal();
}

function clearCartWithoutConfirm() {
  cartItems = [];
  updateCartUI();
}

// ---------- Print Bill ----------
function printBill() {
  if (cartItems.length === 0) {
    alert("Cart is empty. Add items before printing.");
    return;
  }

  const bill = finalizeBill();
  if (!bill) return;

  const metaEl = $("#print-bill-meta");
  const itemsTable = $("#print-bill-items");
  const totalsEl = $("#print-bill-totals");

  const date = new Date(bill.dateTime);
  metaEl.textContent = `Bill ID: ${bill.id} | ${date.toLocaleString()}`;

  itemsTable.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.innerHTML =
    "<th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th>";
  itemsTable.appendChild(headerRow);

  bill.items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${item.name}</td><td>${item.quantity}</td><td>${formatCurrency(
      item.unitPrice
    )}</td><td>${formatCurrency(item.lineTotal)}</td>`;
    itemsTable.appendChild(row);
  });

  totalsEl.innerHTML = `
    <p>Subtotal: ${formatCurrency(bill.subtotal)}</p>
    <p><strong>Total: ${formatCurrency(bill.total)}</strong></p>
  `;

  window.print();
  clearCartWithoutConfirm();
}

// ---------- Reports ----------
function populateReportFilters() {
  const monthSelect = $("#report-month-select");
  const yearSelect = $("#report-year-select");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  monthSelect.innerHTML = "";
  months.forEach((name, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = name;
    monthSelect.appendChild(opt);
  });

  const years = new Set();
  bills.forEach((b) => {
    const d = new Date(b.dateTime);
    if (!Number.isNaN(d.getTime())) {
      years.add(d.getFullYear());
    }
  });
  const currentYear = new Date().getFullYear();
  if (years.size === 0) years.add(currentYear);

  yearSelect.innerHTML = "";
  Array.from(years)
    .sort()
    .forEach((y) => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    });

  monthSelect.value = String(new Date().getMonth());
  yearSelect.value = String(currentYear);
}

function refreshReport() {
  const month = Number($("#report-month-select").value);
  const year = Number($("#report-year-select").value);

  const filtered = bills.filter((b) => {
    const d = new Date(b.dateTime);
    return (
      !Number.isNaN(d.getTime()) &&
      d.getMonth() === month &&
      d.getFullYear() === year
    );
  });

  const tbody = $("#report-table-body");
  const emptyText = $("#report-empty-text");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    emptyText.style.display = "block";
  } else {
    emptyText.style.display = "none";
    filtered.forEach((bill) => {
      const row = document.createElement("tr");
      const date = new Date(bill.dateTime);
      const itemsSummary = bill.items
        .map((i) => `${i.name} x${i.quantity}`)
        .join(", ");

      row.innerHTML = `
        <td>${bill.id}</td>
        <td>${date.toLocaleString()}</td>
        <td>${itemsSummary}</td>
        <td>${bill.total.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  const summaryContainer = $("#report-summary");
  summaryContainer.innerHTML = "";

  const totalSales = filtered.reduce((sum, b) => sum + b.total, 0);
  const totalBills = filtered.length;

  const itemCounts = {};
  filtered.forEach((b) => {
    b.items.forEach((i) => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  function addSummaryCard(label, value) {
    const card = createEl("div", "summary-card");
    const l = createEl("div", "summary-label");
    l.textContent = label;
    const v = createEl("div", "summary-value");
    v.textContent = value;
    card.appendChild(l);
    card.appendChild(v);
    summaryContainer.appendChild(card);
  }

  addSummaryCard("Total Sales", formatCurrency(totalSales));
  addSummaryCard("Number of Bills", String(totalBills));
  if (topItems.length > 0) {
    addSummaryCard(
      "Top Items",
      topItems.map(([name, qty]) => `${name} (${qty})`).join(", ")
    );
  }
}

// ---------- Manage Menu ----------
function renderMenuTable() {
  const tbody = $("#menu-table-body");
  const empty = $("#menu-empty-text");
  tbody.innerHTML = "";

  if (menuItems.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  menuItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category || "-"}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>${item.isActive ? "Yes" : "No"}</td>
      <td class="menu-actions">
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </td>
    `;

    const [editBtn, deleteBtn] = tr.querySelectorAll("button");
    editBtn.addEventListener("click", () => loadItemIntoForm(item.id));
    deleteBtn.addEventListener("click", () => deleteMenuItem(item.id));

    tbody.appendChild(tr);
  });
}

function loadItemIntoForm(id) {
  const item = menuItems.find((m) => m.id === id);
  if (!item) return;

  $("#menu-item-id").value = item.id;
  $("#item-name").value = item.name;
  $("#item-category").value = item.category || "";
  $("#item-price").value = item.price;
  $("#item-image-url").value = item.imageUrl || "";
}

function clearMenuForm() {
  $("#menu-item-id").value = "";
  $("#item-name").value = "";
  $("#item-category").value = "";
  $("#item-price").value = "";
  $("#item-image-url").value = "";
}

function deleteMenuItem(id) {
  const ok = window.confirm("Delete this menu item?");
  if (!ok) return;
  menuItems = menuItems.filter((m) => m.id !== id);
  saveMenu();
  renderMenuTable();
  renderMenuGrid();
}

function upsertMenuItemFromForm(event) {
  event.preventDefault();

  const idField = $("#menu-item-id").value.trim();
  const name = $("#item-name").value.trim();
  const priceValue = Number($("#item-price").value);
  const category = $("#item-category").value.trim();
  const imageUrl = $("#item-image-url").value.trim();

  if (!name || Number.isNaN(priceValue) || priceValue < 0) {
    alert("Please enter a valid name and price.");
    return;
  }

  if (idField) {
    const existing = menuItems.find((m) => m.id === idField);
    if (existing) {
      existing.name = name;
      existing.price = priceValue;
      existing.category = category;
      existing.imageUrl = imageUrl || existing.imageUrl;
      existing.isActive = true;
    }
  } else {
    const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    menuItems.push({
      id,
      name,
      price: priceValue,
      category,
      imageUrl: imageUrl || getSuggestedImageUrl(name),
      isActive: true,
    });
  }

  saveMenu();
  renderMenuTable();
  renderMenuGrid();
  clearMenuForm();
}

function resetMenuToDefaults() {
  const ok = window.confirm(
    "Reset menu to default South Indian items? This will replace current menu."
  );
  if (!ok) return;
  menuItems = getDefaultMenu();
  saveMenu();
  renderMenuTable();
  renderMenuGrid();
}

// ---------- Navigation ----------
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  const sections = document.querySelectorAll(".tab-section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      sections.forEach((section) => {
        if (section.id === targetId) {
          section.classList.add("tab-section-active");
        } else {
          section.classList.remove("tab-section-active");
        }
      });

      if (targetId === "reports-section") {
        populateReportFilters();
        refreshReport();
      }
    });
  });
}

// ---------- Init ----------
function init() {
  menuItems = loadMenu();
  bills = loadBills();

  renderMenuGrid();
  renderMenuTable();
  updateCartUI();
  setupTabs();

  $("#clear-cart-btn").addEventListener("click", clearCart);
  $("#pay-now-btn").addEventListener("click", openQrModal);
  $("#print-bill-btn").addEventListener("click", printBill);

  $("#report-month-select").addEventListener("change", refreshReport);
  $("#report-year-select").addEventListener("change", refreshReport);
  $("#refresh-report-btn").addEventListener("click", refreshReport);

  $("#menu-form").addEventListener("submit", upsertMenuItemFromForm);
  $("#cancel-edit-btn").addEventListener("click", clearMenuForm);
  $("#reset-menu-btn").addEventListener("click", resetMenuToDefaults);

  document
    .querySelectorAll("[data-close-modal]")
    .forEach((el) => el.addEventListener("click", closeQrModal));
  $("#mark-paid-btn").addEventListener("click", handleMarkPaid);
}

document.addEventListener("DOMContentLoaded", init);

function getSuggestedImageUrl(itemName) {
  const n = String(itemName || "").toLowerCase();

  if (n.includes("idly") || n.includes("idli")) {
    return FIXED_ITEM_IMAGES.idly;
  }
  if (n.includes("dosa") || n.includes("dosai") || n.includes("dosha")) {
    return FIXED_ITEM_IMAGES.dosai;
  }
  if (n.includes("vada") || n.includes("vadai") || n.includes("medu")) {
    return FIXED_ITEM_IMAGES.vadai;
  }
  if (n.includes("poori") || n.includes("puri")) {
    return FIXED_ITEM_IMAGES.poori;
  }
  if (n.includes("pongal") || n.includes("ven pongal")) {
    return FIXED_ITEM_IMAGES.pongal;
  }
  if (n.includes("tea") || n.includes("chai")) {
    return FIXED_ITEM_IMAGES.tea;
  }
  if (n.includes("coffee")) {
    return FIXED_ITEM_IMAGES.coffee;
  }

  return "";
}

