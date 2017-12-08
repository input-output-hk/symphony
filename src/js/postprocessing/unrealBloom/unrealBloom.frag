varying vec2 v_uv;
uniform sampler2D u_texture;
uniform sampler2D u_blurTexture1;
uniform sampler2D u_blurTexture2;
uniform sampler2D u_blurTexture3;
uniform sampler2D u_blurTexture4;
uniform sampler2D u_blurTexture5;
uniform float u_bloomStrength;
uniform float u_bloomRadius;
uniform float u_bloomFactors[NUM_MIPS];
uniform vec3 u_bloomTintColors[NUM_MIPS];

float lerpBloomFactor(const in float factor) {
  float mirrorFactor = 1.2 - factor;
  return mix(factor, mirrorFactor, u_bloomRadius);
}

void main() {
  vec4 c = texture2D(u_texture, v_uv);
  vec3 luma = vec3( 0.299, 0.587, 0.114 );
  float v = dot( c.xyz, luma );
  float a = 1.0 - v;//mix(1.0, 0.1, v);

  gl_FragColor = c + u_bloomStrength *(
    lerpBloomFactor(u_bloomFactors[0]) * vec4(u_bloomTintColors[0], 1.0) * texture2D(u_blurTexture1, v_uv) * 0.0625 +
    lerpBloomFactor(u_bloomFactors[1]) * vec4(u_bloomTintColors[1], 1.0) * texture2D(u_blurTexture2, v_uv) * 0.125 +
    lerpBloomFactor(u_bloomFactors[2]) * vec4(u_bloomTintColors[2], 1.0) * texture2D(u_blurTexture3, v_uv) * 0.25 +
    lerpBloomFactor(u_bloomFactors[3]) * vec4(u_bloomTintColors[3], 1.0) * texture2D(u_blurTexture4, v_uv) * 0.5 +
    lerpBloomFactor(u_bloomFactors[4]) * vec4(u_bloomTintColors[4], 1.0) * texture2D(u_blurTexture5, v_uv)
  ) * a;
}
