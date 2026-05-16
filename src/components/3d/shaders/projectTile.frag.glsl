/**
 * Project Tile fragment shader from lusion-reverse-engineered-main.
 * Animated rounded-corner mask with aspect-aware UV remapping.
 */
uniform float aspect;
uniform float maskAmount;
uniform sampler2D map;

varying vec2 vUv;

vec2 getNdcUV(vec2 uv) {
    return uv * 2.0 - 1.0;
}

float roundedCornerMask(vec2 uv, float borderRadius, float asp, float taper) {
    vec2 uv_ndc = abs(getNdcUV(uv));

    vec2 corner;
    corner.x = uv_ndc.x - (1.0 - borderRadius - taper);
    corner.y = uv_ndc.y - (1.0 - borderRadius);
    corner = max(corner, vec2(0.0));
    corner.x *= asp;

    float distanceFromCorner = length(corner);
    return step(distanceFromCorner, borderRadius);
}

void main() {
    vec4 albedo = texture2D(map, vUv);

    float maskScaled = maskAmount * cos(vUv.y);
    albedo.a = roundedCornerMask(vUv, 0.1, aspect, maskScaled);
    gl_FragColor = albedo;
}
