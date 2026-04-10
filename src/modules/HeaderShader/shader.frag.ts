const fragmentShaderSource = `
  precision mediump float;

  varying float v_angle;
  varying float v_depth;

  // Check if point p is inside the 5-pointed star polygon
  // Star defined by 5 outer vertices at radius R and 5 inner at radius r
  // Uses cross-product sign test against each of the 10 edges
  float starAlpha(vec2 p) {
    const float PI2 = 6.28318530;
    const float R = 0.46;   // outer radius
    const float r = 0.19;   // inner radius
    const int N = 5;

    // Rotate p by v_angle (self-rotation per star)
    float ca = cos(v_angle);
    float sa = sin(v_angle);
    p = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);

    // Discard outside bounding circle fast path
    if (length(p) > R + 0.02) return 0.0;

    // Build the 10 vertices of the star (alternating outer/inner)
    // and do a winding-number / cross-product inside test
    // offset by -PI/2 so first point faces up
    float offset = -PI2 * 0.25;

    bool inside = true;
    for (int i = 0; i < 10; i++) {
      float a0 = offset + float(i)     * PI2 / 10.0;
      float a1 = offset + float(i + 1) * PI2 / 10.0;
      float rad0 = (mod(float(i), 2.0) < 1.0) ? R : r;
      float rad1 = (mod(float(i + 1), 2.0) < 1.0) ? R : r;
      vec2 v0 = vec2(cos(a0), sin(a0)) * rad0;
      vec2 v1 = vec2(cos(a1), sin(a1)) * rad1;
      // Cross product to determine side
      vec2 edge = v1 - v0;
      vec2 toP  = p  - v0;
      if (edge.x * toP.y - edge.y * toP.x < 0.0) {
        inside = false;
      }
    }

    if (!inside) return 0.0;

    // Soft edge: distance to outer boundary for slight anti-alias
    float d = R - length(p);
    return smoothstep(0.0, 0.04, d);
  }

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float alpha = starAlpha(coord);
    if (alpha < 0.01) discard;

    // Color: center stars lighter, outer stars darker gray (matches flyer)
    float gray = mix(0.88, 0.38, v_depth);
    vec3 color = vec3(gray);

    gl_FragColor = vec4(color, alpha * mix(0.35, 0.85, v_depth));
  }
`

export default fragmentShaderSource
