/**
 * Project Tile vertex shader from lusion-reverse-engineered-main.
 * Applies scroll-velocity-based horizontal stretch distortion.
 */
uniform float stretchAmount;

varying vec2 vUv;

void main() {
    vec3 newPosition = position;

    float ndcUvY = uv.y * 2.0 - 1.0;
    newPosition.x *= 1.0 + (ndcUvY * stretchAmount);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    vUv = uv;
}
