const products = [
  {
    id: 1,
    name: "Smart Watch",
    category: "tech",
    price: 99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
  },
  {
    id: 2,
    name: "Wireless Headphones",
    category: "tech",
    price: 149,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
  },
  {
    id: 3,
    name: "Luxury Jacket",
    category: "fashion",
    price: 120,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
  },
  {
    id: 4,
    name: "Modern Chair",
    category: "home",
    price: 85,
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c"
  }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderProducts(list) {
  $("#products").html("");

  list.forEach(product => {
    $("#products").append(`
      <div class="product-card">
        <img src="${product.image}?auto=format&fit=crop&w=600&q=80" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.category}</p>
          <div class="price">$${product.price}</div>
          <button class="add-cart" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    `);
  });
}

function updateCart() {
  $("#cartItems").html("");

  let total = 0;
  let count = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
    count += item.qty;

    $("#cartItems").append(`
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <p>$${item.price} x ${item.qty}</p>
        </div>
        <div>
          <button class="decrease" data-id="${item.id}">-</button>
          <button class="increase" data-id="${item.id}">+</button>
          <button class="remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    `);
  });

  $("#cartTotal").text(total);
  $("#cartCount").text(count);

  saveCart();
}

$(document).ready(function () {
  renderProducts(products);
  updateCart();

  $(".filter").click(function () {
    $(".filter").removeClass("active");
    $(this).addClass("active");

    const category = $(this).data("category");

    if (category === "all") {
      renderProducts(products);
    } else {
      renderProducts(products.filter(p => p.category === category));
    }
  });

  $("#searchInput").on("input", function () {
    const keyword = $(this).val().toLowerCase();

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(keyword)
    );

    renderProducts(filtered);
  });

  $(document).on("click", ".add-cart", function () {
    const id = Number($(this).data("id"));
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
      existing.qty++;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    updateCart();
    $("#cartDrawer").addClass("open");
    $("#overlay").addClass("show");
  });

  $(document).on("click", ".increase", function () {
    const id = Number($(this).data("id"));
    cart.find(item => item.id === id).qty++;
    updateCart();
  });

  $(document).on("click", ".decrease", function () {
    const id = Number($(this).data("id"));
    const item = cart.find(item => item.id === id);

    item.qty--;

    if (item.qty <= 0) {
      cart = cart.filter(product => product.id !== id);
    }

    updateCart();
  });

  $(document).on("click", ".remove", function () {
    const id = Number($(this).data("id"));
    cart = cart.filter(item => item.id !== id);
    updateCart();
  });

  $("#cartBtn").click(function () {
    $("#cartDrawer").addClass("open");
    $("#overlay").addClass("show");
  });

  $("#closeCart, #overlay").click(function () {
    $("#cartDrawer").removeClass("open");
    $("#overlay").removeClass("show");
  });

  $("#checkoutBtn").click(function () {
    alert("Redirecting to checkout...");

    // Replace this with Stripe, PayPal, or Shopify checkout link
    window.location.href = "https://buy.stripe.com/YOUR_PAYMENT_LINK";
  });
});