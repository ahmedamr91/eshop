
const TAX_RATE = 0.14;
const PAYMENT_LINK = "https://buy.stripe.com/YOUR_PAYMENT_LINK";
const ADMIN_EMAILS = ["asharkawe91@gmail.com"];

function money(value) {
  return `${Number(value || 0).toLocaleString("en-EG")} EGP`;
}

function getCart() {
  const raw = JSON.parse(localStorage.getItem("cart")) || [];
  return raw.map(item => ({
    id: Number(item.id),
    name: item.name || "Product",
    price: Number(item.price || 0),
    image: item.image || item.image_url || "",
    quantity: Number(item.quantity || item.qty || 1)
  }));
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cartCount").forEach(el => el.textContent = count);
}

async function updateAuthUI() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtnGlobal");
  const adminNav = document.getElementById("adminNavLink");

  if (user) {
    loginLink?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");

    if (ADMIN_EMAILS.includes(user.email)) {
      adminNav?.classList.remove("hidden");
    }
  } else {
    loginLink?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    adminNav?.classList.add("hidden");
  }
}

async function fetchProducts({ featuredOnly = false } = {}) {
  let query = supabaseClient.from("products").select("*").order("created_at", { ascending: false });
  if (featuredOnly) query = query.eq("featured", true).limit(12);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function productCard(product) {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const liked = wishlist.includes(Number(product.id));

  return `
    <article class="product-card">
      <div class="product-image-wrap" onclick="openProductModal(${product.id})">
        <img src="${product.image_url}" alt="${product.name}">
        <span class="product-badge">${product.category || "Premium"}</span>
        <button class="wishlist-btn ${liked ? "active" : ""}" onclick="event.stopPropagation(); toggleWishlist(${product.id})">
          <i class="${liked ? "fa-solid" : "fa-regular"} fa-heart"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="rating">
          <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
          <span>4.8</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description || ""}</p>
        <div class="product-bottom">
          <strong>${money(product.price)}</strong>
          <button class="cart-btn-small" onclick="addToCart(${product.id})">
            <i class="fa-solid fa-cart-plus"></i>
            Add
          </button>
        </div>
      </div>
    </article>
  `;
}

let catalogProducts = [];

async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  container.innerHTML = `<div class="loading-products"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading featured products...</p></div>`;

  try {
    const products = await fetchProducts({ featuredOnly: true });
    catalogProducts = products;
    container.innerHTML = products.length ? products.map(productCard).join("") : "<p>No featured products found.</p>";
  } catch (error) {
    container.innerHTML = "<p>Unable to load products.</p>";
    console.error(error.message);
  }
}

async function loadCatalogProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = `<div class="loading-products"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading premium catalog...</p></div>`;

  try {
    catalogProducts = await fetchProducts();
    applyCatalogFilters();
    setTimeout(applyCategoryFromUrl, 100);
  } catch (error) {
    grid.innerHTML = "<p>Unable to load products.</p>";
    console.error(error.message);
  }
}

function applyCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  if (!category) return;

  const button = document.querySelector(`.filter[data-category="${category}"]`);
  if (button) button.click();
}

function applyCatalogFilters() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const sort = document.getElementById("sortSelect")?.value || "default";
  const activeCategory = document.querySelector(".filter.active")?.dataset.category || "all";

  let products = [...catalogProducts];

  if (activeCategory !== "all") products = products.filter(product => product.category === activeCategory);

  if (search) {
    products = products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      (product.description || "").toLowerCase().includes(search) ||
      (product.category || "").toLowerCase().includes(search)
    );
  }

  if (sort === "low") products.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "high") products.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name));

  const count = document.getElementById("productCount");
  if (count) count.textContent = `${products.length} products found`;

  grid.innerHTML = products.length ? products.map(productCard).join("") : "<p>No products found.</p>";
}

async function addToCart(id) {
  let product = catalogProducts.find(item => Number(item.id) === Number(id));

  if (!product) {
    const { data, error } = await supabaseClient.from("products").select("*").eq("id", id).single();
    if (error) return alert(error.message);
    product = data;
  }

  const cart = getCart();
  const existing = cart.find(item => Number(item.id) === Number(id));

  if (existing) existing.quantity += 1;
  else cart.push({ id: Number(product.id), name: product.name, price: Number(product.price), image: product.image_url, quantity: 1 });

  saveCart(cart);
  updateCartCount();
  alert("Product added to cart");
}

function toggleWishlist(id) {
  id = Number(id);
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  wishlist = wishlist.includes(id) ? wishlist.filter(item => item !== id) : [...wishlist, id];

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  applyCatalogFilters();
}

async function openProductModal(id) {
  let product = catalogProducts.find(item => Number(item.id) === Number(id));

  if (!product) {
    const { data, error } = await supabaseClient.from("products").select("*").eq("id", id).single();
    if (error) return alert(error.message);
    product = data;
  }

  const modal = document.getElementById("productModal");
  const modalBody = document.getElementById("modalBody");
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <div class="modal-product">
      <img src="${product.image_url}" alt="${product.name}">
      <div>
        <span class="badge">${product.category || "Premium"}</span>
        <div class="rating" style="margin-top:20px;">
          <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
          <span>4.8 Rating</span>
        </div>
        <h2>${product.name}</h2>
        <p>${product.description || ""}</p>
        <h3>${money(product.price)}</h3>
        <p><strong>Stock:</strong> ${product.stock || 0}</p>
        <button class="cart-btn-small" onclick="addToCart(${product.id})">
          <i class="fa-solid fa-cart-plus"></i>
          Add To Cart
        </button>
      </div>
    </div>
  `;

  modal.classList.add("open");
}

function renderCartPage() {
  const container = document.getElementById("cartItems");
  if (!container) return;

  const cart = getCart();
  saveCart(cart);
  container.innerHTML = "";

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add products from the catalog to start checkout.</p>
        <a href="products.html" class="btn primary">Shop Products</a>
      </div>
    `;
  }

  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    container.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-info">
          <h3>${item.name}</h3>
          <p>${money(item.price)} each</p>
        </div>
        <div class="cart-controls">
          <button onclick="changeQuantity(${item.id}, -1)">-</button>
          <strong>${item.quantity}</strong>
          <button onclick="changeQuantity(${item.id}, 1)">+</button>
          <button onclick="removeItem(${item.id})">Remove</button>
        </div>
      </div>
    `;
  });

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");

  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (taxEl) taxEl.textContent = money(tax);
  if (totalEl) totalEl.textContent = money(total);

  updateCartCount();
}

function changeQuantity(id, amount) {
  let cart = getCart();
  const item = cart.find(product => Number(product.id) === Number(id));
  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) cart = cart.filter(product => Number(product.id) !== Number(id));

  saveCart(cart);
  renderCartPage();
}

function removeItem(id) {
  let cart = getCart().filter(product => Number(product.id) !== Number(id));
  saveCart(cart);
  renderCartPage();
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const msg = document.getElementById("authMessage");

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Login successful.";

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  if (ADMIN_EMAILS.includes(data.user.email) || redirect === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "products.html";
  }
}

async function handleSignup(event) {
  event.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const msg = document.getElementById("authMessage");

  const { error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Account created. Check your email if confirmation is enabled.";
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

async function checkAdminAccess() {
  const adminBox = document.getElementById("adminBox");
  const denied = document.getElementById("adminDenied");
  if (!adminBox || !denied) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    adminBox.classList.add("hidden");
    denied.classList.remove("hidden");
    return;
  }

  denied.classList.add("hidden");
  adminBox.classList.remove("hidden");
  loadAdminProducts();
}

function resetProductForm() {
  document.getElementById("productId").value = "";
  document.getElementById("formTitle").textContent = "Add Product";
  document.getElementById("productForm").reset();
}

async function saveAdminProduct(event) {
  event.preventDefault();

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email)) return alert("Access denied.");

  const id = document.getElementById("productId").value;

  const product = {
    name: document.getElementById("name").value.trim(),
    description: document.getElementById("description").value.trim(),
    price: Number(document.getElementById("price").value),
    category: document.getElementById("category").value,
    image_url: document.getElementById("image_url").value.trim(),
    stock: Number(document.getElementById("stock").value),
    featured: document.getElementById("featured").checked
  };

  const result = id
    ? await supabaseClient.from("products").update(product).eq("id", id)
    : await supabaseClient.from("products").insert([product]);

  const msg = document.getElementById("adminMessage");

  if (result.error) {
    msg.textContent = result.error.message;
    return;
  }

  msg.textContent = id ? "Product updated successfully." : "Product added successfully.";
  resetProductForm();
  loadAdminProducts();
}

async function loadAdminProducts() {
  const container = document.getElementById("adminProducts");
  if (!container) return;

  container.innerHTML = "Loading products...";

  const { data, error } = await supabaseClient.from("products").select("*").order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = error.message;
    return;
  }

  container.innerHTML = (data || []).map(product => `
    <div class="admin-product">
      <img src="${product.image_url}" alt="${product.name}">
      <div>
        <strong>${product.name}</strong>
        <p>${money(product.price)} | ${product.category} | Stock: ${product.stock || 0} | ${product.featured ? "Featured" : "Not featured"}</p>
      </div>
      <div class="admin-actions">
        <button class="edit-btn" onclick='editAdminProduct(${JSON.stringify(product).replace(/'/g, "&apos;")})'>Edit</button>
        <button class="delete-btn" onclick="deleteAdminProduct(${product.id})">Delete</button>
      </div>
    </div>
  `).join("");
}

function editAdminProduct(product) {
  document.getElementById("productId").value = product.id;
  document.getElementById("formTitle").textContent = "Edit Product";
  document.getElementById("name").value = product.name || "";
  document.getElementById("description").value = product.description || "";
  document.getElementById("price").value = product.price || 0;
  document.getElementById("category").value = product.category || "tech";
  document.getElementById("image_url").value = product.image_url || "";
  document.getElementById("stock").value = product.stock || 0;
  document.getElementById("featured").checked = Boolean(product.featured);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteAdminProduct(id) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email)) return alert("Access denied.");

  if (!confirm("Delete this product?")) return;

  const { error } = await supabaseClient.from("products").delete().eq("id", id);

  if (error) return alert(error.message);

  loadAdminProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  document.getElementById("menuBtn")?.addEventListener("click", () => {
    document.getElementById("navMenu")?.classList.toggle("open");
  });

  document.getElementById("logoutBtnGlobal")?.addEventListener("click", logout);

  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.authTab;
      document.getElementById("loginForm")?.classList.toggle("hidden", target !== "login");
      document.getElementById("signupForm")?.classList.toggle("hidden", target !== "signup");
    });
  });

  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("signupForm")?.addEventListener("submit", handleSignup);

  document.getElementById("searchInput")?.addEventListener("input", applyCatalogFilters);
  document.getElementById("sortSelect")?.addEventListener("change", applyCatalogFilters);

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      applyCatalogFilters();
    });
  });

  document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("productModal")?.classList.remove("open");
  });

  document.getElementById("productModal")?.addEventListener("click", event => {
    if (event.target.id === "productModal") event.currentTarget.classList.remove("open");
  });

  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    if (!getCart().length) return alert("Your cart is empty.");
    alert("Redirecting to checkout...");
    window.location.href = PAYMENT_LINK;
  });

  document.getElementById("resetFormBtn")?.addEventListener("click", resetProductForm);
  document.getElementById("productForm")?.addEventListener("submit", saveAdminProduct);

  updateCartCount();
  updateAuthUI();
  loadFeaturedProducts();
  loadCatalogProducts();
  renderCartPage();
  checkAdminAccess();
});
