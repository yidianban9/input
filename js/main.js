/* ============================================================
   蜀韵·成都 — 交互脚本
   包含：页头滚动态、移动端导航、首页轮播、视频播放器、
        滚动入场动效、返回顶部、页脚年份
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 轻量选择器 */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ==========================================================
     01. 页头滚动态 + 返回顶部
     ========================================================== */
  var header = $("[data-header]");
  var toTop = $("[data-to-top]");

  function onScroll() {
    var scrolled = window.scrollY > 48;

    if (header) {
      header.classList.toggle("is-scrolled", scrolled);
    }

    if (toTop) {
      toTop.classList.toggle("is-visible", window.scrollY > 620);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  }

  /* ==========================================================
     02. 移动端全屏导航
     ========================================================== */
  var navToggle = $("[data-nav-toggle]");
  var mobileMenu = $("[data-mobile-menu]");
  var lastFocused = null;

  function getMenuFocusable() {
    if (!mobileMenu) return [];
    return $$("a[href], button:not([disabled])", mobileMenu).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function openMenu() {
    if (!mobileMenu || !navToggle) return;

    lastFocused = document.activeElement;
    document.body.classList.add("nav-open");
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "关闭菜单");

    window.setTimeout(function () {
      var first = $("a", mobileMenu);
      if (first) first.focus();
    }, 260);
  }

  function closeMenu(returnFocus) {
    if (!mobileMenu || !navToggle) return;

    document.body.classList.remove("nav-open");
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "打开菜单");

    if (returnFocus && lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      if (mobileMenu.classList.contains("is-open")) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    $$("a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!mobileMenu.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }

      /* 简单的焦点循环，避免 Tab 跑到页面背后 */
      if (event.key === "Tab") {
        var focusable = getMenuFocusable();
        if (!focusable.length) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980 && mobileMenu.classList.contains("is-open")) {
        closeMenu(false);
      }
    });
  }

  /* ==========================================================
     03. 首页全屏轮播
     ========================================================== */
  var carousel = $("[data-carousel]");

  if (carousel) {
    var slides = $$("[data-slide]", carousel);
    var dots = $$("[data-dot]", carousel);
    var currentEl = $("[data-current]", carousel);
    var captionEl = $("[data-hero-caption]", carousel);
    var prevBtn = $("[data-prev]", carousel);
    var nextBtn = $("[data-next]", carousel);
    var interval = 7000;
    var index = 0;
    var timer = null;
    var paused = false;
    var dotAnimation = null;
    var touchStartX = null;

    function pad(number) {
      return String(number + 1).padStart(2, "0");
    }

    function restartDotProgress() {
      if (!dots.length) return;

      dots.forEach(function (dot, i) {
        var fill = $("i", dot);
        if (!fill) return;

        if (fill.getAnimations) {
          fill.getAnimations().forEach(function (animation) {
            animation.cancel();
          });
        }

        fill.style.transform = i === index ? "scaleX(0)" : "scaleX(0)";
      });

      if (dotAnimation) {
        dotAnimation.cancel();
        dotAnimation = null;
      }

      var activeFill = dots[index] ? $("i", dots[index]) : null;
      if (!activeFill) return;

      if (reduceMotion) {
        activeFill.style.transform = "scaleX(1)";
        return;
      }

      dotAnimation = activeFill.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { duration: interval, easing: "linear", fill: "forwards" }
      );
    }

    function goTo(nextIndex, isManual) {
      if (!slides.length) return;

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });

      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
        dot.setAttribute("tabindex", active ? "0" : "-1");
      });

      if (currentEl) currentEl.textContent = pad(index);

      if (captionEl) {
        captionEl.textContent = slides[index].getAttribute("data-caption") || "";
      }

      restartDotProgress();

      if (isManual) restartAuto();
    }

    function nextSlide() {
      goTo(index + 1, true);
    }

    function prevSlide() {
      goTo(index - 1, true);
    }

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (reduceMotion || paused || document.hidden || slides.length < 2) return;

      timer = window.setInterval(function () {
        goTo(index + 1, false);
      }, interval);
    }

    function restartAuto() {
      startAuto();
    }

    if (prevBtn) prevBtn.addEventListener("click", prevSlide);
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var target = parseInt(dot.getAttribute("data-dot"), 10);
        if (!isNaN(target)) goTo(target, true);
      });
    });

    /* 鼠标悬停或键盘聚焦时暂停自动播放，离开后恢复 */
    carousel.addEventListener("mouseenter", function () {
      paused = true;
      stopAuto();
    });

    carousel.addEventListener("mouseleave", function () {
      paused = false;
      startAuto();
    });

    carousel.addEventListener("focusin", function () {
      paused = true;
      stopAuto();
    });

    carousel.addEventListener("focusout", function (event) {
      if (carousel.contains(event.relatedTarget)) return;
      paused = false;
      startAuto();
    });

    /* 触屏左右滑动 */
    carousel.addEventListener(
      "touchstart",
      function (event) {
        touchStartX = event.touches[0].clientX;
        paused = true;
        stopAuto();
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      function (event) {
        if (touchStartX === null) return;

        var delta = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        paused = false;

        if (Math.abs(delta) > 48) {
          if (delta < 0) nextSlide();
          else prevSlide();
        } else {
          startAuto();
        }
      },
      { passive: true }
    );

    /* 页面不可见时停止计时，回来再继续 */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAuto();
      } else {
        paused = false;
        startAuto();
        restartDotProgress();
      }
    });

    /* 左右方向键切换（仅当焦点不在表单控件上） */
    document.addEventListener("keydown", function (event) {
      var tag = (event.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (window.scrollY > carousel.offsetHeight) return;

      if (event.key === "ArrowLeft") prevSlide();
      else nextSlide();
    });

    goTo(0, false);
    startAuto();
  }

  /* ==========================================================
     04. 首页城市短片播放器
     ========================================================== */
  var videoShell = $("[data-video]");

  if (videoShell) {
    var video = $("video", videoShell);
    var bigPlay = $("[data-video-bigplay]", videoShell);
    var playBtn = $("[data-video-play]", videoShell);
    var seek = $("[data-video-seek]", videoShell);
    var currentTimeEl = $("[data-video-current]", videoShell);
    var durationEl = $("[data-video-duration]", videoShell);
    var fullscreenBtn = $("[data-video-fullscreen]", videoShell);
    var playIcon = playBtn ? $(".icon-play", playBtn) : null;
    var pauseIcon = playBtn ? $(".icon-pause", playBtn) : null;

    function formatTime(seconds) {
      if (!isFinite(seconds) || seconds < 0) seconds = 0;
      var minutes = Math.floor(seconds / 60);
      var remainder = Math.floor(seconds % 60);
      return String(minutes).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
    }

    function updateProgress() {
      if (!video) return;

      var duration = video.duration || 0;
      var percent = duration ? (video.currentTime / duration) * 100 : 0;

      if (seek) {
        seek.value = percent;
        seek.style.setProperty("--progress", percent.toFixed(3) + "%");
      }

      if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
      if (durationEl && duration) durationEl.textContent = formatTime(duration);
    }

    function setPlayingState(isPlaying) {
      videoShell.classList.toggle("is-playing", isPlaying);

      if (playBtn) {
        playBtn.setAttribute("aria-label", isPlaying ? "暂停视频" : "播放视频");
      }

      if (playIcon && pauseIcon) {
        playIcon.style.display = isPlaying ? "none" : "block";
        pauseIcon.style.display = isPlaying ? "block" : "none";
      }
    }

    function togglePlay() {
      if (!video) return;

      if (video.paused) {
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            setPlayingState(false);
          });
        }
      } else {
        video.pause();
      }
    }

    if (video) {
      video.addEventListener("loadedmetadata", updateProgress);
      video.addEventListener("timeupdate", updateProgress);
      video.addEventListener("play", function () {
        setPlayingState(true);
      });
      video.addEventListener("pause", function () {
        setPlayingState(false);
      });
      video.addEventListener("click", togglePlay);

      if (bigPlay) bigPlay.addEventListener("click", togglePlay);
      if (playBtn) playBtn.addEventListener("click", togglePlay);

      if (seek) {
        seek.addEventListener("input", function () {
          if (!video.duration) return;
          video.currentTime = (parseFloat(seek.value) / 100) * video.duration;
          updateProgress();
        });
      }

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener("click", function () {
          if (!document.fullscreenElement) {
            if (videoShell.requestFullscreen) {
              videoShell.requestFullscreen().catch(function () {});
            }
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        });
      }

      document.addEventListener("fullscreenchange", function () {
        var isFull = Boolean(document.fullscreenElement);
        if (fullscreenBtn) {
          fullscreenBtn.setAttribute("aria-label", isFull ? "退出全屏" : "全屏播放");
        }
      });

      updateProgress();
    }
  }

  /* ==========================================================
     05. 滚动入场动效
     ========================================================== */
  var revealItems = $$(".reveal");

  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );

      revealItems.forEach(function (item) {
        observer.observe(item);
      });
    }
  }

  /* ==========================================================
     06. 页脚年份
     ========================================================== */
  $$("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
