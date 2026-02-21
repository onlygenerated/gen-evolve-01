# Evolutionary Generative Art System

An interactive breeding system for generative art with 20+ morphological algorithms and genome-based encoding.

## Features

- 20+ distinct algorithms (voronoi, metaballs, reaction-diffusion, delaunay, perlin worms, radial symmetry, liquid marbling, fractal trees, dithering, halftone, truchet tiles, lissajous, spirograph, interference patterns, and more)
- Genome-based encoding with deterministic rendering
- Interactive breeding interface with 3-panel comparison
- Mutation system with adjustable rate (0-100%)
- Favorites gallery for saving genotypes
- Full-size rendering (1200x1200) on selection
- Crossover and layer mutation
- 16 blend modes for layer compositing
- 4 color palette schemes (analogous, complementary, triadic, monochrome)

## Architecture

### Genome Structure
```javascript
{
  seed: 12345,
  palette: {
    scheme: 'triadic',
    baseHue: 180
  },
  layers: [
    {
      algorithm: 'voronoi',
      params: { count: 25, influence: 1.5, emphasis: 0.8 },
      blendMode: 'overlay'
    },
    // ... more layers
  ]
}
```

### Files

- `index.html` - Main UI with breeding interface and favorites sidebar
- `renderer.js` - Core rendering engine, renders genomes to canvas
- `genome.js` - Genome encoding, mutation, and crossover logic
- `algorithms.js` - All 20+ algorithm implementations

### Algorithms

1. voronoi - Cellular/crystalline patterns
2. metaballs - Soft blob intersections
3. perlinNoise - Multi-octave noise terrain
4. flowField - Particle flow systems
5. organicBlobs - Large noise-based shapes
6. reactionDiffusion - Gray-Scott simulation
7. delaunay - Triangulation patterns
8. perlinWorms - Noise-driven tendrils
9. radialSymmetry - Kaleidoscope effects
10. displacementField - Image distortion
11. liquidMarbling - Swirl patterns
12. fractalTree - Recursive branching
13. dithering - Floyd-Steinberg style
14. halftone - Dot patterns
15. truchetTiles - Randomized tile patterns
16. lissajous - Parametric curves
17. spirograph - Hypocycloid patterns
18. interference - Wave patterns
19. gradientZones - Color regions
20. circularPacking - Circle packing algorithm

## Usage

1. Open `index.html` in a browser
2. Three random genomes are displayed
3. Click any thumbnail to view full-size (1200x1200)
4. In detail view:
   - "Save to Favorites" - Add to gallery
   - "Continue Breeding" - Generate 3 mutations
   - "Regenerate" - New seed, same genotype
5. Adjust mutation rate slider (0-100%)
6. Click "New Random Generation" for fresh start
7. Click favorites to reload saved genomes

## Mutation Logic

- Parameter adjustment (gaussian distribution)
- Layer addition/removal (based on mutation rate)
- Layer reordering
- Blend mode changes
- Algorithm swapping (rare)
- Palette scheme changes

## Technical Notes

- Uses SeededRandom, PerlinNoise, VoronoiField, and FlowField classes from Sediment
- Deterministic rendering: same genome + seed = same output
- Thumbnails at 400x400, detail view at 1200x1200
- Favorites stored in localStorage
- Async rendering with loading indicator
