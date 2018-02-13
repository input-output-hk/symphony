var effectComposer = require('../../effectComposer')
var PostEffect = require('../PostEffect')
var glslify = require('glslify')
var THREE = require('three')

module.exports = new PostEffect()
var _super = PostEffect.prototype

module.exports.init = init
module.exports.render = render

function init (infoTexture) {
  _super.init.call(this, {
    uniforms: {

      u_infoTexture: {type: 't', value: infoTexture},

      u_cameraNear: {value: 1},
      u_cameraFar: {value: 100},
      u_projectionMatrix: {type: 'm4', value: new THREE.Matrix4()},
      u_unprojectionMatrix: {type: 'm4', value: new THREE.Matrix4()},

      u_scale: {type: 'f', value: 1},
      u_intensity: {type: 'f', value: 0.1},
      u_bias: {type: 'f', value: 0.5},
      u_kernelRadius: {type: 'f', value: 100},
      u_minResolution: {type: 'f', value: 0},
      u_randomSeed: {type: 'f', value: 0},
      u_numRings: {type: 'f', value: 1}

    },
    fragmentShader: glslify('./sao.frag')
  })
  this.material.extensions.derivatives = true
  this.material.defines.NUM_SAMPLES = 24
}

function render (dt, renderTarget, toScreen) {
  let camera = effectComposer.camera
  this.uniforms.u_projectionMatrix.value.copy(camera.projectionMatrix)
  this.uniforms.u_unprojectionMatrix.value.getInverse(camera.projectionMatrix)

  this.uniforms.u_cameraNear.value = camera.near
  this.uniforms.u_cameraFar.value = camera.far
  this.uniforms.u_randomSeed.value += dt

  _super.render.call(this, dt, renderTarget, toScreen)
}
