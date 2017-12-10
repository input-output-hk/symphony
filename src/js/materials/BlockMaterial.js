import * as THREE from 'three'
const glslify = require('glslify')

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'
    this.uniforms = THREE.UniformsUtils.merge([THREE.ShaderLib.standard.uniforms])
    this.vertexShader = glslify('./BlockMaterial.vert')
    this.fragmentShader = glslify('./BlockMaterial.frag')
  }
}
