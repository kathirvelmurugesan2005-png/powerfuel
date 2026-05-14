

$(function () {

  function animateCounter($el, target, duration) {
    $({ n: 0 }).animate({ n: target }, {
      duration,
      step(now) { $el.text(Math.floor(now).toLocaleString("en-IN")); },
      complete() { $el.text(target.toLocaleString("en-IN")); },
    });
  }

  $("input[name='tab']").on("change", function () {
    if (this.id === "home-tab") {
      animateCounter($("#stat-products"), 9,    800);
      animateCounter($("#stat-customers"), 12000, 1400);
      animateCounter($("#stat-orders"),   34500, 1600);
    }
    if (this.id === "cart-tab") {
      highlightCartItems();
    }
  });

  $(document).on("mousemove", ".card", function (e) {
    const $c  = $(this);
    const off = $c.offset();
    const x   = ((e.pageX - off.left) / $c.width()  - 0.5) * 14;
    const y   = ((e.pageY - off.top)  / $c.height() - 0.5) * -14;
    $c.css("transform", `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-6px)`);
  }).on("mouseleave", ".card", function () {
    $(this).css("transform", "");
  });
  function highlightCartItems() {
    $(".dyn-cart-item").each(function (i) {
      const $el = $(this);
      $el.css({ opacity: 0, transform: "translateX(-20px)" });
      setTimeout(() => {
        $el.animate({ opacity: 1 }, 300);
        $el.css("transform", "translateX(0)");
      }, i * 80);
    });
  }
  $("nav label").on("click", function () {
    $("html, body").animate({ scrollTop: 0 }, 300);
  });

  
  window.PF_jqLogin = function () {
    const user = $("#login-user").val().trim();
    const pass = $("#login-pass").val().trim();

    if (!user || !pass) {
      PF_showAlert("warning", "Please fill in all fields.");
      return;
    }

    $("#login-submit-btn")
      .prop("disabled", true)
      .text("Logging in…");

    $.ajax({
      url: "login.php",
      method: "POST",
      data: { username: user, password: pass },
      dataType: "json",
    })
      .done(function (data) {
        if (data.success) {
          PF_showAlert("success", `Welcome, ${data.username}! 💪`);
          $("#nav-username").text(data.username);
          $("#auth-status").show();
          $("#login-form-wrap").hide();
          setTimeout(() => $("#home-tab").prop("checked", true).trigger("change"), 800);
        } else {
          PF_showAlert("error", data.message || "Invalid credentials.");
        }
      })
      .fail(function () {
        PF_showAlert("error", "Could not reach the server.");
      })
      .always(function () {
        $("#login-submit-btn").prop("disabled", false).text("Login");
      });
  };

  
  window.PF_jqCheckout = function (cartData) {
    if (!cartData || !cartData.length) {
      PF_showAlert("warning", "Your cart is empty!");
      return;
    }

    $("#checkout-btn").prop("disabled", true).text("Processing…");

    $.ajax({
      url: "order.php",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ items: cartData }),
      dataType: "json",
    })
      .done(function (data) {
        if (data.success) {
          PF_showAlert("success", `Order #${data.order_id} confirmed! 🎉`);
          PowerFuel.clearCart();
        
          triggerConfetti();
        } else {
          PF_showAlert("error", data.message || "Order failed.");
        }
      })
      .fail(function () {
        PF_showAlert("error", "Server error. Please try again.");
      })
      .always(function () {
        $("#checkout-btn").prop("disabled", false).text("Checkout");
      });
  };

  
  $(document).on("click", ".card h3", function () {
    const $card = $(this).closest(".card");
    const classMatch = $card.attr("class").match(/\bp(\d+)\b/);
    if (!classMatch) return;
    const pid = classMatch[1];

    $.getJSON(`product.php?id=${pid}`, function (data) {
      if (!data.product) return;
      const p = data.product;
      $("#modal-name").text(p.name);
      $("#modal-price").text("₹" + Number(p.price).toLocaleString("en-IN"));
      $("#modal-desc").text(p.description || "No description available.");
      $("#modal-stock").text(p.stock > 0 ? `In stock (${p.stock} left)` : "Out of stock");
      $("#product-modal").fadeIn(200);
    });
  });

  $(document).on("click", "#modal-close, #product-modal", function (e) {
    if (e.target === this) $("#product-modal").fadeOut(200);
  });

  
  window.PF_showAlert = function (type, msg) {
    const colours = { success: "#27ae60", error: "#e74c3c", warning: "#f39c12" };
    const $a = $("#pf-alert");
    if (!$a.length) return;
    $a.text(msg)
      .css({ background: colours[type] || "#555", display: "block", opacity: 0 })
      .animate({ opacity: 1 }, 200);
    clearTimeout(window._pfa);
    window._pfa = setTimeout(() => $a.fadeOut(400), 3000);
  };

  
  function triggerConfetti() {
    const colours = ["#ff3c00", "#ff9900", "#fff", "#00e5ff"];
    for (let i = 0; i < 40; i++) {
      const $p = $("<div class='confetti-piece'>").css({
        background: colours[i % colours.length],
        left: Math.random() * 100 + "vw",
        animationDuration: (Math.random() * 1.5 + 0.8) + "s",
        animationDelay: (Math.random() * 0.5) + "s",
      });
      $("body").append($p);
      setTimeout(() => $p.remove(), 2500);
    }
  }

  
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const $img = $(entry.target);
          const src  = $img.data("src");
          if (src) $img.attr("src", src).removeData("src");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "100px" });

    $("img[data-src]").each((_, el) => io.observe(el));
  }

  $(document).on("mouseenter", ".star", function () {
    const val = +$(this).data("val");
    $(this).closest(".stars").find(".star").each(function () {
      $(this).toggleClass("lit", +$(this).data("val") <= val);
    });
  }).on("mouseleave", ".stars", function () {
    $(this).find(".star").removeClass("lit");
  }).on("click", ".star", function () {
    const val = +$(this).data("val");
    const pid = $(this).closest("[data-product-id]").data("product-id");
    submitRating(pid, val);
  });

  function submitRating(pid, stars) {
    $.post("rating.php", { product_id: pid, stars }, function (r) {
      PF_showAlert(r.success ? "success" : "error",
        r.success ? `Rated ${stars} ⭐` : "Rating failed.");
    }, "json");
  }

  $("#newsletter-form").on("submit", function (e) {
    e.preventDefault();
    const email = $("#newsletter-email").val().trim();
    if (!email) return;

    $.post("subscribe.php", { email }, function (r) {
      PF_showAlert(r.success ? "success" : "error",
        r.success ? "Subscribed! 🎉" : r.message);
    }, "json");
  });

});
