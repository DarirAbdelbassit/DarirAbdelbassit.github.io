(function () {
  var lang = window.__SITE_LANG__ === "fr" ? "fr" : "en";

  fetch("../index.html", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("Could not load site");
      }
      return res.text();
    })
    .then(function (html) {
      var label = lang === "fr" ? "Français" : "English";
      html = html
        .replace(/<html[^>]*>/i, '<html lang="' + lang + '" class="is-lang-loading">')
        .replace(
          /<head>/i,
          '<head><base href="../"><script>window.__SITE_LANG__="' +
            lang +
            '";window.__LOADER_SHOWN_AT__=Date.now();</script>'
        )
        .replace(
          /<p class="page-loader-text">[^<]*<\/p>/,
          '<p class="page-loader-text">' + label + "</p>"
        );
      document.open();
      document.write(html);
      document.close();
    })
    .catch(function () {
      location.replace("../");
    });
})();
