import * as THREE from 'three'
import vertexShader from './BlockHighlightMaterial.vert'
import fragmentShader from './BlockHighlightMaterial.frag'

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.UniformsUtils.merge([
      THREE.ShaderLib.standard.uniforms,
      {
        worldSpaceCameraPos: { type: 'v3', value: new THREE.Vector3() },
        invProjMat: { type: 'm4', value: new THREE.Matrix4() }
      }
    ])
    this.type = 'ShaderMaterial'

    this.vertexShader = vertexShader
    this.fragmentShader = fragmentShader
  }
}
