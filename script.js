/* Ali Hassan — Portfolio interactions (vanilla JS, no framework) */
(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------- fluid-ink hero background ----------------- */
  // Mounts the WebGL fluid simulation onto the hero canvas, replacing the
  // old static hero-bg.jpg. Skipped entirely for prefers-reduced-motion,
  // and fails silently (leaving the hero's plain gradient/dark background)
  // if WebGL isn't available.
  const fluidCanvas = document.getElementById("hero-fluid-canvas");
  if (fluidCanvas && !reducedMotion && typeof fluidSimulation === "function") {
    try {
      fluidSimulation(fluidCanvas);
    } catch (err) {
      fluidCanvas.style.display = "none";
    }
  } else if (fluidCanvas) {
    fluidCanvas.style.display = "none";
  }

  /* ---------------------------- sticky header --------------------------- */
  const header = document.querySelector("[data-header]");
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------- mobile menu (hamburger -> X morph) ------ */
  const toggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const hamburger = document.querySelector("[data-hamburger]");

  const setMenu = (open) => {
    if (!mobileNav || !toggle) return;
    mobileNav.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (hamburger) hamburger.classList.toggle("is-open", open);
  };

  if (toggle) {
    setMenu(false);
    toggle.addEventListener("click", () => {
      setMenu(mobileNav.hidden);
    });
    mobileNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setMenu(false));
    });
  }

  /* ------------------------- infinite tech marquee ---------------------- */
  const track = document.querySelector("[data-marquee]");
  if (track && !track.dataset.cloned) {
    track.innerHTML += track.innerHTML; // duplicate for a seamless loop
    track.dataset.cloned = "true";
  }

  /* ----------------- scroll reveal (with stagger) + meters -------------- */
  const revealables = document.querySelectorAll(".reveal");
  const meters = document.querySelectorAll(".meter > span");

  // assign a staggered reveal delay to any .reveal sitting inside a
  // .stagger-group, so siblings animate in sequence instead of all at once
  document.querySelectorAll(".stagger-group").forEach((group) => {
    const items = group.querySelectorAll(".reveal");
    items.forEach((item, i) => {
      item.style.setProperty("--reveal-delay", `${Math.min(i * 90, 450)}ms`);
    });
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    revealables.forEach((el) => io.observe(el));

    const meterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.width = (entry.target.dataset.level || 0) + "%";
          meterIO.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    meters.forEach((el) => meterIO.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-visible"));
    meters.forEach((el) => (el.style.width = (el.dataset.level || 0) + "%"));
  }

  /* ------------------------------ scroll spy ---------------------------- */
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const spy = () => {
    const pos = window.scrollY + 120;
    let activeIndex = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= pos) activeIndex = i;
    });
    navLinks.forEach((link, i) => link.classList.toggle("is-active", i === activeIndex));
  };
  if (sections.length) {
    spy();
    window.addEventListener("scroll", spy, { passive: true });
  }

  /* ------------------------------ typewriter ----------------------------- */
  // types out the hero subhead once, on load, then leaves a static caret off
  const typeEl = document.querySelector("[data-typewriter]");
  if (typeEl && !reducedMotion) {
    const fullText = typeEl.textContent.trim();
    typeEl.textContent = "";
    let i = 0;
    const speed = 18; // ms per character
    const tick = () => {
      typeEl.textContent = fullText.slice(0, i);
      i += 1;
      if (i <= fullText.length) {
        window.requestAnimationFrame(() => setTimeout(tick, speed));
      } else {
        typeEl.classList.add("is-done");
      }
    };
    // wait a beat after load so it doesn't fight the hero's reveal transition
    setTimeout(tick, 500);
  }

  /* -------------------------- tilt card (pointer 3D) --------------------- */
  const tiltCard = document.querySelector(".tilt-card");
  if (tiltCard && !reducedMotion && window.matchMedia("(hover: hover)").matches) {
    const maxTilt = 6; // degrees
    tiltCard.addEventListener("pointermove", (e) => {
      const rect = tiltCard.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const ry = (px - 0.5) * maxTilt * 2;
      const rx = (0.5 - py) * maxTilt * 2;
      tiltCard.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      tiltCard.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    });
    tiltCard.addEventListener("pointerleave", () => {
      tiltCard.style.setProperty("--rx", "0deg");
      tiltCard.style.setProperty("--ry", "0deg");
    });
  }

  /* --------------------------- grid-lines parallax ------------------------ */
  const parallaxEl = document.querySelector("[data-parallax]");
  if (parallaxEl && !reducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      const y = window.scrollY * 0.08; // subtle drift
      parallaxEl.style.setProperty("--parallax-y", `${y}px`);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
  }
  
  /* ==========================================================================
     Skills Section — ULTRA-PREMIUM Cinematic 3D Interactive Engine
     Cinematic scroll reveal, velocity-aware physics, spring inertia,
     dynamic lighting, magnetic badges, and advanced depth layering.
     ========================================================================== */
  const initSkills3DEngine = () => {
    const skillsSection = document.getElementById("skills");
    const cardScenes = Array.from(document.querySelectorAll("#skills .skill-card-scene"));
    if (!skillsSection || !cardScenes.length) return;

    const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
    if (hasGSAP) {
      gsap.registerPlugin(ScrollTrigger);
    }

    const hoverCapable = window.matchMedia("(hover: hover)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // ========================================================================
    // 1. CINEMATIC SCROLL REVEAL — Multi-Stage 3D Entrance Animation
    // ========================================================================
    if (hasGSAP && !reducedMotion) {
      cardScenes.forEach((scene, index) => {
        const isEven = index % 2 === 0;
        
        // Stage 1: Hidden Depth — cinematic starting position
        const startX = isEven ? -200 : 200;
        const startZ = -300;
        const startRY = isEven ? -40 : 40;
        const startRX = 15;
        const startScale = 0.75;
        const startBlur = 12;

        gsap.set(scene, {
          x: startX,
          z: startZ,
          rotateY: startRY,
          rotateX: startRX,
          scale: startScale,
          opacity: 0,
          filter: `blur(${startBlur}px)`,
          transformPerspective: 1600,
          transformOrigin: "50% 50%",
        });

        // Stage 2 & 3: Camera Approach -> Stabilization with spring physics
        const entranceTl = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            start: "top 88%",
            toggleActions: "play none none none",
            once: true,
          },
          delay: Math.min(index * 0.15, 0.75), // 150ms stagger
        });

        // Phase 1: Opacity & Blur (0.6s)
        entranceTl.to(
          scene,
          {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.6,
            ease: "power2.out",
          },
          0
        );

        // Phase 2: Camera Approach — speeding toward viewer (0.85s)
        entranceTl.to(
          scene,
          {
            x: isEven ? 8 : -8, // subtle lateral overshoot
            z: 25,
            rotateY: isEven ? 3 : -3,
            rotateX: -2.5,
            scale: 1.05, // overshoot scale
            duration: 0.85,
            ease: "power3.out",
          },
          0
        );

        // Phase 3: Spring Stabilization — physical settling with bounce (0.8s)
        entranceTl.to(
          scene,
          {
            x: 0,
            z: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.4)",
            onComplete: () => {
              scene.classList.add("is-settled");
            },
          },
          ">-0.35" // 35% overlap for smooth acceleration
        );

        // ====================================================================
        // PROGRESS BAR — Cinematic Multi-Stage Energy Animation
        // ====================================================================
        const meterSpan = scene.querySelector(".meter > span");
        const energyPulse = scene.querySelector(".meter-energy-pulse");
        const targetLevel = meterSpan ? parseFloat(meterSpan.dataset.level) || 85 : 85;

        if (meterSpan) {
          gsap.set(meterSpan, { width: "0%" });
          
          // Multi-phase progress bar animation
          entranceTl
            // Phase 1: Slow start (0–30%)
            .to(
              meterSpan,
              {
                width: `${targetLevel * 0.3}%`,
                duration: 0.4,
                ease: "power1.in",
                onStart: () => {
                  if (energyPulse) energyPulse.classList.add("is-animating");
                },
              },
              0.35
            )
            // Phase 2: Accelerate (30–85%)
            .to(
              meterSpan,
              {
                width: `${targetLevel * 0.85}%`,
                duration: 0.55,
                ease: "power2.inOut",
              },
              ">-0.1"
            )
            // Phase 3: Final settle (85–100%)
            .to(
              meterSpan,
              {
                width: `${targetLevel}%`,
                duration: 0.45,
                ease: "back.out(1.2)",
              },
              ">-0.15"
            );
        }
      });

      // ======================================================================
      // 2. SCROLL VELOCITY REACTION — Physics-Based 3D Movement
      // ======================================================================
      let targetVelocity = 0;
      let smoothVelocity = 0;
      let scrollDampingFactor = 0.92;

      ScrollTrigger.create({
        trigger: skillsSection,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          targetVelocity = self.getVelocity() || 0;
          // Adjust damping based on scroll intensity
          scrollDampingFactor = Math.abs(targetVelocity) > 500 ? 0.88 : 0.92;
        },
      });

      // Continuous high-frequency physics loop
      gsap.ticker.add(() => {
        // Smooth velocity interpolation with adaptive damping
        smoothVelocity += (targetVelocity - smoothVelocity) * 0.14;
        targetVelocity *= scrollDampingFactor;

        const vh = window.innerHeight || document.documentElement.clientHeight;
        
        // Velocity-responsive transformations
        const velTilt = Math.max(-8, Math.min(8, smoothVelocity * 0.0026));
        const velZ = Math.max(-55, Math.min(0, -Math.abs(smoothVelocity) * 0.038));
        const velMotionBlur = Math.max(0, Math.min(4, Math.abs(smoothVelocity) * 0.002));

        cardScenes.forEach((scene, i) => {
          if (!scene.classList.contains("is-settled")) return;

          const rect = scene.getBoundingClientRect();
          const progress = (vh - rect.top) / (vh + rect.height);
          if (progress < -0.2 || progress > 1.2) return;

          const clampedProgress = Math.max(0, Math.min(1, progress));
          const dir = i % 2 === 0 ? 1 : -1;

          // Smooth orbit rotation: -8deg → 0deg → +8deg
          const orbitRY = (clampedProgress - 0.5) * 14 * dir;
          const orbitRX = (0.5 - clampedProgress) * 5.5 + velTilt;
          const orbitZ = velZ;

          // Scroll exit: smooth depth retreat + scale + opacity fade
          const exitPhase = Math.max(0, progress - 0.88);
          const exitScale = exitPhase > 0 ? 1 - exitPhase * 0.5 : 1;
          const exitOpacity = exitPhase > 0 ? 1 - exitPhase * 2.8 : 1;

          // Apply combined scroll transforms
          gsap.set(scene, {
            rotateY: orbitRY,
            rotateX: orbitRX,
            z: orbitZ,
            scale: Math.max(0.85, exitScale),
            opacity: Math.max(0.5, exitOpacity),
            overwrite: "auto",
          });

          // Motion blur during fast scroll
          const card = scene.querySelector(".skill-card-3d");
          if (card) {
            card.style.setProperty("--motion-blur", `${velMotionBlur.toFixed(2)}px`);
          }
        });
      });
    } else {
      // Accessible fallback
      cardScenes.forEach((scene) => {
        scene.style.opacity = "1";
        scene.style.transform = "none";
        const meterSpan = scene.querySelector(".meter > span");
        if (meterSpan) meterSpan.style.width = (meterSpan.dataset.level || 85) + "%";
      });
    }

    // ========================================================================
    // 3. MOUSE-BASED 3D TRACKING — Spring Physics + Dynamic Lighting
    // ========================================================================
    if (!reducedMotion && hoverCapable && !isMobile) {
      const BADGE_PARALLAX_FACTORS = [1.00, 1.22, 0.82, 1.28, 1.08, 0.91];
      const activeCardsPhysics = [];
      const badgeUpdaters = [];

      cardScenes.forEach((scene) => {
        const card = scene.querySelector(".skill-card-3d");
        const shadow = scene.querySelector(".skill-card-shadow");
        const badges = Array.from(scene.querySelectorAll(".chip"));
        if (!card) return;

        // Spring physics state with separate layers
        const state = {
          current: {
            rx: 0, ry: 0, tx: 0, ty: 0, tz: 0,
            lightX: 50, lightY: 50, lightOp: 0,
            shadowX: 0, shadowY: 18, shadowBlur: 36, shadowSpread: -10, shadowOp: 0.65,
          },
          target: {
            rx: 0, ry: 0, tx: 0, ty: 0, tz: 0,
            lightX: 50, lightY: 50, lightOp: 0,
            shadowX: 0, shadowY: 18, shadowBlur: 36, shadowSpread: -10, shadowOp: 0.65,
          },
          velocity: { rx: 0, ry: 0, tx: 0, ty: 0, tz: 0 },
        };

        let hoverActive = false;

        // Pointer move — normalized + dynamic lighting
        card.addEventListener("pointermove", (e) => {
          hoverActive = true;
          const rect = card.getBoundingClientRect();
          const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
          const lightX = ((e.clientX - rect.left) / rect.width) * 100;
          const lightY = ((e.clientY - rect.top) / rect.height) * 100;

          // Enhanced 3D rotation with better sensitivity
          state.target.ry = nx * 10.5;
          state.target.rx = -ny * 8.2;
          state.target.tx = nx * 11;
          state.target.ty = ny * 11;
          state.target.tz = 48;

          // Dynamic light intensity
          const lightIntensity = 1 + (Math.abs(nx) + Math.abs(ny)) * 0.15;
          state.target.lightX = lightX;
          state.target.lightY = lightY;
          state.target.lightOp = Math.min(1.1, lightIntensity * 0.95);

          // Reactive shadow
          state.target.shadowX = -nx * 18;
          state.target.shadowY = ny * 10 + 28;
          state.target.shadowBlur = 68;
          state.target.shadowSpread = -4;
          state.target.shadowOp = 0.85;
        });

        // Pointer leave — momentum + damping
        card.addEventListener("pointerleave", () => {
          hoverActive = false;
          state.target.rx = 0;
          state.target.ry = 0;
          state.target.tx = 0;
          state.target.ty = 0;
          state.target.tz = 0;
          state.target.lightOp = 0;
          state.target.shadowX = 0;
          state.target.shadowY = 18;
          state.target.shadowBlur = 36;
          state.target.shadowSpread = -10;
          state.target.shadowOp = 0.65;
        });

        // Focus/Blur accessibility
        card.addEventListener("focus", () => {
          state.target.tz = 36;
          state.target.lightOp = 0.55;
          state.target.lightX = 50;
          state.target.lightY = 50;
        });

        card.addEventListener("blur", () => {
          if (!hoverActive) {
            state.target.tz = 0;
            state.target.lightOp = 0;
          }
        });

        // Magnetic Badge Physics
        badges.forEach((chip, chipIdx) => {
          const chipState = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, scale: 1 };
          const chipTarget = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, scale: 1 };
          let chipHovered = false;

          chip.addEventListener("pointermove", (e) => {
            e.stopPropagation();
            chipHovered = true;
            chip.classList.add("is-magnetic");
            const cRect = chip.getBoundingClientRect();
            const cnx = ((e.clientX - cRect.left) / cRect.width) * 2 - 1;
            const cny = ((e.clientY - cRect.top) / cRect.height) * 2 - 1;

            chipTarget.tx = cnx * 7.5;
            chipTarget.ty = cny * 6;
            chipTarget.tz = 22;
            chipTarget.rx = -cny * 7;
            chipTarget.ry = cnx * 7.5;
            chipTarget.scale = 1.12;
          });

          chip.addEventListener("pointerleave", () => {
            chipHovered = false;
            chipTarget.tx = 0;
            chipTarget.ty = 0;
            chipTarget.tz = 0;
            chipTarget.rx = 0;
            chipTarget.ry = 0;
            chipTarget.scale = 1;
            setTimeout(() => {
              if (!chipHovered) chip.classList.remove("is-magnetic");
            }, 300);
          });

          badgeUpdaters.push(() => {
            if (chipHovered || chip.classList.contains("is-magnetic")) {
              chipState.tx += (chipTarget.tx - chipState.tx) * 0.26;
              chipState.ty += (chipTarget.ty - chipState.ty) * 0.26;
              chipState.tz += (chipTarget.tz - chipState.tz) * 0.26;
              chipState.rx += (chipTarget.rx - chipState.rx) * 0.26;
              chipState.ry += (chipTarget.ry - chipState.ry) * 0.26;
              chipState.scale += (chipTarget.scale - chipState.scale) * 0.26;

              chip.style.setProperty("--badge-tx", `${chipState.tx.toFixed(2)}px`);
              chip.style.setProperty("--badge-ty", `${chipState.ty.toFixed(2)}px`);
              chip.style.setProperty("--badge-tz", `${chipState.tz.toFixed(2)}px`);
              chip.style.setProperty("--badge-rx", `${chipState.rx.toFixed(2)}deg`);
              chip.style.setProperty("--badge-ry", `${chipState.ry.toFixed(2)}deg`);
              chip.style.setProperty("--badge-scale", `${chipState.scale.toFixed(3)}`);
            }
          });
        });

        // Premium Harmonic Spring Physics
        const springStiffness = 0.135;
        const dampingFriction = 0.80;
        const maxVelocityClamp = 15;

        const physicsStep = () => {
          // Rotation X
          const fx_rx = (state.target.rx - state.current.rx) * springStiffness;
          state.velocity.rx = Math.max(-maxVelocityClamp, Math.min(maxVelocityClamp,
            (state.velocity.rx + fx_rx) * dampingFriction
          ));
          state.current.rx += state.velocity.rx;

          // Rotation Y
          const fx_ry = (state.target.ry - state.current.ry) * springStiffness;
          state.velocity.ry = Math.max(-maxVelocityClamp, Math.min(maxVelocityClamp,
            (state.velocity.ry + fx_ry) * dampingFriction
          ));
          state.current.ry += state.velocity.ry;

          // Translation X
          const fx_tx = (state.target.tx - state.current.tx) * springStiffness;
          state.velocity.tx = Math.max(-maxVelocityClamp, Math.min(maxVelocityClamp,
            (state.velocity.tx + fx_tx) * dampingFriction
          ));
          state.current.tx += state.velocity.tx;

          // Translation Y
          const fx_ty = (state.target.ty - state.current.ty) * springStiffness;
          state.velocity.ty = Math.max(-maxVelocityClamp, Math.min(maxVelocityClamp,
            (state.velocity.ty + fx_ty) * dampingFriction
          ));
          state.current.ty += state.velocity.ty;

          // Elevation Z
          const fx_tz = (state.target.tz - state.current.tz) * springStiffness;
          state.velocity.tz = Math.max(-maxVelocityClamp, Math.min(maxVelocityClamp,
            (state.velocity.tz + fx_tz) * dampingFriction
          ));
          state.current.tz += state.velocity.tz;

          // Dynamic Lighting & Shadow
          state.current.lightX += (state.target.lightX - state.current.lightX) * 0.18;
          state.current.lightY += (state.target.lightY - state.current.lightY) * 0.18;
          state.current.lightOp += (state.target.lightOp - state.current.lightOp) * 0.14;

          state.current.shadowX += (state.target.shadowX - state.current.shadowX) * 0.16;
          state.current.shadowY += (state.target.shadowY - state.current.shadowY) * 0.16;
          state.current.shadowBlur += (state.target.shadowBlur - state.current.shadowBlur) * 0.16;
          state.current.shadowSpread += (state.target.shadowSpread - state.current.shadowSpread) * 0.16;
          state.current.shadowOp += (state.target.shadowOp - state.current.shadowOp) * 0.16;

          // Apply to card
          card.style.setProperty("--rx", `${state.current.rx.toFixed(3)}deg`);
          card.style.setProperty("--ry", `${state.current.ry.toFixed(3)}deg`);
          card.style.setProperty("--tx", `${state.current.tx.toFixed(2)}px`);
          card.style.setProperty("--ty", `${state.current.ty.toFixed(2)}px`);
          card.style.setProperty("--tz", `${state.current.tz.toFixed(2)}px`);

          card.style.setProperty("--light-x", `${state.current.lightX.toFixed(2)}%`);
          card.style.setProperty("--light-y", `${state.current.lightY.toFixed(2)}%`);
          card.style.setProperty("--light-opacity", `${state.current.lightOp.toFixed(3)}`);
          card.style.setProperty("--border-glow-op", `${(state.current.lightOp * 0.9).toFixed(3)}`);
          card.style.setProperty("--sheen-opacity", `${(0.15 + state.current.lightOp * 0.42).toFixed(3)}`);

          if (shadow) {
            shadow.style.setProperty("--shadow-x", `${state.current.shadowX.toFixed(2)}px`);
            shadow.style.setProperty("--shadow-y", `${state.current.shadowY.toFixed(2)}px`);
            shadow.style.setProperty("--shadow-blur", `${state.current.shadowBlur.toFixed(2)}px`);
            shadow.style.setProperty("--shadow-spread", `${state.current.shadowSpread.toFixed(2)}px`);
            shadow.style.setProperty("--shadow-op", `${state.current.shadowOp.toFixed(3)}`);
          }

          // Independent badge parallax
          badges.forEach((chip, bIdx) => {
            if (chip.classList.contains("is-magnetic")) return;
            const parallaxFactor = BADGE_PARALLAX_FACTORS[bIdx % BADGE_PARALLAX_FACTORS.length];
            const parallaxX = -state.current.ry * 0.42 * parallaxFactor;
            const parallaxY = state.current.rx * 0.42 * parallaxFactor;
            chip.style.setProperty("--badge-tx", `${parallaxX.toFixed(2)}px`);
            chip.style.setProperty("--badge-ty", `${parallaxY.toFixed(2)}px`);
            chip.style.setProperty("--badge-tz", "0px");
            chip.style.setProperty("--badge-rx", "0deg");
            chip.style.setProperty("--badge-ry", "0deg");
            chip.style.setProperty("--badge-scale", "1");
          });
        };

        activeCardsPhysics.push(physicsStep);
      });

      // Unified 60 FPS Physics Ticker
      const physicsLoop = () => {
        for (let i = 0; i < activeCardsPhysics.length; i++) {
          activeCardsPhysics[i]();
        }
        for (let j = 0; j < badgeUpdaters.length; j++) {
          badgeUpdaters[j]();
        }
      };

      if (hasGSAP) {
        gsap.ticker.add(physicsLoop);
      } else {
        const animLoop = () => {
          physicsLoop();
          requestAnimationFrame(animLoop);
        };
        requestAnimationFrame(animLoop);
      }
    } else if (isMobile) {
      // Mobile fallback — Gesture-aware
      cardScenes.forEach((scene) => {
        const card = scene.querySelector(".skill-card-3d");
        if (!card) return;

        card.addEventListener("touchstart", () => {
          card.style.setProperty("--tz", "24px");
          card.style.setProperty("--light-opacity", "0.3");
        });

        card.addEventListener("touchend", () => {
          card.style.setProperty("--tz", "0px");
          card.style.setProperty("--light-opacity", "0");
        });
      });
    }
  };

  initSkills3DEngine();

  /* ------------------------------ footer year --------------------------- */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();