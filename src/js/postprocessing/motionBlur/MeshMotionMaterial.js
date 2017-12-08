var THREE = require('three')
var glslify = require('glslify')
var mixIn = require('mout/object/mixIn')
var fillIn = require('mout/object/fillIn')

var undef

function MeshMotionMaterial (parameters) {
  parameters = parameters || {}

  var uniforms = parameters.uniforms || {}
  var vertexShader = glslify('./motionBlurMotion.vert')
  var fragmentShader = glslify('./motionBlurMotion.frag')
  this.motionMultiplier = parameters.motionMultiplier || 1

  THREE.ShaderMaterial.call(this, mixIn({
    uniforms: fillIn(uniforms, {
      u_prevModelViewMatrix: {type: 'm4', value: undef},
      u_motionMultiplier: {type: 'f', value: 1}
    }),
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    blending: THREE.NoBlending

  }, parameters))

  this.prevModelViewMatrixMap = {}; // use camera.id as reference
}

var _p = MeshMotionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype)
_p.constructor = MeshMotionMaterial
module.exports = MeshMotionMaterial
