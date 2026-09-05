/**
* Template Name: Personal
* Updated: Sep 18 2023 with Bootstrap v5.3.2
* Template URL: https://bootstrapmade.com/personal-free-resume-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)

    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const PENDING_SECTION_KEY = 'site:pendingSection';

  const sectionUrl = (hash) => {
    const path = location.pathname + location.search;
    return (!hash || hash === '#header') ? path : path + hash;
  }

  const setSectionUrl = (hash, replace) => {
    const next = sectionUrl(hash);
    const current = location.pathname + location.search + location.hash;
    if (next === current) {
      return;
    }
    if (replace) {
      history.replaceState(null, '', next);
    } else {
      history.pushState(null, '', next);
    }
  }

  const consumePendingSection = () => {
    try {
      const raw = sessionStorage.getItem(PENDING_SECTION_KEY);
      sessionStorage.removeItem(PENDING_SECTION_KEY);
      if (!raw) {
        return '';
      }
      const data = JSON.parse(raw);
      if (!data || !data.hash || data.hash === '#header') {
        return '';
      }
      if (Date.now() - data.at > 15000) {
        return '';
      }
      return data.hash;
    } catch (e) {
      return '';
    }
  }

  const closeMobileNav = () => {
    let navbar = select('#navbar');
    if (navbar && navbar.classList.contains('navbar-mobile')) {
      navbar.classList.remove('navbar-mobile');
      let navbarToggle = select('.mobile-nav-toggle');
      if (navbarToggle) {
        navbarToggle.classList.toggle('bi-list');
        navbarToggle.classList.toggle('bi-x');
      }
    }
  }

  const showSection = (hash, options = {}) => {
    const updateHistory = options.updateHistory !== false;
    const replaceHistory = !!options.replaceHistory;
    const section = hash && hash !== '#header' ? select(hash) : null;
    const targetHash = section ? hash : '#header';
    let header = select('#header');
    let sections = select('section', true);
    let navlinks = select('#navbar .nav-link', true);

    closeMobileNav();

    navlinks.forEach((item) => {
      item.classList.toggle('active', item.getAttribute('href') === targetHash);
    });

    if (targetHash === '#header') {
      header.classList.remove('header-top');
      sections.forEach((item) => {
        item.classList.remove('section-show');
      });
    } else if (!header.classList.contains('header-top')) {
      header.classList.add('header-top');
      setTimeout(function() {
        sections.forEach((item) => {
          item.classList.remove('section-show');
        });
        section.classList.add('section-show');
      }, 350);
    } else {
      sections.forEach((item) => {
        item.classList.remove('section-show');
      });
      section.classList.add('section-show');
    }

    if (updateHistory) {
      setSectionUrl(targetHash, replaceHistory);
    }

    scrollto(targetHash);
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.nav-link', function(e) {
    if (!this.hash) {
      return;
    }
    let section = this.hash === '#header' ? select('#header') : select(this.hash);
    if (section) {
      e.preventDefault();
      showSection(this.hash, { updateHistory: true });
    }
  }, true)

  /**
   * Activate/show sections on load with hash links
   */
  const restoreSection = () => {
    if (restoreSection.done) {
      return;
    }
    let hash = window.location.hash;
    if (!hash || hash === '#header') {
      hash = consumePendingSection();
    } else {
      try {
        sessionStorage.removeItem(PENDING_SECTION_KEY);
      } catch (e) {}
    }
    if (hash && hash !== '#header' && select(hash)) {
      restoreSection.done = true;
      showSection(hash, { updateHistory: true, replaceHistory: true });
    }
  };

  window.addEventListener('popstate', () => {
    showSection(window.location.hash || '#header', { updateHistory: false });
  });

  window.addEventListener('load', restoreSection);
  document.addEventListener('DOMContentLoaded', restoreSection);
  restoreSection();

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows',
        percentPosition: true
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
      }, true);
    }

  });

})()