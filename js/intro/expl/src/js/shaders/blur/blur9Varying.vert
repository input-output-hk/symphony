attribute vec3 position;
attribute vec2 uv;

uniform vec2 u_delta;
varying vec2 v_uv[9];

void main() {

    v_uv[0] = uv;

    vec2 delta = u_delta;
    v_uv[1] = uv - delta;
    v_uv[2] = uv + delta;

    delta += u_delta;
    v_uv[3] = uv - delta;
    v_uv[4] = uv + delta;

    delta += u_delta;
    v_uv[5] = uv - delta;
    v_uv[6] = uv + delta;

    delta += u_delta;
    v_uv[7] = uv - delta;
    v_uv[8] = uv + delta;

    gl_Position = vec4( position, 1.0 );

}
