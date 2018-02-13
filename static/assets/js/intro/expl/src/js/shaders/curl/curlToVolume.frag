uniform float u_curlSize;
uniform float u_noiseTime;
uniform float u_persistence;
uniform vec4 u_sliceInfo;

varying vec2 v_uv;

#pragma glslify: coord2To3 = require(../../glsl/coord2To3)
#pragma glslify: curl = require(../../glsl/curl4)

void main() {

    gl_FragColor = vec4(curl(coord2To3(v_uv, u_sliceInfo.x, u_sliceInfo.y) * u_curlSize, u_noiseTime, u_persistence) * 0.5 + 0.5, 1.0);

}
