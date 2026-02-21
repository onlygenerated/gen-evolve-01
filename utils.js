/**
 * Core utility classes for generative art
 */

class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max));
  }

  choice(arr) {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(this.next() * arr.length)];
  }
}

class PerlinNoise {
  constructor(rng) {
    this.rng = rng;
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }
    this.p = [...this.permutation, ...this.permutation];
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const a = this.p[X] + Y;
    const aa = this.p[a];
    const ab = this.p[a + 1];
    const b = this.p[X + 1] + Y;
    const ba = this.p[b];
    const bb = this.p[b + 1];

    return this.lerp(v,
      this.lerp(u, this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y)),
      this.lerp(u, this.grad(this.p[ab], x, y - 1), this.grad(this.p[bb], x - 1, y - 1))
    );
  }

  octaveNoise(x, y, octaves, persistence) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

class VoronoiField {
  constructor(rng, width, height, numPoints, influenceVariation = 1.0) {
    this.points = [];
    this.colors = [];

    for (let i = 0; i < numPoints; i++) {
      this.points.push({
        x: rng.range(0, width),
        y: rng.range(0, height),
        influence: rng.range(0.5 / influenceVariation, 2.0 * influenceVariation)
      });

      this.colors.push({
        h: rng.range(0, 360),
        s: rng.range(20, 80),
        l: rng.range(30, 70)
      });
    }
  }

  getCell(x, y) {
    let minDist = Infinity;
    let minIndex = 0;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2) / p.influence;
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }

    return { index: minIndex, distance: minDist, color: this.colors[minIndex] };
  }
}

class FlowField {
  constructor(rng, width, height, resolution, scale, strength) {
    this.width = width;
    this.height = height;
    this.resolution = resolution;
    this.scale = scale;
    this.strength = strength;
    this.perlin = new PerlinNoise(rng);
  }

  getAngle(x, y) {
    return this.perlin.noise(x * this.scale, y * this.scale) * Math.PI * 2;
  }
}
