#pragma glslify: mirror3 = require(../../glsl/mirror3)
#pragma glslify: sampleAs3DTexture = require(../../glsl/sampleAs3DTexture)
// #pragma glslify: sampleAs3DTextureNearest = require(../../glsl/sampleAs3DTextureNearest)

vec3 curlSampler( in vec3 p, in sampler2D tex0, in sampler2D tex1, in vec4 sliceInfo, in float ratio) {

    p = mirror3(p);

    vec3 v0 = sampleAs3DTexture(tex0, p, sliceInfo).xyz - 0.5;
    vec3 v1 = sampleAs3DTexture(tex1, p, sliceInfo).xyz - 0.5;
    return mix(normalize(v0), normalize(v1), ratio) * mix(length(v0), length(v1), ratio) * 2.0;
}

// vec3 curlSamplerNearest( in vec3 p, in sampler2D tex0, in sampler2D tex1, in vec4 sliceInfo, in float ratio) {

//     p = mirror3(p);

//     vec3 v0 = sampleAs3DTextureNearest(tex0, p, sliceInfo).xyz - 0.5;
//     vec3 v1 = sampleAs3DTextureNearest(tex1, p, sliceInfo).xyz - 0.5;

//     return mix(normalize(v0), normalize(v1), ratio) * mix(length(v0), length(v1), ratio);

// }

#pragma glslify: export(curlSampler)
