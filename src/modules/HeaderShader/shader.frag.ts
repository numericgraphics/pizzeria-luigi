const fragmentShaderSource = `
  precision mediump float;

  uniform float u_alpha;

  // Signed distance function for a regular N-pointed star
  // p: point in [-0.5, 0.5] space
  // r1: outer radius, r2: inner radius, n: number of points
  float sdStar(vec2 p, float r1, float r2, float n) {
    float an = 3.14159265 / n;
    float en = 3.14159265 / 3.0; // fixed inner angle
    vec2 acs = vec2(cos(an), sin(an));
    vec2 ecs = vec2(cos(en), sin(en));

    float bn = mod(atan(p.y, p.x), 2.0 * an) - an;
    p = length(p) * vec2(cos(bn), abs(sin(bn)));
    p -= r1 * acs;
    p += ecs * clamp(-dot(p, ecs), 0.0, r1 * acs.y / ecs.y);
    return length(p) * sign(p.x);
  }

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);

    // 4-pointed star: n=4, outer=0.48, inner=0.18
    float d = sdStar(coord, 0.48, 0.18, 4.0);

    // Sharp crisp edge with very slight anti-alias
    float shape = 1.0 - smoothstep(-0.01, 0.02, d);

    if (shape < 0.01) discard;

    // Silver/gray color matching the flyer
    vec3 color = vec3(0.72, 0.70, 0.66);
    gl_FragColor = vec4(color, shape * u_alpha);
  }
`

export default fragmentShaderSource
