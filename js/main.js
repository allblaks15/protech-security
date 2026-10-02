/* Protech Security — small, dependency-free site script. */
(function () {
  "use strict";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Prefill the quote form from ?service=…&location=…&phone=… (sent by the "Request a quote for …"
  // links on the services page).
  var params = new URLSearchParams(window.location.search);
  var wanted = params.getAll("service");
  if (wanted.length) {
    wanted.forEach(function (id) {
      var box = document.querySelector('input[name="services"][data-id="' + CSS.escape(id) + '"]');
      if (box) box.checked = true;
    });
  }
  // URL parameter -> quote form field name (field names double as labels in the email)
  [["location", "Location"], ["phone", "Phone"]].forEach(function (pair) {
    var v = params.get(pair[0]);
    var input = document.querySelector('#quote-form [name="' + pair[1] + '"]');
    if (v && input && !input.value) input.value = v;
  });

  // Order forms: build a WhatsApp message from the fields and open a chat with 0725 310 112.
  // Without JavaScript the form still posts to FormSubmit by email as a fallback.
  var WA_NUMBER = "254725310112";

  document.querySelectorAll("form[data-wa]").forEach(function (form) {
    var status = form.querySelector(".form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var group = form.querySelector("[data-require-one]");
      if (group && !group.querySelector("input:checked")) {
        show("err", "Choose at least one service so we can prepare the right quote.");
        group.querySelector("input").focus();
        return;
      }
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var services = [];
      var lines = [];
      new FormData(form).forEach(function (value, key) {
        value = String(value).trim();
        if (!value || key.charAt(0) === "_") return;
        if (key === "services") services.push(value);
        else lines.push("*" + key + ":* " + value);
      });

      var intro = form.getAttribute("data-wa-intro") || "Hello Protech Security, I'd like to place an order.";
      var text = intro + "\n\n" +
        (services.length ? "*Service:* " + services.join(", ") + "\n" : "") +
        lines.join("\n") +
        "\n\n(Sent from " + window.location.hostname + window.location.pathname + ")";
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);

      var win = window.open(url, "_blank", "noopener");
      if (!win) window.location.href = url;

      show("ok", "WhatsApp is opening with your order. Just press Send and our team will reply. ");
      if (status) {
        var a = document.createElement("a");
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = "Didn't open? Tap here.";
        status.appendChild(a);
      }
      if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form: form.id || "whatsapp" });
    });

    function show(kind, msg) {
      if (!status) return;
      status.hidden = false;
      status.className = "form-status " + kind;
      status.textContent = msg;
      status.setAttribute("role", kind === "err" ? "alert" : "status");
      status.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });

  // Fade sections in as they scroll into view
  document.documentElement.classList.add("js");
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }
})();
