import * as THREE from 'three'
const glslify = require('glslify')

export default class BlockMaterial extends THREE.MeshStandardMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.standard.uniforms

    this.uniforms.worldSpaceCameraPos = {
      type: 'v3',
      value: new THREE.Vector3()
    }

    this.uniforms.invProjMat = {
      type: 'm4',
      value: new THREE.Matrix4()
    }

    this.vertexShader = glslify('./BlockMaterial.vert')
    this.fragmentShader = glslify('./BlockMaterial.frag')
  }
}
