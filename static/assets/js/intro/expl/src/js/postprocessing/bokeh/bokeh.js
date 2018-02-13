const effectComposer = require('../../effectComposer')
const PostEffect = require('../PostEffect')
const blur = require('../../shaders/blur/blur')
const fboHelper = require('../../helpers/fboHelper')

const glslify = require('glslify')
const THREE = require('three')

let exports = module.exports = new PostEffect()
let _super = PostEffect.prototype

exports.init = init
exports.needsRender = needsRender
exports.blurDepthTexture = blurDepthTexture
exports.render = render

exports.discSize = 500
exports.amount = 1
exports.blurDepthRadius = 1
exports.lowerBound = new THREE.Vector2(0, 8)
exports.upperBound = new THREE.Vector2(20, 40)
exports.bluredDepthRenderTarget = null

let _blurDepthHMaterial
let _discMaterial
let _infoTexture

let _blurRenderTarget1
let _blurRenderTarget2
let _needsBlurRenderTarget = true

function init (infoTexture) {
  _infoTexture = infoTexture
  _blurRenderTarget1 = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat)
  _blurRenderTarget1.type = fboHelper.renderTargetFloatType
  _blurRenderTarget2 = exports.bluredDepthRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat)
  _blurRenderTarget2.type = fboHelper.renderTargetFloatType

  _super.init.call(this, {
    uniforms: {
      u_depthTexture: { type: 't', value: _blurRenderTarget2 },
      u_blurredTexture: { type: 't', value: _blurRenderTarget1 },
      u_time: { type: 'f', value: 0 },

      u_cameraNear: { value: 0.001 },
      u_cameraFar: { value: 1 },
      u_lowerBound: { type: 'v2', value: exports.lowerBound },
      u_upperBound: { type: 'v2', value: exports.upperBound },

      u_baseColor: {type: 'c', value: new THREE.Color(0)}
    },
    fragmentShader: glslify('./bokeh.frag')
  })
  if (infoTexture) {
    this.material.defines.USE_INFO_TEXTURE = true
  }

  _blurDepthHMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: infoTexture },
      u_delta: { type: 'v2', value: new THREE.Vector2() },
      u_cameraNear: { value: 0.001 },
      u_cameraFar: { value: 1 }
    },
    vertexShader: fboHelper.precisionPrefix + glslify('../../shaders/blur/blur9Varying.vert'),
    fragmentShader: fboHelper.precisionPrefix + glslify('./bokehBlurDepth.frag'),
    blending: THREE.NoBlending
  })
  if (infoTexture) {
    _blurDepthHMaterial.defines.USE_INFO_TEXTURE = true
  }

  _discMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: undefined },
      u_depthTexture: { type: 't', value: _blurRenderTarget2 },
      // u_resolution: { type: 'v2', value: new THREE.Vector2() },
      u_resolution: this.uniforms.u_resolution,
      u_time: { type: 'f', value: 0 },
      u_discSize: { type: 'f', value: 1 },

      u_cameraNear: this.uniforms.u_cameraNear,
      u_cameraFar: this.uniforms.u_cameraFar,
      u_lowerBound: this.uniforms.u_lowerBound,
      u_upperBound: this.uniforms.u_upperBound
    },
    vertexShader: fboHelper.vertexShader,
    fragmentShader: fboHelper.precisionPrefix + glslify('./bokehDisc.frag'),
    blending: THREE.NoBlending
  })
  if (infoTexture) {
    _discMaterial.defines.USE_INFO_TEXTURE = true
  }
}

function needsRender () {
  return true//!!this.amount
}

function blurDepthTexture () {
  let depthTexture = _infoTexture || effectComposer.depthTexture
  let downScale = 0.5 * this.uniforms.u_resolution.value.x / depthTexture.width
  let downWidth = depthTexture.width * downScale
  let downHeight = depthTexture.height * downScale

  fboHelper.resizeRenderTarget(_blurRenderTarget1, downWidth, downHeight)
  fboHelper.resizeRenderTarget(_blurRenderTarget2, downWidth, downHeight)

  _blurDepthHMaterial.uniforms.u_cameraNear.value = effectComposer.camera.near
  _blurDepthHMaterial.uniforms.u_cameraFar.value = effectComposer.camera.far
  _blurDepthHMaterial.uniforms.u_texture.value = depthTexture
  _blurDepthHMaterial.uniforms.u_delta.value.set(exports.blurDepthRadius / downWidth, 0)
  fboHelper.render(_blurDepthHMaterial, _blurRenderTarget1)

  let blur9Material = blur.getBlur9Material()
  blur9Material.uniforms.u_texture.value = _blurRenderTarget1
  blur9Material.uniforms.u_delta.value.set(0, exports.blurDepthRadius / downHeight)
  fboHelper.render(blur9Material, _blurRenderTarget2)

  // blur.blur9(exports.blurDepthRadius, 1, _blurRenderTarget2, _blurRenderTarget1, _blurRenderTarget2)
  // blur.blur9(exports.blurDepthRadius, 1, _blurRenderTarget2, _blurRenderTarget1, _blurRenderTarget2)
  _needsBlurRenderTarget = false
}

function render (dt, renderTarget, toScreen) {
  let depthTexture = _infoTexture || effectComposer.depthTexture

  if (exports.lowerBound.x > exports.lowerBound.y) {
    exports.lowerBound.x = exports.lowerBound.y
  }

  if (exports.upperBound.x > exports.upperBound.y) {
    exports.upperBound.x = exports.upperBound.y
  }

  if (_needsBlurRenderTarget) {
    this.blurDepthTexture()
  }
  _needsBlurRenderTarget = true

  this.uniforms.u_cameraNear.value = effectComposer.camera.near
  this.uniforms.u_cameraFar.value = effectComposer.camera.far
  // this.uniforms.u_time.value += dt

  _discMaterial.uniforms.u_texture.value = renderTarget
  _discMaterial.uniforms.u_discSize.value = exports.discSize * depthTexture.width / renderTarget.width
  // _discMaterial.uniforms.u_resolution.value.set(depthTexture.width, depthTexture.height)
  fboHelper.render(_discMaterial, _blurRenderTarget1)

  _super.render.call(this, dt, renderTarget, toScreen)
}
