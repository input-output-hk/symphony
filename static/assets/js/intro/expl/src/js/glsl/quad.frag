#ifdef TEXTURE_COUNT
  uniform sampler2D u_texture0;
  #if TEXTURE_COUNT > 1
  uniform sampler2D u_texture1;
  #endif
  #if TEXTURE_COUNT > 2
  uniform sampler2D u_texture2;
  #endif
  #if TEXTURE_COUNT > 3
  uniform sampler2D u_texture3;
  #endif
  #if TEXTURE_COUNT > 4
  uniform sampler2D u_texture4;
  #endif
#else
  uniform sampler2D u_texture;
#endif

varying vec2 v_uv;

void main() {
  #ifdef TEXTURE_COUNT
    gl_FragData[0] = texture2D( u_texture0, v_uv );
    #if TEXTURE_COUNT > 1
      gl_FragData[1] = texture2D( u_texture1, v_uv );
    #endif
    #if TEXTURE_COUNT > 2
      gl_FragData[2] = texture2D( u_texture2, v_uv );
    #endif
    #if TEXTURE_COUNT > 3
      gl_FragData[3] = texture2D( u_texture3, v_uv );
    #endif
    #if TEXTURE_COUNT > 4
      gl_FragData[4] = texture2D( u_texture4, v_uv );
    #endif
  #else
    gl_FragColor = texture2D( u_texture, v_uv );
  #endif

  // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
