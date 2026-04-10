const fragmentShaderSource = `
  precision mediump float;

  uniform float u_alpha;

  // 5-pointed star SDF (Inigo Quilez)
  // p: coord in [-0.5, 0.5], r: outer radius, rf: inner/outer ratio
  float sdStar5(vec2 p, float r, float rf) {
    const float PI = 3.14159265;
    const float an = PI / 5.0;          // 36 deg — angle between points
    const float he = 0.7265425947;      // tan(an*2) normalisation factor

    // Fold into one sector
    float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
    p = length(p) * vec2(sin(bn), cos(bn));

    // Distance to the edge segment
    p -= r * vec2(sin(an), cos(an));
    float q = p.y + he * p.x;
    p += vec2(-he, 1.0) * clamp(q / (he * he + 1.0), 0.0, r);
    return length(p) * sign(p.x);
  }

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);

    // 5-pointed star: outer radius 0.47, inner/outer ratio 0.4
    float d = sdStar5(coord, 0.47, 0.4);

    // Crisp edge, 1px anti-alias
    float shape = 1.0 - smoothstep(-0.01, 0.025, d);

    if (shape < 0.01) discard;

    // Silver/gray — matches the flyer palette
    vec3 color = vec3(0.70, 0.68, 0.64);
    gl_FragColor = vec4(color, shape * u_alpha);
  }
`

export default fragmentShaderSource
