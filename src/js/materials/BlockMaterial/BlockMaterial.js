import * as THREE from 'three'
import vertexShader from './BlockMaterial.vert'
import fragmentShader from './BlockMaterial.frag'

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.standard.uniforms
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.ShaderLib.standard.uniforms,
      {
        uRefractionRatio: { type: 'f', value: 0.8 },
        uFresnelBias: { type: 'f', value: 0.1 },
        uFresnelScale: { type: 'f', value: 0.1 },
        uFresnelPower: { type: 'f', value: 20.0 },
        uCubePos: { type: 'v3', value: new THREE.Vector3() }
      }
    ])

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader
  }
}