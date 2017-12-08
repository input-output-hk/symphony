var PostEffect = require('../PostEffect')
var glslify = require('glslify')

module.exports = new PostEffect()
var _super = PostEffect.prototype

module.exports.init = init

function init (isLow) {
  var vs = isLow ? glslify('./lowFxaa.vert') : ''
  var fs = isLow ? glslify('./lowFxaa.frag') : glslify('./fxaa.frag')

  _super.init.call(this, {
    uniforms: {},
    vertexShader: vs,
    fragmentShader: fs
  })
}
