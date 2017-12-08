#ifdef TEXTURE_COUNT
  uniform vec4 u_color0;
  #if TEXTURE_COUNT > 1
  uniform vec4 u_color1;
  #endif
  #if TEXTURE_COUNT > 2
  uniform vec4 u_color2;
  #endif
  #if TEXTURE_COUNT > 3
  uniform vec4 u_color3;
  #endif
  #if TEXTURE_COUNT > 4
  uniform vec4 u_color4;
  #endif
#else
  uniform vec4 u_color;
#endif

varying vec2 v_uv;

void main() {
  #ifdef TEXTURE_COUNT
    gl_FragData[0] = u_color0;
    #if TEXTURE_COUNT > 1
      gl_FragData[1] = u_color1;
    #endif
    #if TEXTURE_COUNT > 2
      gl_FragData[2] = u_color2;
    #endif
    #if TEXTURE_COUNT > 3
      gl_FragData[3] = u_color3;
    #endif
    #if TEXTURE_COUNT > 4
      gl_FragData[4] = u_color4;
    #endif
  #else
    gl_FragColor = u_color;
  #endif
}
