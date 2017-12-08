
#include <packing>

uniform sampler2D u_texture;
uniform sampler2D u_depthTexture;

uniform vec2 u_resolution;
uniform vec2 u_lowerBound;
uniform vec2 u_upperBound;
uniform vec2 u_delta;
uniform float u_amount;

uniform float u_cameraNear;
uniform float u_cameraFar;

#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
#define LOG2 1.442695

float readDepth (const in vec2 coord) {
    float fragCoordZ = texture2D(u_depthTexture, coord).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, u_cameraNear, u_cameraFar );
    // return viewZToOrthographicDepth( viewZ, u_cameraNear, u_cameraFar );
    return -viewZ;
}

void main() {

    vec2 resolutionInverted = 1.0 / u_resolution;
    vec2 uv = gl_FragCoord.xy * resolutionInverted;

    // vec2 depthInfo = texture2D( u_distanceTexture, uv ).ba;
    // vec2 depthInfo = texture2D( u_distanceTexture, uv ).ba;
    // float depth = depthInfo.x / depthInfo.y;
    float depth = readDepth(uv);
    float fogFactor = max(smoothstep(-u_lowerBound.y, -u_lowerBound.x, -depth), smoothstep(u_upperBound.x, u_upperBound.y, depth));
    vec2 d = u_delta * resolutionInverted * fogFactor * u_amount;

    vec4 sum = vec4(0.0);
    vec4 center = texture2D( u_texture, uv );
    d *= length(center.xyz);
    sum += texture2D( u_texture, ( uv - d * 4. ) ) * 0.051;
    sum += texture2D( u_texture, ( uv - d * 3. ) ) * 0.0918;
    sum += texture2D( u_texture, ( uv - d * 2. ) ) * 0.12245;
    sum += texture2D( u_texture, ( uv - d * 1. ) ) * 0.1531;
    sum += center * 0.1633;
    sum += texture2D( u_texture, ( uv + d * 1. ) ) * 0.1531;
    sum += texture2D( u_texture, ( uv + d * 2. ) ) * 0.12245;
    sum += texture2D( u_texture, ( uv + d * 3. ) ) * 0.0918;
    sum += texture2D( u_texture, ( uv + d * 4. ) ) * 0.051;

    gl_FragColor = sum;
}
