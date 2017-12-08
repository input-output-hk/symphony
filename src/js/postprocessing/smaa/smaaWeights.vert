attribute vec3 position;
attribute vec2 uv;

uniform vec2 u_resolutionInv;

varying vec2 v_uv;
varying vec4 v_offsets[ 3 ];
varying vec2 v_pixcoord;

void SMAABlendingWeightCalculationVS( vec2 texcoord ) {
  v_pixcoord = texcoord / u_resolutionInv;

  // We will use these offsets for the searches later on (see @PSEUDO_GATHER4):
  v_offsets[ 0 ] = texcoord.xyxy + u_resolutionInv.xyxy * vec4( -0.25, 0.125, 1.25, 0.125 ); // WebGL port note: Changed sign in Y and W components
  v_offsets[ 1 ] = texcoord.xyxy + u_resolutionInv.xyxy * vec4( -0.125, 0.25, -0.125, -1.25 ); // WebGL port note: Changed sign in Y and W components

  // And these for the searches, they indicate the ends of the loops:
  v_offsets[ 2 ] = vec4( v_offsets[ 0 ].xz, v_offsets[ 1 ].yw ) + vec4( -2.0, 2.0, -2.0, 2.0 ) * u_resolutionInv.xxyy * float( SMAA_MAX_SEARCH_STEPS );

}

void main() {

  v_uv = uv;

  SMAABlendingWeightCalculationVS( v_uv );

  // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  gl_Position = vec4( position, 1.0 );

}
