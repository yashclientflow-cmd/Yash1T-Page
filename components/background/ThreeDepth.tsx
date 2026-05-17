"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getFrameManager } from "@/lib/frameManager";
import { getEventThrottler } from "@/lib/eventThrottler";

export default function ThreeDepth() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isDisabled = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches;
    setEnabled(!isDisabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3)); // Slightly reduced for performance
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const geo = new THREE.BufferGeometry();
    
    // Reduce point count for better performance (from 220 to adaptive count)
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const count = isMobile ? 80 : 160; // Reduced from 220
    
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 18;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xc8ff00,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const grid = new THREE.GridHelper(24, 40, 0x1a2a10, 0x0a1208);
    grid.position.y = -3;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.12;
    (grid.material as THREE.Material).depthTest = false;
    scene.add(grid);

    let w = 0;
    let h = 0;
    let mx = 0;
    let my = 0;
    let unsubscribeThrottler: (() => void) | null = null;
    let unsubscribeFrame: (() => void) | null = null;

    const resize = () => {
      w = mount.clientWidth;
      h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const throttler = getEventThrottler();
    const frameManager = getFrameManager();

    // Throttled mousemove for camera control
    unsubscribeThrottler = throttler.on((e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.3;
      my = (e.clientY / window.innerHeight - 0.5) * 0.2;
    });

    // Rendering in frame loop with lower priority
    unsubscribeFrame = frameManager.subscribe("three", () => {
      points.rotation.y += 0.0006; // Slightly reduced rotation speed
      points.rotation.x += 0.00025; // Slightly reduced
      camera.position.x += (mx * 2 - camera.position.x) * 0.025; // Slightly reduced easing
      camera.position.y += (-my * 2 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }, 0); // Lower priority than other effects

    const handleResize = () => {
      resize();
    };

    resize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (unsubscribeThrottler) unsubscribeThrottler();
      if (unsubscribeFrame) unsubscribeFrame();
      window.removeEventListener("resize", handleResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={mountRef} className="layer layer--three" aria-hidden="true" />;
}
