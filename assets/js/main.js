(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. Sheet-tab nav: highlight active section on scroll
  --------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tabs a"));
  var navSections = tabs.map(function (t) {
    return document.querySelector(t.getAttribute("href"));
  });

  function setActiveTab() {
    var y = window.scrollY + 140;
    var idx = 0;
    navSections.forEach(function (s, i) {
      if (s && s.offsetTop <= y) idx = i;
    });
    tabs.forEach(function (t, i) {
      var wasActive = t.classList.contains("active");
      var isActive = i === idx;
      t.classList.toggle("active", isActive);
      if (isActive && !wasActive && t.scrollIntoView) {
        t.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  }

  /* ---------------------------------------------------------
     2. Scroll progress bar
  --------------------------------------------------------- */
  var progressBar = document.querySelector(".progress-bar");
  function setProgress() {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
  }

  /* ---------------------------------------------------------
     3. Back-to-top button
  --------------------------------------------------------- */
  var toTopBtn = document.querySelector(".to-top");
  function toggleToTop() {
    if (!toTopBtn) return;
    toTopBtn.classList.toggle("show", window.scrollY > 600);
  }
  if (toTopBtn) {
    toTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------
     4. Combined scroll handler (throttled via rAF)
  --------------------------------------------------------- */
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        setActiveTab();
        setProgress();
        toggleToTop();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll);
  setActiveTab();
  setProgress();
  toggleToTop();

  /* ---------------------------------------------------------
     5. Reveal-on-scroll (IntersectionObserver)
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = entry.target.getAttribute("data-delay") || 0;
            setTimeout(function () {
              entry.target.classList.add("in");
            }, Number(delay));
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ---------------------------------------------------------
     5b. Experience timeline rail fill
  --------------------------------------------------------- */
  var timelineEl = document.querySelector(".timeline");
  if (timelineEl && "IntersectionObserver" in window) {
    var timelineIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            timelineEl.classList.add("in-view");
            timelineIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    timelineIO.observe(timelineEl);
  } else if (timelineEl) {
    timelineEl.classList.add("in-view");
  }

  /* ---------------------------------------------------------
     6. Animated stat counters
     - Hero "Snapshot.xlsx" counters: always above the fold and
       the card itself animates in on load, so these count up
       immediately rather than waiting on a visibility threshold
       that short viewports might never satisfy without scrolling.
     - All other counters (e.g. experience impact chips): scroll-triggered.
  --------------------------------------------------------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion || !target) {
      el.textContent = target + suffix;
      return;
    }
    var start = 0;
    var duration = 900;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(start + (target - start) * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  var heroCounters = document.querySelectorAll(".stat-card [data-count]");
  heroCounters.forEach(function (el) {
    setTimeout(function () {
      animateCount(el);
    }, 250);
  });

  var scrollCounters = Array.prototype.filter.call(
    document.querySelectorAll("[data-count]"),
    function (el) {
      return !el.closest(".stat-card");
    }
  );
  if (scrollCounters.length) {
    if ("IntersectionObserver" in window) {
      var countIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      scrollCounters.forEach(function (el) {
        countIO.observe(el);
      });
    } else {
      scrollCounters.forEach(animateCount);
    }
  }

  /* ---------------------------------------------------------
     7. Cycling role text in hero
  --------------------------------------------------------- */
  var roleEl = document.querySelector("[data-role-cycle]");
  if (roleEl && !reduceMotion) {
    var roles = ["Data Analyst", "Excel Dashboard Builder", "Power BI Developer", "Insight Generator"];
    var ri = 0;
    setInterval(function () {
      ri = (ri + 1) % roles.length;
      roleEl.style.opacity = 0;
      setTimeout(function () {
        roleEl.textContent = roles[ri];
        roleEl.style.opacity = 1;
      }, 260);
    }, 2600);
  }

  /* ---------------------------------------------------------
     8. Project filter buttons
  --------------------------------------------------------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var pcards = document.querySelectorAll(".pcard");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      var filter = btn.getAttribute("data-filter");
      pcards.forEach(function (card) {
        var cardTags = (card.getAttribute("data-tags") || "").split(",");
        var show = filter === "all" || cardTags.indexOf(filter) !== -1;
        card.classList.toggle("hidden-filter", !show);
      });
    });
  });

  /* ---------------------------------------------------------
     9. Copy email to clipboard + toast
  --------------------------------------------------------- */
  var toast = document.querySelector(".toast");
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }
  var copyBtn = document.querySelector(".copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      if (navigator.clipboard && email) {
        navigator.clipboard.writeText(email).then(function () {
          copyBtn.textContent = "Copied";
          copyBtn.classList.add("copied");
          showToast("Email copied to clipboard");
          setTimeout(function () {
            copyBtn.textContent = "Copy";
            copyBtn.classList.remove("copied");
          }, 1800);
        });
      }
    });
  }
})();
