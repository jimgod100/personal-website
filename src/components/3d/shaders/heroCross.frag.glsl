uniform float uTime;
uniform vec3 uColor;
uniform float uHueShift;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// RGB to HSL and back for hue shifting
vec3 rgb2hsl(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float l = (maxC + minC) * 0.5;
  float s = 0.0;
  float h = 0.0;
  if (maxC != minC) {
    float d = maxC - minC;
    s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    h /= 6.0;
  }
  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x, s = hsl.y, l = hsl.z;
  if (s == 0.0) return vec3(l);
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  return vec3(
    hue2rgb(p, q, h + 1.0/3.0),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1.0/3.0)
  );
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel rim lighting
  float rim = 1.0 - max(dot(viewDir, normal), 0.0);
  rim = smoothstep(0.5, 1.0, rim);

  // Apply hue shift to base color
  vec3 hsl = rgb2hsl(uColor);
  hsl.x = fract(hsl.x + uHueShift); // Shift hue
  hsl.y = clamp(hsl.y + uHueShift * 0.3, 0.0, 1.0); // Slightly vary saturation
  vec3 baseColor = hsl2rgb(hsl);

  // Time-based pulsing on the rim
  float pulse = (sin(uTime * 2.0) + 1.0) * 0.5;
  vec3 rimColor = baseColor * (2.0 + pulse);

  vec3 finalColor = baseColor * 0.6 + rimColor * rim;

  gl_FragColor = vec4(finalColor, 1.0);
}
