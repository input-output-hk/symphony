import * as THREE from 'three'
import vertexShader from './BlockMaterial.vert'
import fragmentShader from './BlockMaterial.frag'

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.standard.uniforms

    this.uniforms.uRefractionRatio = {
      type: 'f',
      value: 0.8
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

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader
  }
}
