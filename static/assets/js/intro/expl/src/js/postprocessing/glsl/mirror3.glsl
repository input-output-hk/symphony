// 3D Uv Mirror wrapping
vec3 mirror3(vec3 pos) {
    vec3 mirrorPos = fract(pos);
    return mix(mirrorPos, 1.0 - mirrorPos, floor(mod(pos, vec3(2.0))));
}

#pragma glslify: export(mirror3)
