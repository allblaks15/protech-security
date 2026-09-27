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

  // Prefill the quote form from ?service=…&location=…&phone=… (sent by the hero quick-quote form
  // and by the "Request a quote for …" links on the services page).
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

  // Forms that email info@pro-tech.co.ke through FormSubmit's AJAX endpoint.
  // Without JavaScript the same form posts normally and FormSubmit redirects to thank-you.html.
  document.querySelectorAll("form[data-ajax]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');

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

      var data = {};
      new FormData(form).forEach(function (value, key) {
        if (key === "services") {
          data["Services requested"] = data["Services requested"] ? data["Services requested"] + ", " + value : value;
        } else if (value !== "") {
          data[key] = value;
        }
      });
      data["Page"] = window.location.href;

      var label = button.textContent;
      button.disabled = true;
      button.textContent = "Sending…";

      fetch(form.getAttribute("data-ajax"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (r) {
          if (!r.ok || String(r.body.success) === "false") throw new Error(r.body.message || "Send failed");
          form.reset();
          show("ok", form.getAttribute("data-success"));
          if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form: form.id });
        })
        .catch(function () {
          show("err", "Your request didn't send. Check your connection and try again, or email info@pro-tech.co.ke directly.");
        })
        .finally(function () {
          button.disabled = false;
          button.textContent = label;
        });
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
})();
