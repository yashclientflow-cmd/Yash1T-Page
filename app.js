/**
 * 2.5D Antigravity + GSAP ScrollTrigger parallax system
 * Animates only transform + opacity (+ blur via CSS custom property)
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  const bgHero = document.getElementById("bgHero");
  const bgHeroInner = document.getElementById("bgHeroInner");
  const bgDashboard = document.getElementById("bgDashboard");
  const bgDashboardInner = document.getElementById("bgDashboardInner");
  const heroSection = document.getElementById("hero");
  const goalsSection = document.getElementById("goals");
  const scrollHint = document.getElementById("scrollHint");

  if (!bgHero || !bgHeroInner || !bgDashboard || !goalsSection) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ── Mouse / touch / device-orientation parallax tilt ── */
  const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const TILT_STRENGTH = 6;
  const TILT_EASE = 0.08;
  let tiltRafId = null;

  function applyTilt() {
    tilt.x += (tilt.targetX - tilt.x) * TILT_EASE;
    tilt.y += (tilt.targetY - tilt.y) * TILT_EASE;

    const rotateX = tilt.y;
    const rotateY = -tilt.x;

    bgHeroInner.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    if (
      Math.abs(tilt.targetX - tilt.x) > 0.01 ||
      Math.abs(tilt.targetY - tilt.y) > 0.01
    ) {
      tiltRafId = requestAnimationFrame(applyTilt);
    } else {
      tiltRafId = null;
    }
  }

  function setTiltFromNormalized(nx, ny) {
    tilt.targetX = nx * TILT_STRENGTH;
    tilt.targetY = ny * TILT_STRENGTH;
    if (!tiltRafId) tiltRafId = requestAnimationFrame(applyTilt);
  }

  function resetTilt() {
    tilt.targetX = 0;
    tilt.targetY = 0;
    if (!tiltRafId) tiltRafId = requestAnimationFrame(applyTilt);
  }

  if (!prefersReducedMotion) {
    window.addEventListener(
      "mousemove",
      (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setTiltFromNormalized(nx, ny);
      },
      { passive: true }
    );

    window.addEventListener("mouseleave", resetTilt, { passive: true });

    /* Touch drag parallax fallback */
    window.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches.length) return;
        const t = e.touches[0];
        const nx = (t.clientX / window.innerWidth - 0.5) * 2;
        const ny = (t.clientY / window.innerHeight - 0.5) * 2;
        setTiltFromNormalized(nx, ny);
      },
      { passive: true }
    );

    window.addEventListener("touchend", resetTilt, { passive: true });

    /* Device orientation fallback (mobile) */
    if (window.DeviceOrientationEvent) {
      const requestOrientation =
        typeof DeviceOrientationEvent.requestPermission === "function";

      const bindOrientation = () => {
        window.addEventListener(
          "deviceorientation",
          (e) => {
            const beta = e.beta ?? 0;
            const gamma = e.gamma ?? 0;
            const nx = Math.max(-1, Math.min(1, gamma / 45));
            const ny = Math.max(-1, Math.min(1, (beta - 45) / 45));
            setTiltFromNormalized(nx, ny);
          },
          { passive: true }
        );
      };

      if (requestOrientation && isCoarsePointer) {
        document.body.addEventListener(
          "touchstart",
          () => {
            DeviceOrientationEvent.requestPermission()
              .then((state) => {
                if (state === "granted") bindOrientation();
              })
              .catch(() => {});
          },
          { once: true, passive: true }
        );
      } else {
        bindOrientation();
      }
    }
  }

  /* ── Hero scroll-out: scale, opacity, blur (3D fall-back) ── */
  const heroScrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: heroSection,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  heroScrollTl
    .to(
      bgHero,
      {
        scale: 0.88,
        opacity: 0.15,
        ease: "none",
        force3D: true,
      },
      0
    )
    .to(
      bgHero,
      {
        "--bg-blur": "12px",
        ease: "none",
      },
      0
    );

  if (scrollHint) {
    gsap.to(scrollHint, {
      opacity: 0,
      y: -12,
      ease: "none",
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "+=120",
        scrub: true,
      },
    });
  }

  const contactCards = document.querySelectorAll(
    ".contact-whatsapp, .contact-email"
  );
  const whatsappCard = document.querySelector(".contact-whatsapp");
  const emailCard = document.querySelector(".contact-email");

  if (!prefersReducedMotion && contactCards.length) {
    let scrollY = 0;
    let targetY = { whatsapp: 0, email: 0 };
    let currentY = { whatsapp: 0, email: 0 };
    let isAnimating = false;

    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
      targetY.whatsapp = Math.min(scrollY * 0.12, 60);
      targetY.email = Math.min(scrollY * 0.08, 50);
      
      if (!isAnimating) {
        isAnimating = true;
        updateCardMovement();
      }
    }, { passive: true });

    function updateCardMovement() {
      currentY.whatsapp += (targetY.whatsapp - currentY.whatsapp) * 0.18;
      currentY.email += (targetY.email - currentY.email) * 0.18;

      if (whatsappCard) {
        gsap.set(whatsappCard, { y: currentY.whatsapp, force3D: true });
      }
      if (emailCard) {
        gsap.set(emailCard, { y: currentY.email, force3D: true });
      }

      const threshold = 0.05;
      if (
        Math.abs(targetY.whatsapp - currentY.whatsapp) > threshold ||
        Math.abs(targetY.email - currentY.email) > threshold
      ) {
        requestAnimationFrame(updateCardMovement);
      } else {
        isAnimating = false;
      }
    }
  }

  /* ── Dashboard pop: section #goals ── */
  gsap.set(bgDashboard, {
    scale: 0.8,
    opacity: 0,
    "--bg-blur": "16px",
    force3D: true,
  });

  const dashboardTl = gsap.timeline({
    scrollTrigger: {
      trigger: goalsSection,
      start: "top 85%",
      end: "center center",
      scrub: 0.5,
      invalidateOnRefresh: true,
      onEnter: () => bgDashboard.classList.add("is-active"),
      onLeaveBack: () => {
        bgDashboard.classList.remove("is-active");
      },
    },
  });

  dashboardTl
    .to(
      bgDashboard,
      {
        scale: 1,
        opacity: 1,
        "--bg-blur": "0px",
        ease: "none",
        force3D: true,
      },
      0
    )
    .to(
      bgDashboardInner,
      {
        scale: 1.02,
        ease: "none",
        force3D: true,
      },
      0
    );

  /* Subtle dashboard parallax while locked in (preserve scale) */
  ScrollTrigger.create({
    trigger: goalsSection,
    start: "top bottom",
    end: "bottom top",
    scrub: 0.8,
    onUpdate: (self) => {
      if (!bgDashboard.classList.contains("is-active")) return;
      const y = (self.progress - 0.5) * 40;
      gsap.set(bgDashboardInner, {
        y,
        scale: 1.02,
        force3D: true,
      });
    },
  });

  /* Fade hero completely once goals section dominates */
  ScrollTrigger.create({
    trigger: goalsSection,
    start: "top 60%",
    end: "top 20%",
    scrub: true,
    onUpdate: (self) => {
      gsap.set(bgHero, {
        opacity: Math.max(0, 0.15 - self.progress * 0.15),
        force3D: true,
      });
    },
  });

  /* ── Content reveal (IntersectionObserver) ── */
  const reveals = document.querySelectorAll(".reveal");
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("visible"), i * 60);
          revealObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  reveals.forEach((el) => revealObs.observe(el));

  /* ── Trajectory phase switcher ── */
  const phaseNodes = document.querySelectorAll(".phase-node");
  const trajPanels = document.querySelectorAll(".traj-panel");

  phaseNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const phase = node.dataset.phase;
      phaseNodes.forEach((n) => n.classList.remove("active"));
      trajPanels.forEach((p) => p.classList.remove("active"));
      node.classList.add("active");
      const panel = document.querySelector(`.traj-panel[data-panel="${phase}"]`);
      if (panel) panel.classList.add("active");
    });
  });

  /* ── Custom cursor ── */
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");

  if (cursor && ring && !isCoarsePointer) {
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;

    document.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.left = `${mx}px`;
        cursor.style.top = `${my}px`;
      },
      { passive: true }
    );

    function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(animRing);
    }
    animRing();

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.style.transform = "translate3d(-50%, -50%, 0) scale(1.8)";
      });
      el.addEventListener("mouseleave", () => {
        ring.style.transform = "translate3d(-50%, -50%, 0) scale(1)";
      });
    });
  }

  /* Refresh ScrollTrigger after images load */
  const images = document.querySelectorAll(".bg-layer__img");
  let loaded = 0;
  const onImgLoad = () => {
    loaded += 1;
    if (loaded >= images.length) ScrollTrigger.refresh();
  };
  images.forEach((img) => {
    if (img.complete) onImgLoad();
    else img.addEventListener("load", onImgLoad);
  });

  window.addEventListener("resize", () => ScrollTrigger.refresh(), { passive: true });
})();
