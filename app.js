/* ==========================================================================
                    CENTRAL DATA STORE & LOCAL STORAGE ENGINE
       ========================================================================== */
const STORAGE_KEY = "INVENTO_PRO_DB_V1";

const defaultDemoData = {
  users: [
    {
      email: "admin@inventopro.com",
      password: "admin123",
      name: "Admin User",
      business: "Apex Retailers",
    },
  ],
  settings: {
    businessName: "Apex Retailers",
    currency: "Rs.",
  },
  categories: [
    {
      id: "cat_1",
      name: "Electronics",
      description: "Gadgets & tech accessories",
    },
    { id: "cat_2", name: "Groceries", description: "Daily essential goods" },
    { id: "cat_3", name: "Apparel", description: "Clothing and fashion" },
  ],
  products: [
    {
      id: "prod_1",
      sku: "SKU-1001",
      name: "Wireless Headphones",
      categoryId: "cat_1",
      cost: 3500,
      price: 5500,
      stock: 24,
      minStock: 5,
    },
    {
      id: "prod_2",
      sku: "SKU-1002",
      name: "Mechanical Keyboard",
      categoryId: "cat_1",
      cost: 4500,
      price: 7200,
      stock: 12,
      minStock: 5,
    },
    {
      id: "prod_3",
      sku: "SKU-2001",
      name: "Organic Green Tea",
      categoryId: "cat_2",
      cost: 400,
      price: 650,
      stock: 3,
      minStock: 10,
    },
    {
      id: "prod_4",
      sku: "SKU-3001",
      name: "Cotton Denim Jacket",
      categoryId: "cat_3",
      cost: 2800,
      price: 4500,
      stock: 8,
      minStock: 4,
    },
  ],
  suppliers: [
    {
      id: "supp_1",
      name: "TechSupply Co.",
      company: "TechSupply Ltd",
      email: "sales@techsupply.com",
      phone: "+92 300 1234567",
    },
  ],
  customers: [
    {
      id: "cust_1",
      name: "Ali Khan",
      email: "ali@gmail.com",
      phone: "+92 321 9876543",
      spent: 12000,
    },
  ],
  purchases: [],
  sales: [],
  inventoryLogs: [],
};

let db = {};

function loadDatabase() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      db = JSON.parse(stored);
    } catch (e) {
      db = JSON.parse(JSON.stringify(defaultDemoData));
    }
  } else {
    db = JSON.parse(JSON.stringify(defaultDemoData));
    saveDatabase();
  }
}

function saveDatabase() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let currentUser = null;
let posCart = [];

// Toast Utility
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color: var(--accent-primary);"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Modal Control Helper
function openModal(id) {
  document.getElementById(id).classList.add("active");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// Theme Switcher
function toggleTheme() {
  const current = document.body.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  document.getElementById("themeIcon").className =
    next === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  localStorage.setItem("invento_theme", next);
}

// Auth Views Navigation
function switchAuthView(viewId) {
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("signupView").classList.add("hidden");
  document.getElementById("forgotView").classList.add("hidden");
  document.getElementById(viewId).classList.remove("hidden");
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
  } else {
    input.type = "password";
    btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
  }
}

// Auth Event Listeners
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pwd = document.getElementById("loginPassword").value;

  const found = db.users.find((u) => u.email === email && u.password === pwd);
  if (found) {
    currentUser = found;
    localStorage.setItem("invento_session", JSON.stringify(found));
    initAppView();
    showToast(`Welcome back, ${found.name}!`);
  } else {
    showToast("Invalid email or password", "error");
  }
});

document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("signUpName").value.trim();
  const business = document.getElementById("signUpBusiness").value.trim();
  const email = document.getElementById("signUpEmail").value.trim();
  const password = document.getElementById("signUpPassword").value;

  if (db.users.some((u) => u.email === email)) {
    showToast("Email is already registered!");
    return;
  }

  const newUser = { name, business, email, password };
  db.users.push(newUser);
  saveDatabase();
  currentUser = newUser;
  localStorage.setItem("invento_session", JSON.stringify(newUser));
  initAppView();
  showToast("Account created successfully!");
});

document.getElementById("forgotForm").addEventListener("submit", function (e) {
  e.preventDefault();
  showToast("Password reset link sent to your email!");
  switchAuthView("loginView");
});

function logout() {
  currentUser = null;
  localStorage.removeItem("invento_session");
  document.getElementById("appSection").classList.add("hidden");
  document.getElementById("authSection").classList.remove("hidden");
}

function navigateTo(viewName) {
  document
    .querySelectorAll(".view-panel")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("active"));

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove("hidden");

  const activeNav = document.querySelector(
    `.nav-item[data-view="${viewName}"]`,
  );
  if (activeNav) activeNav.classList.add("active");

  document.getElementById("pageTitle").textContent = viewName.toUpperCase();

  // Refresh corresponding tab views
  if (viewName === "dashboard") renderDashboard();
  if (viewName === "products") renderProductsTable();
  if (viewName === "categories") renderCategoriesTable();
  if (viewName === "pos") {
    renderPosGrid();
    populatePosCustomers();
  }
  if (viewName === "purchases") renderPurchasesTable();
  if (viewName === "sales") renderSalesTable();
  if (viewName === "suppliers") renderSuppliersTable();
  if (viewName === "customers") renderCustomersTable();
  if (viewName === "inventory") renderInventoryLogs();
  if (viewName === "reports") renderReports();
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("mobileBackdrop");
  sidebar.classList.toggle("open");
  backdrop.classList.toggle("hidden");
}

// Chart.js Instances
let salesChartInstance = null;
let stockChartInstance = null;

function renderDashboard() {
  const curr = db.settings.currency || "Rs.";

  // KPI Calculations
  document.getElementById("statTotalProducts").textContent = db.products.length;
  document.getElementById("statTotalCategories").textContent =
    db.categories.length;

  const totalStock = db.products.reduce((acc, p) => acc + Number(p.stock), 0);
  document.getElementById("statTotalStock").textContent = totalStock;

  const totalVal = db.products.reduce(
    (acc, p) => acc + Number(p.cost) * Number(p.stock),
    0,
  );
  document.getElementById("statTotalValue").textContent =
    `${curr} ${totalVal.toLocaleString()}`;

  const totalSalesVal = db.sales.reduce(
    (acc, s) => acc + Number(s.grandTotal),
    0,
  );
  document.getElementById("statTotalSales").textContent =
    `${curr} ${totalSalesVal.toLocaleString()}`;

  const lowStockCount = db.products.filter(
    (p) => Number(p.stock) <= Number(p.minStock),
  ).length;
  document.getElementById("statLowStock").textContent = lowStockCount;

  // Recent Sales
  const recentTbody = document.getElementById("recentSalesTableBody");
  recentTbody.innerHTML = "";
  const recentSales = [...db.sales].reverse().slice(0, 5);
  recentSales.forEach((s) => {
    recentTbody.innerHTML += `
          <tr>
            <td><strong>#${s.invoiceNo}</strong></td>
            <td>${s.customerName}</td>
            <td>${new Date(s.date).toLocaleDateString()}</td>
            <td>${curr} ${s.grandTotal.toLocaleString()}</td>
            <td><span class="badge badge-success">Completed</span></td>
          </tr>
        `;
  });

  // Render Charts
  initCharts();
}

function initCharts() {
  const ctx1 = document.getElementById("salesPurchaseChart").getContext("2d");
  const ctx2 = document
    .getElementById("stockDistributionChart")
    .getContext("2d");

  if (salesChartInstance) salesChartInstance.destroy();
  if (stockChartInstance) stockChartInstance.destroy();

  salesChartInstance = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Sales",
          data: [12000, 19000, 3000, 5000, 2000, 30000],
          backgroundColor: "#4f46e5",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
    },
  });

  const low = db.products.filter(
    (p) => p.stock <= p.minStock && p.stock > 0,
  ).length;
  const out = db.products.filter((p) => p.stock == 0).length;
  const inStock = db.products.length - low - out;

  stockChartInstance = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [
        {
          data: [inStock, low, out],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
    },
  });
}

function renderProductsTable() {
  const search = document.getElementById("productSearch").value.toLowerCase();
  const catFilter = document.getElementById("productCategoryFilter").value;
  const curr = db.settings.currency || "Rs.";

  const tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = "";

  let filtered = db.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search);
    const matchesCat = catFilter ? p.categoryId === catFilter : true;
    return matchesSearch && matchesCat;
  });

  filtered.forEach((p) => {
    const cat =
      db.categories.find((c) => c.id === p.categoryId)?.name || "Uncategorized";
    let statusBadge = '<span class="badge badge-success">In Stock</span>';
    if (p.stock == 0)
      statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
    else if (p.stock <= p.minStock)
      statusBadge = '<span class="badge badge-warning">Low Stock</span>';

    tbody.innerHTML += `
          <tr>
            <td><code>${p.sku}</code></td>
            <td><strong>${p.name}</strong></td>
            <td>${cat}</td>
            <td>${curr} ${Number(p.cost).toLocaleString()}</td>
            <td>${curr} ${Number(p.price).toLocaleString()}</td>
            <td><strong>${p.stock}</strong></td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Edit<i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Delete<i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
  });
}

function openProductModal(prodId = null) {
  // Populate Category Dropdown
  const select = document.getElementById("prodCategory");
  select.innerHTML = '<option value="">Select Category</option>';
  db.categories.forEach(
    (c) => (select.innerHTML += `<option value="${c.id}">${c.name}</option>`),
  );

  if (prodId) {
    const p = db.products.find((item) => item.id === prodId);
    document.getElementById("productModalTitle").textContent = "Edit Product";
    document.getElementById("prodId").value = p.id;
    document.getElementById("prodSKU").value = p.sku;
    document.getElementById("prodName").value = p.name;
    document.getElementById("prodCategory").value = p.categoryId;
    document.getElementById("prodCost").value = p.cost;
    document.getElementById("prodPrice").value = p.price;
    document.getElementById("prodStock").value = p.stock;
    document.getElementById("prodMinStock").value = p.minStock;
  } else {
    document.getElementById("productModalTitle").textContent =
      "Add New Product";
    document.getElementById("productForm").reset();
    document.getElementById("prodId").value = "";
  }
  openModal("productModal");
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("prodId").value;
  const sku = document.getElementById("prodSKU").value.trim();
  const name = document.getElementById("prodName").value.trim();
  const categoryId = document.getElementById("prodCategory").value;
  const cost = parseFloat(document.getElementById("prodCost").value);
  const price = parseFloat(document.getElementById("prodPrice").value);
  const stock = parseInt(document.getElementById("prodStock").value);
  const minStock = parseInt(document.getElementById("prodMinStock").value);

  if (id) {
    const index = db.products.findIndex((p) => p.id === id);
    db.products[index] = {
      id,
      sku,
      name,
      categoryId,
      cost,
      price,
      stock,
      minStock,
    };
    showToast("Product updated!");
  } else {
    const newProd = {
      id: "prod_" + Date.now(),
      sku,
      name,
      categoryId,
      cost,
      price,
      stock,
      minStock,
    };
    db.products.push(newProd);
    showToast("Product added!");
  }

  saveDatabase();
  closeModal("productModal");
  renderProductsTable();
}

function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    db.products = db.products.filter((p) => p.id !== id);
    saveDatabase();
    renderProductsTable();
    showToast("Product deleted");
  }
}

function editProduct(id) {
  openProductModal(id);
}

// Categories Logic
function renderCategoriesTable() {
  const tbody = document.getElementById("categoriesTableBody");
  tbody.innerHTML = "";
  db.categories.forEach((c) => {
    const prodCount = db.products.filter((p) => p.categoryId === c.id).length;
    tbody.innerHTML += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.description || "-"}</td>
            <td><span class="badge badge-info">${prodCount} Items</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="deleteCategory('${c.id}')">Edit<i class="fa-solid fa-trash"></i></button>

              <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')">Delete<i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
  });
}

function openCategoryModal() {
  document.getElementById("categoryForm").reset();
  openModal("categoryModal");
}

function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById("catName").value.trim();
  const description = document.getElementById("catDesc").value.trim();

  db.categories.push({ id: "cat_" + Date.now(), name, description });
  saveDatabase();
  closeModal("categoryModal");
  renderCategoriesTable();
  showToast("Category created");
}

function deleteCategory(id) {
  const count = db.products.filter((p) => p.categoryId === id).length;
  if (count > 0) {
    showToast("Cannot delete category containing existing products!");
    return;
  }
  if (confirm("Delete this category?")) {
    db.categories = db.categories.filter((c) => c.id !== id);
    saveDatabase();
    renderCategoriesTable();
  }
}

function renderPosGrid() {
  const search = document.getElementById("posSearch").value.toLowerCase();
  const catFilter = document.getElementById("posCategoryFilter").value;
  const curr = db.settings.currency || "Rs.";

  const grid = document.getElementById("posGrid");
  grid.innerHTML = "";

  const items = db.products.filter((p) => {
    const matches =
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search);
    const matchesCat = catFilter ? p.categoryId === catFilter : true;
    return matches && p.stock > 0;
  });

  items.forEach((p) => {
    grid.innerHTML += `
          <div class="pos-card" onclick="addToCart('${p.id}')">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">${p.sku}</span>
              <h4 style="font-size: 0.875rem; font-weight: 600; margin: 0.25rem 0;">${p.name}</h4>
            </div>
            <div class="flex justify-between items-center" style="margin-top: 0.75rem;">
              <strong style="color: var(--accent-primary); font-size: 0.875rem;">${curr} ${p.price}</strong>
              <span class="badge badge-info" style="font-size: 0.6875rem;">Stock: ${p.stock}</span>
            </div>
          </div>
        `;
  });
}

function populatePosCustomers() {
  const select = document.getElementById("posCustomerSelect");
  select.innerHTML = '<option value="walkin">Walk-in Customer</option>';
  db.customers.forEach(
    (c) => (select.innerHTML += `<option value="${c.id}">${c.name}</option>`),
  );
}

function addToCart(prodId) {
  const prod = db.products.find((p) => p.id === prodId);
  const existing = posCart.find((item) => item.id === prodId);

  if (existing) {
    if (existing.qty + 1 > prod.stock) {
      showToast("Cannot exceed available stock limit!");
      return;
    }
    existing.qty += 1;
  } else {
    posCart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      cost: prod.cost,
      qty: 1,
    });
  }
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItemsContainer");
  const curr = db.settings.currency || "Rs.";
  container.innerHTML = "";

  if (posCart.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">Cart is empty</div>`;
    updateCartTotals();
    return;
  }

  posCart.forEach((item, index) => {
    container.innerHTML += `
          <div class="flex items-center justify-between" style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 0.875rem; font-weight: 600;">${item.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${curr} ${item.price} x ${item.qty}</div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-secondary btn-sm" onclick="adjustCartQty(${index}, -1)">-</button>
              <span style="font-size: 0.875rem; font-weight: 600;">${item.qty}</span>
              <button class="btn btn-secondary btn-sm" onclick="adjustCartQty(${index}, 1)">+</button>
            </div>
          </div>
        `;
  });
  updateCartTotals();
}

function adjustCartQty(index, delta) {
  const item = posCart[index];
  const prod = db.products.find((p) => p.id === item.id);

  if (delta > 0 && item.qty + 1 > prod.stock) {
    showToast("Insufficient stock!");
    return;
  }

  item.qty += delta;
  if (item.qty <= 0) posCart.splice(index, 1);
  renderCart();
}

function clearCart() {
  posCart = [];
  renderCart();
}

function updateCartTotals() {
  const curr = db.settings.currency || "Rs.";
  const subtotal = posCart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const discountPct =
    parseFloat(document.getElementById("cartDiscount").value) || 0;
  const grandTotal = subtotal - subtotal * (discountPct / 100);

  document.getElementById("cartSubtotal").textContent =
    `${curr} ${subtotal.toFixed(2)}`;
  document.getElementById("cartGrandTotal").textContent =
    `${curr} ${grandTotal.toFixed(2)}`;
}

function processSale() {
  if (posCart.length === 0) {
    showToast("Cart is empty!");
    return;
  }

  const curr = db.settings.currency || "Rs.";
  const subtotal = posCart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const discountPct =
    parseFloat(document.getElementById("cartDiscount").value) || 0;
  const grandTotal = subtotal - subtotal * (discountPct / 100);
  const custId = document.getElementById("posCustomerSelect").value;
  const customer = db.customers.find((c) => c.id === custId);
  const customerName = customer ? customer.name : "Walk-in Customer";

  const saleRecord = {
    id: "sale_" + Date.now(),
    invoiceNo: Math.floor(100000 + Math.random() * 900000),
    customerName,
    items: [...posCart],
    subtotal,
    discountPct,
    grandTotal,
    date: new Date().toISOString(),
  };

  // Deduct Inventory Stock
  posCart.forEach((cartItem) => {
    const prod = db.products.find((p) => p.id === cartItem.id);
    if (prod) prod.stock -= cartItem.qty;
  });

  db.sales.push(saleRecord);
  saveDatabase();

  // Show Thermal Receipt
  const printArea = document.getElementById("invoicePrintArea");
  printArea.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
          <h3>${db.settings.businessName}</h3>
          <p>Sales Receipt</p>
          <p>Invoice #${saleRecord.invoiceNo}</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        <hr style="margin: 0.5rem 0;">
        ${posCart.map((i) => `<div class="flex justify-between"><span>${i.name} x${i.qty}</span><span>${curr} ${i.price * i.qty}</span></div>`).join("")}
        <hr style="margin: 0.5rem 0;">
        <div class="flex justify-between"><strong>Grand Total:</strong><strong>${curr} ${grandTotal.toFixed(2)}</strong></div>
      `;

  clearCart();
  renderPosGrid();
  openModal("invoiceModal");
  showToast("Sale completed successfully!");
}

function renderPurchasesTable() {
  const tbody = document.getElementById("purchasesTableBody");
  const curr = db.settings.currency || "Rs.";
  tbody.innerHTML = "";

  db.purchases.forEach((p) => {
    tbody.innerHTML += `
          <tr>
            <td><code>#${p.poRef}</code></td>
            <td>${p.supplierName}</td>
            <td>${new Date(p.date).toLocaleDateString()}</td>
            <td>${curr} ${p.totalCost.toLocaleString()}</td>
            <td><span class="badge badge-success">Completed</span></td>
            <td><span class="badge badge-info">Received</span></td>
          </tr>
        `;
  });
}

function openPurchaseModal() {
  const suppSelect = document.getElementById("poSupplier");
  suppSelect.innerHTML = "";
  db.suppliers.forEach(
    (s) =>
      (suppSelect.innerHTML += `<option value="${s.name}">${s.company} (${s.name})</option>`),
  );

  const prodSelect = document.getElementById("poProduct");
  prodSelect.innerHTML = "";
  db.products.forEach(
    (p) =>
      (prodSelect.innerHTML += `<option value="${p.id}">${p.name} (Current Stock: ${p.stock})</option>`),
  );

  document.getElementById("purchaseForm").reset();
  openModal("purchaseModal");
}

function savePurchase(e) {
  e.preventDefault();
  const supplierName = document.getElementById("poSupplier").value;
  const prodId = document.getElementById("poProduct").value;
  const qty = parseInt(document.getElementById("poQty").value);
  const cost = parseFloat(document.getElementById("poCost").value);

  const prod = db.products.find((p) => p.id === prodId);
  if (prod) prod.stock += qty;

  db.purchases.push({
    id: "po_" + Date.now(),
    poRef: Math.floor(100000 + Math.random() * 900000),
    supplierName,
    totalCost: qty * cost,
    date: new Date().toISOString(),
  });

  saveDatabase();
  closeModal("purchaseModal");
  renderPurchasesTable();
  showToast("Stock received & Purchase Order saved!");
}

function renderSuppliersTable() {
  const tbody = document.getElementById("suppliersTableBody");
  tbody.innerHTML = "";
  db.suppliers.forEach((s) => {
    tbody.innerHTML += `
          <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.company}</td>
            <td>${s.email || "-"}</td>
            <td>${s.phone}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteSupplier('${s.id}')"><i class="fa-solid fa-trash"></i></button></td>
          </tr>
        `;
  });
}

function openSupplierModal() {
  document.getElementById("supplierForm").reset();
  openModal("supplierModal");
}

function saveSupplier(e) {
  e.preventDefault();
  db.suppliers.push({
    id: "supp_" + Date.now(),
    name: document.getElementById("suppName").value,
    company: document.getElementById("suppCompany").value,
    email: document.getElementById("suppEmail").value,
    phone: document.getElementById("suppPhone").value,
  });
  saveDatabase();
  closeModal("supplierModal");
  renderSuppliersTable();
}

function deleteSupplier(id) {
  if (confirm("Delete supplier?")) {
    db.suppliers = db.suppliers.filter((s) => s.id !== id);
    saveDatabase();
    renderSuppliersTable();
  }
}

function renderCustomersTable() {
  const tbody = document.getElementById("customersTableBody");
  const curr = db.settings.currency || "Rs.";
  tbody.innerHTML = "";
  db.customers.forEach((c) => {
    tbody.innerHTML += `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.email || "-"}</td>
            <td>${c.phone}</td>
            <td>${curr} ${(c.spent || 0).toLocaleString()}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')"><i class="fa-solid fa-trash"></i></button></td>
          </tr>
        `;
  });
}

function openCustomerModal() {
  document.getElementById("customerForm").reset();
  openModal("customerModal");
}

function saveCustomer(e) {
  e.preventDefault();
  db.customers.push({
    id: "cust_" + Date.now(),
    name: document.getElementById("custName").value,
    email: document.getElementById("custEmail").value,
    phone: document.getElementById("custPhone").value,
    spent: 0,
  });
  saveDatabase();
  closeModal("customerModal");
  renderCustomersTable();
}

function deleteCustomer(id) {
  if (confirm("Delete customer?")) {
    db.customers = db.customers.filter((c) => c.id !== id);
    saveDatabase();
    renderCustomersTable();
  }
}

/* Stock Adjustments */
function renderInventoryLogs() {
  const tbody = document.getElementById("inventoryLogTableBody");
  tbody.innerHTML = "";
  db.inventoryLogs.forEach((log) => {
    const badge =
      log.type === "IN"
        ? '<span class="badge badge-success">IN (+)</span>'
        : '<span class="badge badge-danger">OUT (-)</span>';
    tbody.innerHTML += `
          <tr>
            <td>${new Date(log.date).toLocaleString()}</td>
            <td><strong>${log.productName}</strong></td>
            <td>${badge}</td>
            <td>${log.qty}</td>
            <td>${log.reason}</td>
          </tr>
        `;
  });
}

function openStockAdjustModal() {
  const select = document.getElementById("adjProduct");
  select.innerHTML = "";
  db.products.forEach(
    (p) => (select.innerHTML += `<option value="${p.id}">${p.name}</option>`),
  );
  document.getElementById("stockAdjustForm").reset();
  openModal("stockAdjustModal");
}

function saveStockAdjustment(e) {
  e.preventDefault();
  const prodId = document.getElementById("adjProduct").value;
  const type = document.getElementById("adjType").value;
  const qty = parseInt(document.getElementById("adjQty").value);
  const reason = document.getElementById("adjReason").value;

  const prod = db.products.find((p) => p.id === prodId);
  if (prod) {
    if (type === "IN") prod.stock += qty;
    else prod.stock = Math.max(0, prod.stock - qty);

    db.inventoryLogs.unshift({
      date: new Date().toISOString(),
      productName: prod.name,
      type,
      qty,
      reason,
    });
  }

  saveDatabase();
  closeModal("stockAdjustModal");
  renderInventoryLogs();
  showToast("Stock audit log updated!");
}

function renderSalesTable() {
  const tbody = document.getElementById("salesTableBody");
  const curr = db.settings.currency || "Rs.";
  tbody.innerHTML = "";
  db.sales.forEach((s) => {
    tbody.innerHTML += `
          <tr>
            <td><code>#${s.invoiceNo}</code></td>
            <td>${s.customerName}</td>
            <td>${new Date(s.date).toLocaleDateString()}</td>
            <td>${curr} ${s.subtotal.toLocaleString()}</td>
            <td>${s.discountPct}%</td>
            <td><strong>${curr} ${s.grandTotal.toLocaleString()}</strong></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="reprintInvoice('${s.id}')"><i class="fa-solid fa-print"></i> Receipt</button>
            </td>
          </tr>
        `;
  });
}

function reprintInvoice(saleId) {
  const sale = db.sales.find((s) => s.id === saleId);
  const curr = db.settings.currency || "Rs.";
  const printArea = document.getElementById("invoicePrintArea");

  printArea.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
          <h3>${db.settings.businessName}</h3>
          <p>Sales Receipt</p>
          <p>Invoice #${sale.invoiceNo}</p>
          <p>${new Date(sale.date).toLocaleString()}</p>
        </div>
        <hr style="margin: 0.5rem 0;">
        ${sale.items.map((i) => `<div class="flex justify-between"><span>${i.name} x${i.qty}</span><span>${curr} ${i.price * i.qty}</span></div>`).join("")}
        <hr style="margin: 0.5rem 0;">
        <div class="flex justify-between"><strong>Grand Total:</strong><strong>${curr} ${sale.grandTotal.toFixed(2)}</strong></div>
      `;
  openModal("invoiceModal");
}

function renderReports() {
  const curr = db.settings.currency || "Rs.";
  const revenue = db.sales.reduce((acc, s) => acc + s.grandTotal, 0);

  let cogs = 0;
  db.sales.forEach((s) => {
    s.items.forEach((item) => {
      cogs += Number(item.cost || 0) * Number(item.qty);
    });
  });

  const grossProfit = revenue - cogs;

  document.getElementById("reportRevenue").textContent =
    `${curr} ${revenue.toLocaleString()}`;
  document.getElementById("reportCOGS").textContent =
    `${curr} ${cogs.toLocaleString()}`;
  document.getElementById("reportGrossProfit").textContent =
    `${curr} ${grossProfit.toLocaleString()}`;
}

function exportReportCSV() {
  let csv = "Invoice,Customer,Date,Grand Total\n";
  db.sales.forEach((s) => {
    csv += `${s.invoiceNo},${s.customerName},${new Date(s.date).toLocaleDateString()},${s.grandTotal}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Invento_Pro_Sales_Report.csv";
  a.click();
}

// Settings logic
document
  .getElementById("settingsForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    db.settings.businessName = document.getElementById(
      "settingBusinessName",
    ).value;
    db.settings.currency = document.getElementById("settingCurrency").value;
    saveDatabase();
    showToast("Settings saved successfully!");
  });

function exportDatabaseJSON() {
  const blob = new Blob([JSON.stringify(db, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invento_pro_backup.json";
  a.click();
}

function resetDemoData() {
  if (
    confirm(
      "Are you sure you want to reset all data back to factory demo state?",
    )
  ) {
    db = JSON.parse(JSON.stringify(defaultDemoData));
    saveDatabase();
    location.reload();
  }
}

function initAppView() {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("appSection").classList.remove("hidden");

  document.getElementById("userNameDisplay").textContent = currentUser.name;
  document.getElementById("userBusinessDisplay").textContent =
    currentUser.business;
  document.getElementById("userAvatar").textContent = currentUser.name
    .charAt(0)
    .toUpperCase();

  document.getElementById("settingBusinessName").value =
    db.settings.businessName || currentUser.business;
  document.getElementById("settingCurrency").value =
    db.settings.currency || "Rs.";

  navigateTo("dashboard");
}

window.onload = function () {
  loadDatabase();

  // Check Saved Theme
  const savedTheme = localStorage.getItem("invento_theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  document.getElementById("themeIcon").className =
    savedTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";

  // Check Active Auth Session
  const savedSession = localStorage.getItem("invento_session");
  if (savedSession) {
    currentUser = JSON.parse(savedSession);
    initAppView();
  }
};
