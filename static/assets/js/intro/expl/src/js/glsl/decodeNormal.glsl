// http://aras-p.info/texts/CompactNormalStorage.html
vec3 decodeNormal (vec2 enc) {
    float scale = 1.7777;
    vec3 nn = (vec3(enc.xy, 0.0) * 2.0 + vec3(-1.0, -1.0, 0.562525)) * scale;
    float g = 2.0 / dot(nn.xyz,nn.xyz);
    return vec3(
      g * nn.xy,
      g - 1.0
    );
}

#pragma glslify: export(decodeNormal)
