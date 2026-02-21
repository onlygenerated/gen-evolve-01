/**
 * Algorithm library for evolutionary generative art
 * Each algorithm takes (ctx, width, height, rng, params) and renders to canvas
 */

class Algorithms {
  // Existing from Sediment
  static voronoi(ctx, width, height, rng, params) {
    const { count = 25, influence = 1.0, emphasis = 0.8 } = params;
    const voronoi = new VoronoiField(rng, width, height, count, influence);

    ctx.globalAlpha = emphasis;
    const cellSize = 2;
    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        const cell = voronoi.getCell(x, y);
        const edgeWeight = voronoi.getEdgeWeight(x, y, 1.08);

        if (edgeWeight > 0) {
          ctx.fillStyle = `hsl(${cell.color.h}, ${cell.color.s}%, ${cell.color.l}%)`;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }

  static metaballs(ctx, width, height, rng, params) {
    const { count = 10, radius = 0.3, emphasis = 0.6 } = params;
    const balls = [];

    for (let i = 0; i < count; i++) {
      balls.push({
        x: rng.range(0, width),
        y: rng.range(0, height),
        radius: radius * Math.max(width, height) * rng.range(0.5, 1.5)
      });
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let totalInfluence = 0;

        for (const ball of balls) {
          const dist = Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2);
          totalInfluence += Math.max(0, 1 - (dist / ball.radius));
        }

        if (totalInfluence > 0.3) {
          const idx = (y * width + x) * 4;
          const v = Math.floor(255 * Math.min(totalInfluence, 1));
          data[idx] = data[idx + 1] = data[idx + 2] = v;
          data[idx + 3] = Math.floor(emphasis * 255);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static perlinNoise(ctx, width, height, rng, params) {
    const { scale = 0.005, octaves = 4, emphasis = 0.7 } = params;
    const noise = new PerlinNoise(rng);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const n = noise.octaveNoise(x * scale, y * scale, octaves, 0.5);
        const v = Math.floor(((n + 1) / 2) * 255);
        const idx = (y * width + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = v;
        data[idx + 3] = Math.floor(emphasis * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static flowField(ctx, width, height, rng, params) {
    const { resolution = 20, scale = 0.01, particles = 1000, emphasis = 0.6 } = params;
    const field = new FlowField(rng, width, height, resolution, scale, 3);

    ctx.globalAlpha = emphasis * 0.3;
    ctx.lineWidth = 1;

    for (let i = 0; i < particles; i++) {
      let x = rng.range(0, width);
      let y = rng.range(0, height);

      ctx.beginPath();
      ctx.moveTo(x, y);

      const steps = rng.int(20, 80);
      for (let s = 0; s < steps; s++) {
        const vector = field.getVector(x, y);
        x += Math.cos(vector.angle) * 2;
        y += Math.sin(vector.angle) * 2;

        if (x < 0 || x > width || y < 0 || y > height) break;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  static organicBlobs(ctx, width, height, rng, params) {
    const { count = 5, scale = 0.003, threshold = 0.5, emphasis = 0.6 } = params;
    const noise = new PerlinNoise(rng);

    for (let blob = 0; blob < count; blob++) {
      const offsetX = rng.range(0, 1000);
      const offsetY = rng.range(0, 1000);

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const n = noise.octaveNoise((x + offsetX) * scale, (y + offsetY) * scale, 4, 0.5);

          if (n > threshold) {
            const idx = (y * width + x) * 4;
            const alpha = ((n - threshold) / (1 - threshold)) * emphasis;
            const v = Math.floor(255 * alpha);
            data[idx] = data[idx + 1] = data[idx + 2] = v;
            data[idx + 3] = Math.floor(alpha * 255);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }

  // NEW ALGORITHMS

  static reactionDiffusion(ctx, width, height, rng, params) {
    const { emphasis = 0.7, iterations = 100, feed = 0.055, kill = 0.062 } = params;
    const scale = 4; // Downsample for performance
    const w = Math.floor(width / scale);
    const h = Math.floor(height / scale);

    let a = new Float32Array(w * h);
    let b = new Float32Array(w * h);

    // Initialize with random seeds
    a.fill(1);
    b.fill(0);
    for (let i = 0; i < 20; i++) {
      const x = rng.int(0, w);
      const y = rng.int(0, h);
      const r = rng.int(3, 8);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx*dx + dy*dy <= r*r) {
            const idx = ((y + dy + h) % h) * w + ((x + dx + w) % w);
            b[idx] = 1;
          }
        }
      }
    }

    // Simulate
    const dA = 1.0;
    const dB = 0.5;

    for (let iter = 0; iter < iterations; iter++) {
      const a2 = new Float32Array(a);
      const b2 = new Float32Array(b);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;

          // Laplacian using 3x3 kernel
          const laplacianA = (
            a2[((y-1+h)%h)*w + ((x-1+w)%w)] * 0.05 +
            a2[((y-1+h)%h)*w + x] * 0.2 +
            a2[((y-1+h)%h)*w + ((x+1)%w)] * 0.05 +
            a2[y*w + ((x-1+w)%w)] * 0.2 +
            a2[idx] * -1 +
            a2[y*w + ((x+1)%w)] * 0.2 +
            a2[((y+1)%h)*w + ((x-1+w)%w)] * 0.05 +
            a2[((y+1)%h)*w + x] * 0.2 +
            a2[((y+1)%h)*w + ((x+1)%w)] * 0.05
          );

          const laplacianB = (
            b2[((y-1+h)%h)*w + ((x-1+w)%w)] * 0.05 +
            b2[((y-1+h)%h)*w + x] * 0.2 +
            b2[((y-1+h)%h)*w + ((x+1)%w)] * 0.05 +
            b2[y*w + ((x-1+w)%w)] * 0.2 +
            b2[idx] * -1 +
            b2[y*w + ((x+1)%w)] * 0.2 +
            b2[((y+1)%h)*w + ((x-1+w)%w)] * 0.05 +
            b2[((y+1)%h)*w + x] * 0.2 +
            b2[((y+1)%h)*w + ((x+1)%w)] * 0.05
          );

          const abb = a2[idx] * b2[idx] * b2[idx];
          a[idx] = a2[idx] + (dA * laplacianA - abb + feed * (1 - a2[idx]));
          b[idx] = b2[idx] + (dB * laplacianB + abb - (kill + feed) * b2[idx]);

          a[idx] = Math.max(0, Math.min(1, a[idx]));
          b[idx] = Math.max(0, Math.min(1, b[idx]));
        }
      }
    }

    // Render
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sx = Math.floor(x / scale);
        const sy = Math.floor(y / scale);
        const idx = (y * width + x) * 4;
        const val = b[sy * w + sx];
        const v = Math.floor(val * 255);
        data[idx] = data[idx + 1] = data[idx + 2] = v;
        data[idx + 3] = Math.floor(emphasis * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static delaunay(ctx, width, height, rng, params) {
    const { count = 50, emphasis = 0.7 } = params;
    const points = [];

    // Generate random points
    for (let i = 0; i < count; i++) {
      points.push({
        x: rng.range(0, width),
        y: rng.range(0, height)
      });
    }

    // Simple triangulation approximation (not true Delaunay but visually similar)
    ctx.globalAlpha = emphasis;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];

      // Find 3 nearest neighbors
      const neighbors = points
        .map((p, idx) => ({
          p,
          idx,
          dist: Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2)
        }))
        .filter(n => n.idx !== i)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

      // Draw triangles
      for (let j = 0; j < neighbors.length - 1; j++) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(neighbors[j].p.x, neighbors[j].p.y);
        ctx.lineTo(neighbors[j + 1].p.x, neighbors[j + 1].p.y);
        ctx.closePath();

        const hue = rng.range(0, 360);
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  static perlinWorms(ctx, width, height, rng, params) {
    const { count = 30, scale = 0.02, emphasis = 0.6 } = params;
    const noise = new PerlinNoise(rng);

    ctx.globalAlpha = emphasis;
    ctx.lineWidth = rng.range(1, 4);

    for (let i = 0; i < count; i++) {
      let x = rng.range(0, width);
      let y = rng.range(0, height);

      ctx.beginPath();
      ctx.moveTo(x, y);

      const steps = rng.int(50, 200);
      for (let s = 0; s < steps; s++) {
        const angle = noise.octaveNoise(x * scale, y * scale, 3, 0.5) * Math.PI * 2;
        x += Math.cos(angle) * 3;
        y += Math.sin(angle) * 3;

        if (x < 0 || x > width || y < 0 || y > height) break;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  static radialSymmetry(ctx, width, height, rng, params) {
    const { segments = 8, radius = 0.8, emphasis = 0.7 } = params;
    const noise = new PerlinNoise(rng);
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) / 2 * radius;

    ctx.globalAlpha = emphasis;

    for (let seg = 0; seg < segments; seg++) {
      const baseAngle = (seg / segments) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);

      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const r = maxR * t;
        const noiseOffset = noise.octaveNoise(t * 5, seg, 3, 0.5) * 0.2;
        const angle = baseAngle + noiseOffset;

        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = `hsl(${(seg / segments) * 360}, 70%, 50%)`;
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }

  static displacementField(ctx, width, height, rng, params) {
    const { scale = 0.01, intensity = 30, emphasis = 0.7 } = params;
    const noise = new PerlinNoise(rng);

    // Create a gradient to displace
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    const gradient = tempCtx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#000');
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, width, height);

    const sourceData = tempCtx.getImageData(0, 0, width, height);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = noise.octaveNoise(x * scale, y * scale, 3, 0.5) * intensity;
        const dy = noise.octaveNoise(x * scale + 100, y * scale + 100, 3, 0.5) * intensity;

        const sx = Math.floor(x + dx);
        const sy = Math.floor(y + dy);

        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const sidx = (sy * width + sx) * 4;
          const idx = (y * width + x) * 4;
          data[idx] = sourceData.data[sidx];
          data[idx + 1] = sourceData.data[sidx + 1];
          data[idx + 2] = sourceData.data[sidx + 2];
          data[idx + 3] = Math.floor(emphasis * 255);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static liquidMarbling(ctx, width, height, rng, params) {
    const { swirls = 10, complexity = 3, emphasis = 0.7 } = params;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Create swirl centers
    const centers = [];
    for (let i = 0; i < swirls; i++) {
      centers.push({
        x: rng.range(0, width),
        y: rng.range(0, height),
        strength: rng.range(0.5, 2),
        rotation: rng.range(0, Math.PI * 2)
      });
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let totalAngle = 0;

        for (const center of centers) {
          const dx = x - center.x;
          const dy = y - center.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          if (dist > 0) {
            totalAngle += (center.strength / dist) * Math.sin(angle * complexity + center.rotation);
          }
        }

        const idx = (y * width + x) * 4;
        const v = Math.floor(((Math.sin(totalAngle) + 1) / 2) * 255);
        data[idx] = data[idx + 1] = data[idx + 2] = v;
        data[idx + 3] = Math.floor(emphasis * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static fractalTree(ctx, width, height, rng, params) {
    const { depth = 10, angle = 0.4, emphasis = 0.7 } = params;

    ctx.globalAlpha = emphasis;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    const drawBranch = (x, y, length, angle, depth) => {
      if (depth === 0 || length < 2) return;

      const x2 = x + Math.cos(angle) * length;
      const y2 = y + Math.sin(angle) * length;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const newLength = length * rng.range(0.6, 0.8);
      const angleVariation = rng.range(0.3, 0.6);

      drawBranch(x2, y2, newLength, angle - angleVariation, depth - 1);
      drawBranch(x2, y2, newLength, angle + angleVariation, depth - 1);
    };

    const startX = width / 2;
    const startY = height;
    const startLength = height * 0.3;

    drawBranch(startX, startY, startLength, -Math.PI / 2, depth);

    ctx.globalAlpha = 1.0;
  }

  static dithering(ctx, width, height, rng, params) {
    const { threshold = 128, emphasis = 0.7 } = params;
    const noise = new PerlinNoise(rng);

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Generate gradient
    const gradient = [];
    for (let y = 0; y < height; y++) {
      gradient[y] = [];
      for (let x = 0; x < width; x++) {
        const n = noise.octaveNoise(x * 0.005, y * 0.005, 4, 0.5);
        gradient[y][x] = ((n + 1) / 2) * 255;
      }
    }

    // Floyd-Steinberg dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const oldPixel = gradient[y][x];
        const newPixel = oldPixel < threshold ? 0 : 255;
        gradient[y][x] = newPixel;

        const error = oldPixel - newPixel;

        if (x + 1 < width) gradient[y][x + 1] += error * 7 / 16;
        if (y + 1 < height) {
          if (x > 0) gradient[y + 1][x - 1] += error * 3 / 16;
          gradient[y + 1][x] += error * 5 / 16;
          if (x + 1 < width) gradient[y + 1][x + 1] += error * 1 / 16;
        }

        const idx = (y * width + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
        data[idx + 3] = Math.floor(emphasis * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static halftone(ctx, width, height, rng, params) {
    const { dotSize = 8, emphasis = 0.7 } = params;
    const noise = new PerlinNoise(rng);

    ctx.globalAlpha = emphasis;

    for (let y = 0; y < height; y += dotSize) {
      for (let x = 0; x < width; x += dotSize) {
        const n = noise.octaveNoise(x * 0.005, y * 0.005, 4, 0.5);
        const brightness = (n + 1) / 2;
        const radius = (dotSize / 2) * brightness;

        ctx.beginPath();
        ctx.arc(x + dotSize / 2, y + dotSize / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  static truchetTiles(ctx, width, height, rng, params) {
    const { tileSize = 40, emphasis = 0.7 } = params;

    ctx.globalAlpha = emphasis;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';

    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        const variant = rng.int(0, 4);

        ctx.beginPath();
        switch (variant) {
          case 0:
            ctx.arc(x, y, tileSize / 2, 0, Math.PI / 2);
            ctx.arc(x + tileSize, y + tileSize, tileSize / 2, Math.PI, Math.PI * 1.5);
            break;
          case 1:
            ctx.arc(x + tileSize, y, tileSize / 2, Math.PI / 2, Math.PI);
            ctx.arc(x, y + tileSize, tileSize / 2, -Math.PI / 2, 0);
            break;
          case 2:
            ctx.moveTo(x, y);
            ctx.lineTo(x + tileSize, y + tileSize);
            break;
          case 3:
            ctx.moveTo(x + tileSize, y);
            ctx.lineTo(x, y + tileSize);
            break;
        }
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1.0;
  }

  static lissajous(ctx, width, height, rng, params) {
    const { a = 3, b = 4, delta = 1.5, emphasis = 0.7 } = params;

    ctx.globalAlpha = emphasis;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) * 0.4;

    ctx.beginPath();

    const steps = 1000;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = cx + scale * Math.sin(a * t + delta);
      const y = cy + scale * Math.sin(b * t);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  static spirograph(ctx, width, height, rng, params) {
    const { R = 100, r = 30, d = 50, emphasis = 0.7 } = params;

    ctx.globalAlpha = emphasis;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;

    const cx = width / 2;
    const cy = height / 2;

    ctx.beginPath();

    const steps = 2000;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 20;
      const x = cx + (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
      const y = cy + (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  static interference(ctx, width, height, rng, params) {
    const { waves = 5, frequency = 0.02, emphasis = 0.7 } = params;

    const centers = [];
    for (let i = 0; i < waves; i++) {
      centers.push({
        x: rng.range(0, width),
        y: rng.range(0, height),
        phase: rng.range(0, Math.PI * 2)
      });
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let interference = 0;

        for (const wave of centers) {
          const dist = Math.sqrt((x - wave.x) ** 2 + (y - wave.y) ** 2);
          interference += Math.sin(dist * frequency + wave.phase);
        }

        interference /= waves;

        const idx = (y * width + x) * 4;
        const v = Math.floor(((interference + 1) / 2) * 255);
        data[idx] = data[idx + 1] = data[idx + 2] = v;
        data[idx + 3] = Math.floor(emphasis * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static gradientZones(ctx, width, height, rng, params) {
    const { zones = 3, emphasis = 0.7 } = params;

    ctx.globalAlpha = emphasis;

    for (let i = 0; i < zones; i++) {
      const type = rng.choice(['radial', 'linear']);

      let gradient;
      if (type === 'radial') {
        gradient = ctx.createRadialGradient(
          rng.range(0, width), rng.range(0, height), 0,
          rng.range(0, width), rng.range(0, height), rng.range(width * 0.5, width)
        );
      } else {
        gradient = ctx.createLinearGradient(
          rng.range(0, width), rng.range(0, height),
          rng.range(0, width), rng.range(0, height)
        );
      }

      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#000');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalAlpha = 1.0;
  }

  static circularPacking(ctx, width, height, rng, params) {
    const { attempts = 1000, minRadius = 5, maxRadius = 50, emphasis = 0.7 } = params;

    const circles = [];

    for (let i = 0; i < attempts; i++) {
      const x = rng.range(0, width);
      const y = rng.range(0, height);
      let radius = maxRadius;

      // Find max radius that doesn't overlap
      for (const circle of circles) {
        const dist = Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2);
        radius = Math.min(radius, dist - circle.radius);
      }

      if (radius >= minRadius) {
        circles.push({ x, y, radius });
      }
    }

    ctx.globalAlpha = emphasis;

    for (const circle of circles) {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }
}
