uniform vec2 u_resolution;
uniform sampler2D u_texture;

#pragma glslify: fxaa = require(glsl-fxaa)

void main() {
    vec4 color = fxaa(u_texture, gl_FragCoord.xy, u_resolution);
    // color.xyz = 1.0 - color.xyz;
    // color.xyz = mix(color.xyz, vec3(1.0), 0.75);
    gl_FragColor = color;
}
