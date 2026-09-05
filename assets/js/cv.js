(function () {
  const CVS = {
    en: {
      file: "cv/ABDELBASSIT_DARIR_CV_EN.pdf",
      downloadName: "Abdelbassit_Darir_CV_EN.pdf",
      label: "English"
    },
    fr: {
      file: "cv/ABDELBASSIT_DARIR_CV_FR.pdf",
      downloadName: "Abdelbassit_Darir_CV_FR.pdf",
      label: "French"
    }
  };

  const viewer = document.getElementById("cv-viewer");
  const section = document.getElementById("cv");
  const stage = document.getElementById("cv-stage");
  const pagesEl = document.getElementById("cv-pages");
  const loader = document.getElementById("cv-loader");
  const zoomLabel = document.getElementById("cv-zoom-label");
  const pageInfo = document.getElementById("cv-page-info");
  const downloadBtn = document.getElementById("cv-download");
  const openBtn = document.getElementById("cv-open");
  const zoomInBtn = document.getElementById("cv-zoom-in");
  const zoomOutBtn = document.getElementById("cv-zoom-out");
  const langBtns = document.querySelectorAll(".cv-lang-btn");
  const cacheBust = Date.now();

  if (!viewer || !section || typeof pdfjsLib === "undefined") {
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let currentLang = "en";
  let zoom = 1;
  let renderToken = 0;
  let started = false;
  let hasPdf = false;
  let resizeTimer;
  const pdfCache = {};

  function fileUrl(file) {
    return file + "?v=" + cacheBust;
  }

  function setLoading(on) {
    loader.hidden = !on;
  }

  function setZoomEnabled(on) {
    zoomInBtn.disabled = !on;
    zoomOutBtn.disabled = !on;
  }

  function setLinks(cv) {
    downloadBtn.href = cv.file;
    openBtn.href = cv.file;
    downloadBtn.setAttribute("download", cv.downloadName);
  }

  function showMissing(cv) {
    hasPdf = false;
    setZoomEnabled(false);
    pageInfo.textContent = "";
    pagesEl.innerHTML =
      '<div class="cv-empty">' +
      "<h4>" + cv.label + " resume not found</h4>" +
      "<p>Upload <strong>" + cv.downloadName + "</strong> to the <strong>cv</strong> folder, then refresh.</p>" +
      "</div>";
  }

  function fitScale(page) {
    const base = page.getViewport({ scale: 1 });
    const available = Math.max(280, stage.clientWidth - 40);
    const fitted = Math.min(available, 860) / base.width;
    return fitted * zoom;
  }

  async function getPdf(url) {
    if (!pdfCache[url]) {
      pdfCache[url] = pdfjsLib.getDocument(url).promise;
    }
    try {
      return await pdfCache[url];
    } catch (err) {
      delete pdfCache[url];
      throw err;
    }
  }

  async function renderPdf(url) {
    const token = ++renderToken;
    const pdf = await getPdf(url);
    if (token !== renderToken) {
      return;
    }

    const firstPage = await pdf.getPage(1);
    const scale = fitScale(firstPage);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    pagesEl.innerHTML = "";
    hasPdf = true;
    setZoomEnabled(true);

    for (let number = 1; number <= pdf.numPages; number++) {
      const page = number === 1 ? firstPage : await pdf.getPage(number);
      if (token !== renderToken) {
        return;
      }

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.className = "cv-page";
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = viewport.width + "px";
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      pagesEl.appendChild(canvas);
      await page.render({ canvasContext: context, viewport }).promise;
    }

    pageInfo.textContent = pdf.numPages > 1 ? pdf.numPages + " pages" : "1 page";
  }

  async function loadCv(lang) {
    currentLang = lang;
    const cv = CVS[lang];
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
    setLinks(cv);
    setLoading(true);

    try {
      await renderPdf(fileUrl(cv.file));
    } catch (err) {
      showMissing(cv);
    } finally {
      setLoading(false);
    }
  }

  langBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      langBtns.forEach((item) => {
        item.classList.toggle("active", item === btn);
        item.setAttribute("aria-selected", item === btn ? "true" : "false");
      });
      zoom = 1;
      loadCv(btn.dataset.cv);
    });
  });

  zoomInBtn.addEventListener("click", () => {
    if (!hasPdf) {
      return;
    }
    zoom = Math.min(2, +(zoom + 0.15).toFixed(2));
    loadCv(currentLang);
  });

  zoomOutBtn.addEventListener("click", () => {
    if (!hasPdf) {
      return;
    }
    zoom = Math.max(0.7, +(zoom - 0.15).toFixed(2));
    loadCv(currentLang);
  });

  document.getElementById("cv-fullscreen").addEventListener("click", async () => {
    if (!document.fullscreenElement) {
      await viewer.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const icon = document.querySelector("#cv-fullscreen i");
    if (icon) {
      icon.className = document.fullscreenElement ? "bi bi-fullscreen-exit" : "bi bi-fullscreen";
    }
    if (started && hasPdf) {
      loadCv(currentLang);
    }
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (started && hasPdf && section.classList.contains("section-show")) {
        loadCv(currentLang);
      }
    }, 180);
  });

  function start() {
    if (started || !section.classList.contains("section-show")) {
      return;
    }
    if (stage.clientWidth < 100) {
      setTimeout(start, 80);
      return;
    }
    started = true;
    loadCv(currentLang);
  }

  if (section.classList.contains("section-show")) {
    start();
  }

  new MutationObserver(() => {
    if (section.classList.contains("section-show")) {
      start();
    }
  }).observe(section, { attributes: true, attributeFilter: ["class"] });
})();
