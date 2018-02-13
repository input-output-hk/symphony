const THREE = require('three')
const effectComposer = require('../effectComposer')
const fboHelper = require('../helpers/fboHelper')
// const merge = require('mout/object/merge')
const glslify = require('glslify')

const DEFAULT_QUAD_VERTEX_SHADER = glslify('../glsl/shaderMaterialQuad.vert')

class PostEffectRaw extends THREE.RawShaderMaterial {

  // constructor({
  //   uniforms: {
  //     u_texture: { type: 't', value: undef },
  //     u_resolution: { type: 'v2', value: effectComposer.resolution }
  //   },
  //   // defines: {},
  //   // enabled = true,
  //   vertexShader,
  //   fragmentShader,
  //   // isRawMaterial: true,
  //   addRawShaderPrefix: true
  // }){

  constructor(params = {
    fragmentShader: DEFAULT_QUAD_VERTEX_SHADER,
    uniforms: {
      u_texture: { type: 't', value: undef },
      u_resolution: { type: 'v2', value: effectComposer.resolution }
    }
  }){

    super({
      ...params,
      // uniforms: uniforms,
      vertexShader: ( params.addRawShaderPrefix ? fboHelper.precisionPrefix : '' ) + params.vertexShader,
      fragmentShader: ( params.addRawShaderPrefix ? fboHelper.precisionPrefix : '' ) + fragmentShader  
      // defines
    })

    this.enabled = true

    // if (!this.vertexShader) {
    //   this.vertexShader = fboHelper.vertexShader
    // }
  


    // if (this.addRawShaderPrefix) {
    //   this.vertexShader = fboHelper.precisionPrefix + this.vertexShader
    //   this.fragmentShader = fboHelper.precisionPrefix + this.fragmentShader
    // }
  
    // this.material = new (this.isRawMaterial ? THREE.RawShaderMaterial : THREE.ShaderMaterial)({
    //   uniforms: this.uniforms,
    //   vertexShader: this.vertexShader,
    //   fragmentShader: this.fragmentShader,
    //   defines: this.defines
    // })
  }

  resize(w, h){}

   /*
    `needsRender` is a dynamic way to skip the rendering.
    For example, if blurRadius is zero, there is no point to render
  */
  needsRender (dt) {
    return true
  }

  render (dt, texture, toScreen) {
    this.uniforms.u_texture.value = texture
    return effectComposer.render(this, toScreen)
  }

}

// function PostEffect () {}
// module.exports = PostEffect
// var _p = PostEffect.prototype

// _p.init = init
// _p.resize = resize
// _p.needsRender = needsRender
// _p.render = render

// function init (cfg) {
//   merge(this, {
//     uniforms: {
//       u_texture: { type: 't', value: undef },
//       u_resolution: { type: 'v2', value: effectComposer.resolution }
//     },
//     defines: {},
//     enabled: true,
//     vertexShader: '',
//     fragmentShader: '',
//     isRawMaterial: true,
//     addRawShaderPrefix: true

//   }, cfg)

//   if (!this.vertexShader) {
//     this.vertexShader = this.isRawMaterial ? fboHelper.vertexShader : glslify('../glsl/shaderMaterialQuad.vert')
//   }

//   if (this.addRawShaderPrefix && this.isRawMaterial) {
//     this.vertexShader = fboHelper.precisionPrefix + this.vertexShader
//     this.fragmentShader = fboHelper.precisionPrefix + this.fragmentShader
//   }

//   this.material = new (this.isRawMaterial ? THREE.RawShaderMaterial : THREE.ShaderMaterial)({
//     uniforms: this.uniforms,
//     vertexShader: this.vertexShader,
//     fragmentShader: this.fragmentShader,
//     defines: this.defines
//   })
// }

// function resize (width, height) {}

//  /*
//  `needsRender` is a dynamic way to skip the rendering.
//  For example, if blurRadius is zero, there is no point to render
//   */
// function needsRender (dt) {
//   return true
// }

// function render (dt, renderTarget, toScreen) {
//   this.uniforms.u_texture.value = renderTarget

//   return effectComposer.render(this.material, toScreen)
// }
