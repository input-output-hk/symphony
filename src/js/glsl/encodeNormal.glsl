vec2 encodeNormal (vec3 n) {
    float scale = 1.7777;
    vec2 enc = n.xy / (n.z+1.0);
    enc /= scale;
    enc = enc*0.5+0.5;
    return enc;
}

#pragma glslify: export(encodeNormal)
