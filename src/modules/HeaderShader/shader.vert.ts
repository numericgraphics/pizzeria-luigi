const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_selfAngle;
  attribute float a_spinSpeed;
  attribute float a_orbitSpeed;
  attribute float a_depth;

  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_rotation;

  varying float v_angle;
  varying float v_depth;

  void main() {
    // Each star orbits at its own speed around the logo center
    float orbit = u_rotation * a_orbitSpeed;

    vec2 offset = a_position - u_center;
    float c = cos(orbit);
    float s = sin(orbit);
    vec2 rotated = vec2(
      offset.x * c - offset.y * s,
      offset.x * s + offset.y * c
    ) + u_center;

    vec2 clip = (rotated / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = a_size;

    // Self-rotation: each star spins on its own axis
    v_angle = a_selfAngle + u_rotation * a_spinSpeed;
    v_depth = a_depth;
  }
`

export default vertexShaderSource
