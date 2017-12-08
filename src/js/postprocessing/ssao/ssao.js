/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Screen-space ambient occlusion shader
 * - ported from
 *   SSAO GLSL shader v1.2
 *   assembled by Martins Upitis (martinsh) (http://devlog-martinsh.blogspot.com)
 *   original technique is made by ArKano22 (http://www.gamedev.net/topic/550699-ssao-no-halo-artifacts/)
 * - modifications
 * - modified to use RGBA packed depth texture (use clear color 1,1,1,1 for depth pass)
 * - refactoring and optimizations
 */

var effectComposer = require('../../effectComposer')
var PostEffect = require('../PostEffect')
var glslify = require('glslify')
var THREE = require('three')

module.exports = new PostEffect()
var _super = PostEffect.prototype

module.exports.init = init
module.exports.resize = resize

function init () {
  _super.init.call(this, {
    uniforms: {
      u_depthTexture: { type: 't', value: effectComposer.depthTexture },
      u_size: { type: 'v2', value: new THREE.Vector2() },
      u_cameraNear: { type: 'f', value: 1 },
      u_cameraFar: { type: 'f', value: 100 },
      u_aoClamp: { type: 'f', value: 0.3 },
      u_darkness: { type: 'f', value: 0.5 },
      u_radius: { type: 'f', value: 6.5 }
    },
    fragmentShader: glslify('./ssao.frag')
  })
}

function resize (width, height) {
  this.uniforms.u_size.value.set(width, height)
  this.uniforms.u_cameraNear.value = effectComposer.camera.near
  this.uniforms.u_cameraFar.value = effectComposer.camera.far
}
