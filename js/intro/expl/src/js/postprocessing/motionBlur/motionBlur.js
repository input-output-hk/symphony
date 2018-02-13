var PostEffect = require('../PostEffect')
var effectComposer = require('../../effectComposer')
var fboHelper = require('../../helpers/fboHelper')
var math = require('../../utils/math')

var glslify = require('glslify')
var THREE = require('three')

var undef

var exports = module.exports = new PostEffect()
var _super = PostEffect.prototype

exports.init = init
exports.resize = resize
exports.needsRender = needsRender
exports.render = render

exports.useSampling = true

// for debug
exports.skipMatrixUpdate = false
exports.ignoreCamera = false

exports.fadeStrength = 1
exports.motionMultiplier = 1
exports.maxDistance = 50
exports.leaning = 0.5

// lines method only options
exports.jitter = 0
exports.opacity = 1
exports.depthBias = 0.002
exports.depthTest = false
exports.useDithering = true

exports.motionRenderTargetScale = 1; // has to be one for vr... not sure what is going on yet
exports.linesRenderTargetScale = 1 / 2

var _motionRenderTarget
var _linesRenderTarget

var _lines
var _linesCamera
var _linesScene
var _linesPositions
var _linesPositionAttribute
var _linesGeometry
var _linesMaterial

var _samplingMaterial

var _prevUseDithering
var _prevUseSampling
var _motionMultiplierVector

var _visibleCache = []

var _width
var _height
var _sampleCount

var _prevLeaning
var _blurWeights

function init (sampleCount) {
  var filter = THREE.NearestFilter
  var gl = effectComposer.renderer.getContext()
  if (gl.getExtension('OES_texture_float') && gl.getExtension('OES_texture_float_linear')) {
    filter = THREE.LinearFilter
  }

  _motionRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat, fboHelper.renderTargetFloatType, filter, filter)
  _motionRenderTarget.depthBuffer = true
  _motionRenderTarget.stencilBuffer = true

  _linesRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat, fboHelper.renderTargetFloatType, filter, filter)
  _linesCamera = new THREE.Camera()
  _linesCamera.position.z = 1.0
  _linesScene = new THREE.Scene()

  _motionMultiplierVector = new THREE.Vector2(1, 1)

  _super.init.call(this, {
    uniforms: {
      u_lineAlphaMultiplier: { type: 'f', value: 1 },
      u_linesTexture: { type: 't', value: _linesRenderTarget }
    },
    fragmentShader: glslify('./motionBlur.frag')
  })

  _linesPositions = []
  _linesGeometry = new THREE.BufferGeometry()
  _linesMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: undef },
      u_motionTexture: { type: 't', value: _motionRenderTarget },
      u_resolution: { type: 'v2', value: effectComposer.resolution },
      u_maxDistance: { type: 'f', value: 1 },
      u_jitter: { type: 'f', value: 0.3 },
      u_fadeStrength: { type: 'f', value: 1 },
      u_motionMultiplier: { type: 'v2', value: _motionMultiplierVector },
      u_depthTest: { type: 'f', value: 0 },
      u_opacity: { type: 'f', value: 1 },
      u_leaning: { type: 'f', value: 0.5 },
      u_depthBias: { type: 'f', value: 0.01 }
    },
    vertexShader: fboHelper.precisionPrefix + glslify('./motionBlurLines.vert'),
    fragmentShader: fboHelper.precisionPrefix + glslify('./motionBlurLines.frag'),

    blending: THREE.AdditiveBlending,
    // blending : THREE.CustomBlending,
    // blendEquation : THREE.AddEquation,
    // blendSrc : THREE.OneFactor,
    // blendDst : THREE.OneFactor ,
    // blendEquationAlpha : THREE.AddEquation,
    // blendSrcAlpha : THREE.OneFactor,
    // blendDstAlpha : THREE.OneFactor,
    depthTest: false,
    depthWrite: false,
    transparent: true
  })
  _lines = new THREE.LineSegments(_linesGeometry, _linesMaterial)
  _linesScene.add(_lines)

  _sampleCount = sampleCount || 21
  _samplingMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: undef },
      u_motionTexture: { type: 't', value: _motionRenderTarget },
      u_resolution: { type: 'v2', value: effectComposer.resolution },
      u_maxDistance: { type: 'f', value: 1 },
      u_fadeStrength: { type: 'f', value: 1 },
      u_motionMultiplier: { type: 'v2', value: _motionMultiplierVector },
      u_leaning: { type: 'f', value: 0.5 },
      u_blurWeights: { type: 'f', value: _blurWeights = new Float32Array(_sampleCount) }
    },
    defines: {
      SAMPLE_COUNT: _sampleCount
    },
    vertexShader: this.material.vertexShader,
    fragmentShader: '\n' + fboHelper.precisionPrefix + glslify('./motionBlurSampling.frag')
  })
}

function resize (width, height) {
  if (!width) {
    width = _width
    height = _height
  } else {
    _width = width
    _height = height
  }

  var motionWidth = ~~(width * exports.motionRenderTargetScale)
  var motionHeight = ~~(height * exports.motionRenderTargetScale)

  _motionRenderTarget.setSize(motionWidth , motionHeight)

  if (!exports.useSampling) {
    var linesWidth = ~~(width * exports.linesRenderTargetScale)
    var linesHeight = ~~(height * exports.linesRenderTargetScale)
    _linesRenderTarget.setSize(linesWidth, linesHeight)

    var i
    var noDithering = !exports.useDithering
    var amount = noDithering ? linesWidth * linesHeight : _getDitheringAmount(linesWidth, linesHeight)
    var currentLen = _linesPositions.length / 6
    if (amount > currentLen) {
      _linesPositions = new Float32Array(amount * 6)
      _linesPositionAttribute = new THREE.BufferAttribute(_linesPositions, 3)
      _linesGeometry.removeAttribute('position')
      _linesGeometry.addAttribute('position', _linesPositionAttribute)
    }
    var i6 = 0
    var x, y
    var size = linesWidth * linesHeight
    for (i = 0; i < size; i++) {
      x = i % linesWidth
      y = ~~(i / linesWidth)
      if (noDithering || ((x + (y & 1)) & 1)) {
        _linesPositions[i6 + 0] = _linesPositions[i6 + 3] = (x + 0.5) / linesWidth
        _linesPositions[i6 + 1] = _linesPositions[i6 + 4] = (y + 0.5) / linesHeight
        _linesPositions[i6 + 2] = 0
        _linesPositions[i6 + 5] = (0.001 + 0.999 * Math.random())
        i6 += 6
      }
    }
    _linesPositionAttribute.needsUpdate = true
    _linesGeometry.drawRange.count = amount * 2
  }

  _prevUseDithering = exports.useDithering
  _prevUseSampling = exports.useSampling
}

function needsRender () {
  return !!this.motionMultiplier
}

// dithering
function _getDitheringAmount (width, height) {
  if ((width & 1) && (height & 1)) {
    return (((width - 1) * (height - 1)) >> 1) + (width >> 1) + (height >> 1)
  } else {
    return (width * height) >> 1
  }
}

function render (dt, renderTarget, toScreen) {
  if (_prevUseDithering !== exports.useDithering) {
    resize()
  } else if (_prevUseSampling !== exports.useSampling) {
    resize()
  }

  var useSampling = exports.useSampling

  var state = fboHelper.getColorState()
  effectComposer.renderer.setClearColor(0, 1)
  effectComposer.renderer.clearTarget(_motionRenderTarget, true, true, true)

  effectComposer.beforeRendered.add(_onBeforeSceneRender)
  effectComposer.afterRendered.add(_onAfterSceneRender)
  effectComposer.renderScene(_motionRenderTarget)
  effectComposer.beforeRendered.remove(_onBeforeSceneRender)
  effectComposer.afterRendered.remove(_onAfterSceneRender)

  var leaning = Math.max(0.001, Math.min(0.999, exports.leaning))

  if (!useSampling) {
    _linesMaterial.uniforms.u_maxDistance.value = exports.maxDistance
    _linesMaterial.uniforms.u_jitter.value = exports.jitter
    _linesMaterial.uniforms.u_fadeStrength.value = exports.fadeStrength
    _linesMaterial.uniforms.u_depthTest.value = exports.depthTest
    _linesMaterial.uniforms.u_opacity.value = exports.opacity
    _linesMaterial.uniforms.u_leaning.value = leaning
    _linesMaterial.uniforms.u_depthBias.value = Math.max(0.00001, exports.depthBias)
    _linesMaterial.uniforms.u_texture.value = renderTarget

    effectComposer.renderer.setClearColor(0, 0)
    effectComposer.renderer.clearTarget(_linesRenderTarget, true)
    effectComposer.renderer.render(_linesScene, _linesCamera, _linesRenderTarget)
  }

  fboHelper.setColorState(state)

  if (useSampling) {
    _samplingMaterial.uniforms.u_maxDistance.value = exports.maxDistance
    _samplingMaterial.uniforms.u_fadeStrength.value = exports.fadeStrength
    _samplingMaterial.uniforms.u_leaning.value = leaning
    _samplingMaterial.uniforms.u_texture.value = renderTarget

    if (leaning !== _prevLeaning) {
      var ratio, weight
      var totalWeight = 0
      for (var i = 0; i < _sampleCount; i++) {
        ratio = (i + 1) / (_sampleCount + 1)
        _blurWeights[i] = weight = math.smoothstep(0.0, leaning, ratio) * (1.0 - math.smoothstep(leaning, 1.0, ratio))
        totalWeight += weight
      }
      for (i = 0; i < _sampleCount; i++) {
        _blurWeights[i] /= totalWeight
      }
      _prevLeaning = leaning
    }

    effectComposer.render(_samplingMaterial, toScreen)
  } else {
    this.uniforms.u_lineAlphaMultiplier.value = 1 + exports.useDithering
    _super.render.call(this, dt, renderTarget, toScreen)
  }
}

function _onBeforeSceneRender (scene, camera, renderTarget, forceClear) {
  _motionMultiplierVector.set(
    renderTarget.viewport.z / renderTarget.width * exports.motionMultiplier,
    renderTarget.viewport.w / renderTarget.height * exports.motionMultiplier
  )
  effectComposer.scene.traverseVisible(_setObjectBeforeState.bind(this, camera.id))
}

function _onAfterSceneRender (scene, camera, renderTarget, forceClear) {
  var cameraId = camera.id
  for (var i = 0, len = _visibleCache.length; i < len; i++) {
    _setObjectAfterState(cameraId, _visibleCache[i])
  }
  _visibleCache = []
}

function _setObjectBeforeState (cameraId, obj) {
  if (obj.motionMaterial) {
    obj._tmpMaterial = obj.material
    var motionMaterial = obj.material = obj.motionMaterial
    motionMaterial.uniforms.u_motionMultiplier.value = motionMaterial.motionMultiplier
    var matrix = motionMaterial.prevModelViewMatrixMap[cameraId]
    if (!matrix) {
      matrix = motionMaterial.prevModelViewMatrixMap[cameraId] = (new THREE.Matrix4()).copy(obj.modelViewMatrix)
    }

    if (exports.ignoreCamera) {
      motionMaterial.uniforms.u_prevModelViewMatrix.value = obj.modelViewMatrix
      if (obj.isStatic) {
        obj.visible = false
      }
    } else {
      motionMaterial.uniforms.u_prevModelViewMatrix.value = matrix
    }
  } else if (obj.material) {
    obj.visible = false
  }

  _visibleCache.push(obj)
}

function _setObjectAfterState (cameraId, obj) {
  if (obj.motionMaterial) {
    if (exports.ignoreCamera || !exports.skipMatrixUpdate) {
      obj.motionMaterial.prevModelViewMatrixMap[cameraId].copy(obj.modelViewMatrix)
    }
    obj.material = obj._tmpMaterial
    obj._tmpMaterial = undef
  }
  obj.visible = true
}
