const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const toast = (message) => {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
};

const pageMap = {
  "index.html": "home",
  "story.html": "story",
  "craft.html": "craft",
  "solutions.html": "solutions",
  "lab.html": "lab",
  "video.html": "video",
  "about.html": "about",
  "learn.html": "learn",
  "html/story.html": "story",
  "html/craft.html": "craft",
  "html/solutions.html": "solutions",
  "html/lab.html": "lab",
  "html/video.html": "video",
  "html/about.html": "about",
  "html/learn.html": "learn"
};

function currentPageKey() {
  const file = location.pathname.split("/").pop() || "index.html";
  return pageMap[file] || "home";
}

function initNav() {
  const key = currentPageKey();
  $$(".nav-links a[data-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === key);
  });

  const toggle = $(".menu-toggle");
  const nav = $(".nav-links");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    $$(".nav-links a").forEach((link) => link.addEventListener("click", () => nav.classList.remove("open")));
  }
}

function initScrollHeader() {
  const header = $(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 16);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initReveal() {
  const items = $$(".reveal, .portal-card, .solution, .challenge-item, .metric-card, .pathway-step, .feature-card, .timeline li");
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view", "reveal");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((el, index) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(index * 0.05, 0.35)}s`;
    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initScrollHeader();
  initReveal();
});

window.App = { $, $$, toast };
