uniform sampler2D u_texture;

#ifdef USE_EMISSIVE
  uniform sampler2D u_emissiveTexture;
#endif

uniform vec3 u_defaultColor;
uniform float u_defaultOpacity;
uniform float u_luminosityThreshold;
uniform float u_smoothWidth;

varying vec2 v_uv;

void main() {

  vec4 texel = texture2D( u_texture, v_uv );

  vec3 luma = vec3( 0.299, 0.587, 0.114 );

  float v = dot( texel.xyz, luma );

  vec4 outputColor = vec4( u_defaultColor.rgb * u_defaultOpacity, 1.0);

  float alpha = smoothstep( u_luminosityThreshold, u_luminosityThreshold + u_smoothWidth, v );

  outputColor = mix( outputColor, texel, alpha );

  #ifdef USE_EMISSIVE
    vec3 emissive = texture2D( u_emissiveTexture, v_uv ).rgb;
    v = dot( emissive.xyz, luma );
    // outputColor.rgb += max( outputColor.rgb, texture2D( u_emissiveTexture, v_uv ).rgb * v );
    outputColor.rgb += texture2D( u_emissiveTexture, v_uv ).rgb * v;
  #endif

  // gl_FragColor = outputColor;
  gl_FragColor = vec4(outputColor.rgb, 1.0);

}
