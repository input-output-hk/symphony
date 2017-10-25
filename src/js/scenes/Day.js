'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'

import {
  ExtrudeCrystalGeometry,
  ExtrudeCrystalBufferGeometry
} from '../geometries/ExtrudeCrystalGeometry'
import {
  ConvexGeometry
} from '../geometries/ConvexGeometry'

let OrbitControls = OrbitContructor(THREE)

export default class Day {

  constructor(blocks) {

    // declare class vars
    this.camera
    this.scene
    this.renderer
    this.width
    this.height
    this.bgMap
    this.blocks = blocks
    this.textureLoader = new THREE.TextureLoader()

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.001)

    // renderer
    this.canvas = document.getElementById('stage')
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas,
      alpha: true
    })

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)

    this.renderer.autoClear = false

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false

    // camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(0.0, 35.0, 0.0)
    this.camera.updateMatrixWorld()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    // objects
    this.addLights()
    this.setupMaterials()
    this.addObjects()

    // animation loop
    this.animate()

  }

  addLights(scene) {

    let ambLight = new THREE.AmbientLight(0xf1d0c5)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xeee6a5)
    light.position.set(100, 30, 0)
    light.target.position.set(0, 0, 0)

    //if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    //}

    this.scene.add(light)

  }

  addObjects() {

    for (let i = 0; i < this.blocks.length; i++) {

      let block = this.blocks[i]

      let boxWidth = block.n_tx / 250
      let boxHeight = block.fee / 5000000000

      let geometry = new THREE.BoxBufferGeometry(boxWidth, boxHeight, boxHeight)
      let cube = new THREE.Mesh(geometry, this.crystalMaterial)

      let rotation = ((2 * Math.PI) / this.blocks.length) * i

      cube.rotation.y = rotation
      cube.translateX(10 + boxWidth / 2)
      cube.translateY(i / 15)

      this.scene.add(cube)

    }

  }

  addConvexHull(points) {
    // Convex Hull
    var CVgeometry = new ConvexGeometry(points)
    var CVmaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      opacity: 0.5,
      transparent: true
    })
    var CVmesh = new THREE.Mesh(CVgeometry, CVmaterial)

    CVmesh.rotation.set(0.0, Math.PI, Math.PI)

    this.scene.add(CVmesh)
  }

  setupMaterials() {

    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    this.bgMap = new THREE.CubeTextureLoader().setPath('/static/assets/textures/').load(this.cubeMapUrls)

    //this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: 1.0,
      side: THREE.DoubleSide,
      transparent: false,
      envMap: this.bgMap,
      //wireframe: true,
    })

  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }


}
