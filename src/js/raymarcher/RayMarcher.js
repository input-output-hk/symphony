'use strict'

import * as THREE from 'three'
import Config from '../Config'

const glslify = require('glslify')

export default class RayMarcher {
  constructor (params) {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.loaded = false
    this.effectDownscaleDivisor = Config.postProcessing.effectDownscaleDivisor

    this.tmpMatrix = new THREE.Matrix4()

    // scene setup
    this.scene = new THREE.Scene()
    this.camera = params.camera

    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: params.canvas
    })

    this.renderer.setSize(this.width, this.height)
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.domElement = this.renderer.domElement

    // geometry setup
    this.quadGeometry = new THREE.PlaneBufferGeometry(2, 2)
    this.quad = new THREE.Mesh(this.quadGeometry, null)
    this.scene.add(this.quad)

    // this.setSize(this.width, this.height)

    this.setFragmentShader()

    return this
  }

  setFragmentShader () {
    this.startTime = Date.now()

    this.quad.material = this.material = new THREE.ShaderMaterial({

      uniforms: {
        resolution: {
          type: 'v2',
          value: new THREE.Vector2(this.width, this.height)
        },
        shadowMap: {
          value: null
        },
        spotLightMatrix: {
          type: 'm4'
        },
        invProjMat: {
          type: 'm4',
          value: new THREE.Matrix4()
        },
        carouselInvRotationMat: {
          type: 'm3',
          value: new THREE.Matrix3()
        },
        uTime: {
          type: 'f',
          value: this.startTime
        },
        depthTexture: {
          value: this.depthRenderTarget
        },
        spotLightPosition: {
          value: new THREE.Vector3()
        },
        spotLightDirection: {
          value: new THREE.Vector3()
        },
        spotLightColor: {
          value: new THREE.Color()
        },
        spotLightDistance: {
          value: 0
        },
        spotLightConeCos: {
          value: 0
        },
        spotLightPenumbraCos: {
          value: 0
        },
        spotLightDecay: {
          value: 0
        },
        spotLightShadowBias: {
          value: 0
        },
        noiseTexture: {
          value: this.noiseTexture
        },
        fogDirection: {
          value: new THREE.Vector3()
        },
        aspect: {
          value: this.width / this.height
        },
        rainbowSaturation: {
          value: 0
        }
      },
      vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
      fragmentShader: `
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
      }
      `,
      defines: {
        RAY_COUNT: 10,
        MAX_DISTANCE: 3
      }
      // side: THREE.BackSide

    })

    this.quad.material.transparent = true
    this.quad.material.blending = THREE.CustomBlending
    this.quad.material.blendSrc = THREE.OneFactor
    this.quad.material.blendDst = THREE.OneFactor
    this.quad.material.blendEquation = THREE.AddEquation
    this.quad.material.blendSrcAlpha = THREE.OneFactor
    this.quad.material.blendDstAlpha = THREE.ZeroFactor
    this.quad.material.blendEquationAlpha = THREE.AddEquation

    this.update()

    this.loaded = true
  }

  setSize (width, height) {
    this.width = width
    this.height = height

    this.renderer.setSize(width, height)

    if (this.material != null) {
      this.material.uniforms.resolution.value.x = width
      this.material.uniforms.resolution.value.y = height
      this.material.uniforms.aspect.value = width / height
    }
  }

  update () {
    if (this.material == null) {
      return
    }

    // pass camera position to shader
    let projectionMatrixInverse = new THREE.Matrix4()
    projectionMatrixInverse.getInverse(this.camera.projectionMatrix)
    this.material.uniforms.invProjMat.value.multiplyMatrices(this.camera.matrixWorld, projectionMatrixInverse)

    this.material.uniforms.uTime.value = (Date.now() - this.startTime) * 0.0003
  }
}
