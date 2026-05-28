async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-products">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <p>Loading premium products...</p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Supabase error:", error.message);
    container.innerHTML = "<p>Unable to load products.</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach(product => {
    container.innerHTML += `
      <div class="product-card premium-card">
        <div class="product-image-wrap">
          <img src="${product.image_url}" alt="${product.name}">
          <span class="product-badge">${product.category || "Premium"}</span>
          <button class="wishlist-btn">
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

async function addToCartFromSupabase(id) {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find(item => item.id === data.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: data.id,
      name: data.name,
      price: Number(data.price),
      image: data.image_url,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
  }

  alert("Product added to cart");
}

loadFeaturedProducts();