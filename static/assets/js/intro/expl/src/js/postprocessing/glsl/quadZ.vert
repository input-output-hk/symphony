attribute vec3 position;
attribute vec2 uv;

uniform float u_vertZ;

varying vec2 v_uv;

void main() {
    v_uv = uv;
    gl_Position = vec4( position.xy, u_vertZ, 1.0 );
}
