import * as THREE from 'three'
const glslify = require('glslify')

export default class BlockMaterial extends THREE.PointsMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.points.uniforms

    /* this.uniforms.worldSpaceCameraPos = {
      type: 'v3',
      value: new THREE.Vector3()
    }

    this.uniforms.invProjMat = {
      type: 'm4',
      value: new THREE.Matrix4()
    } */

    this.vertexShader = glslify('./PointsMaterial.vert')
    this.fragmentShader = glslify('./PointsMaterial.frag')
  }
}
