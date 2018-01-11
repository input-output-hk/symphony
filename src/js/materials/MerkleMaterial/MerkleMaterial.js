import * as THREE from 'three'
// import BlockMaterial from '../BlockMaterial/BlockMaterial'
import vertexShader from './MerkleMaterial.vert'
import fragmentShader from './MerkleMaterial.frag'

export default class MerkleMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.standard.uniforms

    this.uniforms.uTime = {
      type: 'f',
      value: 0.0
    }

    this.uniforms.uAnimTime = {
      type: 'f',
      value: 0.0
    }

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader
  }
}
