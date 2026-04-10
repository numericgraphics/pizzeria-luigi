# Header Animation – Technical Plan
## Feature: `feature/header-animation-shader`

---

## 1. Goal

Add a full-width animated star background behind the logo in the site header.
Stars rotate around the logo center, masked strictly within the header bounds (`overflow: hidden`).
The logo is untouched — the animation lives entirely behind it.

---

## 2. Source Asset

**`sources/background-stars.svg`**
- Square canvas: `734.08 × 734.08` viewBox
- Single `<path>` of star shapes distributed in a circular arrangement
- Fill: radial gradient (white center → dark gray outer edge)
- Stars range from tiny single points to large multi-point bursts
- The composition is already centered and radially balanced — ideal for a spin animation

The SVG star positions will be **extracted as data** (x/y coordinates + size class) to drive the WebGL shader, rather than rendering the SVG directly. This gives full GPU control.

---

## 3. Technology Decision

### Candidates evaluated

| Technology | Shader Language | Browser Support (2026) | Notes |
|---|---|---|---|
| Canvas 2D | None | 100% | CPU-bound, no shaders |
| **WebGL 1** | **GLSL ES 1.00** | **~99%** | ✅ Chosen — see below |
| WebGL 2 | GLSL ES 3.00 | ~85% | Excludes older iOS/Safari |
| WebGPU | WGSL | ~70% | Too new, Firefox incomplete |

### Decision: **WebGL 1 + GLSL ES 1.00**

**Reasons:**
- 99% browser support including all iOS/Safari versions
- GLSL ES 1.00 is fully sufficient for a 2D rotation + alpha/scale animation
- No external dependencies — raw WebGL in a React `useEffect` client component
- GPU-accelerated: matrix transforms run on GPU, not CPU
- Graceful fallback to CSS animation if WebGL context fails

**Rejected:**
- WebGL 2 — unnecessary for this use case, breaks ~15% of users (older iOS)
- WebGPU — Firefox support incomplete, not yet universal
- Canvas 2D — CPU-bound, cannot run vertex/fragment shaders

---

## 4. Architecture

### File structure

```
src/
├── modules/
│   └── HeaderShader/
│       ├── index.tsx          ← Client component ('use client')
│       ├── styles.css         ← Canvas positioning, overflow hidden
│       ├── shader.vert.ts     ← GLSL ES 1.00 vertex shader (string)
│       └── shader.frag.ts     ← GLSL ES 1.00 fragment shader (string)
├── data/
│   └── stars.json             ← Extracted star positions from SVG
public/
└── background-stars.svg       ← Copied from sources/ (reference)
```

### Integration

`layout.tsx` → `<header>` contains:
1. `<HeaderShader />` — absolutely positioned, fills header, z-index below logo
2. `<img logo />` — unchanged, z-index above shader canvas

---

## 5. Shader Design

### Vertex Shader (GLSL ES 1.00)

Each star is a point sprite rendered as a `gl.POINTS` primitive.

```glsl
attribute vec2 a_position;   // star x/y in normalized coords
attribute float a_size;      // star point size

uniform float u_time;        // elapsed time (seconds)
uniform vec2 u_center;       // rotation center (normalized)
uniform float u_rotation;    // global rotation angle
uniform vec2 u_resolution;   // canvas dimensions

void main() {
  // Rotate each star around the center
  vec2 offset = a_position - u_center;
  float cos_r = cos(u_rotation);
  float sin_r = sin(u_rotation);
  vec2 rotated = vec2(
    offset.x * cos_r - offset.y * sin_r,
    offset.x * sin_r + offset.y * cos_r
  ) + u_center;

  // Convert to clip space
  vec2 clipSpace = (rotated / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  gl_PointSize = a_size;
}
```

### Fragment Shader (GLSL ES 1.00)

Each point renders as a soft circular disc.

```glsl
precision mediump float;

uniform float u_alpha;       // global opacity

void main() {
  // Circular soft point
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, dist) * u_alpha;
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
```

### Uniforms driven by JavaScript

| Uniform | Source | Notes |
|---|---|---|
| `u_time` | `requestAnimationFrame` timestamp | Drives rotation |
| `u_rotation` | `time * SPEED` | Constant angular velocity |
| `u_center` | Header center (pixel) | Logo center |
| `u_resolution` | Canvas `width, height` | Updated on resize |
| `u_alpha` | Constant `0.7` | Subtle, non-distracting |

---

## 6. Star Data Extraction

The SVG `<path>` encodes all star shapes. Stars are extracted by:
1. Parsing the SVG path `M` commands to find each star's center point
2. Counting path complexity (small = tiny star, large = big star) to derive a size bucket
3. Outputting `stars.json`: `[{ x, y, size }, ...]` in the SVG coordinate space (0–734)

This data is baked at build time — no runtime SVG parsing.

---

## 7. React Component

```tsx
// src/modules/HeaderShader/index.tsx
'use client'

import { useEffect, useRef } from 'react'
import './styles.css'

export default function HeaderShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 1. Try WebGL context
    const gl = canvas.getContext('webgl')
    if (!gl) return // graceful: canvas stays hidden, no crash

    // 2. Compile shaders, create program
    // 3. Upload star geometry (from stars.json)
    // 4. Start requestAnimationFrame loop
    // 5. Update u_time, u_rotation each frame
    // 6. Cleanup on unmount (cancel RAF, lose context)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="header-shader"
      aria-hidden="true"
    />
  )
}
```

### Graceful fallback

If `getContext('webgl')` returns `null`:
- Canvas remains hidden (`opacity: 0`)
- No error thrown, no visible impact on page
- Header looks normal (white background, logo visible)

---

## 8. CSS

```css
/* src/modules/HeaderShader/styles.css */
.header-shader {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;          /* behind logo (z-index: 1) */
  opacity: 0.6;
  pointer-events: none; /* clicks pass through to header */
}
```

Header gets `position: relative` and `overflow: hidden` — animation is clipped to header bounds.

---

## 9. Animation Parameters

| Parameter | Value | Rationale |
|---|---|---|
| Rotation speed | `0.03 rad/s` | Slow, subtle — not distracting while ordering |
| Star count | All from SVG (~120) | Already balanced composition |
| Point size range | `2–12 px` | Proportional to original star sizes |
| Alpha | `0.6` | Visible but not overwhelming over white bg |
| Background | `transparent` | Header background color shows through |
| Frame rate | 60fps target | `requestAnimationFrame` native |
| Resize handling | `ResizeObserver` | Canvas redraws on header resize |

---

## 10. Implementation Steps

- [ ] Extract star positions from SVG → `src/data/stars.json`
- [ ] Create `src/modules/HeaderShader/shader.vert.ts` (vertex shader string)
- [ ] Create `src/modules/HeaderShader/shader.frag.ts` (fragment shader string)
- [ ] Create `src/modules/HeaderShader/index.tsx` (WebGL setup + RAF loop)
- [ ] Create `src/modules/HeaderShader/styles.css`
- [ ] Update `src/app/layout.tsx` — add `<HeaderShader />` inside `<header>`, set `position: relative` + `overflow: hidden`
- [ ] Update `src/css/layout.css` — add `position: relative; overflow: hidden` to `.header`; add `z-index: 1` to `.header__logo` and `.header__tagline`
- [ ] Copy `sources/background-stars.svg` → `public/background-stars.svg`
- [ ] Test WebGL fallback (disable WebGL in DevTools → verify no crash)
- [ ] Test responsive (mobile header height change → stars refit)
- [ ] Build + deploy to `feature/header-animation-shader` on Vercel

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| WebGL not available (old device, security policy) | Graceful no-op fallback |
| Animation distracts from menu readability | Low alpha (0.6), slow rotation (0.03 rad/s) |
| Performance on low-end mobile | ~120 point sprites is negligible GPU load |
| Header height varies on resize | `ResizeObserver` updates canvas size + uniforms |
| SSR (Next.js server render) | `'use client'` directive + `useEffect` guard |

---

*Branch: `feature/header-animation-shader` | Created: 2026-04-10*
