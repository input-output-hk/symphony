// http://john-chapman-graphics.blogspot.co.uk/2013/02/pseudo-lens-flare.html

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_aspect;
uniform float u_ghostDispersal;
uniform float u_haloWidth;
uniform float u_distortion;
uniform float u_opacity;

const int NUM_OF_GHOSTS = 2;

varying vec2 v_uv;

vec3 textureDistorted(
  in sampler2D tex,
  in vec2 texcoord,
  in vec2 direction, // direction of distortion
  in vec3 distortion // per-channel distortion factor
) {
  return vec3(
    texture2D(tex, texcoord + direction * distortion.r).r,
    texture2D(tex, texcoord + direction * distortion.g).g,
    texture2D(tex, texcoord + direction * distortion.b).b
  );
}

void main () {
  vec2 aspectUv = (v_uv - 0.5) * u_aspect + 0.5;
  vec2 texelSize = 1.0 / u_resolution;

  vec2 ghostUv = 1.0 - aspectUv;
  vec2 ghostVec = (vec2(0.5) - ghostUv) * u_ghostDispersal;

  vec4 result = vec4(0.0);
  for (int i = 0; i < NUM_OF_GHOSTS; ++i) {
    vec2 offset = fract(ghostUv + ghostVec * float(i));

    float weight = length(vec2(0.5) - offset) / length(vec2(0.5));
    weight = pow(1.0 - weight, 10.0);

    result += texture2D(u_texture, offset) * weight;
  }

  // result *= texture2D(uLensColor, length(vec2(0.5) - texcoord) / length(vec2(0.5)));

  vec2 haloVec = normalize(ghostVec) * u_haloWidth;
  float weight = length(vec2(0.5) - fract(ghostUv + haloVec)) / length(vec2(0.5));
  weight = pow(1.0 - weight, 5.0);

  vec3 distortion = vec3(-texelSize.x, 0.0, texelSize.x) * u_distortion;
  vec2 direction = normalize(ghostVec);

  // result += texture2D(u_texture, texcoord + haloVec) * weight;

  result.rgb += textureDistorted(
    u_texture,
    ghostUv + haloVec,
    direction,
    distortion
  );

  gl_FragColor = result * u_opacity;

}
