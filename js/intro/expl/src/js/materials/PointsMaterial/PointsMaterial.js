import * as THREE from 'three'
const glslify = require('glslify')

export default class PointsMaterial extends THREE.PointsMaterial {
  constructor (cfg) {
    super(cfg)
    this.type = 'ShaderMaterial'

    this.uniforms = THREE.ShaderLib.points.uniforms

    this.uniforms.uTime = {
      type: 'f',
      value: 0.0
    }

    this.uniforms.uColor = {
      type: 't'
    }

    this.uniforms.pointCount = {
      type: 'f'
    }

    this.vertexShader = glslify('./PointsMaterial.vert')
    this.fragmentShader = glslify('./PointsMaterial.frag')
  }
}
