import * as THREE from 'three'
const glslify = require('glslify')

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.standard.uniforms

    this.uniforms.uRefractionRatio = {
      type: 'f',
      value: 0.72
    }

    this.uniforms.uFresnelBias = {
      type: 'f',
      value: 0.1
    }

    this.uniforms.uFresnelScale = {
      type: 'f',
      value: 0.1
    }

    this.uniforms.uFresnelPower = {
      type: 'f',
      value: 20.0
    }

    this.vertexShader = glslify('./BlockMaterial.vert')
    this.fragmentShader = glslify('./BlockMaterial.frag')
  }
}
