(function () {
  var SUPPORTED = ["en", "fr"];
  var SITE_ORIGIN = "https://darirabdelbassit.website";
  var typedInstance = null;
  var currentLang = "en";

  function strings() {
    return window.I18N_STRINGS || {};
  }

  function isSupported(lang) {
    return SUPPORTED.indexOf(lang) !== -1;
  }

  function machineLang() {
    var primary =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      navigator.userLanguage ||
      "en";
    return String(primary).toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
  }

  function pathLang() {
    var parts = location.pathname.replace(/\/index\.html$/i, "/").split("/").filter(Boolean);
    var first = (parts[0] || "").toLowerCase();
    return isSupported(first) ? first : "";
  }

  function langPath(lang) {
    return "/" + lang + "/";
  }

  function detectLang() {
    if (isSupported(window.__SITE_LANG__)) {
      return window.__SITE_LANG__;
    }
    return pathLang() || machineLang();
  }

  function lookup(lang, key) {
    var parts = key.split(".");
    var node = strings()[lang] || strings().en;
    for (var i = 0; i < parts.length; i++) {
      if (!node || typeof node !== "object") {
        node = undefined;
        break;
      }
      node = node[parts[i]];
    }
    if (node == null && lang !== "en") {
      return lookup("en", key);
    }
    return node;
  }

  function interpolate(value, vars) {
    if (typeof value !== "string" || !vars) {
      return value;
    }
    return value.replace(/\{(\w+)\}/g, function (_, name) {
      return vars[name] != null ? vars[name] : "";
    });
  }

  function t(key, vars) {
    return interpolate(lookup(currentLang, key), vars);
  }

  function setMeta(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el && value) {
      el.setAttribute(attr, value);
    }
  }

  function ensureLink(rel, hreflang, href) {
    var selector = hreflang
      ? 'link[rel="' + rel + '"][hreflang="' + hreflang + '"]'
      : 'link[rel="' + rel + '"]';
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      if (hreflang) {
        el.setAttribute("hreflang", hreflang);
      }
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function loaderLabel(lang) {
    return lang === "fr" ? "Français" : "English";
  }

  function ensureLoader() {
    var el = document.getElementById("page-loader");
    if (el) {
      return el;
    }
    el = document.createElement("div");
    el.id = "page-loader";
    el.className = "page-loader";
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<div class="page-loader-orbit"><span class="page-loader-ring"></span><span class="page-loader-ring-slow"></span><span class="page-loader-brand">DA</span></div>' +
      '<p class="page-loader-text"></p><div class="page-loader-bar"><span></span></div>';
    document.body.appendChild(el);
    return el;
  }

  function showPageLoader(lang) {
    var el = ensureLoader();
    var text = el.querySelector(".page-loader-text");
    if (text) {
      text.textContent = loaderLabel(lang);
    }
    el.classList.remove("is-done");
    el.setAttribute("aria-busy", "true");
    document.documentElement.classList.add("is-lang-loading");
    window.__LOADER_SHOWN_AT__ = Date.now();
  }

  function hidePageLoader() {
    var el = document.getElementById("page-loader");
    var shownAt = window.__LOADER_SHOWN_AT__ || 0;
    var wait = Math.max(0, 600 - (Date.now() - shownAt));
    setTimeout(function () {
      if (el) {
        el.classList.add("is-done");
        el.setAttribute("aria-busy", "false");
      }
      document.documentElement.classList.remove("is-lang-loading");
    }, wait);
  }

  function currentSectionHash() {
    var hash = location.hash;
    if (hash && hash !== "#" && hash !== "#header") {
      return hash;
    }
    var shown = document.querySelector("section.section-show");
    if (shown && shown.id) {
      return "#" + shown.id;
    }
    return "";
  }

  function rememberSection(hash) {
    try {
      sessionStorage.setItem(
        "site:pendingSection",
        JSON.stringify({ hash: hash || "", at: Date.now() })
      );
    } catch (e) {}
  }

  function goToLang(lang) {
    var hash = currentSectionHash();
    rememberSection(hash);
    var target = langPath(lang) + hash;
    var current = location.pathname.replace(/\/index\.html$/i, "/");
    if (!current.endsWith("/")) {
      current += "/";
    }
    if (current !== langPath(lang)) {
      showPageLoader(lang);
      location.assign(target);
      return true;
    }
    if (location.search || location.hash !== hash) {
      history.replaceState({}, "", langPath(lang) + hash);
    }
    return false;
  }

  function updateMetadata(lang) {
    var meta = strings()[lang].meta;
    document.title = meta.title;
    document.documentElement.lang = lang;
    document.documentElement.dataset.siteLang = lang;

    setMeta('meta[name="description"]', "content", meta.description);
    setMeta('meta[name="keywords"]', "content", meta.keywords);
    setMeta('meta[property="og:title"]', "content", meta.title);
    setMeta('meta[property="og:description"]', "content", meta.description);
    setMeta('meta[property="og:locale"]', "content", meta.ogLocale);
    setMeta('meta[property="og:locale:alternate"]', "content", lang === "fr" ? "en_US" : "fr_FR");

    var pageUrl = SITE_ORIGIN + langPath(lang);
    setMeta('meta[property="og:url"]', "content", pageUrl);
    ensureLink("canonical", null, pageUrl);
    ensureLink("alternate", "en", SITE_ORIGIN + "/en/");
    ensureLink("alternate", "fr", SITE_ORIGIN + "/fr/");
    ensureLink("alternate", "x-default", SITE_ORIGIN + "/");
  }

  function applyDom(lang) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = lookup(lang, el.getAttribute("data-i18n"));
      if (value == null || Array.isArray(value)) {
        return;
      }
      if (el.getAttribute("data-i18n-html") === "true") {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(",")
        .forEach(function (pair) {
          var parts = pair.split(":");
          if (parts.length < 2) {
            return;
          }
          var attr = parts[0].trim();
          var key = parts.slice(1).join(":").trim();
          var value = lookup(lang, key);
          if (value != null && !Array.isArray(value)) {
            el.setAttribute(attr, value);
          }
        });
    });
  }

  function refreshTyped(lang) {
    var el = document.querySelector(".typing");
    if (!el || typeof Typed === "undefined") {
      return;
    }
    if (typedInstance) {
      typedInstance.destroy();
      el.textContent = "";
    }
    typedInstance = new Typed(".typing", {
      strings: lookup(lang, "hero.typed") || [],
      loop: true,
      typeSpeed: 65,
      backSpeed: 65,
    });
  }

  function syncSwitcher(lang) {
    document.querySelectorAll(".lang-switch [data-lang]").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function apply(lang) {
    if (!isSupported(lang)) {
      lang = "en";
    }
    currentLang = lang;
    window.__SITE_LANG__ = lang;

    var text = document.querySelector("#page-loader .page-loader-text");
    if (text) {
      text.textContent = loaderLabel(lang);
    }

    updateMetadata(lang);
    applyDom(lang);
    refreshTyped(lang);
    syncSwitcher(lang);

    document.documentElement.classList.remove("i18n-wait");
    document.documentElement.classList.add("i18n-ready");
    hidePageLoader();
    document.dispatchEvent(
      new CustomEvent("site:lang", {
        detail: { lang: lang },
      })
    );
  }

  function setLang(lang) {
    if (!isSupported(lang)) {
      return;
    }
    if (goToLang(lang)) {
      return;
    }
    apply(lang);
  }

  function bindSwitcher() {
    document.addEventListener("click", function (event) {
      var btn = event.target.closest(".lang-switch [data-lang]");
      if (!btn) {
        return;
      }
      event.preventDefault();
      setLang(btn.getAttribute("data-lang"));
    });
  }

  window.SiteI18n = {
    t: t,
    getLang: function () {
      return currentLang;
    },
    setLang: setLang,
    detectLang: detectLang,
  };

  bindSwitcher();

  function boot() {
    apply(detectLang());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
