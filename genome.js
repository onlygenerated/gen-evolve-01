/**
 * Genome encoding and mutation for evolutionary art
 */

class Genome {
  static ALGORITHMS = [
    'voronoi', 'metaballs', 'perlinNoise', 'flowField', 'organicBlobs',
    'reactionDiffusion', 'delaunay', 'perlinWorms', 'radialSymmetry',
    'displacementField', 'liquidMarbling', 'fractalTree', 'dithering',
    'halftone', 'truchetTiles', 'lissajous', 'spirograph', 'interference',
    'gradientZones', 'circularPacking'
  ];

  static BLEND_MODES = [
    'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
  ];

  static PALETTE_SCHEMES = ['analogous', 'complementary', 'triadic', 'monochrome'];

  static random(rng) {
    const numLayers = rng.int(2, 6);
    const layers = [];

    for (let i = 0; i < numLayers; i++) {
      const algorithm = rng.choice(Genome.ALGORITHMS);
      layers.push({
        algorithm,
        params: Genome.randomParams(algorithm, rng),
        blendMode: rng.choice(Genome.BLEND_MODES)
      });
    }

    return {
      seed: rng.int(0, 1000000),
      palette: {
        scheme: rng.choice(Genome.PALETTE_SCHEMES),
        baseHue: rng.range(0, 360)
      },
      layers
    };
  }

  static randomParams(algorithm, rng) {
    const baseParams = {
      emphasis: rng.range(0.3, 1.0)
    };

    switch (algorithm) {
      case 'voronoi':
        return { ...baseParams, count: rng.int(10, 80), influence: rng.range(0.5, 2.0) };
      case 'metaballs':
        return { ...baseParams, count: rng.int(5, 20), radius: rng.range(0.2, 0.5) };
      case 'perlinNoise':
        return { ...baseParams, scale: rng.range(0.002, 0.01), octaves: rng.int(2, 6) };
      case 'flowField':
        return { ...baseParams, resolution: rng.int(10, 40), scale: rng.range(0.005, 0.02), particles: rng.int(500, 2000) };
      case 'organicBlobs':
        return { ...baseParams, count: rng.int(3, 10), scale: rng.range(0.002, 0.006), threshold: rng.range(0.3, 0.7) };
      case 'reactionDiffusion':
        return { ...baseParams, iterations: rng.int(50, 150), feed: rng.range(0.04, 0.07), kill: rng.range(0.055, 0.068) };
      case 'delaunay':
        return { ...baseParams, count: rng.int(30, 100) };
      case 'perlinWorms':
        return { ...baseParams, count: rng.int(20, 50), scale: rng.range(0.01, 0.04) };
      case 'radialSymmetry':
        return { ...baseParams, segments: rng.int(4, 16), radius: rng.range(0.6, 0.9) };
      case 'displacementField':
        return { ...baseParams, scale: rng.range(0.005, 0.02), intensity: rng.range(10, 50) };
      case 'liquidMarbling':
        return { ...baseParams, swirls: rng.int(5, 15), complexity: rng.int(2, 5) };
      case 'fractalTree':
        return { ...baseParams, depth: rng.int(6, 12), angle: rng.range(0.3, 0.6) };
      case 'dithering':
        return { ...baseParams, threshold: rng.int(100, 180) };
      case 'halftone':
        return { ...baseParams, dotSize: rng.int(4, 12) };
      case 'truchetTiles':
        return { ...baseParams, tileSize: rng.int(20, 60) };
      case 'lissajous':
        return { ...baseParams, a: rng.int(2, 6), b: rng.int(2, 6), delta: rng.range(0, Math.PI * 2) };
      case 'spirograph':
        return { ...baseParams, R: rng.range(80, 150), r: rng.range(20, 60), d: rng.range(30, 80) };
      case 'interference':
        return { ...baseParams, waves: rng.int(3, 8), frequency: rng.range(0.01, 0.04) };
      case 'gradientZones':
        return { ...baseParams, zones: rng.int(2, 5) };
      case 'circularPacking':
        return { ...baseParams, attempts: rng.int(500, 1500), minRadius: rng.int(3, 10), maxRadius: rng.int(30, 80) };
      default:
        return baseParams;
    }
  }

  static mutate(genome, mutationRate, rng) {
    const newGenome = JSON.parse(JSON.stringify(genome));
    const rate = mutationRate / 100;

    // Mutate palette
    if (rng.next() < rate * 0.3) {
      newGenome.palette.scheme = rng.choice(Genome.PALETTE_SCHEMES);
    }
    if (rng.next() < rate * 0.5) {
      newGenome.palette.baseHue = (newGenome.palette.baseHue + rng.range(-30, 30) + 360) % 360;
    }

    // Mutate layers
    for (let i = 0; i < newGenome.layers.length; i++) {
      const layer = newGenome.layers[i];

      // Mutate blend mode
      if (rng.next() < rate * 0.2) {
        layer.blendMode = rng.choice(Genome.BLEND_MODES);
      }

      // Mutate parameters
      for (const key in layer.params) {
        if (rng.next() < rate) {
          const val = layer.params[key];
          if (typeof val === 'number') {
            const stdDev = Math.abs(val) * 0.2;
            const gaussian = rng.range(-stdDev, stdDev);
            layer.params[key] = Math.max(0.01, val + gaussian);
          }
        }
      }

      // Change algorithm (rare)
      if (rng.next() < rate * 0.1) {
        const newAlg = rng.choice(Genome.ALGORITHMS);
        layer.algorithm = newAlg;
        layer.params = Genome.randomParams(newAlg, rng);
      }
    }

    // Add layer
    if (rng.next() < rate * 0.3 && newGenome.layers.length < 8) {
      const algorithm = rng.choice(Genome.ALGORITHMS);
      const insertPos = rng.int(0, newGenome.layers.length + 1);
      newGenome.layers.splice(insertPos, 0, {
        algorithm,
        params: Genome.randomParams(algorithm, rng),
        blendMode: rng.choice(Genome.BLEND_MODES)
      });
    }

    // Remove layer
    if (rng.next() < rate * 0.3 && newGenome.layers.length > 2) {
      const removePos = rng.int(0, newGenome.layers.length);
      newGenome.layers.splice(removePos, 1);
    }

    // Shuffle layers
    if (rng.next() < rate * 0.2 && newGenome.layers.length > 2) {
      const i = rng.int(0, newGenome.layers.length);
      const j = rng.int(0, newGenome.layers.length);
      [newGenome.layers[i], newGenome.layers[j]] = [newGenome.layers[j], newGenome.layers[i]];
    }

    return newGenome;
  }

  static crossover(genome1, genome2, rng) {
    const newGenome = {
      seed: rng.int(0, 1000000),
      palette: rng.next() < 0.5 ? { ...genome1.palette } : { ...genome2.palette },
      layers: []
    };

    // Interleave layers from both parents
    const maxLen = Math.max(genome1.layers.length, genome2.layers.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < genome1.layers.length && (rng.next() < 0.5 || i >= genome2.layers.length)) {
        newGenome.layers.push({ ...genome1.layers[i] });
      } else if (i < genome2.layers.length) {
        newGenome.layers.push({ ...genome2.layers[i] });
      }
    }

    // Ensure at least 2 layers
    if (newGenome.layers.length < 2) {
      const source = rng.choice([genome1, genome2]);
      newGenome.layers.push({ ...rng.choice(source.layers) });
    }

    return newGenome;
  }
}
