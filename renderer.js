/**
 * Core rendering engine - renders genomes to canvas
 */

class Renderer {
  static render(canvas, genome) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Create RNG from genome seed
    const rng = new SeededRandom(genome.seed);

    // Generate palette colors
    const palette = this.generatePalette(genome.palette, rng);

    // Render each layer
    for (const layer of genome.layers) {
      this.renderLayer(ctx, width, height, layer, rng, palette);
    }
  }

  static generatePalette(paletteConfig, rng) {
    const { scheme, baseHue } = paletteConfig;
    const palette = [];

    switch (scheme) {
      case 'analogous':
        for (let i = 0; i < 5; i++) {
          palette.push({
            h: (baseHue + i * 15) % 360,
            s: rng.range(55, 90),  // Higher saturation
            l: rng.range(35, 70)   // Avoid too dark/light
          });
        }
        break;

      case 'complementary':
        palette.push({ h: baseHue, s: rng.range(60, 90), l: rng.range(40, 65) });
        palette.push({ h: (baseHue + 180) % 360, s: rng.range(60, 90), l: rng.range(40, 65) });
        palette.push({ h: (baseHue + 30) % 360, s: rng.range(45, 75), l: rng.range(45, 70) });
        palette.push({ h: (baseHue + 210) % 360, s: rng.range(45, 75), l: rng.range(45, 70) });
        break;

      case 'triadic':
        for (let i = 0; i < 3; i++) {
          palette.push({
            h: (baseHue + i * 120) % 360,
            s: rng.range(60, 90),  // Higher saturation
            l: rng.range(40, 70)   // Mid-range lightness
          });
        }
        palette.push({ h: (baseHue + 60) % 360, s: rng.range(50, 80), l: rng.range(45, 70) });
        palette.push({ h: (baseHue + 180) % 360, s: rng.range(50, 80), l: rng.range(45, 70) });
        break;

      case 'monochrome':
        for (let i = 0; i < 5; i++) {
          palette.push({
            h: baseHue,
            s: rng.range(10, 60),
            l: 20 + i * 15
          });
        }
        break;
    }

    return palette;
  }

  static renderLayer(ctx, width, height, layer, rng, palette) {
    const { algorithm, params, blendMode } = layer;

    // Create temporary canvas for this layer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    // Apply palette to temp context (for algorithms that use fillStyle/strokeStyle)
    const paletteColor = rng.choice(palette);
    if (paletteColor) {
      tempCtx.fillStyle = `hsl(${paletteColor.h}, ${paletteColor.s}%, ${paletteColor.l}%)`;
      tempCtx.strokeStyle = `hsl(${paletteColor.h}, ${paletteColor.s}%, ${paletteColor.l}%)`;
    }

    // Render algorithm to temp canvas
    try {
      if (Algorithms[algorithm]) {
        // Create a new RNG seeded from the current state for determinism
        const layerRng = new SeededRandom(Math.floor(rng.next() * 1000000));
        Algorithms[algorithm](tempCtx, width, height, layerRng, params);
      }
    } catch (e) {
      console.error(`Error rendering ${algorithm}:`, e);
    }

    // Composite onto main canvas with blend mode
    const previousMode = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = blendMode;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalCompositeOperation = previousMode;
  }

  static renderToDataURL(genome, width = 1200, height = 1200) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.render(canvas, genome);
    return canvas.toDataURL('image/png');
  }
}
