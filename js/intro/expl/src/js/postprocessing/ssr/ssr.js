var effectComposer = require('../../effectComposer')
var PostEffect = require('../PostEffect')
var glslify = require('glslify')
var THREE = require('three')

module.exports = new PostEffect()
var _super = PostEffect.prototype

module.exports.init = init
module.exports.resize = resize
module.exports.render = render

let _trs
let _scrScale

function init (infoTexture) {
  _super.init.call(this, {
    uniforms: {
      u_infoTexture: {type: 't', value: infoTexture},

      u_projectionMatrix: {type: 'm4', value: new THREE.Matrix4()},
      u_unprojectionMatrix: {type: 'm4', value: new THREE.Matrix4()},
      u_traceProjectionMatrix: {type: 'm4', value: new THREE.Matrix4()},
      u_infoResolution: {type: 'v2', value: new THREE.Vector2()},
      u_noHitBoost: {type: 'f', value: 0.3},
      u_seed: {type: 'f', value: 0},

      u_cameraNear: {value: 1},
      u_cameraFar: {value: 100}

    },
    fragmentShader: glslify('./ssr.frag')
  })
  this.material.extensions.derivatives = true
  _trs = (new THREE.Matrix4()).compose(new THREE.Vector3(0.5, 0.5, 0.0), new THREE.Quaternion(0.0, 0.0, 0.0, 1.0), new THREE.Vector3(0.5, 0.5, 1.0))
  _scrScale = new THREE.Matrix4()
}

function resize (width, height) {
}

function render (dt, renderTarget, toScreen) {
  let infoTexture = this.uniforms.u_infoTexture.value
  _scrScale.makeScale(infoTexture.width, infoTexture.height, 1.0)

  let camera = effectComposer.camera
  this.uniforms.u_traceProjectionMatrix.value.copy(_trs).multiply(camera.projectionMatrix).premultiply(_scrScale)
  this.uniforms.u_projectionMatrix.value.copy(camera.projectionMatrix)
  this.uniforms.u_unprojectionMatrix.value.getInverse(camera.projectionMatrix)

  this.uniforms.u_cameraNear.value = camera.near
  this.uniforms.u_cameraFar.value = camera.far
  this.uniforms.u_infoResolution.value.set(infoTexture.width, infoTexture.height)
  this.uniforms.u_seed.value += dt % 125.6223

  _super.render.call(this, dt, renderTarget, toScreen)
}
