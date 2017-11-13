'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'

import {
  ConvexGeometry
} from '../geometries/ConvexGeometry'

let OrbitControls = OrbitContructor(THREE)

let merkle = require('merkle-tree-gen')

export default class Day {
  constructor(days) {

    this.days = days

    // keep track of each of the block within a day
    this.dayGroups = []

    this.textureLoader = new THREE.TextureLoader()

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.0001)

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
    this.camera.position.set(0.000007349558154544886, 2993.684696190396, 0.00299447337233752)
    this.camera.updateMatrixWorld()

    window.camera = this.camera

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    this.addEvents()

    // objects
    this.addLights()
    this.setupMaterials()
    this.addObjects()

    // animation loop
    this.animate()
  }

  addEvents() {
    this.raycaster = new THREE.Raycaster()
    this.intersected = null
    this.mousePos = new THREE.Vector2()

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
  }

  onDocumentMouseDown(event) {
    event.preventDefault()

    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mousePos, this.camera)

    this.dayGroups.forEach((group) => {
      var intersects = this.raycaster.intersectObjects(group.children)
      if (intersects.length > 0) {
        intersects[0].object.material.color.setHex(0xffffff)
        let hash = intersects[0].object.blockchainData.hash
        document.location.href = '/block/' + hash
      }
    })
  }

  onDocumentMouseMove(event) {
    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  addLights(scene) {
    let ambLight = new THREE.AmbientLight(0xf1d0c5)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xeee6a5)
    light.position.set(100, 30, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light)
  }

  addObjects() {
    
    for (let daysIndex = 0; daysIndex < this.days.length; daysIndex++) {
      let blocks = this.days[daysIndex]
      
      let group = new THREE.Group()

      this.dayGroups.push(group)

      let spiralPoints = []
      
      this.scene.add(group)

      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
        let block = blocks[blockIndex]

        // create an array of ints the same size as the number of transactions in this block
        let tx = []
        for (let index = 0; index < block.n_tx; index++) {
          tx.push(index)
        }

        const X = new THREE.Vector3(1, 0, 0)
        const Y = new THREE.Vector3(0, 1, 0)
        const Z = new THREE.Vector3(0, 0, 1)

        let sortedTree

        let angle = 90.0

        let xPosRotation = new THREE.Quaternion().setFromAxisAngle(X, (Math.PI / 180) * angle)
        let xNegRotation = new THREE.Quaternion().setFromAxisAngle(X, (Math.PI / 180) * -angle)
        let yPosRotation = new THREE.Quaternion().setFromAxisAngle(Y, (Math.PI / 180) * angle)
        let yNegRotation = new THREE.Quaternion().setFromAxisAngle(Y, (Math.PI / 180) * -angle)
        let yReverseRotation = new THREE.Quaternion().setFromAxisAngle(Y, (Math.PI / 180) * 180)
        let zPosRotation = new THREE.Quaternion().setFromAxisAngle(Z, (Math.PI / 180) * angle)
        let zNegRotation = new THREE.Quaternion().setFromAxisAngle(Z, (Math.PI / 180) * -angle)

        var args = {
          array: tx,
          hashalgo: 'md5'
          //hashlist: true
        }

        merkle.fromArray(args, function (err, tree) {
          if (!err) {
            console.log('Root hash: ' + tree.root)
            //console.log('Number of leaves: ' + tree.leaves)
            //console.log('Number of levels: ' + tree.levels)

            for (var key in tree) {
              if (tree.hasOwnProperty(key)) {
                var element = tree[key]
                if (element.type === 'root' || element.type === 'node') {
                  tree[key].children = {}
                  tree[key].children[element.left] = tree[element.left]
                  tree[key].children[element.right] = tree[element.right]
                  if (element.type === 'root') {
                    sortedTree = element
                  }
                }
              }
            }

            let points = []

            let treeGroup = new THREE.Group()
            this.scene.add(treeGroup)

            function build(node, startingPosition, direction, context) {

              let magnitude = node.level

              let startPosition = startingPosition.clone()
              let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

              points.push(startPosition)
              points.push(endPosition)

              //let path = new THREE.LineCurve3(startPosition, endPosition)

              //var geometry = new THREE.TubeBufferGeometry(path, 1, (magnitude / 20), 6, false)
              //var mesh = new THREE.Mesh(geometry, context.crystalMaterial)
              //treeGroup.add(mesh)

              let i = 0
              for (var key in node.children) {
                if (node.children.hasOwnProperty(key)) {
                  i++

                  var childNode = node.children[key]

                  if (childNode) {
                    if (typeof childNode.children !== 'undefined') {
                      let newDirection


                      if (i === 1) {

                        newDirection = direction.clone().applyQuaternion(xPosRotation)

                        var yaxis = direction.multiply(Y).normalize()
                        let yangle = (Math.PI / 180) * angle
                        let quaternion = new THREE.Quaternion().setFromAxisAngle(yaxis, yangle)
                        newDirection.applyQuaternion(quaternion)

                      } else {
                        newDirection = direction.clone().applyQuaternion(xNegRotation)

                        var yaxis = direction.multiply(Y).normalize()
                        let yangle = (Math.PI / 180) * angle
                        let quaternion = new THREE.Quaternion().setFromAxisAngle(yaxis, yangle)
                        newDirection.applyQuaternion(quaternion)

                      }

                      build(childNode, endPosition, newDirection, context)
                    }
                  }
                }
              }
            }

            let startingPosition = new THREE.Vector3(0, 0, 0)
            let direction = new THREE.Vector3(0, 1, 0)

            build(sortedTree, startingPosition, direction, this)

            // Convex Hull
            if (points.length > 3) {

              let CVgeometry = new ConvexGeometry(points)
              let CVmesh = new THREE.Mesh(CVgeometry, this.crystalMaterial.clone())

              CVmesh.blockchainData = block

              let rotation = ((8 * Math.PI) / blocks.length) * blockIndex
              CVmesh.rotation.y = rotation
              CVmesh.translateX(700 + (blockIndex * 4))
              //CVmesh.translateY(blockIndex * 5)

              // add random rotation
              /*CVmesh.rotation.y = Math.random()
              CVmesh.rotation.x = Math.random()
              CVmesh.rotation.z = Math.random()*/

              group.add(CVmesh)

              spiralPoints.push(CVmesh.position)

            }

          }

        }.bind(this))

      }

      var material = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.5
      })

      var curve = new THREE.CatmullRomCurve3(spiralPoints)
      var points = curve.getPoints(spiralPoints.length * 2)
      var geometry = new THREE.Geometry()
      geometry.vertices = points
      var line = new THREE.Line(geometry, material)

      group.translateY(daysIndex * 500)
      line.translateY(daysIndex * 500)

      this.scene.add(line)

    }

    document.getElementById('loading').style.display = 'none'

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

    // this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: 0.7,
      side: THREE.DoubleSide,
      transparent: true,
      envMap: this.bgMap
      // wireframe: true,
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
    /*this.group.rotation.y += 0.0001*/

    var vector = new THREE.Vector3(this.mousePos.x, this.mousePos.y, 1)
    vector.unproject(this.camera)
    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())

    this.dayGroups.forEach((group) => {
      var intersects = ray.intersectObjects(group.children)
      if (intersects.length > 0) {
        if (intersects[0].object !== this.intersected) {
          if (this.intersected) {
            this.intersected.material.color.setHex(this.intersected.currentHex)
          }
          this.intersected = intersects[0].object
          this.intersected.currentHex = this.intersected.material.color.getHex()
          this.intersected.material.color.setHex(0xffffff)
        }
      } else {
        if (this.intersected) {
          this.intersected.material.color.setHex(this.intersected.currentHex)
        }
        this.intersected = null
      }

    }, this)

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
