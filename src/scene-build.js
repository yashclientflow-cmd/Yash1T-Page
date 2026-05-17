(function () {
  const GOLD = 0xf5a623;
  const BLUE = 0x0066ff;
  const CYAN = 0x00c8ff;
  const SPACE = 0x080c1a;
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

  function createNodeLabelTexture(label) {
    return createCanvasTexture(512, 160, function (ctx, width, height) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = '700 66px "DM Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, width / 2, height / 2);
    });
  }

  function createHudTexture() {
    return createCanvasTexture(768, 512, function (ctx, width, height) {
      const background = ctx.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "rgba(8, 12, 26, 0.94)");
      background.addColorStop(1, "rgba(4, 16, 36, 0.86)");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(0, 200, 255, 0.24)";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.font = '700 30px "DM Mono", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("DAILY EXECUTION PANEL", 42, 40);

      ctx.strokeStyle = "rgba(0, 200, 255, 0.16)";
      ctx.beginPath();
      ctx.moveTo(42, 88);
      ctx.lineTo(width - 42, 88);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 42px "Syne", sans-serif';
      ctx.fillText("NON-NEGOTIABLE TODAY", 42, 116);

      const checklist = [
        "Ship (public or usable)",
        "Talk to users / get signal",
        "Improve distribution",
        "Track real metric"
      ];

      ctx.font = '500 28px "DM Sans", sans-serif';
      checklist.forEach(function (item, index) {
        const y = 208 + index * 66;
        ctx.strokeStyle = "rgba(0, 102, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(44, y + 6, 24, 24);
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.fillText(item, 88, y);
      });

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 30px "DM Mono", monospace';
      ctx.fillText("TODAY TARGET:", 42, 446);

      ctx.strokeStyle = "rgba(0, 200, 255, 0.3)";
      ctx.beginPath();
      ctx.moveTo(42, 492);
      ctx.lineTo(width - 42, 492);
      ctx.stroke();
    });
  }

  function createConnector(start, end) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const geometry = new THREE.CylinderGeometry(0.08, 0.08, length, 10, 1, true);
    const material = new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    return mesh;
  }

  class BuildScene {
    constructor(options) {
      this.canvas = options.canvas;
      this.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      this.visibility = 0;
      this.sectionProgress = 0;
      this.motionScale = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.4 : 1;
      this.isCompact = this.viewport.width < 768;
      this.hudBasePosition = new THREE.Vector3();

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(SPACE, this.isCompact ? 0.007 : 0.0055);

      this.camera = new THREE.PerspectiveCamera(
        55,
        this.viewport.width / this.viewport.height,
        0.1,
        320
      );
      this.camera.position.set(0, 8, 50);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: !this.isCompact,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isCompact ? 1.2 : 1.6));
      this.renderer.setSize(this.viewport.width, this.viewport.height, false);
      this.renderer.setClearColor(SPACE, 0);
      if ("outputColorSpace" in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      this.addLights();
      this.createNebula();
      this.createGrids();
      this.createNodeGraph();
      this.createHudPanel();
      this.resize(this.viewport.width, this.viewport.height);
    }

    addLights() {
      this.scene.add(new THREE.AmbientLight(WHITE, 0.2));

      const hemi = new THREE.HemisphereLight(0xb8d6ff, 0x040610, 0.3);
      hemi.position.set(0, 40, 0);
      this.scene.add(hemi);
    }

    createNebula() {
      const count = this.isCompact ? 280 : 400;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const alphas = new Float32Array(count);
      const geometry = new THREE.BufferGeometry();
      const blue = new THREE.Color(BLUE);
      const white = new THREE.Color(WHITE);

      this.nebulaMeta = [];
      for (let index = 0; index < count; index += 1) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.cbrt(Math.random()) * 100;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        const color = Math.random() < 0.58 ? blue : white;

        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
        sizes[index] = 0.65 + Math.random() * 1.25;
        alphas[index] = 0.35 + Math.random() * 0.65;

        this.nebulaMeta.push({
          speed: 0.8 + Math.random() * 1.7,
          offset: Math.random() * Math.PI * 2
        });
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

      const material = new THREE.ShaderMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vColor = color;
            vAlpha = aAlpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (86.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) {
              discard;
            }
            float softness = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
            gl_FragColor = vec4(vColor, vAlpha * softness);
          }
        `
      });

      this.nebulaSystem = new THREE.Group();
      this.nebula = new THREE.Points(geometry, material);
      this.nebulaSystem.add(this.nebula);
      this.scene.add(this.nebulaSystem);
    }

    createGrids() {
      this.grids = [];
      this.gridGroup = new THREE.Group();

      const floor = new THREE.GridHelper(300, 50, BLUE, BLUE);
      floor.position.set(0, -20, -24);
      setMaterialOpacity(floor.material, 0);
      this.gridGroup.add(floor);
      this.grids.push(floor);

      const left = new THREE.GridHelper(300, 50, BLUE, BLUE);
      left.position.set(-48, 2, -28);
      left.rotation.z = Math.PI / 2;
      left.rotation.y = 0.12;
      setMaterialOpacity(left.material, 0);
      this.gridGroup.add(left);
      this.grids.push(left);

      const right = new THREE.GridHelper(300, 50, BLUE, BLUE);
      right.position.set(48, 2, -28);
      right.rotation.z = -Math.PI / 2;
      right.rotation.y = -0.12;
      setMaterialOpacity(right.material, 0);
      this.gridGroup.add(right);
      this.grids.push(right);

      this.scene.add(this.gridGroup);
    }

    createNodeGraph() {
      this.graphGroup = new THREE.Group();
      this.nodes = [];
      this.nodePositions = [
        new THREE.Vector3(-18, 0, -2),
        new THREE.Vector3(-6, 0, 0),
        new THREE.Vector3(6, 0, -2),
        new THREE.Vector3(18, 0, 0)
      ];
      const colors = [GOLD, BLUE, CYAN, WHITE];
      const labels = ["BUILD", "DISTRIBUTE", "SCALE", "OWN"];

      for (let index = 0; index < this.nodePositions.length; index += 1) {
        const color = colors[index];
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 28, 28),
          new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: color === WHITE ? 0.85 : 1.25,
            roughness: 0.22,
            metalness: 0.32
          })
        );
        mesh.position.copy(this.nodePositions[index]);

        const light = new THREE.PointLight(color, 2, 15, 2);
        mesh.add(light);

        const labelSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: createNodeLabelTexture(labels[index]),
            transparent: true,
            depthWrite: false
          })
        );
        labelSprite.position.set(0, 4.1, 0);
        labelSprite.scale.set(9, 2.8, 1);
        mesh.add(labelSprite);

        this.graphGroup.add(mesh);
        this.nodes.push({
          mesh: mesh,
          light: light,
          phase: index * 0.45
        });
      }

      for (let index = 0; index < this.nodePositions.length - 1; index += 1) {
        this.graphGroup.add(
          createConnector(this.nodePositions[index], this.nodePositions[index + 1])
        );
      }

      const curve = new THREE.CatmullRomCurve3(this.nodePositions);
      const tubeGeometry = new THREE.TubeGeometry(curve, 180, 0.22, 12, false);
      const beamMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec2 vUv;

          vec3 gradientColor(float t) {
            vec3 gold = vec3(245.0 / 255.0, 166.0 / 255.0, 35.0 / 255.0);
            vec3 blue = vec3(0.0, 102.0 / 255.0, 1.0);
            vec3 cyan = vec3(0.0, 200.0 / 255.0, 1.0);
            vec3 white = vec3(1.0);

            if (t < 0.33) {
              return mix(gold, blue, t / 0.33);
            }
            if (t < 0.66) {
              return mix(blue, cyan, (t - 0.33) / 0.33);
            }
            return mix(cyan, white, (t - 0.66) / 0.34);
          }

          void main() {
            float axial = fract(vUv.x * 4.0 - uTime * 0.65);
            float pulse = 1.0 - smoothstep(0.0, 0.55, abs(axial - 0.5) * 2.0);
            float radial = 1.0 - smoothstep(0.18, 0.48, abs(vUv.y - 0.5));
            vec3 color = gradientColor(vUv.x);
            float alpha = radial * (0.34 + pulse * 0.76);
            gl_FragColor = vec4(color * (0.72 + pulse * 0.9), alpha);
          }
        `
      });
      this.energyBeam = new THREE.Mesh(tubeGeometry, beamMaterial);
      this.graphGroup.add(this.energyBeam);

      this.graphGroup.position.set(0, -1.4, -4);
      this.scene.add(this.graphGroup);
    }

    createHudPanel() {
      const geometry = new THREE.PlaneGeometry(12, 8);
      const material = new THREE.MeshBasicMaterial({
        map: createHudTexture(),
        transparent: true,
        depthWrite: false,
        toneMapped: false
      });
      this.hud = new THREE.Mesh(geometry, material);
      this.hudOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({
          color: CYAN,
          transparent: true,
          opacity: 0.72
        })
      );
      this.hud.add(this.hudOutline);
      this.scene.add(this.hud);
    }

    updateLayout() {
      this.graphGroup.scale.setScalar(this.isCompact ? 0.68 : 1);
      this.graphGroup.position.y = this.isCompact ? -2.8 : -1.4;

      const hudWorld = screenToWorld(
        this.camera,
        this.viewport.width,
        this.viewport.height,
        this.viewport.width * (this.isCompact ? 0.5 : 0.82),
        this.viewport.height * (this.isCompact ? 0.2 : 0.27),
        this.isCompact ? 8 : 10
      );
      this.hudBasePosition.copy(hudWorld);
      this.hud.position.copy(this.hudBasePosition);
      this.hud.scale.setScalar(this.isCompact ? 0.78 : 1);
    }

    setVisibility(alpha) {
      this.visibility = clamp(alpha, 0, 1);
      this.canvas.style.opacity = String(this.visibility);
    }

    setSectionProgress(progress) {
      this.sectionProgress = clamp(progress, 0, 1);
    }

    resize(width, height) {
      this.viewport.width = width;
      this.viewport.height = height;
      this.isCompact = width < 768;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isCompact ? 1.2 : 1.6));
      this.renderer.setSize(width, height, false);
      this.scene.fog.density = this.isCompact ? 0.007 : 0.0055;
      this.updateLayout();
    }

    update(delta, elapsed) {
      if (this.visibility <= 0.001) {
        return;
      }

      const motion = this.motionScale;
      this.nebulaSystem.rotation.y += delta * 0.03 * motion;

      const alphaAttribute = this.nebula.geometry.attributes.aAlpha;
      for (let index = 0; index < this.nebulaMeta.length; index += 1) {
        const meta = this.nebulaMeta[index];
        alphaAttribute.array[index] =
          0.22 + (0.5 + Math.sin(elapsed * meta.speed + meta.offset) * 0.5) * 0.72;
      }
      alphaAttribute.needsUpdate = true;

      const gridBase = 0.12 * this.sectionProgress;
      const gridPulse = Math.sin(elapsed * 1.15) * 0.012 * this.sectionProgress * motion;
      this.grids.forEach(function (grid) {
        setMaterialOpacity(grid.material, clamp(gridBase + gridPulse, 0, 0.12));
      });

      this.nodes.forEach(function (node) {
        const pulse = (Math.sin(elapsed * Math.PI + node.phase) + 1) * 0.5;
        const scale = 1 + pulse * 0.15 * motion;
        node.mesh.scale.setScalar(scale);
        node.light.intensity = 1.5 + pulse * 0.75;
      });

      this.energyBeam.material.uniforms.uTime.value = elapsed;

      this.hud.rotation.y =
        Math.sin(elapsed * 0.9) * THREE.MathUtils.degToRad(5) * motion;
      this.hud.position.copy(this.hudBasePosition);
      this.hud.position.y += Math.sin(elapsed * 0.95) * 0.35 * motion;

      this.camera.position.x = Math.sin(elapsed * 0.22) * 1.05 * motion;
      this.camera.position.y = 8 + this.sectionProgress * 0.6;
      this.camera.position.z = 50 - 15 * this.sectionProgress;
      this.camera.lookAt(0, -0.6, -2);
    }

    render() {
      if (this.visibility <= 0.001) {
        this.renderer.clear();
        return;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  window.BuildScene = BuildScene;
})();
