const fragmentShaderSource = `
  precision mediump float;

  uniform float u_alpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * u_alpha;
    gl_FragColor = vec4(1.0, 0.85, 0.4, alpha);
  }
`

export default fragmentShaderSource
