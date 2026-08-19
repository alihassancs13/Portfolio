/* ==========================================================================
   About section — 3D particle vortex (canvas 2D, no external deps)
   Reuses the site's existing design tokens (--primary, --accent,
   --foreground, --background) so the color scheme always matches the hero.

   Scroll behavior mirrors the site's existing [data-parallax] pattern
   (grid-lines in the hero): an rAF-throttled scroll listener computes how
   far the section has travelled through the viewport, and maps that
   progress to a 3D rotation / tilt / depth-scale on the vortex, so it
   visibly turns and drifts as you scroll past it — the "camera" orbits
   the shape instead of it just idling in place.
   ========================================================================== */
(function () {
  "use strict";

  function initAboutParticles() {
    var canvas = document.getElementById("about-particles");
    if (!canvas) return;

    var section = canvas.closest(".about-visual") || canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var root = getComputedStyle(document.documentElement);
    var colorPrimary = root.getPropertyValue("--primary").trim() || "oklch(0.79 0.14 190)";
    var colorAccent = root.getPropertyValue("--accent").trim() || "oklch(0.66 0.16 255)";
    var colorForeground = root.getPropertyValue("--foreground").trim() || "oklch(0.97 0.006 240)";

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;

    // ---- particle field -----------------------------------------------
    var PARTICLE_COUNT = window.innerWidth < 768 ? 900 : 2200;
    var particles = [];

    // Radius profile along the vertical axis (t: 0 top -> 1 bottom).
    // Wide at the top, pinches in around the lower-third, slight flare
    // at the very bottom — the "hourglass / vortex" silhouette.
    // Floor raised (0.14 -> 0.24) so the pinch never collapses to a thin
    // sliver — that collapse was reading as "dead space" on the sides.
    function radiusProfile(t) {
      var pinchAt = 0.62;
      var d = Math.abs(t - pinchAt);
      return 0.24 + 0.76 * Math.pow(d / Math.max(pinchAt, 1 - pinchAt), 1.5);
    }

    function makeParticle() {
      var t = Math.pow(Math.random(), 0.7); // bias density toward the top
      return {
        t: t,
        angle0: Math.random() * Math.PI * 2,
        radiusJitter: 0.78 + Math.random() * 0.4,
        z0: Math.random() * 2 - 1,
        size: 0.7 + Math.random() * 1.6,
        speed: 0.4 + Math.random() * 0.6,
        sparkle: Math.random() < 0.06, // small % of bright foreground flecks
        twinklePhase: Math.random() * Math.PI * 2,
      };
    }

    function buildParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle());
    }

    function resize() {
      var rect = section.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var BASE_TWIST = Math.PI * 7.5;  // idle swirl wind-up, top -> bottom
    var SCROLL_TWIST = Math.PI * 3.5; // extra rotation added across the scroll range
    var pointer = { x: 0, y: 0, active: false };

    section.addEventListener("pointermove", function (e) {
      var rect = section.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      pointer.active = true;
    });
    section.addEventListener("pointerleave", function () {
      pointer.active = false;
    });

    // ---- scroll-linked 3D progress (same rAF-throttle pattern as the
    // site's existing [data-parallax] handler) -----------------------------
    var scrollProgress = 0; // 0 = section entering from bottom, 1 = exiting top
    var scrollTicking = false;

    function updateScrollProgress() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // 0 when the section's top edge is at the viewport's bottom edge,
      // 1 when the section's bottom edge reaches the viewport's top edge.
      var raw = (vh - rect.top) / (vh + rect.height);
      scrollProgress = Math.max(0, Math.min(1, raw));
      scrollTicking = false;
    }

    function onScroll() {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateScrollProgress);
        scrollTicking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    var start = performance.now();

    function draw(now) {
      var elapsed = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      var cx = width * 0.5;
      var topPad = height * 0.01;
      var drawHeight = height * 0.98;
      // maxRadius now leans on width, not min(width, height): the container
      // is portrait (tall, narrower), so basing spread on height alone left
      // a visible gutter on the left and right edges.
      var maxRadius = Math.min(width * 0.62, height * 0.42);
      var focal = 480;

      // scroll drives the bulk of the 3D turn; idle drift + pointer add a
      // little life on top of it, same layering the hero uses (base motion
      // + parallax offset).
      var scrollAngle = (scrollProgress - 0.5) * SCROLL_TWIST;
      var idleAngle = reducedMotion ? 0 : Math.sin(elapsed * 0.15) * 0.15;
      var pointerTiltX = pointer.active ? pointer.x * 0.35 : 0;
      var pointerTiltY = pointer.active ? pointer.y * 0.15 : 0;

      // scroll also gives the whole vortex a subtle camera dolly (scale)
      // and vertical drift, so it reads as moving *through* 3D space, not
      // just spinning in place.
      var scrollScale = 0.92 + 0.16 * Math.sin(scrollProgress * Math.PI);
      var scrollDriftY = (scrollProgress - 0.5) * height * 0.12;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var t = p.t;
       var rot = reducedMotion ? 0 : elapsed * p.speed * 1.5;
        var angle = p.angle0 + t * BASE_TWIST + scrollAngle * (0.4 + t * 0.6) + rot;

        var r = radiusProfile(t) * maxRadius * p.radiusJitter * scrollScale;
        var x = Math.cos(angle) * r;
        var z = Math.sin(angle) * r * 0.7 + p.z0 * 12;

        x += (pointerTiltX + idleAngle * 0.5) * (t - 0.5) * 120;
        var y = topPad + t * drawHeight + scrollDriftY + pointerTiltY * 40 * (t - 0.5);

        var scale = focal / (focal - z);
        // Horizontal fill factor raised from 0.55 -> 0.92: the old value
        // compressed the whole shape into ~55% of the box's width, which
        // is what read as empty margins on the left and right.
        var screenX = cx + x * scale * 0.92;
        var screenY = y;

        var edgeFade = Math.min(1, t / 0.03) * Math.min(1, (1 - t) / 0.03 + 0.4);
        var depthFade = Math.max(0.25, Math.min(1, scale));
        var alpha = 0.55 * edgeFade * depthFade;

        var size = p.size * scale * dpr * 0.6;

        var color;
        if (p.sparkle) {
          var twinkle = 0.5 + 0.5 * Math.sin(elapsed * 2 + p.twinklePhase);
          alpha = Math.min(1, alpha + twinkle * 0.5);
          color = colorForeground;
        } else {
          color = t < 0.55 ? colorPrimary : colorAccent;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.4, size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    var resizeObserver = new ResizeObserver(function () {
      resize();
      buildParticles();
      updateScrollProgress();
    });
    resizeObserver.observe(section);

    resize();
    buildParticles();
    updateScrollProgress();
    requestAnimationFrame(draw);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutParticles);
  } else {
    initAboutParticles();
  }
})();