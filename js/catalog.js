let allCatalogProducts = [];
let activeCategory = "all";
let searchKeyword = "";
let sortType = "default";

async function loadCatalogProducts() {
  const productGrid = document.getElementById("productGrid");
  const productCount = document.getElementById("productCount");

  if (!productGrid) return;

  productGrid.innerHTML = `
    <div class="loading-products">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Loading premium catalog...</p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    productGrid.innerHTML = "<p>Unable to load products.</p>";
    console.error("Supabase error:", error.message);
    return;
  }

  allCatalogProducts = data || [];
  renderCatalogProducts();
}

function renderCatalogProducts() {
  const productGrid = document.getElementById("productGrid");
  const productCount = document.getElementById("productCount");

  let products = [...allCatalogProducts];

  if (activeCategory !== "all") {
    products = products.filter(product => product.category === activeCategory);
  }

  if (searchKeyword) {
    products = products.filter(product =>
      product.name.toLowerCase().includes(searchKeyword) ||
      (product.description || "").toLowerCase().includes(searchKeyword) ||
      (product.category || "").toLowerCase().includes(searchKeyword)
    );
  }

  if (sortType === "low") {
    products.sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sortType === "high") {
    products.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (sortType === "name") {
    products.sort((a, b) => a.name.localeCompare(b.name));
  }

  productCount.textContent = `${products.length} products found`;
  productGrid.innerHTML = "";

  if (products.length === 0) {
    productGrid.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach(product => {
    productGrid.innerHTML += `
      <div class="product-card premium-card">
        <div class="product-image-wrap" onclick="openProductModal(${product.id})">
          <img src="${product.image_url}" alt="${product.name}">
          <span class="product-badge">${product.category || "Premium"}</span>
          <button class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist(${product.id})">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>

        <div class="product-info">
          <div class="rating">
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star-half-stroke"></i>
            <span>4.8</span>
          </div>

          <h3>${product.name}</h3>
          <p>${product.description || ""}</p>

          <div class="product-bottom">
            <strong>$${product.price}</strong>
            <button class="cart-btn-small" onclick="addToCartFromSupabase(${product.id})">
              <i class="fa-solid fa-cart-plus"></i>
              Add
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

function openProductModal(id) {
  const product = allCatalogProducts.find(item => item.id === id);

  if (!product) return;

  const modal = document.getElementById("productModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <div class="modal-product">
      <img src="${product.image_url}" alt="${product.name}">

      <div>
        <span class="product-badge">
          ${product.category || "Premium"}
        </span>

        <div class="rating" style="margin-top:20px;">
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star-half-stroke"></i>
          <span>4.8 Rating</span>
        </div>

        <h2>${product.name}</h2>

        <p>
          ${product.description || ""}
        </p>

        <h3>$${product.price}</h3>

        <p><strong>Stock:</strong> ${product.stock || 0}</p>

        <button 
          class="cart-btn-small"
          onclick="addToCartFromSupabase(${product.id})"
        >
          <i class="fa-solid fa-cart-plus"></i>
          Add To Cart
        </button>
      </div>
    </div>
  `;

  modal.classList.add("open");
}

function toggleWishlist(id) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(item => item !== id);
  } else {
    wishlist.push(id);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  alert("Wishlist updated");
}

document.addEventListener("DOMContentLoaded", () => {
  loadCatalogProducts();

  document.getElementById("searchInput").addEventListener("input", event => {
    searchKeyword = event.target.value.toLowerCase();
    renderCatalogProducts();
  });

  document.getElementById("sortSelect").addEventListener("change", event => {
    sortType = event.target.value;
    renderCatalogProducts();
  });

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      activeCategory = button.dataset.category;
      renderCatalogProducts();
    });
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("open");
  });

  document.getElementById("productModal").addEventListener("click", event => {
    if (event.target.id === "productModal") {
      document.getElementById("productModal").classList.remove("open");
    }
  });
});