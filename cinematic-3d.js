/* ==========================================================================
   Ali Hassan — Global Cinematic 3D Floating Engine (cinematic-3d.js)
   Pure Canvas + WebGL/2D Matrix math, 3D physics, mouse camera orbit,
   floating volumetric geometric polyhedra, and continuous card levitation.
   ========================================================================== */

(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     1. GLOBAL 3D SPACE CANVAS (Volumetric Particles, 3D Wireframes & Mesh)
     ========================================================================== */
  function initGlobal3DSpace() {
    const canvas = document.getElementById("global-3d-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Camera & Mouse Orbit State
    const camera = {
      x: 0,
      y: 0,
      z: 0,
      targetX: 0,
      targetY: 0,
      rotX: 0,
      rotY: 0,
      targetRotX: 0,
      targetRotY: 0,
      fov: 750,
      scrollVelocity: 0,
      lastScrollY: window.scrollY
    };

    window.addEventListener("pointermove", (e) => {
      const px = (e.clientX / width) * 2 - 1; // -1 to +1
      const py = (e.clientY / height) * 2 - 1;
      camera.targetRotY = px * 0.45; // camera yaw
      camera.targetRotX = -py * 0.35; // camera pitch
      camera.targetX = px * 120;
      camera.targetY = py * 80;
    }, { passive: true });

    // Scroll Velocity Tracker
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - camera.lastScrollY;
      camera.scrollVelocity = Math.max(-40, Math.min(40, delta * 0.4));
      camera.lastScrollY = currentScrollY;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        camera.scrollVelocity = 0;
      }, 120);
    }, { passive: true });

    // 3D Particles
    const PARTICLE_COUNT = width < 768 ? 95 : 220;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2200,
        y: (Math.random() - 0.5) * 2200,
        z: (Math.random() - 0.5) * 1600,
        size: Math.random() * 2.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.35,
        speedZ: (Math.random() - 0.5) * 0.4,
        colorType: Math.random() > 0.4 ? "primary" : (Math.random() > 0.5 ? "accent" : "white"),
        alpha: Math.random() * 0.55 + 0.25,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // 3D Floating Wireframe Polyhedra (Icosahedrons / Octahedrons / Prisms)
    const POLY_COUNT = width < 768 ? 4 : 9;
    const polyhedra = [];

    // Polyhedron 3D Vertices (Octahedron / Prism)
    const baseVertices = [
      { x: 0, y: -1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 1, z: 0 }
    ];
    const baseEdges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [5, 1], [5, 2], [5, 3], [5, 4],
      [1, 2], [2, 3], [3, 4], [4, 1]
    ];

    for (let i = 0; i < POLY_COUNT; i++) {
      polyhedra.push({
        x: (Math.random() - 0.5) * 1800,
        y: (Math.random() - 0.5) * 1800,
        z: Math.random() * 1000 - 400,
        scale: Math.random() * 32 + 24,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        spinSpeedX: (Math.random() - 0.5) * 0.015,
        spinSpeedY: (Math.random() - 0.5) * 0.018,
        spinSpeedZ: (Math.random() - 0.5) * 0.012,
        floatFreq: Math.random() * 0.0015 + 0.0008,
        floatPhase: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? "oklch(0.79 0.14 190)" : "oklch(0.66 0.16 255)"
      });
    }

    let lastTime = performance.now();

    function render3DScene(currentTime) {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Smooth Camera Interpolation
      camera.rotX += (camera.targetRotX - camera.rotX) * 0.06;
      camera.rotY += (camera.targetRotY - camera.rotY) * 0.06;
      camera.x += (camera.targetX - camera.x) * 0.06;
      camera.y += (camera.targetY - camera.y) * 0.06;

      const cosY = Math.cos(camera.rotY);
      const sinY = Math.sin(camera.rotY);
      const cosX = Math.cos(camera.rotX);
      const sinX = Math.sin(camera.rotX);

      const cx = width / 2;
      const cy = height / 2;

      // Project 3D Point to 2D Screen
      function project(x, y, z) {
        // Translate relative to camera
        const dx = x - camera.x;
        const dy = y - camera.y;
        const dz = z - camera.z;

        // Yaw (Rotation Y)
        const x1 = dx * cosY - dz * sinY;
        const z1 = dx * sinY + dz * cosY;

        // Pitch (Rotation X)
        const y2 = dy * cosX - z1 * sinX;
        const z2 = dy * sinX + z1 * cosX + camera.fov;

        if (z2 <= 20) return null; // Behind camera clipping

        const factor = camera.fov / z2;
        return {
          x: cx + x1 * factor,
          y: cy + y2 * factor,
          scale: factor,
          depth: z2
        };
      }

      // 1. Draw 3D Floating Polyhedra Meshes
      polyhedra.forEach((poly) => {
        if (!reducedMotion) {
          poly.rotX += poly.spinSpeedX;
          poly.rotY += poly.spinSpeedY;
          poly.rotZ += poly.spinSpeedZ;
          poly.y += Math.sin(currentTime * poly.floatFreq + poly.floatPhase) * 0.35;
          poly.z += camera.scrollVelocity * 0.2;

          // Boundary wraps
          if (poly.z > 800) poly.z = -600;
          if (poly.z < -600) poly.z = 800;
        }

        const pCosX = Math.cos(poly.rotX);
        const pSinX = Math.sin(poly.rotX);
        const pCosY = Math.cos(poly.rotY);
        const pSinY = Math.sin(poly.rotY);
        const pCosZ = Math.cos(poly.rotZ);
        const pSinZ = Math.sin(poly.rotZ);

        // Transform vertices
        const projectedVerts = baseVertices.map((v) => {
          // Local Rotation
          let x = v.x * poly.scale;
          let y = v.y * poly.scale;
          let z = v.z * poly.scale;

          // Roll (Z)
          let x1 = x * pCosZ - y * pSinZ;
          let y1 = x * pSinZ + y * pCosZ;
          let z1 = z;

          // Pitch (X)
          let y2 = y1 * pCosX - z1 * pSinX;
          let z2 = y1 * pSinX + z1 * pCosX;

          // Yaw (Y)
          let x3 = x1 * pCosY + z2 * pSinY;
          let y3 = y2;
          let z3 = -x1 * pSinY + z2 * pCosY;

          // World position
          return project(poly.x + x3, poly.y + y3, poly.z + z3);
        });

        // Draw Edges
        ctx.beginPath();
        baseEdges.forEach(([i1, i2]) => {
          const pt1 = projectedVerts[i1];
          const pt2 = projectedVerts[i2];
          if (pt1 && pt2) {
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
          }
        });

        const avgDepth = projectedVerts[0] ? projectedVerts[0].depth : 800;
        const depthAlpha = Math.max(0.06, Math.min(0.28, 500 / avgDepth));
        ctx.strokeStyle = poly.color.replace(")", ` / ${depthAlpha})`);
        ctx.lineWidth = Math.max(0.6, Math.min(1.6, 700 / avgDepth));
        ctx.stroke();

        // Draw glowing vertex nodes
        projectedVerts.forEach((pt) => {
          if (pt) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(1, 2.5 * pt.scale), 0, Math.PI * 2);
            ctx.fillStyle = poly.color.replace(")", ` / ${depthAlpha * 1.5})`);
            ctx.fill();
          }
        });
      });

      // 2. Draw 3D Floating Constellation Particles
      particles.forEach((p) => {
        if (!reducedMotion) {
          p.x += p.speedX;
          p.y += p.speedY;
          p.z += p.speedZ + camera.scrollVelocity * 0.4;
          p.pulsePhase += p.pulseSpeed;

          // Boundary wraps in 3D
          if (p.x > 1100) p.x = -1100;
          if (p.x < -1100) p.x = 1100;
          if (p.y > 1100) p.y = -1100;
          if (p.y < -1100) p.y = 1100;
          if (p.z > 700) p.z = -700;
          if (p.z < -700) p.z = 700;
        }

        const pt = project(p.x, p.y, p.z);
        if (!pt) return;

        const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulsePhase)) * Math.min(1, pt.scale * 1.4);
        const radius = Math.max(0.5, p.size * pt.scale);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

        if (p.colorType === "primary") {
          ctx.fillStyle = `oklch(0.79 0.14 190 / ${currentAlpha})`;
        } else if (p.colorType === "accent") {
          ctx.fillStyle = `oklch(0.66 0.16 255 / ${currentAlpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.8})`;
        }
        ctx.fill();
      });

      requestAnimationFrame(render3DScene);
    }

    requestAnimationFrame(render3DScene);
  }

  /* ==========================================================================
     2. GLOBAL 3D CARD LEVITATION & SPECULAR MAGNETIC LIGHTING
     ========================================================================== */
  function initGlobal3DCardPhysics() {
    // Select only non-skill-card surface cards (skill cards have their own 3D system)
    const cards = document.querySelectorAll(".surface-card:not(.skill-card-3d)");
    if (!cards.length) return;

    cards.forEach((card, index) => {
      // Create Specular Glint & Glow Overlay if missing
      if (!card.querySelector(".card-specular-light")) {
        const glint = document.createElement("div");
        glint.className = "card-specular-light";
        glint.setAttribute("aria-hidden", "true");
        card.appendChild(glint);
      }

      // Add gentle periodic floating levitation offset
      const floatPhase = index * 0.75;
      const floatDuration = 4.5 + (index % 3) * 0.8; // between 4.5s and 6.1s
      card.style.setProperty("--float-duration", `${floatDuration}s`);
      card.style.setProperty("--float-delay", `${floatPhase}s`);
      card.classList.add("float-levitate");

      // Magnetic 3D Pointer Interaction
      if (!reducedMotion && window.matchMedia("(hover: hover)").matches) {
        let isHovered = false;

        card.addEventListener("pointerenter", () => {
          isHovered = true;
          card.classList.add("is-hovered-3d");
        });

        card.addEventListener("pointermove", (e) => {
          if (!isHovered) return;
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width; // 0..1
          const py = (e.clientY - rect.top) / rect.height; // 0..1

          const rx = (0.5 - py) * 12; // tilt X (-6deg to +6deg)
          const ry = (px - 0.5) * 14; // tilt Y (-7deg to +7deg)

          card.style.setProperty("--tilt-rx", `${rx.toFixed(2)}deg`);
          card.style.setProperty("--tilt-ry", `${ry.toFixed(2)}deg`);
          card.style.setProperty("--pointer-x", `${(px * 100).toFixed(1)}%`);
          card.style.setProperty("--pointer-y", `${(py * 100).toFixed(1)}%`);
        });

        card.addEventListener("pointerleave", () => {
          isHovered = false;
          card.classList.remove("is-hovered-3d");
          card.style.setProperty("--tilt-rx", "0deg");
          card.style.setProperty("--tilt-ry", "0deg");
        });
      }
    });
  }

  /* ==========================================================================
     3. MULTI-PLANE 3D PARALLAX DEPTH ON SCROLL
     ========================================================================== */
  function init3DMultiPlaneParallax() {
    const floatingElements = document.querySelectorAll("[data-parallax-3d]");
    if (!floatingElements.length || reducedMotion) return;

    let ticking = false;

    function update3DParallax() {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      floatingElements.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-parallax-3d")) || 0.1;
        const rect = el.getBoundingClientRect();
        const offsetFromCenter = rect.top + rect.height / 2 - vh / 2;
        const yShift = -offsetFromCenter * speed;
        const rotShift = (-offsetFromCenter * speed * 0.04).toFixed(2);

        el.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0) rotateZ(${rotShift}deg)`;
      });

      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update3DParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // Initialize all 3D subsystems when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initGlobal3DSpace();
      initGlobal3DCardPhysics();
      init3DMultiPlaneParallax();
    });
  } else {
    initGlobal3DSpace();
    initGlobal3DCardPhysics();
    init3DMultiPlaneParallax();
  }
})();
