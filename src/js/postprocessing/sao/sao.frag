
 #include <common>

 varying vec2 v_uv;

 uniform sampler2D u_texture;
 uniform sampler2D u_infoTexture;

 uniform float u_cameraNear;
 uniform float u_cameraFar;
 uniform mat4 u_projectionMatrix;
 uniform mat4 u_unprojectionMatrix;

 uniform float u_scale;
 uniform float u_intensity;
 uniform float u_bias;
 uniform float u_kernelRadius;
 uniform float u_minResolution;
 uniform vec2 u_resolution;
 uniform float u_randomSeed;
 uniform float u_numRings;

 // RGBA depth

 #include <packing>

vec3 decodeNormal (vec2 enc){
  float scale = 1.7777;
  vec3 nn =
      vec3(enc.xy, 0.0) * vec3(scale, scale, 0.0) * 2.0 +
      vec3(-scale, -scale, 1.0);
  float g = 2.0 / dot(nn.xyz,nn.xyz);
  vec3 n;
  n.xy = g*nn.xy;
  n.z = g-1.0;
  return normalize(n);
}

 vec3 getViewPosition( const in vec2 screenPosition ) {
   // float perspectiveDepth = texture2D( u_infoTexture, screenPosition ).z;
   // float viewZ = perspectiveDepthToViewZ( perspectiveDepth, u_cameraNear, u_cameraFar );
   // float clipW = u_projectionMatrix[2][3] * viewZ + u_projectionMatrix[3][3];
   // vec4 clipPosition = vec4( ( vec3( screenPosition, perspectiveDepth ) - 0.5 ) * 2.0, clipW );
   // clipPosition.xyz *= clipW; // unproject to homogeneous coordinates
   // return ( u_unprojectionMatrix * clipPosition ).xyz;

  float depth = texture2D( u_infoTexture, screenPosition ).z * 2.0 - 1.0;
  vec3 ndc = vec3 (screenPosition * 2.0 - 1.0, depth);
  vec4 tmp4 = u_unprojectionMatrix * vec4(ndc, 1.0);
  tmp4.xyz = tmp4.xyz / tmp4.w;
  return tmp4.xyz;
 }

 vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition ) {
   // return -unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
   return decodeNormal(texture2D( u_infoTexture, screenPosition ).rg);
 }

 float getOcclusion( const in vec3 viewPosition, const in vec3 viewNormal, const in vec3 viewPositionOffset ) {
   vec3 viewDelta = viewPositionOffset - viewPosition;
   float viewDistance = length( viewDelta );
   float scaledScreenDistance = u_scale * viewDistance / u_cameraFar;
   return u_intensity * max(0.0, (dot(viewNormal, viewDelta) - u_minResolution * u_cameraFar) / scaledScreenDistance - u_bias) / (1.0 + pow2( scaledScreenDistance ) );
 }

 float getAmbientOcclusion( const in vec3 viewPosition ) {

   vec3 viewNormal = getViewNormal( viewPosition, v_uv );

   float random = rand( v_uv + u_randomSeed );
   vec2 radius = vec2( u_kernelRadius ) / u_resolution;
   float numSamples = float( NUM_SAMPLES );
   // float numRings = float( NUM_RINGS );
   float alphaStep = 1.0 / numSamples;

   // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/

   float occlusionSum = 0.0;
   float alpha = 0.0;
   float weight = 0.0;

   for( int i = 0; i < NUM_SAMPLES; i ++ ) {
     float angle = PI2 * ( u_numRings * alpha + random );
     vec2 currentRadius = radius * ( 0.01 + alpha * 0.99 );
     vec2 offset = vec2( cos(angle), sin(angle) ) * currentRadius;
     alpha += alphaStep;

     vec3 viewPositionOffset = getViewPosition( v_uv + offset );
     if( -viewPositionOffset.z >= u_cameraFar ) {
       continue;
     }

     occlusionSum += getOcclusion( viewPosition, viewNormal, viewPositionOffset );
     weight += 1.0;

   }

   if( weight == 0.0 ) return 0.0;
   return occlusionSum / weight;

 }


 void main() {

   gl_FragColor = texture2D(u_texture, v_uv );

   vec3 viewPosition = getViewPosition( v_uv );
   if( -viewPosition.z >= u_cameraFar ) {
     return;
   }

   gl_FragColor.xyz *= 1.0 - getAmbientOcclusion( viewPosition ) * 0.1;

 }
