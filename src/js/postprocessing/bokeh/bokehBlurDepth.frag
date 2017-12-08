uniform sampler2D u_texture;
uniform vec2 u_delta;
uniform float u_cameraNear;
uniform float u_cameraFar;

varying vec2 v_uv[9];

float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
    return ( near * far ) / ( ( far - near ) * invClipZ - far );
}

#ifdef USE_INFO_TEXTURE
float getDepth (vec2 uv) {
  float d = texture2D( u_texture, uv ).b;
  return -perspectiveDepthToViewZ( d, u_cameraNear, u_cameraFar );
}
#else
float getDepth (vec2 uv) {
  float d = texture2D( u_texture, uv ).r;
  return -perspectiveDepthToViewZ( d, u_cameraNear, u_cameraFar );
}
#endif

void main() {
    float depth = getDepth(v_uv[0]) * 0.1633;

    depth += getDepth( v_uv[1] ) * 0.1531;
    depth += getDepth( v_uv[2] ) * 0.1531;
    depth += getDepth( v_uv[3] ) * 0.12245;
    depth += getDepth( v_uv[4] ) * 0.12245;
    depth += getDepth( v_uv[5] ) * 0.0918;
    depth += getDepth( v_uv[6] ) * 0.0918;
    depth += getDepth( v_uv[7] ) * 0.051;
    depth += getDepth( v_uv[8] ) * 0.051;

    gl_FragColor = vec4(depth, depth, depth, 1.0);

}
