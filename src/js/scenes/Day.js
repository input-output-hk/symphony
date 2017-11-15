'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'
import {
   ConvexGeometry
} from '../../../functions/ConvexGeometry'
import loader from '../../utils/loader'
let OrbitControls = OrbitContructor(THREE)
let merkle = require('merkle-tree-gen')
const TWEEN = require('@tweenjs/tween.js')

export default class Day {
  constructor (days) {
    this.days = days

    this.currentBlock = null
    this.crystalOpacity = 0.7

    this.view = 'day' // can be 'day' or 'block'

    this.mouseStatic = true
    this.mouseMoveTimeout = null

    // keep track of each of the block within a day
    this.dayGroups = []
    this.lineGroups = []

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

    this.isAnimating = false

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
    this.initialCameraPos = new THREE.Vector3(0.0, 1000.0, 0.0)

    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z)
    this.camera.updateMatrixWorld()

    this.camPos = this.camera.position.clone()
    this.targetPos = this.camPos.clone()
    this.origin = new THREE.Vector3(0, 0, 0)
    this.lookAtPos = new THREE.Vector3(0, 0, 0)

    this.camera.lookAt(this.lookAtPos)
    let toRotation = new THREE.Euler().copy(this.camera.rotation)
    this.fromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
    this.toQuaternion = new THREE.Quaternion().setFromEuler(toRotation)
    this.moveQuaternion = new THREE.Quaternion()
    this.camera.quaternion.set(this.moveQuaternion)

    // are we focussed on a block?
    this.focussed = false

    window.camera = this.camera

    // controls
    //this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    //this.controls.minDistance = 0
    //this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    /*
      Temp loading mechanism
    */
   // loader.get('convexHull')
   //   .then(({ data }) => {

      //  this.templateGeometry = new THREE.BufferGeometryLoader().parse(data)
        this.addEvents()

        // objects
        this.addLights()
        this.setupMaterials()
        this.addObjects()

        this.moveCamera()

        // animation loop
        this.animate()
 //     })
  }

  addEvents () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = null
    this.mousePos = new THREE.Vector2()

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
    document.addEventListener('keydown', this.onkeydown.bind(this), false)
  }

  onkeydown (event) {
    var isEscape = false
    if ('key' in event) {
      isEscape = (event.key === 'Escape' || event.key === 'Esc')
    } else {
      isEscape = (event.keyCode === 27)
    }
    if (isEscape) {
      this.resetDayView()
    }
  }

  resetDayView () {
    this.view = 'day'

    this.animateCamera(this.initialCameraPos, new THREE.Vector3(0.0, 0.0, 0.0))

    this.focussed = false
    this.isAnimating = false
    this.toggleBlocks(true)

    if (this.currentBlock) {
      new TWEEN.Tween( this.currentBlock.material )
      .to( { opacity: this.crystalOpacity }, 1000 )
      .start()
    }
  }

  removeTrees () {
    if (typeof this.treeGroup !== 'undefined') {
      this.scene.remove(this.treeGroup)
    }
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    console.log(this.view)
    if (this.view === 'block') {
      return
    }

    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mousePos, this.camera)

    this.focussed = true

    this.dayGroups.forEach((group) => {
      var intersects = this.raycaster.intersectObjects(group.children)
      if (intersects.length > 0) {

        let blockObject = intersects[0].object

        this.currentBlock = blockObject

        let lookAtPos = blockObject.getWorldPosition().clone()

        let blockDir = blockObject.getWorldPosition().clone().normalize()
        let newCamPos = blockObject.getWorldPosition().clone().add(blockDir.multiplyScalar(30))
        newCamPos.y += 80.0

        this.animateCamera(newCamPos, lookAtPos).then(() => {
          this.buildSingleTree(blockObject)
        })

      }
    })
  }

  toggleBlocks (visibility) {
    this.dayGroups.forEach((group) => {
      group.visible = visibility
    }, this)

    this.lineGroups.forEach((group) => {
      group.visible = visibility
    }, this)
  }

  buildSingleTree (blockObject) {

    this.view = 'block'

    let block = blockObject.blockchainData

    let sortedTree
    
    let position = blockObject.getWorldPosition().clone()
    let rotation = blockObject.getWorldRotation().clone()

    new TWEEN.Tween( blockObject.material )
      .to( { opacity: 0 }, 1000 )
      .onComplete(() => {

        this.toggleBlocks(false)

        let blockDir = position.clone().normalize()
        let newCamPos = position.clone().add(blockDir.multiplyScalar(27))
        newCamPos.y += 40.0

        this.animateCamera(newCamPos, position.clone())

      })
      .start()

    this.removeTrees()
    this.treeGroup = new THREE.Group()
    this.treeGroup.position.set(position.x, position.y, position.z)
    this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
    this.scene.add(this.treeGroup)

    // create an array of ints the same size as the number of transactions in this block
    let tx = []
    for (let index = 0; index < block.n_tx; index++) {
      tx.push(index)
    }

    var args = {
      array: tx,
      hashalgo: 'md5'
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

        this.points = []

        let startingPosition = new THREE.Vector3(0, 0, 0)
        let direction = new THREE.Vector3(0, 1, 0)

        this.build(sortedTree, startingPosition, direction, this, true)

      }
    }.bind(this))
  }

  animateCamera (target, lookAt) {

    return new Promise((resolve, reject) => {

      if (this.isAnimating) {
        console.log('animating')
        return
      }
      this.isAnimating = true

      this.targetPos = target.clone()
      this.origin = lookAt.clone()

      // grab initial postion/rotation
      let fromPosition = new THREE.Vector3().copy(this.camera.position)
      let fromRotation = new THREE.Euler().copy(this.camera.rotation)

      this.camera.position.set(this.targetPos.x, this.targetPos.y, this.targetPos.z)
      this.camera.lookAt(this.origin)
      let toRotation = new THREE.Euler().copy(this.camera.rotation)

      // reset original position and rotation
      this.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z)
      this.camera.rotation.set(fromRotation.x, fromRotation.y, fromRotation.z)

      this.fromQuaternion = new THREE.Quaternion().copy(this.camera.quaternion)
      this.toQuaternion = new THREE.Quaternion().setFromEuler(toRotation)
      this.moveQuaternion = new THREE.Quaternion()

      var tweenVars = { time: 0 }

      this.transitionDuration = 2000
      this.easing = TWEEN.Easing.Quartic.InOut

      new TWEEN.Tween(tweenVars)
      .to({time: 1}, this.transitionDuration)
      .onUpdate(function () {
        this.moveCamera(tweenVars.time)
      }.bind(this))
      .easing(this.easing)
      .onComplete(function () {
        this.isAnimating = false
        
        resolve()

      }.bind(this))
      .start()

    })

  }

  moveCamera (time) {
    this.camPos.lerp(this.targetPos, 0.05)
    this.camera.position.copy(this.camPos)
    THREE.Quaternion.slerp(this.fromQuaternion, this.toQuaternion, this.camera.quaternion, time)
  }

  onDocumentMouseMove (event) {
    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.mouseStatic = false

    clearTimeout(this.mouseMoveTimeout)
    this.mouseMoveTimeout = setTimeout(
      () => {
        this.mouseStatic = true
      },
      600
    )
  }

  addLights (scene) {
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

  addObjects () {
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

        let sortedTree

        this.angle = 90.0

        this.X = new THREE.Vector3(1, 0, 0)
        this.Y = new THREE.Vector3(0, 1, 0)
        this.Z = new THREE.Vector3(0, 0, 1)

        this.xPosRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * this.angle)
        this.xNegRotation = new THREE.Quaternion().setFromAxisAngle(this.X, (Math.PI / 180) * -this.angle)
        this.yPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * this.angle)
        this.yNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * -this.angle)
        this.yReverseRotation = new THREE.Quaternion().setFromAxisAngle(this.Y, (Math.PI / 180) * 180)
        this.zPosRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * this.angle)
        this.zNegRotation = new THREE.Quaternion().setFromAxisAngle(this.Z, (Math.PI / 180) * -this.angle)

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

            this.points = []

            let startingPosition = new THREE.Vector3(0, 0, 0)
            let direction = new THREE.Vector3(0, 1, 0)

            this.build(sortedTree, startingPosition, direction, this)

            // Convex Hull
            if (this.points.length > 3) {
              let CVgeometry = new ConvexGeometry(this.points)
              //let CVmesh = new THREE.Mesh(this.templateGeometry, this.crystalMaterial.clone())
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

      let material = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.5
      })

      let curve = new THREE.CatmullRomCurve3(spiralPoints)
      let points = curve.getPoints(spiralPoints.length * 2)
      let geometry = new THREE.Geometry()
      geometry.vertices = points
      let line = new THREE.Line(geometry, material)

      group.translateY(daysIndex * 500)
      line.translateY(daysIndex * 500)

      let lineGroup = new THREE.Group()
      this.scene.add(lineGroup)

      lineGroup.add(line)

      this.lineGroups.push(lineGroup)
    }

    document.getElementById('loading').style.display = 'none'
  }

  build (node, startingPosition, direction, context, visualise) {
    let magnitude = node.level

    let startPosition = startingPosition.clone()
    let endPosition = startPosition.clone().add(direction.clone().multiplyScalar(magnitude))

    this.points.push(startPosition)
    this.points.push(endPosition)

    if (visualise) {
      let path = new THREE.LineCurve3(startPosition, endPosition)
      
      var geometry = new THREE.TubeBufferGeometry(path, 1, (magnitude / 20), 6, false)
      var mesh = new THREE.Mesh(geometry, this.crystalMaterial.clone())

      this.treeGroup.add(mesh)
    }

    let i = 0
    for (var key in node.children) {
      if (node.children.hasOwnProperty(key)) {
        i++

        var childNode = node.children[key]

        if (childNode) {
          if (typeof childNode.children !== 'undefined') {
            let newDirection

            let yaxis
            let yangle

            if (i === 1) {
              newDirection = direction.clone().applyQuaternion(this.xPosRotation)
              yaxis = direction.multiply(this.Y).normalize()
              yangle = (Math.PI / 180) * this.angle
              newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
            } else {
              newDirection = direction.clone().applyQuaternion(this.xNegRotation)
              yaxis = direction.multiply(this.Y).normalize()
              yangle = (Math.PI / 180) * this.angle
              newDirection.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(yaxis, yangle))
            }

            this.build(childNode, endPosition, newDirection, context, visualise)
          }
        }
      }
    }
  }

  setupMaterials () {
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
      opacity: this.crystalOpacity,
      side: THREE.DoubleSide,
      transparent: true,
      envMap: this.bgMap
      // wireframe: true,
    })
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render () {
    
    var vector = new THREE.Vector3(this.mousePos.x, this.mousePos.y, 1)
    vector.unproject(this.camera)
    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())

    this.dayGroups.forEach((group) => {
      var intersects = ray.intersectObjects(group.children)
      if (intersects.length > 0) {
        this.mouseStatic = false
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

    /*if (this.mouseStatic && !this.focussed) {
      this.dayGroups.forEach((group) => {
        group.rotation.y -= 0.0002
      })
      this.lineGroups.forEach((group) => {
        group.rotation.y -= 0.0002
      })
    }*/

    TWEEN.update()

    this.renderer.render(this.scene, this.camera)
    //this.controls.update()
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
