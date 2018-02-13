#include <packing>

uniform sampler2D u_texture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_blurredTexture;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_baseColor;
varying vec2 v_uv;

uniform vec2 u_lowerBound;
uniform vec2 u_upperBound;


float range(float vmin, float vmax, float value) {
  return (value - vmin) / (vmax - vmin);
}

void main() {
  vec2 uv = v_uv;
  #ifdef USE_INFO_TEXTURE
    float d = texture2D( u_depthTexture, v_uv ).b;
  #else
    float d = texture2D( u_depthTexture, v_uv ).r;
  #endif
  // float factor = max(1.0 - range(u_lowerBound.x, u_lowerBound.y, d), range(u_upperBound.x, u_upperBound.y, d));
  float factor = 1.0 - range(u_lowerBound.x, u_lowerBound.y, d);
  factor = smoothstep(0.0, 0.5, factor);


  vec4 blurredColor = texture2D(u_blurredTexture, v_uv);
  vec4 color = texture2D(u_texture, v_uv);

  color = mix(color, blurredColor, factor);

  // color.rgb = pow( color.rgb, 1. / vec3( 2.2 ) );

  color.rgb = max(u_baseColor, color.rgb);

  gl_FragColor = color;
}
