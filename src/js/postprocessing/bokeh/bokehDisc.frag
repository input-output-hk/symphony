#include <packing>

uniform sampler2D u_texture;
uniform sampler2D u_depthTexture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_discSize;
varying vec2 v_uv;

uniform vec2 u_lowerBound;
uniform vec2 u_upperBound;

// Bokeh disc.
// by David Hoskins.
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
#define USE_MIPMAP
// The Golden Angle is (3.-sqrt(5.0))*PI radians, which doesn't precompiled for some reason.
// The compiler is a dunce I tells-ya!!
#define GOLDEN_ANGLE 2.39996323
#define ITERATIONS 35
mat2 rot = mat2(cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE));
//-------------------------------------------------------------------------------------------
vec3 Bokeh(sampler2D tex, vec2 uv, float radius, float amount)
{
  vec3 acc = vec3(0.0);
  vec3 div = vec3(0.0);
  vec2 pixel = 2.0 / u_resolution.xy;
  float r = 1.0;
    vec2 vangle = vec2(0.0, radius); // Start angle
    amount += radius * u_discSize;
  for (int j = 0; j < ITERATIONS; j += 1 )
  {
    r += 1. / r;
    vangle = rot * vangle;
    // (r-1.0) here is the equivalent to sqrt(0, 1, 2, 3...)
    #ifdef USE_MIPMAP
    vec3 col = texture2D(tex, uv + pixel * (r-1.) * vangle, radius).xyz;
    #else
    vec3 col = texture2D(tex, uv + pixel * (r-1.) * vangle).xyz;
    #endif
    col = col * col * 1.5; // ...contrast it for better highlights - leave this out elsewhere.
    vec3 bokeh = pow(col, vec3(9.0)) * amount + .4;
    acc += col * bokeh;
    div += bokeh;
  }
  return acc / div;
}

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
  factor = smoothstep(0.0, 1.0, factor);
  vec4 color = vec4( Bokeh( u_texture, v_uv, factor, 0.0 ), 1. );
  // color.rgb = pow( color.rgb, 1. / vec3( 2.2 ) );

  gl_FragColor = color;
}
