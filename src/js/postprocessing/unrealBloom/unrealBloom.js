var effectComposer = require('../../effectComposer')
var fboHelper = require('../../helpers/fboHelper')
var PostEffect = require('../PostEffect')

var glslify = require('glslify')
var THREE = require('three')

var exports = module.exports = new PostEffect()
var _super = PostEffect.prototype

exports.init = init
exports.needsRender = needsRender
exports.resize = resize
exports.render = render

exports.maskActive = false
exports.amount = 1
exports.radius = 0
exports.threshold = 0.34
exports.lenFlareFeatureMaterial = null

let _nMips
let _directionX
let _directionY
let _highPassMaterial
let _highPassRenderTarget
// let _lenFlareFeatureMaterial
let _lenFlareRenderTarget
let _blurMaterials = []
let _renderTargetsHorizontal = []
let _renderTargetsVertical = []
let _bloomTintColors = []

function init (useFloatType, emissiveRenderTarget, /*nMips*/) {
  _nMips = 5 // fix passes for now
  // let renderTargetType = useFloatType ? fboHelper.renderTargetFloatType : THREE.UnsignedByteType
  let renderTargetType = THREE.UnsignedByteType
  _highPassRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBFormat, renderTargetType)
  _lenFlareRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBFormat, renderTargetType)
  for (var i = 0; i < _nMips; i++) {
    _renderTargetsHorizontal.push(fboHelper.createRenderTarget(1, 1, THREE.RGBFormat, renderTargetType))
    _renderTargetsVertical.push(fboHelper.createRenderTarget(1, 1, THREE.RGBFormat, renderTargetType))
    _bloomTintColors.push(new THREE.Vector3(1, 1, 1))
  }

  _directionX = new THREE.Vector2(1, 0)
  _directionY = new THREE.Vector2(0, 1)

  _super.init.call(this, {
    uniforms: {
      'u_blurTexture1': {type: 't', value: _renderTargetsVertical[0]},
      'u_blurTexture2': {type: 't', value: _renderTargetsVertical[1]},
      'u_blurTexture3': {type: 't', value: _renderTargetsVertical[2]},
      'u_blurTexture4': {type: 't', value: _renderTargetsVertical[3]},
      'u_blurTexture5': {type: 't', value: _renderTargetsVertical[4]},
      'u_bloomStrength': {type: 'f', value: 1.0},
      'u_bloomFactors': {type: 'f', value: [1.0, 0.8, 0.6, 0.4, 0.2]},
      'u_bloomTintColors': {type: 'v3', value: _bloomTintColors},
      'u_bloomRadius': {value: 0.0}
    },
    defines: {
      NUM_MIPS: _nMips
    },
    fragmentShader: glslify('./unrealBloom.frag')
  })

  _highPassMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      'u_texture': { type: 't', value: null },
      'u_luminosityThreshold': { type: 'f', value: 1.0 },
      'u_smoothWidth': { type: 'f', value: 1.0 },
      'u_defaultColor': { type: 'c', value: new THREE.Color(0xffffff) },
      'u_defaultOpacity': { type: 'f', value: 0.0 }
    },
    vertexShader: fboHelper.precisionPrefix + fboHelper.vertexShader,
    fragmentShader: fboHelper.precisionPrefix + glslify('./unrealBloomHighPass.frag')
  })
  if(emissiveRenderTarget) {
    _highPassMaterial.defines.USE_EMISSIVE = true
    _highPassMaterial.uniforms.u_emissiveTexture = { type: 't', value: emissiveRenderTarget}
  }

  exports.lenFlareFeatureMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      'u_texture': { type: 't', value: null },
      'u_resolution': { type: 'v2', value: new THREE.Vector2() },
      'u_aspect': { type: 'v2', value: new THREE.Vector2(1, 1) },
      'u_ghostDispersal': { type: 'f', value: 0.6 },
      'u_haloWidth': { type: 'f', value: 0.6 },
      'u_distortion': { type: 'f', value: 7 },
      'u_opacity': { type: 'f', value: 1 }
    },
    vertexShader: fboHelper.precisionPrefix + fboHelper.vertexShader,
    fragmentShader: fboHelper.precisionPrefix + glslify('./lenFlareFeature.frag'),
    blending: THREE.NoBlending
  })

  var kernelSizeArray = [3, 5, 7, 9, 11]
  for (let i = 0; i < _nMips; i++) {
    let kernelRadius = kernelSizeArray[i]
    _blurMaterials[i] = new THREE.RawShaderMaterial({
      uniforms: {
        'u_texture': { type: 't', value: null },
        'u_texSize': { type: 'v2', value: new THREE.Vector2() },
        'u_direction': { type: 'v2', value: null }
      },
      vertexShader: fboHelper.precisionPrefix + fboHelper.vertexShader,
      fragmentShader: fboHelper.precisionPrefix + glslify('./unrealBloomBlur.frag'),
      defines: {
        'KERNEL_RADIUS': kernelRadius,
        'SIGMA': kernelRadius
      }
    })
  }
}

function resize (width, height) {
  let resx = Math.round(width / 2)
  let resy = Math.round(height / 2)
  fboHelper.resizeRenderTarget(_highPassRenderTarget, resx, resy)
  fboHelper.resizeRenderTarget(_lenFlareRenderTarget, resx, resy)

  for (let i = 0; i < _nMips; i++) {
    fboHelper.resizeRenderTarget(_renderTargetsHorizontal[i], resx, resy)
    fboHelper.resizeRenderTarget(_renderTargetsVertical[i], resx, resy)
    _blurMaterials[i].uniforms.u_texSize.value = new THREE.Vector2(resx, resy)
    resx = Math.round(resx / 2)
    resy = Math.round(resy / 2)
  }
}

function needsRender () {
  return !!exports.amount
}

function render (dt, renderTarget, toScreen) {
  let state = fboHelper.getColorState()

  let renderer = fboHelper.renderer
  renderer.autoClear = true
  renderer.setClearColor(0, 0)

  if (exports.maskActive) renderer.context.disable(renderer.context.STENCIL_TEST)

  // 1. Extract Bright Areas
  _highPassMaterial.uniforms.u_texture.value = renderTarget
  _highPassMaterial.uniforms.u_luminosityThreshold.value = exports.threshold
  fboHelper.render(_highPassMaterial, _highPassRenderTarget, true)

  exports.lenFlareFeatureMaterial.uniforms.u_texture.value = _highPassRenderTarget
  exports.lenFlareFeatureMaterial.uniforms.u_resolution.value.set(_highPassRenderTarget.width, _highPassRenderTarget.height)
  exports.lenFlareFeatureMaterial.uniforms.u_aspect.value.x = _highPassRenderTarget.width / _highPassRenderTarget.height
  fboHelper.render(exports.lenFlareFeatureMaterial, _lenFlareRenderTarget)


  // // 2. Blur All the mips progressively
  // var inputRenderTarget = _highPassRenderTarget
  var inputRenderTarget = _lenFlareRenderTarget

  for (var i = 0; i < _nMips; i++) {
    let blurMaterial = _blurMaterials[i]
    blurMaterial.uniforms.u_texture.value = inputRenderTarget.texture
    blurMaterial.uniforms.u_direction.value = _directionX
    fboHelper.render(blurMaterial, _renderTargetsHorizontal[i], true)
    blurMaterial.uniforms.u_texture.value = _renderTargetsHorizontal[i].texture
    blurMaterial.uniforms.u_direction.value = _directionY
    fboHelper.render(blurMaterial, _renderTargetsVertical[i], true)
    inputRenderTarget = _renderTargetsVertical[i]
  }

  let material = this.material
  material.uniforms.u_texture.value = renderTarget
  material.uniforms.u_bloomStrength.value = exports.amount
  material.uniforms.u_bloomRadius.value = exports.radius
  renderTarget = effectComposer.render(material, toScreen)

  if (exports.maskActive) renderer.context.enable(renderer.context.STENCIL_TEST)

  fboHelper.setColorState(state)

  return renderTarget
}
