const fragmentShaderSource = `
  precision mediump float;

  varying float v_angle;
  varying float v_depth;

  // Inigo Quilez exact sdPentagram — GLSL ES 1.00 compatible
  // No loops, no arrays — pure reflection symmetry
  float sdPentagram(vec2 p, float r) {
    // Precomputed constants for a regular pentagram
    const float k1x =  0.809016994; // cos(PI/5)
    const float k1y =  0.587785252; // sin(PI/5)
    const float k2x = -0.309016994; // -sin(PI/10)
    const float k2y =  0.951056516; //  cos(PI/10)
    const float k3x =  0.726542528; //  tan(PI/5) — inner ratio

    vec2 k1 = vec2(k1x, -k1y);
    vec2 k2 = vec2(k2x,  k2y);

    p.x = abs(p.x);

    // Three reflection folds to collapse to canonical sector
    p -= 2.0 * min(dot(k1, p), 0.0) * k1;
    p -= 2.0 * min(dot(k2, p), 0.0) * k2;

    p.x = abs(p.x);
    p.y -= r;

    vec2 k3 = vec2(k3x, -k1y);
    p -= k3 * clamp(dot(p, k3), 0.0, r * k1x / k1y);

    return length(p) * sign(p.y);
  }

  void main() {
    // Map gl_PointCoord [0,1] to centered [-1,1] space
    vec2 p = (gl_PointCoord - 0.5) * 2.0;

    // Apply per-star self-rotation BEFORE the SDF
    float ca = cos(v_angle);
    float sa = sin(v_angle);
    p = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);

    // Evaluate pentagram SDF — outer radius 0.85 gives full tile coverage
    float dist = sdPentagram(p, 0.85);

    // Crisp fill with 1px anti-alias
    float shape = smoothstep(0.04, -0.04, dist);
    if (shape < 0.01) discard;

    // Depth-based color: center = light gray, outer = dark gray (matches flyer)
    float gray  = mix(0.85, 0.32, v_depth);
    float alpha = mix(0.30, 0.92, v_depth);

    gl_FragColor = vec4(vec3(gray), shape * alpha);
  }
`

export default fragmentShaderSource
