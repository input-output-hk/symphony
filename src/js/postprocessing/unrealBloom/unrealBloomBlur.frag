varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_texSize;
uniform vec2 u_direction;

float gaussianPdf(in float x, in float sigma) {
  return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
}
void main() {
  vec2 invSize = 1.0 / u_texSize;
  float fSigma = float(SIGMA);
  float weightSum = gaussianPdf(0.0, fSigma);
  vec3 diffuseSum = texture2D( u_texture, v_uv).rgb * weightSum;
  for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
    float x = float(i);
    float w = gaussianPdf(x, fSigma);
    vec2 uvOffset = u_direction * invSize * x;
    vec3 sample1 = texture2D( u_texture, v_uv + uvOffset).rgb;
    vec3 sample2 = texture2D( u_texture, v_uv - uvOffset).rgb;
    diffuseSum += (sample1 + sample2) * w;
    weightSum += 2.0 * w;
  }
  gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
}
