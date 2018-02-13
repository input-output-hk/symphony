var effectComposer = require('../../effectComposer')
var PostEffect = require('../PostEffect')

var glslify = require('glslify')
var THREE = require('three')

var exports = module.exports = new PostEffect()
var _super = PostEffect.prototype

exports.init = init
exports.needsRender = needsRender
exports.render = render

exports.amount = 1
exports.lowerBound = new THREE.Vector2(1, 3)
exports.upperBound = new THREE.Vector2(4, 6)

function init () {
  _super.init.call(this, {
    uniforms: {
      u_depthTexture: { type: 't', value: effectComposer.depthTexture },
      u_cameraNear: { value: 0.001 },
      u_cameraFar: { value: 1 },
      u_lowerBound: { type: 'v2', value: exports.lowerBound },
      u_upperBound: { type: 'v2', value: exports.upperBound },
      u_delta: { type: 'v2', value: new THREE.Vector2() },
      u_amount: { type: 'f', value: 1 }
    },
    fragmentShader: glslify('./dof.frag')
  })
}

function needsRender () {
  return !!this.amount
}

function render (dt, renderTarget, toScreen) {
  if (exports.lowerBound.x > exports.lowerBound.y) {
    exports.lowerBound.x = exports.lowerBound.y
  }

  if (exports.upperBound.x > exports.upperBound.y) {
    exports.upperBound.x = exports.upperBound.y
  }

  this.uniforms.u_cameraNear.value = effectComposer.camera.near
  this.uniforms.u_cameraFar.value = effectComposer.camera.far

  this.uniforms.u_amount.value = exports.amount
  this.uniforms.u_delta.value.set(1, 0)
  renderTarget = _super.render.call(this, dt, renderTarget)
  this.uniforms.u_delta.value.set(0, 1)
  _super.render.call(this, dt, renderTarget, toScreen)
}
