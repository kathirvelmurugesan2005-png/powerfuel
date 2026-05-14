const PowerFuel = (() => {
  const PRODUCTS = {
    p1: { name: "Whey Protein",   price: 2499 },
    p2: { name: "Mass Gainer",    price: 1999 },
    p3: { name: "Creatine",       price: 1499 },
    p4: { name: "Fish Oil",       price:  999 },
    p5: { name: "Munthiri",       price: 1299 },
    p6: { name: "Badam",          price: 1399 },
    p7: { name: "Oats",           price:  499 },
    p8: { name: "Peanut Butter",  price:  299 },
    p9: { name: "Dates",          price:  359 },
  };
  let cart = {};  

  const formatINR = n => "₹" + n.toLocaleString("en-IN");

  function saveCart() {
    try { localStorage.setItem("pf_cart", JSON.stringify(cart)); } catch (_) {}
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem("pf_cart");
      if (raw) cart = JSON.parse(raw);
    } catch (_) { cart = {}; }
    syncCheckboxes();
    renderCart();
  }

  function syncCheckboxes() {
    Object.keys(PRODUCTS).forEach(id => {
      const cb = document.getElementById(id);
      if (cb) cb.checked = !!cart[id];
    });
  }

  function addItem(productId) {
    if (!PRODUCTS[productId]) return;
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart();
    renderCart();
    showToast(`${PRODUCTS[productId].name} added to cart ✓`);
  }

  function removeItem(productId) {
    delete cart[productId];
    saveCart();
    renderCart();
    const cb = document.getElementById(productId);
    if (cb) cb.checked = false;
  }

  function updateQty(productId, delta) {
    if (!cart[productId]) return;
    cart[productId] = Math.max(1, cart[productId] + delta);
    saveCart();
    renderCart();
  }

  function clearCart() {
    cart = {};
    saveCart();
    syncCheckboxes();
    renderCart();
  }

  function renderCart() {
    const wrap = document.getElementById("cart-items-dynamic");
    const totalEl = document.getElementById("cart-total");
    const countBadge = document.getElementById("cart-badge");
    if (!wrap) return;

    let html = "";
    let total = 0;
    let count = 0;

    Object.entries(cart).forEach(([id, qty]) => {
      const p = PRODUCTS[id];
      if (!p) return;
      const sub = p.price * qty;
      total += sub;
      count += qty;
      html += `
        <div class="dyn-cart-item" id="dci-${id}">
          <div class="dci-name">${p.name}</div>
          <div class="dci-controls">
            <button class="qty-btn" onclick="PowerFuel.updateQty('${id}',-1)">−</button>
            <span class="qty-val">${qty}</span>
            <button class="qty-btn" onclick="PowerFuel.updateQty('${id}',1)">+</button>
          </div>
          <div class="dci-price">${formatINR(sub)}</div>
          <button class="remove-btn" onclick="PowerFuel.removeItem('${id}')">✕</button>
        </div>`;
    });

    if (!html) {
      html = `<div class="empty-cart">
                <span style="font-size:3rem">🛒</span>
                <p>Your cart is empty</p>
              </div>`;
    }

    wrap.innerHTML = html;
    if (totalEl) totalEl.textContent = formatINR(total);
    if (countBadge) {
      countBadge.textContent = count;
      countBadge.style.display = count ? "inline-block" : "none";
    }
  }

  function showToast(msg) {
    let t = document.getElementById("pf-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "pf-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove("show"), 2500);
  }

  function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById("login-user")?.value.trim();
    const pass = document.getElementById("login-pass")?.value.trim();

    if (!user || !pass) {
      showToast("Please enter username and password.");
      return;
    }

    fetch("login.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`,
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          document.getElementById("nav-username").textContent = data.username;
          document.getElementById("auth-status").style.display = "block";
          document.getElementById("login-form-wrap").style.display = "none";
          showToast(`Welcome back, ${data.username}! 💪`);
          document.getElementById("home-tab").checked = true;
        } else {
          showToast(data.message || "Invalid credentials.");
        }
      })
      .catch(() => showToast("Server error. Please try again."));
  }

  function handleCheckout() {
    if (!Object.keys(cart).length) {
      showToast("Add items to cart first!");
      return;
    }

    const items = Object.entries(cart).map(([id, qty]) => ({
      product_id: id.replace("p", ""),
      qty,
      price: PRODUCTS[id].price,
    }));

    fetch("order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast(`Order #${data.order_id} placed! 🎉`);
          clearCart();
        } else {
          showToast(data.message || "Checkout failed.");
        }
      })
      .catch(() => showToast("Server error. Please try again."));
  }

  function filterProducts(query) {
    const q = query.toLowerCase();
    document.querySelectorAll(".card[class*=' p']").forEach(card => {
      const name = card.querySelector("h3")?.textContent.toLowerCase() || "";
      card.style.display = name.includes(q) ? "" : "none";
    });
  }

  function togglePasswordVisibility(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.type = inp.type === "password" ? "text" : "password";
    btn.textContent = inp.type === "password" ? "👁" : "🙈";
  }

  function init() {
    loadCart();

    Object.keys(PRODUCTS).forEach(id => {
      const cb = document.getElementById(id);
      if (!cb) return;
      cb.addEventListener("change", () => {
        if (cb.checked) addItem(id);
        else removeItem(id);
      });
    });

    const loginBtn = document.getElementById("login-submit-btn");
    if (loginBtn) loginBtn.addEventListener("click", handleLogin);

    const coBtn = document.getElementById("checkout-btn");
    if (coBtn) coBtn.addEventListener("click", handleCheckout);

    const searchInp = document.getElementById("product-search");
    if (searchInp) searchInp.addEventListener("input", e => filterProducts(e.target.value));

    const pwToggle = document.getElementById("pw-toggle");
    if (pwToggle) pwToggle.addEventListener("click", () =>
      togglePasswordVisibility("login-pass", pwToggle));
  }

  document.addEventListener("DOMContentLoaded", init);

  return { addItem, removeItem, updateQty, clearCart, handleCheckout, showToast };

})();
