uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Simple rim lighting (fake SSS/glow)
  float rim = 1.0 - max(dot(viewDir, normal), 0.0);
  rim = smoothstep(0.6, 1.0, rim);

  // Base color
  vec3 baseColor = uColor;

  // Add some time-based pulsing to the rim
  float pulse = (sin(uTime * 2.0) + 1.0) * 0.5;
  vec3 rimColor = baseColor * (2.0 + pulse);

  vec3 finalColor = baseColor * 0.5 + rimColor * rim;

  gl_FragColor = vec4(finalColor, 1.0);
}
