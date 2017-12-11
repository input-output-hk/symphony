const THREE = require('three')
const effectComposer = require('../effectComposer')
const fboHelper = require('../helpers/fboHelper')
// const merge = require('mout/object/merge')
const glslify = require('glslify')

const DEFAULT_QUAD_VERTEX_SHADER = glslify('../glsl/shaderMaterialQuad.vert')

class PostEffectRaw extends THREE.ShaderMaterial {

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
  }

  resize(w, h){}

    /*
    `needsRender` is a dynamic way to skip the rendering.
    For example, if blurRadius is zero, there is no point to render
  */
  needsRender (dt) {
    return true
  }

  render (dt, renderTarget, toScreen) {
    this.uniforms.u_texture.value = renderTarget
    return effectComposer.render(this, toScreen)
  }

}