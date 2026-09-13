(() => {
  const { $, $$ } = window.App;

  document.addEventListener("DOMContentLoaded", () => {
    initCarousel();
    initGallery();
    initIntroFilm();
    initCounters();
  });

  function initCounters() {
    const nums = $$("[data-count]");
    if (!nums.length) return;
    const animate = (el) => {
      const target = Number(el.dataset.count || 0);
      const duration = 1200;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach((el) => io.observe(el));
  }

  function initCarousel() {
    const root = $("#heritage-carousel");
    if (!root) return;

    const slides = $$(".carousel-slide", root);
    const dotsWrap = $(".carousel-dots", root);
    const progress = $(".carousel-progress i", root);
    let index = 0;
    let timer = null;
    const DURATION = 5000;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `第 ${i + 1} 张`);
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.append(dot);
    });

    const dots = $$(".carousel-dots button", root);

    function goTo(next, manual = false) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      restartProgress();
      if (manual) startAuto();
    }

    function restartProgress() {
      progress.style.transition = "none";
      progress.style.width = "0%";
      void progress.offsetWidth;
      progress.style.transition = `width ${DURATION}ms linear`;
      progress.style.width = "100%";
    }

    function startAuto() {
      clearInterval(timer);
      restartProgress();
      timer = setInterval(() => goTo(index + 1), DURATION);
    }

    $(".carousel-btn.prev", root)?.addEventListener("click", () => goTo(index - 1, true));
    $(".carousel-btn.next", root)?.addEventListener("click", () => goTo(index + 1, true));

    root.addEventListener("mouseenter", () => {
      clearInterval(timer);
      progress.style.animationPlayState = "paused";
    });
    root.addEventListener("mouseleave", startAuto);

    let touchX = 0;
    root.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1), true);
    }, { passive: true });

    startAuto();
  }

  function initGallery() {
    const lightbox = $("#lightbox");
    if (!lightbox) return;
    const img = $("#lightbox-img");
    const caption = $("#lightbox-caption");

    $$("[data-gallery]").forEach((btn) => {
      btn.addEventListener("click", () => {
        img.src = btn.dataset.gallery;
        img.alt = btn.dataset.title || "";
        caption.textContent = btn.dataset.title || "";
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
      });
    });

    $$("[data-close-lightbox]").forEach((el) => {
      el.addEventListener("click", () => {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        img.src = "";
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("open")) {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
      }
    });
  }

  function initIntroFilm() {
    const modal = $("#intro-modal");
    if (!modal) return;

    const filmSlides = $$(".film-slide");
    let filmIndex = 0;
    let filmTimer;
    let filmPaused = false;

    function showSlide(index) {
      filmSlides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    }

    function startFilm() {
      clearInterval(filmTimer);
      filmPaused = false;
      $(".film-toggle").textContent = "Ⅱ";
      $(".film-progress").classList.remove("playing");
      void $(".film-progress").offsetWidth;
      $(".film-progress").classList.add("playing");
      filmTimer = setInterval(() => {
        filmIndex = (filmIndex + 1) % filmSlides.length;
        showSlide(filmIndex);
      }, 4000);
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      clearInterval(filmTimer);
    }

    $$("[data-play-intro]").forEach((button) => button.addEventListener("click", () => {
      filmIndex = 0;
      showSlide(0);
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      startFilm();
    }));

    $$("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
    $(".film-toggle")?.addEventListener("click", (event) => {
      filmPaused = !filmPaused;
      if (filmPaused) {
        clearInterval(filmTimer);
        $(".film-progress i").style.animationPlayState = "paused";
        event.currentTarget.textContent = "▶";
      } else {
        $(".film-progress i").style.animationPlayState = "running";
        event.currentTarget.textContent = "Ⅱ";
        filmTimer = setInterval(() => {
          filmIndex = (filmIndex + 1) % filmSlides.length;
          showSlide(filmIndex);
        }, 4000);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }
})();
