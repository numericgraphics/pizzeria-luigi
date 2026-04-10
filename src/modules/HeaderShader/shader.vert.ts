const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_size;

  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_rotation;

  void main() {
    vec2 offset = a_position - u_center;
    float c = cos(u_rotation);
    float s = sin(u_rotation);
    vec2 rotated = vec2(
      offset.x * c - offset.y * s,
      offset.x * s + offset.y * c
    ) + u_center;

    vec2 clipSpace = (rotated / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = a_size;
  }
`

export default vertexShaderSource
