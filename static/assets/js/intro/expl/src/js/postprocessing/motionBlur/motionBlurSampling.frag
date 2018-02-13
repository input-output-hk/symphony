
uniform sampler2D u_texture;
uniform sampler2D u_motionTexture;

uniform vec2 u_resolution;
uniform float u_maxDistance;
uniform vec2 u_motionMultiplier;
uniform float u_leaning;
uniform float u_blurWeights[SAMPLE_COUNT];

varying vec2 v_uv;


void main() {

    vec2 motion = texture2D( u_motionTexture, v_uv ).xy;

    vec2 offset = motion * u_resolution * u_motionMultiplier;
    float offsetDistance = length(offset);
    if(offsetDistance > u_maxDistance) {
        offset = normalize(offset) * u_maxDistance;
    }
    vec2 delta = - offset / u_resolution * 2.0 / float(SAMPLE_COUNT);
    vec2 pos = v_uv - delta * u_leaning * float(SAMPLE_COUNT);
    vec3 color = vec3(0.0);

    for(int i = 0; i < SAMPLE_COUNT; i++) {
        color += texture2D( u_texture, pos ).rgb * u_blurWeights[i];
        pos += delta;
    }

    gl_FragColor = vec4( color, 1.0 );

}
