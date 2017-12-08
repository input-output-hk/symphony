const PostEffect = require('../PostEffect')
const effectComposer = require('../../effectComposer')
const fboHelper = require('../../helpers/fboHelper')
const blur = require('../../shaders/blur/blur')

const glslify = require('glslify')

let undef

let exports = module.exports = new PostEffect()
let _super = PostEffect.prototype

exports.init = init
exports.needsRender = needsRender
exports.render = render

exports.amount = 0.5
exports.blurRadius = 5
exports.blurScale = 0.5

let _blurRenderTarget1
let _blurRenderTarget2

function init () {
  _super.init.call(this, {
    uniforms: {
      u_blurTexture: { type: 't', value: undef },
      u_amount: { type: 'f', value: 0 }
    },
    fragmentShader: glslify('./bloom.frag')
  })

  _blurRenderTarget1 = fboHelper.createRenderTarget(1, 1)
  _blurRenderTarget2 = fboHelper.createRenderTarget(1, 1)
}

function needsRender () {
  return exports.blurRadius && exports.amount
}

function render (dt, renderTarget, toScreen) {
  let state = fboHelper.getColorState()
  effectComposer.renderer.autoClearColor = true
  effectComposer.renderer.setClearColor(0, 0)

  blur.blur9(exports.blurRadius, exports.blurScale, renderTarget, _blurRenderTarget1, _blurRenderTarget2)

  this.uniforms.u_blurTexture.value = _blurRenderTarget2
  this.uniforms.u_amount.value = this.amount

  _super.render.call(this, dt, renderTarget, toScreen)

  fboHelper.setColorState(state)
}
