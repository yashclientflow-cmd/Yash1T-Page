document.addEventListener("DOMContentLoaded", function () {
  const canvasHero = document.getElementById("canvas-hero");
  const canvasBuild = document.getElementById("canvas-build");

  if (!canvasHero || !canvasBuild || !window.HeroScene || !window.BuildScene || !window.gsap || !window.ScrollTrigger) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const heroScene = new window.HeroScene({
    canvas: canvasHero,
    heroSection: document.querySelector(".hero"),
    heroStats: document.querySelector(".hero-stats")
  });
  const buildScene = new window.BuildScene({
    canvas: canvasBuild
  });

  const state = {
    heroAlpha: 1,
    buildAlpha: 0,
    buildProgress: 0
  };

  function applySceneState() {
    heroScene.setVisibility(state.heroAlpha);
    buildScene.setVisibility(state.buildAlpha);
    buildScene.setSectionProgress(state.buildProgress);
  }

  function syncViewport() {
    heroScene.resize(window.innerWidth, window.innerHeight);
    buildScene.resize(window.innerWidth, window.innerHeight);
  }

  applySceneState();
  syncViewport();

  const transitionTrigger =
    document.querySelector("#products") || document.querySelector("#trajectory");
  const progressTrigger = document.querySelector("#trajectory") || transitionTrigger;

  if (transitionTrigger) {
    const transitionTimeline = gsap.timeline({
      paused: true,
      defaults: {
        duration: 0.6,
        ease: "power2.out"
      },
      onUpdate: applySceneState
    });

    transitionTimeline
      .to(state, { heroAlpha: 0 }, 0)
      .to(document.body, { backgroundColor: "#080c1a" }, 0)
      .to(state, { buildAlpha: 1 }, 0.3);

    ScrollTrigger.create({
      trigger: transitionTrigger,
      start: "top 50%",
      onEnter: function () {
        transitionTimeline.play();
      },
      onEnterBack: function () {
        transitionTimeline.play();
      },
      onLeaveBack: function () {
        transitionTimeline.reverse();
      }
    });

    const triggerTop =
      transitionTrigger.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY >= triggerTop - window.innerHeight * 0.5) {
      transitionTimeline.progress(1);
    }
  }

  if (progressTrigger) {
    gsap.to(state, {
      buildProgress: 1,
      ease: "none",
      onUpdate: applySceneState,
      scrollTrigger: {
        trigger: progressTrigger,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  }

  let resizeFrame = 0;
  window.addEventListener("resize", function () {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(function () {
      syncViewport();
      ScrollTrigger.refresh();
    });
  });

  let lastFrame = performance.now();
  let elapsed = 0;

  function tick(now) {
    requestAnimationFrame(tick);

    if (document.hidden) {
      lastFrame = now;
      return;
    }

    const delta = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    elapsed += delta;

    heroScene.update(delta, elapsed);
    buildScene.update(delta, elapsed);
    heroScene.render();
    buildScene.render();
  }

  requestAnimationFrame(tick);
});
