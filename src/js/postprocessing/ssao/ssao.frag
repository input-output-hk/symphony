/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Screen-space ambient occlusion shader
 * - ported from
 *   SSAO GLSL shader v1.2
 *   assembled by Martins Upitis (martinsh) (http://devlog-martinsh.blogspot.com)
 *   original technique is made by ArKano22 (http://www.gamedev.net/topic/550699-ssao-no-halo-artifacts/)
 * - modifications
 * - modified to use RGBA packed depth texture (use clear color 1,1,1,1 for depth pass)
 * - refactoring and optimizations
 */

uniform float u_cameraNear;
uniform float u_cameraFar;

// uniform bool onlyAO;      // use only ambient occlusion pass?

uniform vec2 u_size;        // texture width, height
uniform float u_aoClamp;    // depth clamp - reduces haloing at screen edges

uniform float u_lumInfluence;  // how much luminance affects occlusion
uniform float u_darkness;  // how much luminance affects occlusion
uniform float u_radius;  // how much luminance affects occlusion

uniform sampler2D u_texture;
uniform sampler2D u_depthTexture;

varying vec2 v_uv;

// #define PI 3.14159265
#define DL 2.399963229728653  // PI * ( 3.0 - sqrt( 5.0 ) )
#define EULER 2.718281828459045

// user variables

const int samples = 16;     // ao sample count
// const float radius = 4.0;  // ao radius

const bool useNoise = false;      // use noise instead of pattern for sample dithering
const float noiseAmount = 0.0003; // dithering amount

const float diffArea = 0.3;   // self-shadowing reduction
const float gDisplace = 0.3;  // gauss bell center


// RGBA depth

#include <packing>

// generating noise / pattern texture for dithering

vec2 rand( const vec2 coord ) {

    vec2 noise;

    if ( useNoise ) {

        float nx = dot ( coord, vec2( 12.9898, 78.233 ) );
        float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );

        noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );

    } else {

        float ff = fract( 1.0 - coord.s * ( u_size.x / 2.0 ) );
        float gg = fract( coord.t * ( u_size.y / 2.0 ) );

        noise = vec2( 0.25, 0.75 ) * vec2( ff ) + vec2( 0.75, 0.25 ) * gg;

    }

    return ( noise * 2.0  - 1.0 ) * noiseAmount;

}

// float readDepth( const in vec2 coord ) {

//     float cameraFarPlusNear = u_cameraFar + u_cameraNear;
//     float cameraFarMinusNear = u_cameraFar - u_cameraNear;
//     float cameraCoef = 2.0 * u_cameraNear;

//     // return ( 2.0 * u_cameraNear ) / ( u_cameraFar + u_cameraNear - unpackDepth( texture2D( u_depthTexture, coord ) ) * ( u_cameraFar - u_cameraNear ) );
//     return cameraCoef / ( cameraFarPlusNear - unpackRGBAToDepth( texture2D( u_depthTexture, coord ) ) * cameraFarMinusNear );

// }


float readDepth (const in vec2 coord) {
    // float fragCoordZ = unpackRGBAToDepth( texture2D( u_depthTexture, coord ) );
    float fragCoordZ = texture2D(u_depthTexture, coord).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, u_cameraNear, u_cameraFar );
    return viewZToOrthographicDepth( viewZ, u_cameraNear, u_cameraFar );
    return fragCoordZ;
}


float compareDepths( const in float depth1, const in float depth2, inout int far ) {

    float garea = 2.0;                         // gauss bell width
    float diff = ( depth1 - depth2 ) * 100.0;  // depth difference (0-100)

    // reduce left bell width to avoid self-shadowing

    if ( diff < gDisplace ) {

        garea = diffArea;

    } else {

        far = 1;

    }

    float dd = diff - gDisplace;
    float gauss = pow( EULER, -2.0 * dd * dd / ( garea * garea ) );
    return gauss;

}

float calcAO( float depth, float dw, float dh ) {

    // float dd = radius - depth * radius;
    float dd = u_radius - depth * u_radius;
    vec2 vv = vec2( dw, dh );

    vec2 coord1 = v_uv + dd * vv;
    vec2 coord2 = v_uv - dd * vv;

    float temp1 = 0.0;
    float temp2 = 0.0;

    int far = 0;
    temp1 = compareDepths( depth, readDepth( coord1 ), far );

    // DEPTH EXTRAPOLATION

    if ( far > 0 ) {

        temp2 = compareDepths( readDepth( coord2 ), depth, far );
        temp1 += ( 1.0 - temp1 ) * temp2;

    }

    return temp1;

}

void main() {

    vec2 noise = rand( v_uv );
    float depth = readDepth( v_uv );

    float tt = clamp( depth, u_aoClamp, 1.0 );

    float w = ( 1.0 / u_size.x )  / tt + ( noise.x * ( 1.0 - noise.x ) );
    float h = ( 1.0 / u_size.y ) / tt + ( noise.y * ( 1.0 - noise.y ) );

    float ao = 0.0;

    float dz = 1.0 / float( samples );
    float z = 1.0 - dz / 2.0;
    float l = 0.0;

    for ( int i = 0; i <= samples; i ++ ) {

        float r = sqrt( 1.0 - z );

        float pw = cos( l ) * r;
        float ph = sin( l ) * r;
        ao += calcAO( depth, pw * w, ph * h );
        z = z - dz;
        l = l + DL;

    }

    ao /= float( samples );
    ao = 1.0 - ao;
    ao = clamp(ao, 0.0, 1.0);
    ao = mix(1.0, smoothstep(0.0, 0.75, ao), u_darkness);
    vec3 color = texture2D( u_texture, v_uv ).rgb;

    vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
    float lum = dot( color.rgb, lumcoeff );
    vec3 luminance = vec3( lum );

    vec3 final = vec3( color * mix( vec3( ao ), vec3( 1.0 ), u_lumInfluence ) );  // mix( color * ao, white, luminance )

    gl_FragColor = vec4( color * ao, 1.0 );
    // gl_FragColor = vec4(ao);
}
