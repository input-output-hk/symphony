const fboHelper = require('../../helpers/fboHelper')
const THREE = require('three')
const glslify = require('glslify')

let undef
let _blur9Material
let _blur9RGBAMaterial

export function getBlur9Material (useRGBA) {
  useRGBA = !!useRGBA
  let material = useRGBA ? _blur9RGBAMaterial : _blur9Material
  if (!material) {
    if (!_blur9Material) {
      // TODO add maximum varying detection.
      // if the maximum varying is lower than sampling point / 2,
      // do the delta calculation in the fragment shader instead
      material = new THREE.RawShaderMaterial({
        uniforms: {
          u_texture: { type: 't', value: undef },
          u_delta: { type: 'v2', value: new THREE.Vector2() }
        },
        vertexShader: fboHelper.precisionPrefix + glslify('./blur9Varying.vert'),
        fragmentShader: fboHelper.precisionPrefix + glslify('./blur9Varying.frag'),
        blending: THREE.NoBlending,
        defines: {
          USE_RGBA: useRGBA
        }
      })
    }

    if (useRGBA) {
      _blur9RGBAMaterial = material
    } else {
      _blur9Material = material
    }
  }
  return material
}

export function blur9 (radius, scale, fromRenderTarget, intermediateRenderTarget, toRenderTarget) {
  blur(getBlur9Material(), 0.25, radius, scale, fromRenderTarget, intermediateRenderTarget, toRenderTarget)
}

export function blur9RGBA (radius, scale, fromRenderTarget, intermediateRenderTarget, toRenderTarget) {
  blur(getBlur9Material(true), 0.25, radius, scale, fromRenderTarget, intermediateRenderTarget, toRenderTarget)
}

export function blur (material, deltaRatio, radius, scale, fromRenderTarget, intermediateRenderTarget, toRenderTarget) {
  let scaledWidth = fromRenderTarget.width * scale || 0
  let scaledHeight = fromRenderTarget.height * scale || 0
  fboHelper.resizeRenderTarget(intermediateRenderTarget, scaledWidth, scaledHeight)

  if (toRenderTarget) {
    fboHelper.resizeRenderTarget(toRenderTarget, fromRenderTarget.width, fromRenderTarget.height)
  } else {
    toRenderTarget = fromRenderTarget
  }

  // horizontal
  material.uniforms.u_texture.value = fromRenderTarget
  material.uniforms.u_delta.value.set(radius / scaledWidth * deltaRatio, 0)
  fboHelper.render(material, intermediateRenderTarget)
  // vertical
  material.uniforms.u_texture.value = intermediateRenderTarget
  material.uniforms.u_delta.value.set(0, radius / scaledHeight * deltaRatio)
  fboHelper.render(material, toRenderTarget)
}
