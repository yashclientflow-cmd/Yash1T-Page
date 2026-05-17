(function () {
  const GOLD = 0xf5a623;
  const HERO_BLACK = 0x0a0a0a;
  const WHITE = 0xffffff;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setMaterialOpacity(material, opacity) {
    if (Array.isArray(material)) {
      material.forEach(function (entry) {
        entry.transparent = true;
        entry.opacity = opacity;
      });
      return;
    }

    material.transparent = true;
    material.opacity = opacity;
  }

  function screenToWorld(camera, width, height, screenX, screenY, targetZ) {
    const ndc = new THREE.Vector3(
      (screenX / width) * 2 - 1,
      -(screenY / height) * 2 + 1,
      0.5
    );
    ndc.unproject(camera);
    const direction = ndc.sub(camera.position).normalize();
    const distance = (targetZ - camera.position.z) / direction.z;
    return camera.position.clone().add(direction.multiplyScalar(distance));
  }

  function createCanvasTexture(width, height, painter) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    painter(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    if ("colorSpace" in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.needsUpdate = true;
    return texture;
  }

  function createCardTexture(config) {
    return createCanvasTexture(768, 288, function (ctx, width, height) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(10, 10, 10, 0.94)");
      gradient.addColorStop(1, "rgba(20, 12, 3, 0.82)");

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(245, 166, 35, 0.9)";
      ctx.strokeRect(2, 2, width - 4, height - 4);

      ctx.strokeStyle = "rgba(245, 166, 35, 0.18)";
      ctx.beginPath();
      ctx.moveTo(42, height - 44);
      ctx.lineTo(width - 42, height - 44);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = '500 24px "DM Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(config.label, 44, 38);

      ctx.fillStyle = "#f5a623";
      ctx.font = '700 66px "Syne", sans-serif';
      ctx.fillText(config.value, 40, 82);

      ctx.fillStyle = "rgba(245, 166, 35, 0.9)";
      ctx.font = '600 28px "DM Sans", sans-serif';
      ctx.fillText(config.delta, 44, 182);

      ctx.strokeStyle = "rgba(245, 166, 35, 0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      config.sparkline.forEach(function (point, index) {
        const x = 388 + index * 48;
        const y = 210 - point * 74;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.fillStyle = "rgba(245, 166, 35, 0.18)";
      config.sparkline.forEach(function (point, index) {
        const x = 388 + index * 48;
        const y = 210 - point * 74;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  class HeroScene {
    constructor(options) {
      this.canvas = options.canvas;
      this.heroSection = options.heroSection || null;
      this.heroStats = options.heroStats || null;
      this.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      this.visibility = 1;
      this.motionScale = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.35 : 1;
      this.isCompact = this.viewport.width < 768;
      this.lookTarget = new THREE.Vector3(0, 0, -10);

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(HERO_BLACK, this.isCompact ? 0.011 : 0.0085);

      this.camera = new THREE.PerspectiveCamera(
        60,
        this.viewport.width / this.viewport.height,
        0.1,
        300
      );
      this.camera.position.set(0, 5, 40);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: !this.isCompact,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isCompact ? 1.25 : 1.6));
      this.renderer.setSize(this.viewport.width, this.viewport.height, false);
      this.renderer.setClearColor(HERO_BLACK, 0);
      if ("outputColorSpace" in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      this.addLights();
      this.createParticles();
      this.createSkyline();
      this.createGrid();
      this.createRings();
      this.createStatCards();
      this.resize(this.viewport.width, this.viewport.height);
    }

    addLights() {
      this.scene.add(new THREE.AmbientLight(WHITE, 0.42));

      const hemi = new THREE.HemisphereLight(WHITE, 0x140b00, 0.58);
      hemi.position.set(0, 30, 0);
      this.scene.add(hemi);

      this.ringLight = new THREE.PointLight(GOLD, 16, 120, 2);
      this.ringLight.position.set(8, 6, -6);
      this.scene.add(this.ringLight);
    }

    createParticles() {
      const count = this.isCompact ? 180 : 250;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      this.particleMeta = [];
      this.particleBounds = {
        x: 54,
        yMin: -30,
        yMax: 34,
        zNear: 18,
        zFar: -38
      };

      for (let index = 0; index < count; index += 1) {
        const rise = 3 + Math.random() * 2.5;
        const baseX = (Math.random() - 0.5) * this.particleBounds.x * 2;
        const y =
          this.particleBounds.yMin +
          Math.random() * (this.particleBounds.yMax - this.particleBounds.yMin);
        const z =
          this.particleBounds.zFar +
          Math.random() * (this.particleBounds.zNear - this.particleBounds.zFar);
        const size = 0.5 + Math.random() * 1.5;

        positions[index * 3] = baseX;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;
        sizes[index] = size;

        this.particleMeta.push({
          baseX: baseX,
          y: y,
          z: z,
          rise: rise,
          driftAmplitude: 0.6 + Math.random() * 1.8,
          driftSpeed: 0.7 + Math.random() * 1.1,
          offset: Math.random() * Math.PI * 2
        });
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(GOLD) },
          uYMin: { value: this.particleBounds.yMin },
          uYMax: { value: this.particleBounds.yMax }
        },
        vertexShader: `
          uniform float uYMin;
          uniform float uYMax;
          attribute float aSize;
          varying float vAlpha;
          void main() {
            float fadeIn = smoothstep(uYMin, mix(uYMin, uYMax, 0.22), position.y);
            float fadeOut = 1.0 - smoothstep(mix(uYMin, uYMax, 0.76), uYMax, position.y);
            vAlpha = fadeIn * fadeOut;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (92.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) {
              discard;
            }
            float softness = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
            gl_FragColor = vec4(uColor, vAlpha * softness * 0.9);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      this.particles = new THREE.Points(geometry, material);
      this.scene.add(this.particles);
    }

    createSkyline() {
      const buildingCount = this.isCompact ? 20 : 26;
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.94,
        metalness: 0.08,
        emissive: 0x050505
      });
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.3
      });

      this.skyline = new THREE.Group();
      this.skyline.position.z = -96;

      for (let index = 0; index < buildingCount; index += 1) {
        const width = 4 + Math.random() * 5.5;
        const height = 3 + Math.random() * 17;
        const depth = 4 + Math.random() * 5;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, buildingMaterial);
        mesh.position.set(
          -58 + (index / (buildingCount - 1)) * 116 + (Math.random() - 0.5) * 5,
          height / 2 - 15,
          -14 + Math.random() * 28
        );

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
        mesh.add(edges);
        this.skyline.add(mesh);
      }

      this.scene.add(this.skyline);
    }

    createGrid() {
      this.grid = new THREE.GridHelper(200, 30, GOLD, GOLD);
      this.grid.position.set(0, -15, -18);
      setMaterialOpacity(this.grid.material, 0.08);
      this.scene.add(this.grid);
    }

    createRings() {
      this.ringGroup = new THREE.Group();

      const innerMaterial = new THREE.MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 1.7,
        roughness: 0.18,
        metalness: 0.78
      });
      const outerMaterial = new THREE.MeshStandardMaterial({
        color: GOLD,
        emissive: GOLD,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.3,
        roughness: 0.2,
        metalness: 0.68
      });

      this.innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(12, 0.15, 22, 64),
        innerMaterial
      );
      this.outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(14, 0.05, 22, 64),
        outerMaterial
      );

      this.innerRing.rotation.x = THREE.MathUtils.degToRad(8);
      this.outerRing.rotation.x = THREE.MathUtils.degToRad(-7);

      this.ringGroup.add(this.innerRing);
      this.ringGroup.add(this.outerRing);
      this.scene.add(this.ringGroup);
    }

    createStatCards() {
      const cardConfigs = [
        {
          label: "ACTIVE USERS",
          value: "125K+",
          delta: "+45%",
          sparkline: [0.2, 0.32, 0.26, 0.42, 0.38, 0.58]
        },
        {
          label: "MONTHLY REV",
          value: "$24.8K",
          delta: "+32%",
          sparkline: [0.16, 0.24, 0.22, 0.36, 0.44, 0.7]
        },
        {
          label: "GROWTH RATE",
          value: "28.6%",
          delta: "+18%",
          sparkline: [0.08, 0.16, 0.3, 0.24, 0.46, 0.52]
        }
      ];

      this.cards = cardConfigs.map(function (config, index) {
        const texture = createCardTexture(config);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          toneMapped: false
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), material);
        mesh.rotation.y = THREE.MathUtils.degToRad(index === 0 ? 10 : -8);
        mesh.rotation.x = THREE.MathUtils.degToRad(index === 2 ? -3 : 2);
        return {
          mesh: mesh,
          basePosition: new THREE.Vector3(),
          phase: index * 1.4 + 0.35,
          frequency: 0.85 + index * 0.12
        };
      });

      this.cards.forEach(
        function (card) {
          this.scene.add(card.mesh);
        }.bind(this)
      );
    }

    getRingScreenPosition() {
      if (this.heroStats && !this.isCompact) {
        const rect = this.heroStats.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return {
            x: rect.left + rect.width * 0.52,
            y: rect.top + rect.height * 0.48
          };
        }
      }

      const fallbackRect = this.heroSection
        ? this.heroSection.getBoundingClientRect()
        : { left: 0, top: 0, width: this.viewport.width, height: this.viewport.height };

      return {
        x: fallbackRect.left + fallbackRect.width * (this.isCompact ? 0.52 : 0.74),
        y: fallbackRect.top + fallbackRect.height * (this.isCompact ? 0.38 : 0.46)
      };
    }

    updateLayout() {
      const ringScreen = this.getRingScreenPosition();
      const ringWorld = screenToWorld(
        this.camera,
        this.viewport.width,
        this.viewport.height,
        ringScreen.x,
        ringScreen.y,
        this.isCompact ? -18 : -15
      );

      this.ringGroup.position.copy(ringWorld);
      this.ringGroup.scale.setScalar(this.isCompact ? 0.72 : 1);
      this.ringLight.position.copy(ringWorld).add(new THREE.Vector3(0, 0, 8));

      const offsetX = this.viewport.width * (this.isCompact ? 0.16 : 0.18);
      const offsetY = this.viewport.height * (this.isCompact ? 0.12 : 0.17);
      const cardScreens = [
        {
          x: ringScreen.x - offsetX * 1.05,
          y: ringScreen.y + offsetY * 0.95,
          z: -9
        },
        {
          x: ringScreen.x + offsetX * 0.34,
          y: ringScreen.y - offsetY * 1.08,
          z: -17
        },
        {
          x: ringScreen.x + offsetX * 0.44,
          y: ringScreen.y + offsetY * 1.12,
          z: -12
        }
      ];

      this.cards.forEach(
        function (card, index) {
          const target = cardScreens[index];
          card.basePosition.copy(
            screenToWorld(
              this.camera,
              this.viewport.width,
              this.viewport.height,
              clamp(target.x, 56, this.viewport.width - 56),
              clamp(target.y, 84, this.viewport.height - 72),
              target.z
            )
          );
          card.mesh.position.copy(card.basePosition);
          card.mesh.scale.setScalar(this.isCompact ? 0.74 : 1);
        }.bind(this)
      );
    }

    setVisibility(alpha) {
      this.visibility = clamp(alpha, 0, 1);
      this.canvas.style.opacity = String(this.visibility);
    }

    resize(width, height) {
      this.viewport.width = width;
      this.viewport.height = height;
      this.isCompact = width < 768;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isCompact ? 1.25 : 1.6));
      this.renderer.setSize(width, height, false);
      this.scene.fog.density = this.isCompact ? 0.011 : 0.0085;
      this.updateLayout();
    }

    update(delta, elapsed) {
      if (this.visibility <= 0.001) {
        return;
      }

      const motion = this.motionScale;
      const positions = this.particles.geometry.attributes.position.array;
      const spanY = this.particleBounds.yMax - this.particleBounds.yMin;

      for (let index = 0; index < this.particleMeta.length; index += 1) {
        const meta = this.particleMeta[index];
        meta.y += meta.rise * delta * motion;
        if (meta.y > this.particleBounds.yMax) {
          meta.y -= spanY;
          meta.baseX = (Math.random() - 0.5) * this.particleBounds.x * 2;
          meta.z =
            this.particleBounds.zFar +
            Math.random() * (this.particleBounds.zNear - this.particleBounds.zFar);
        }

        positions[index * 3] =
          meta.baseX + Math.sin(elapsed * meta.driftSpeed + meta.offset) * meta.driftAmplitude * motion;
        positions[index * 3 + 1] = meta.y;
        positions[index * 3 + 2] = meta.z;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;

      const skylineScale = 1 + Math.sin(elapsed * 0.9) * 0.002 * motion;
      this.skyline.scale.setScalar(skylineScale);

      const gridOpacity = 0.085 + Math.sin((elapsed / 3) * Math.PI * 2) * 0.035 * motion;
      setMaterialOpacity(this.grid.material, gridOpacity);

      this.innerRing.rotation.z += delta * 0.12 * motion;
      this.outerRing.rotation.z -= delta * 0.17 * motion;

      this.cards.forEach(function (card) {
        const lift = Math.sin(elapsed * card.frequency + card.phase) * 0.5 * motion;
        card.mesh.position.y = card.basePosition.y + lift;
        card.mesh.rotation.x =
          THREE.MathUtils.degToRad(1) +
          Math.sin(elapsed * 0.8 + card.phase) * THREE.MathUtils.degToRad(2) * motion;
        card.mesh.rotation.y =
          Math.cos(elapsed * 0.7 + card.phase) * THREE.MathUtils.degToRad(2) * motion;
      });

      this.camera.position.x = Math.sin((elapsed / 10) * Math.PI * 2) * 1.5 * motion;
      this.camera.position.y = 5 + Math.cos(elapsed * 0.28) * 0.35 * motion;
      this.lookTarget.set(
        this.ringGroup.position.x * 0.12,
        this.ringGroup.position.y * 0.08,
        -10
      );
      this.camera.lookAt(this.lookTarget);
    }

    render() {
      if (this.visibility <= 0.001) {
        this.renderer.clear();
        return;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.HeroScene = HeroScene;
})();
