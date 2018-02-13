uniform sampler2D u_texture;
varying vec2 v_uv[9];

void main() {

    #ifdef USE_RGBA
        vec4 color = texture2D( u_texture, v_uv[0] ) * 0.1633;
        color += texture2D( u_texture,  v_uv[1] ) * 0.1531;
        color += texture2D( u_texture,  v_uv[2] ) * 0.1531;
        color += texture2D( u_texture,  v_uv[3] ) * 0.12245;
        color += texture2D( u_texture,  v_uv[4] ) * 0.12245;
        color += texture2D( u_texture,  v_uv[5] ) * 0.0918;
        color += texture2D( u_texture,  v_uv[6] ) * 0.0918;
        color += texture2D( u_texture,  v_uv[7] ) * 0.051;
        color += texture2D( u_texture,  v_uv[8] ) * 0.051;

        gl_FragColor = color;
    #else
        vec4 center = texture2D( u_texture, v_uv[0] );
        vec3 color = center.rgb * 0.1633;
        color += texture2D( u_texture,  v_uv[1] ).rgb * 0.1531;
        color += texture2D( u_texture,  v_uv[2] ).rgb * 0.1531;
        color += texture2D( u_texture,  v_uv[3] ).rgb * 0.12245;
        color += texture2D( u_texture,  v_uv[4] ).rgb * 0.12245;
        color += texture2D( u_texture,  v_uv[5] ).rgb * 0.0918;
        color += texture2D( u_texture,  v_uv[6] ).rgb * 0.0918;
        color += texture2D( u_texture,  v_uv[7] ).rgb * 0.051;
        color += texture2D( u_texture,  v_uv[8] ).rgb * 0.051;

        gl_FragColor = vec4(color, center.a);
    #endif

}
