var PostEffect = require('../PostEffect')
var glslify = require('glslify')

module.exports = new PostEffect()
var _super = PostEffect.prototype

module.exports.init = init

function init () {
  _super.init.call(this, {
    uniforms: {
      u_reduction: { type: 'f', value: 0.3 },
      u_boost: { type: 'f', value: 1.2 }
    },
    fragmentShader: glslify('./vignette.frag')
  })
}
