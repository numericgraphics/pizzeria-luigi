const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_selfAngle;
  attribute float a_spinSpeed;
  attribute float a_depth;

  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_rotation;

  varying float v_angle;
  varying float v_depth;

  void main() {
    // Orbit: rotate position around the logo center
    vec2 offset = a_position - u_center;
    float c = cos(u_rotation);
    float s = sin(u_rotation);
    vec2 rotated = vec2(
      offset.x * c - offset.y * s,
      offset.x * s + offset.y * c
    ) + u_center;

    vec2 clip = (rotated / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = a_size;

    // Self rotation: each star spins at its own speed and direction
    v_angle = a_selfAngle + u_rotation * a_spinSpeed;
    v_depth = a_depth;
  }
`

export default vertexShaderSource
