import * as THREE from 'three'
const glslify = require('glslify')

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)

    // {
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.ShaderLib.standard.uniforms,
      {
        worldSpaceCameraPos: { type: 'v3', value: new THREE.Vector3() },
        invProjMat: { type: 'm4', value: new THREE.Matrix4() }
      }
    ])
    this.type = 'ShaderMaterial'

    this.vertexShader = glslify('./BlockMaterial.vert')
    this.fragmentShader = glslify('./BlockMaterial.frag')
  }
}
