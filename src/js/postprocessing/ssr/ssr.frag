uniform sampler2D u_texture;
uniform sampler2D u_infoTexture;
uniform vec2 u_infoResolution;
uniform vec2 u_resolution;

uniform float u_cameraNear;
uniform float u_cameraFar;
uniform float u_noHitBoost;
uniform float u_seed;

#include <common>
#include <packing>
#include <bsdfs>
#include <encodings_pars_fragment>

uniform mat4 u_traceProjectionMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_unprojectionMatrix;

varying vec2 v_uv;

#pragma glslify: luma = require(glsl-luma)

vec3 getViewPositionFromDepth (vec2 uv) {
  float depth = texture2D(u_infoTexture, uv).z;
  vec3 ndc = vec3 (uv, depth) * 2.0 - 1.0;
  vec4 tmp4 = u_unprojectionMatrix * vec4(ndc, 1.0);
  return tmp4.xyz / tmp4.w;
}

float getNDCDepth (vec2 uv) {
  // return viewZToPerspectiveDepth(texture2D(u_infoTexture, uv).r, u_cameraNear, u_cameraFar) * 2.0 - 1.0;
  // return texture2D(u_infoTexture, uv).r * 2.0 - 1.0;
  // return unpackRGBAToDepth(texture2D(u_infoTexture, uv)) * 2.0 - 1.0;
  return (texture2D(u_infoTexture, uv).z) * 2.0 - 1.0;
}

float distanceSquared(vec2 a, vec2 b) { a -= b; return dot(a, a); }

// Returns true if the ray hit something
bool traceScreenSpaceRay(

 // Camera-space ray origin, which must be within the view volume
 vec3 csOrig,

 // Unit length camera-space ray direction
 vec3 csDir,

 // A projection matrix that maps to pixel coordinates (not [-1, +1]
 // normalized device coordinates)
 mat4 proj,

 // The camera-space Z buffer (all negative values)
 sampler2D csZBuffer,

 // Dimensions of csZBuffer
 vec2 csZBufferSize,

 // Camera space thickness to ascribe to each pixel in the depth buffer
 float zThickness,

 // (Negative number)
 float nearPlaneZ,

 // Step in horizontal or vertical pixels between samples. This is a float
 // because integer math is slow on GPUs, but should be set to an integer >= 1
 float stride,

 // Number between 0 and 1 for how far to bump the ray in stride units
 // to conceal banding artifacts
 float jitter,

 // Maximum number of iterations. Higher gives better images but may be slow
 // const int maxSteps,

 // Maximum camera-space distance to trace before returning a miss
 float maxDistance,

 // Pixel coordinates of the first intersection with the scene
 out vec2 hitPixel,

 // Camera space location of the ray hit
 out vec3 hitPoint,

 out float isFront) {

    // Clip to the near plane
    float rayLength = ((csOrig.z + csDir.z * maxDistance) > nearPlaneZ) ?
        (nearPlaneZ - csOrig.z) / csDir.z : maxDistance;
    vec3 csEndPoint = csOrig + csDir * rayLength;

    // Project into homogeneous clip space
    vec4 H0 = proj * vec4(csOrig, 1.0);
    vec4 H1 = proj * vec4(csEndPoint, 1.0);
    float k0 = 1.0 / H0.w;
    float k1 = 1.0 / H1.w;

    // Screen-space endpoints
    vec2 P0 = H0.xy * k0;
    vec2 P1 = H1.xy * k1;

    // The interpolated homogeneous version of the camera-space points
    vec3 Q0 = csOrig * k0;
    vec3 Q1 = csEndPoint * k1;


    // If the line is degenerate, make it cover at least one pixel
    // to avoid handling zero-pixel extent as a special case later
    // P1 += vec2((distanceSquared(P0, P1) < 0.0001) ? 0.01 : 0.0);
    P1 = (distanceSquared(P0, P1) < 0.0001) ? P0 + vec2(0.01) : P1; // unity version
    vec2 delta = P1 - P0;

    // Permute so that the primary iteration is in x to collapse
    // all quadrant-specific DDA cases later
    bool permute = false;
    if (abs(delta.x) < abs(delta.y)) {
        // This is a more-vertical line
        permute = true;

        delta = delta.yx;
        P0 = P0.yx;
        P1 = P1.yx;
    }

    float stepDir = sign(delta.x);
    float invdx = stepDir / delta.x;

    // Track the derivatives of Q and k
    vec3  dQ = (Q1 - Q0) * invdx;
    float dk = (k1 - k0) * invdx;
    vec2  dP = vec2(stepDir, delta.y * invdx);

    // Scale derivatives by the desired pixel stride and then
    // offset the starting values by the jitter fraction
    dP *= stride;
    dQ *= stride;
    dk *= stride;

    P0 += dP * jitter;
    Q0 += dQ * jitter;
    k0 += dk * jitter;

    // Slide P from P0 to P1, (now-homogeneous) Q from Q0 to Q1, k from k0 to k1
    vec3 Q = Q0;

    // Adjust end condition for iteration direction
    float  end = P1.x * stepDir;

    float k = k0;
    float prevZMaxEstimate = csOrig.z;
    float rayZMin = prevZMaxEstimate, rayZMax = prevZMaxEstimate;
    // float sceneZ = rayZMax + 100.0;
    float sceneZ = 100.0;
    vec2 P = P0;
    float fStepCount = 0.0;
    for (int stepCount = 0;stepCount < 25; ++stepCount) {
        fStepCount = float(stepCount);
        if (!(((P.x * stepDir) <= end) && ((rayZMax < sceneZ - zThickness) || (rayZMin > sceneZ)) &&(sceneZ != 0.0))) {
          break;
        }

        rayZMin = prevZMaxEstimate;
        rayZMax = (dQ.z * 0.5 + Q.z) / (dk * 0.5 + k);
        prevZMaxEstimate = rayZMax;
        if (rayZMin > rayZMax) {
          // swap
           float t = rayZMin; rayZMin = rayZMax; rayZMax = t;
        }

        hitPixel = permute ? P.yx : P;
        // You may need hitPixel.y = csZBufferSize.y - hitPixel.y; here if your vertical axis
        // is different than ours in screen space
        sceneZ = getViewPositionFromDepth(hitPixel / csZBufferSize).z;
        // tmp4.w = 1.0;
        // tmp4 = (proj * tmp4);
        // sceneZ = tmp4.z / tmp4.w;

        P += dP;
        Q.z += dQ.z;
        k += dk;
    }

    // Advance Q based on the number of steps
    Q.xy += dQ.xy * fStepCount;
    hitPoint = Q * (1.0 / k);
    // return (rayZMax >= sceneZ - zThickness) && (rayZMin < sceneZ);

    isFront = step(sceneZ - zThickness, rayZMax);
    return (rayZMin < sceneZ);
}













// float rand(vec2 co){
//     return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
// }



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


void main () {
  vec2 uv = v_uv;

  vec4 texelTmp;

  vec3 viewPos = getViewPositionFromDepth(uv);
  vec3 viewDir = normalize(viewPos);

  texelTmp = texture2D(u_infoTexture, uv);
  // vec3 viewNormal = texelTmp.rgb * 2.0 - 1.0;
  vec3 viewNormal = decodeNormal(texelTmp.rg);
  float extra = texelTmp.a;


  vec3 dir = normalize(reflect(viewDir, viewNormal));

  vec2 hitPixel = vec2(-1.0, -1.0);
  vec3 hitPoint = vec3(-1.0, -1.0, -1.0);
  float isFront;

  vec3 outgoingLight = texture2D(u_texture, v_uv).rgb;
  float dotWeight = max(0.0, -dot(viewNormal, viewDir));
  float alpha = extra;
  alpha *= pow(1.0 - dotWeight, 0.4);
  alpha *= 1.0 - smoothstep(0.0, 0.5, viewNormal.z);
  float baseLuma = luma(outgoingLight);
  alpha *= (1.0 - pow(baseLuma, 0.5) * 0.5) * mix(0.1, 1.0, smoothstep(0.0, 0.1, baseLuma));
  float needsTrace = step(0.001, alpha);

  bool hasHit = traceScreenSpaceRay(
    // viewPos,
    viewPos + dir * 0.02,
 // vec3 csOrig,

 // Unit length camera-space ray direction
    dir,
 // vec3 csDir,

 // A projection matrix that maps to pixel coordinates (not [-1, +1]
 // normalized device coordinates)
  u_traceProjectionMatrix,
 // mat4 proj,

 // The camera-space Z buffer (all negative values)
  u_infoTexture,
 // sampler2D csZBuffer,

 // Dimensions of csZBuffer
  // u_infoResolution,
  u_infoResolution,
 // vec2 csZBufferSize,

 // Camera space thickness to ascribe to each pixel in the depth buffer
  0.01,
 // float zThickness,

 // (Negative number)
  -0.01,
  // -u_cameraNear,
 // float nearPlaneZ,

 // Step in horizontal or vertical pixels between samples. This is a float
 // because integer math is slow on GPUs, but should be set to an integer >= 1
  3.0,
 // float stride,

 // Number between 0 and 1 for how far to bump the ray in stride units
  0.5 + rand(uv + u_seed) * 0.5,
  // 1.0,
  // 0.5,
 // to conceal banding artifacts
 // float jitter,

 // Maximum number of iterations. Higher gives better images but may be slow
  // 50,
 // const int maxSteps,
 // const float maxSteps,

 // Maximum camera-space distance to trace before returning a miss
  16.0 * needsTrace,
 // float maxDistance,

 // Pixel coordinates of the first intersection with the scene
 hitPixel,
 // out vec2 hitPixel,

 // Camera space location of the ray hit
 // hitPoint);
 hitPoint,
 // out vec3 hitPoint);

 isFront);

 float hitRate = hasHit ? 1.0 : 0.0;

  // hitPoint = viewPos + (hitPoint - viewPos) * mix(1.0, 0.5, viewNormal.z);


  vec2 hitUv = hitPixel.xy / u_infoResolution;
  vec3 indirectSpecular = texture2D(u_texture, hitUv).rgb;

  float d = distance(viewPos, hitPoint);
  indirectSpecular *= (1.0 - smoothstep(2.0, 6.0, d));
  indirectSpecular *= 0.5 + isFront * 0.5;

  // hitRate *= 1.0 - fwidth(hitRate) * 0.5 * rand(uv);

  indirectSpecular = max(outgoingLight * pow(baseLuma, u_noHitBoost), indirectSpecular * hitRate);

  outgoingLight += indirectSpecular * alpha;

  // gl_FragColor = vec4(indirectSpecular, 1.0);
  gl_FragColor = vec4(outgoingLight, 1.0);
  // gl_FragColor = vec4(isEdge);
  // gl_FragColor = vec4(viewNormal, 1.0);
  // gl_FragColor = vec4(viewPos / 20.0 + 0.5, 1.0);
  // gl_FragColor = texture2D(u_infoTexture, uv);
  // gl_FragColor = vec4(uv, 0.0, 1.0);
  // gl_FragColor = vec4(hitUv, 0.0, 1.0);
  // gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);


}
