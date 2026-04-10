const fragmentShaderSource = `
  precision mediump float;

  varying float v_angle;
  varying float v_depth;

  // Inigo Quilez — sdPentagram exact (verbatim from iquilezles.org/articles/distfunctions2d/)
  float sdPentagram(in vec2 p, in float r) {
    const float k1x =  0.809016994; // cos(PI/5)
    const float k1y =  0.587785252; // sin(PI/5)
    const float k2x =  0.309016994; // sin(PI/10)
    const float k2y =  0.951056516; // cos(PI/10)
    const float k1z =  0.726542528; // tan(PI/5)

    const vec2 v1 = vec2( k1x, -k1y);
    const vec2 v2 = vec2(-k1x, -k1y);
    const vec2 v3 = vec2( k2x, -k2y);

    p.x = abs(p.x);
    p -= 2.0 * max(dot(v1, p), 0.0) * v1;
    p -= 2.0 * max(dot(v2, p), 0.0) * v2;
    p.x = abs(p.x);
    p.y -= r;

    return length(p - v3 * clamp(dot(p, v3), 0.0, k1z * r))
         * sign(p.y * v3.x - p.x * v3.y);
  }

  void main() {
    // Map gl_PointCoord [0,1] to centered [-1,1]
    vec2 p = (gl_PointCoord - 0.5) * 2.0;

    // Per-star self-rotation applied BEFORE SDF
    float ca = cos(v_angle);
    float sa = sin(v_angle);
    p = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);

    // Evaluate pentagram SDF
    float dist = sdPentagram(p, 0.88);

    // Crisp fill with slight anti-alias
    float shape = smoothstep(0.03, -0.03, dist);
    if (shape < 0.01) discard;

    // Depth shading: center = light gray, outer = dark gray (matches flyer)
    float gray  = mix(0.85, 0.32, v_depth);
    float alpha = mix(0.28, 0.92, v_depth);

    gl_FragColor = vec4(vec3(gray), shape * alpha);
  }
`

export default fragmentShaderSource
