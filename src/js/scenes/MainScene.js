'use strict'

// libs
import * as THREE from 'three'
import { map } from '../../utils/math'
import moment from 'moment'
import EventEmitter from 'eventemitter3'
import _ from 'lodash'

// Global config
import Config from '../Config'

// Audio
import Audio from '../audio/audio'

// API
import API from '../api/btc'

// Custom Materials
import BlockMaterial from '../materials/BlockMaterial/BlockMaterial'
import PointsMaterial from '../materials/PointsMaterial/PointsMaterial'
import MerkleMaterial from '../materials/MerkleMaterial/MerkleMaterial'

const dat = require('dat-gui')

const work = require('webworkify')

const DayBuilderWorker = work(require('../workers/dayBuilder.js'))
const TreeBuilderWorker = work(require('../workers/treeBuilder.js'))
const TWEEN = require('@tweenjs/tween.js')

export default class MainScene extends EventEmitter {
  constructor ({ stage, path = './static/assets/' }) {
    super()
    // this.params = params

    this.cubeCamera = null

    this.api = new API()

    this.allBlocksObj3d = new Map()

    this.stage = stage // reference to the stage

    this.initProperties() // class properties
    this.initState()
    this.addInteraction()

    this.audio = new Audio(this.stage.camera, path)

    this.audio.init()

    this.addEvents()
    this.setupMaterials(path)
    this.initGui()

    this.initReflection()

    this.clock = new THREE.Clock()

    DayBuilderWorker.addEventListener('message', this.addBlocksToStage.bind(this), false)
  }

  // start(){ console.warn("'start' method yet to be implemented") }
  destroy () {
    document.removeEventListener('preUpdate', this.onUpdateBound, false)
    cancelAnimationFrame(this.stage.reqID)
    const scene = this.stage.scene

    // const traverse = (obj, callback) => {
    //   obj.children.forEach(child => traverse(child, callback))
    //   callback(obj)
    // }

    const dispose = function (object) {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (object.material.map) object.material.map.dispose()
        object.material.dispose()
      }
      // if( object.parent ) object.parent.remove(object)
    }

    this.stage.scene.traverse(dispose)
  }

  setDate (date, focusOnBlock = false) {
    if (this.state.currentDate === null) {
      this.state.currentDate = date
    }
    let currentDate = moment(this.state.currentDate)

    let inputDate = moment(date)

    let dayIndex = currentDate.diff(inputDate, 'days')

    // move camera
    let newOffset = this.dayZOffset * dayIndex
    this.stage.targetCameraLookAt.z = newOffset
    this.stage.targetCameraPos.z = newOffset + this.stage.defaultCameraPos.z

    this.state.closestDayIndex = dayIndex

    this.loadBlocks(inputDate.valueOf(), dayIndex, focusOnBlock, dayIndex)
  }

  initReflection () {

  }

  initGui () {
    if (!Config.showGUI) {
      return
    }

    this.gui = new dat.GUI({ width: 300 })
    this.gui.open()

    let param = {
      blockMetalness: 0.9,
      blockRoughness: 0.2,
      blockColor: this.blockMaterialFront.color.getHex(),
      blockEmissive: this.blockMaterialFront.emissive.getHex(),
      blockLightIntesity: 5.0,
      //
      merkleMetalness: 0.9,
      merkleRoughness: 0.1,
      merkleColor: this.merkleMaterial.color.getHex(),
      merkleEmissive: this.merkleMaterial.emissive.getHex(),
      //
      backgroundColor: Config.scene.bgColor,
      vignetteAmount: 1.4,
      cameraFOV: Config.camera.fov
    }

    /**
     * Create a GUI for a material
     */
    const createGuiForMaterial = (mat, title) => {
      let f = this.gui.addFolder(title)
      f.add(mat, 'metalness', 0.0, 1.0).step(0.01)
      f.add(mat, 'roughness', 0.0, 1.0).step(0.01)
      f.add(mat, 'bumpScale', 0.0, 1.0).step(0.01)
      f.add(mat, 'opacity', 0.0, 1.0).step(0.01)
      if (mat.reflectivity) f.add(mat, 'reflectivity', 0.0, 1.0).step(0.01)
      f.addColor({color: mat.color.getHex()}, 'color').onChange(val => mat.color.setHex(val))
      f.addColor({emissive: mat.emissive.getHex()}, 'emissive').onChange(val => mat.emissive.setHex(val))
    }

     /**
     * Gui for Material
     */
    // createGuiForMaterial(this.centralBlockMaterial, 'Central Block Material')
    // createGuiForMaterial(this.blockMaterialFront, 'Block Material')
    // createGuiForMaterial(this.merkleMaterial, 'Merkle Block Material')

    /*
      Light GUI
    */
    let lightFolder = this.gui.addFolder('Lighting')
    lightFolder.add(this.stage.pointLight, 'intensity', 0.0, 10.0).step(0.01)

    /**
     * Scene
     */
    let sceneFolder = this.gui.addFolder('Scene')
    sceneFolder.addColor(param, 'backgroundColor').onChange(function (val) {
      this.stage.scene.background = new THREE.Color(val)
      this.stage.scene.fog.color = new THREE.Color(val)
    }.bind(this))

    sceneFolder.add(param, 'vignetteAmount', 1.0, 2.0).step(0.01).onChange(function (val) {
      this.stage.VignettePass.uniforms.darkness.value = val
    }.bind(this))

    sceneFolder.add(param, 'cameraFOV', 45.0, 100.0).step(0.01).onChange(function (val) {
      this.stage.camera.fov = val
      this.stage.camera.updateProjectionMatrix()
    }.bind(this))
  }

  initState (blocks, currentDate) {
    this.state = {
      frameCount: 0,
      currentDate: null,
      dayGroups: [],
      loadDayRequested: false,
      currentBlock: null,
      currentBlockObject: null,
      view: 'day', // can be 'day' or 'block'
      dayData: [], // all blocks grouped by day
      currentDay: null, // which day is the camera closest to
      blocksToAnimate: [],
      closestDayIndex: 0,
      minCameraZPos: 0,
      maxCameraZPos: 0
    }
  }

  /**
   * Load in blocks for one day
   */
  loadBlocks (date, dayIndex = 0, focusOnBlock = false) {
    this.state.loadDayRequested = true

    // prune days too far away from viewer
    for (const key in this.state.dayData) {
      if (this.state.dayData.hasOwnProperty(key)) {
        if (Math.abs(key - this.state.closestDayIndex) > Config.daysEitherSide) {
          delete this.state.dayData[key]
          this.stage.scene.remove(this.state.dayGroups[key])
          delete this.state.dayGroups[key]
        }
      }
    }

    if (window.Worker) {
      const fromDate = moment(date).startOf('day').toDate()
      const toDate = moment(date).endOf('day').toDate()
      const timeStamp = fromDate.valueOf()

      this.api.getBlocksSince(fromDate, toDate).then((blocks) => {
        const day = {
          blocks: blocks,
          timeStamp: timeStamp
        }

        DayBuilderWorker.postMessage({
          cmd: 'build',
          blocks: day.blocks,
          timeStamp: day.timeStamp,
          dayIndex: dayIndex,
          focusOnBlock: focusOnBlock
        })
      })
    } else {
      console.log('Webworkers not supported. Sad')
    }
  }

  addBlocksToStage ({ data }) {
    // if (typeof e.data.sizes === 'undefined') {
    //   return
    // }

    const that = this

    try {
      // let workerData = e.data
      const { sizes, blockCount, timeStamp, dayIndex, blocks, focusOnBlock } = data
      // let sizes = workerData.sizes
      // let blockCount = workerData.blockCount
      // let timeStamp = workerData.timeStamp
      // let dayIndex = workerData.dayIndex
      // let blocks = workerData.blocks
      // let focusOnBlock = workerData.focusOnBlock

      this.state.dayData[dayIndex] = {
        blocks,
        timeStamp,
        blockMaterialFront: this.blockMaterialFront.clone(), // each day has it's own material
        blockMaterialBack: this.blockMaterialBack.clone(),
        merkleMaterial: this.merkleMaterial.clone(),
        visibleCount: 0
      }

      let group = new THREE.Group()
      this.state.dayGroups[dayIndex] = group
      this.stage.scene.add(group)
      this.blocksToAnimate = []

      for (let index = 0; index < blocks.length; index++) {
        // const size = sizes[index]
        const block = blocks[index]
        const size = block.size

        if (
          size.x === 0 ||
          size.y === 0 ||
          size.z === 0
        ) {
          continue
        }

        // make box size slightly larger than the merkle tree it contains
        /* size.x += 20.0
        size.y += 20.0
        size.z += 20.0 */

        let front = new THREE.Mesh(this.boxGeometry, this.state.dayData[dayIndex].blockMaterialFront)
        let back = new THREE.Mesh(this.boxGeometry, this.state.dayData[dayIndex].blockMaterialBack)
        front.name = 'front'
        back.name = 'back'

        back.renderOrder = ((index - 1 * -dayIndex) + 1000000)
        front.renderOrder = ((index * -dayIndex) + 1000000)

        front.scale.set(size.x, size.y, size.z)
        back.scale.set(size.x, size.y, size.z)

        // align all front faces
        // blockMeshFront.translateZ(-(size.z / 2))
        // blockMeshBack.translateZ(-(size.z / 2))

        let rotation = -(((25 * Math.PI) / 200) * index)

        block.dayIndex = dayIndex

        // blockMeshFront.rotation.z = rotation
        // blockMeshFront.translateY(800 + (index))
        // blockMeshFront.rotation.z += Math.PI / 2
        // blockMeshFront.translateZ((index * 30))

        // blockMeshBack.rotation.z = rotation
        // blockMeshBack.translateY(800 + (index))
        // blockMeshBack.rotation.z += Math.PI / 2
        // blockMeshBack.translateZ((index * 30))
        // lockMeshBack.blockchainData = block

        /* let edgeGeo = new THREE.EdgesGeometry(blockMesh.geometry)
        let wireframe = new THREE.LineSegments(edgeGeo, this.blockMaterialOutline)
        blockMesh.add(wireframe) */

        let blockGroup = new THREE.Group()
        blockGroup.materials = {
          front: this.state.dayData[dayIndex].blockMaterialFront,
          back: this.state.dayData[dayIndex].blockMaterialBack
        }
        blockGroup.front = front
        blockGroup.back = back

        blockGroup.blockchainData = block
        blockGroup.rotation.z = rotation
        blockGroup.translateY(800 + (index))
        blockGroup.rotation.z += Math.PI / 2
        blockGroup.translateZ((index * 30))
        // blockGroup.name = block.hash
        this.allBlocksObj3d.set(block.hash, blockGroup)
        blockGroup.visible = false

        blockGroup.add(back)
        blockGroup.add(front)

        group.add(blockGroup)
      }

      let zPos = this.dayZOffset * dayIndex
      group.translateZ(zPos)
      this.state.dayData[dayIndex].zPos = zPos
      this.state.loadDayRequested = false

      let that = this
      Object.keys(this.state.dayGroups).forEach(function (key) {
        let group = that.state.dayGroups[key]
        that.stage.scene.remove(group)
      })

      Object.keys(this.state.dayGroups).reverse().forEach(function (key) {
        let group = that.state.dayGroups[key]
        that.stage.scene.add(group)
      })

      // if (this.treeGroup) {
      //   that.stage.scene.remove(this.treeGroup)
      //   that.stage.scene.add(this.treeGroup)
      // }

      if (focusOnBlock) {
        for (let index = 0; index < this.state.dayGroups[dayIndex].children.length; index++) {
          const mesh = this.state.dayGroups[dayIndex].children[index]
          if (mesh.blockchainData.hash === this.state.currentHash) {
            this.focusOnBlock(mesh)
            break
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  initProperties () {
    this.boxGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0) // block geo instance
    this.dayZOffset = -5500 // offset for each day on z-axis
    this.treeGroup = null
    this.blockLoadZThreshold = 10000 // how far away from the last block until we load in another?
    this.crystalOpacity = 0.5
    this.pointLightTarget = new THREE.Vector3(0.0, 0.0, 0.0)
    this.cameraBlockFocusDistance = 300
  }

  addInteraction () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = null
  }

  addEvents () {
    this.onUpdateBound = this.onUpdate.bind(this)
    document.addEventListener('preUpdate', this.onUpdateBound, false)
    document.addEventListener('cameraMove', this.onCameraMove.bind(this), false)

    this.selectBlock = new Event('selectBlock')

    this.dayChangedEvent = document.createEvent('CustomEvent')

    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)

    document.addEventListener('touchend', this.onDocumentMouseDown.bind(this), false)

    if (window.Worker) {
      this.treeBuilderWorker = TreeBuilderWorker
      this.treeBuilderWorker.addEventListener('message', this.addTreeToStage.bind(this), false)
    }
  }

  addTreeToStage ({ data }) {
    const { boxCenter, offset, sie, vertices, endPoints, block } = data
    if (!vertices) return

    /*
      Remove existing Trees
    */
    if (this.state.currentBlockObject) {
      this.state.currentBlockObject.remove(this.state.currentBlockObject.tree)
      this.audio.unloadSound()
    }

    // this.treeGroup = new THREE.Group()
    // this.stage.scene.add(this.treeGroup)

    let blockObjectPosition = this.state.currentBlockObject.getWorldPosition().clone()
    // let rotation = this.state.currentBlockObject.getWorldRotation().clone()

    let treeGeo = new THREE.BufferGeometry()
    treeGeo.addAttribute('position', new THREE.BufferAttribute(vertices, 3))
    treeGeo.computeVertexNormals()
    treeGeo.computeFaceNormals()

    /*
      Tree Mesh
    */
    let mesh = new THREE.Mesh(treeGeo, this.state.dayData[block.dayIndex].merkleMaterial)
    mesh.position.add(offset)
    mesh.renderOrder = 10000000
    mesh.onBeforeRender = renderer => renderer.clearDepth()

    /*
      Sound Wave Geometry
    */
    let positions = new THREE.BufferAttribute(endPoints, 3, 1)
    const indices = new Array(endPoints.length / 3).fill(0).map((a, i) => i)

    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', positions)
    geometry.addAttribute('id', new THREE.BufferAttribute(new Float32Array(indices), 1, 1))
    // per instance data

    let pointsMesh = new THREE.Points(geometry, this.pointsMaterial)
    pointsMesh.position.add(offset)

    const blockObj3D = this.allBlocksObj3d.get(block.hash)
    blockObj3D.add(pointsMesh)
    blockObj3D.add(mesh)
    blockObj3D.tree = mesh

    // start animation
    this.merkleMaterial.uniforms.uAnimTime.value = 0.0

    // this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
    // this.treeGroup.position.set(blockObjectPosition.x, blockObjectPosition.y, blockObjectPosition.z)

    this.audio.generateMerkleSound(endPoints, blockObjectPosition, block, this.pointsMaterial, pointsMesh)
  }

  resetDayView () {
    if (this.state.isAnimating) {
      return
    }

    // this.removeTrees()
    this.audio.unloadSound()

    if (this.state.currentBlockObject) {
      this.state.currentBlockObject.remove(this.state.currentBlockObject.tree)
      // this.animateBlockOut(this.state.currentBlockObject.parent.children[0])
      this.animateBlockOut(this.state.currentBlockObject).then(() => {
        this.state.currentBlockObject = null
        this.state.view = 'day'
      })
    } else {
      this.state.view = 'day'
    }
  }

  // removeTrees () {
  //   debugger;
  //   if (typeof this.treeGroup !== 'undefined') {
  //     this.stage.scene.remove(this.treeGroup)
  //     this.treeGroup = null
  //   }
  //   this.audio.unloadSound()
  // }

  onDocumentMouseDown (event) {
    event.preventDefault()
    if (document.querySelector('.dg.ac').contains(event.target)) return
    if (this.state.isAnimating) return

    const { intersected } = this.getIntersections()

    // if( intersected ){
    if (!intersected || intersected === this.state.currentBlockObject) this.resetDayView()
    else this.focusOnBlock(intersected)

    // for (const key in this.state.dayGroups) {
    //   if (this.state.dayGroups.hasOwnProperty(key)) {
    //     const group = this.state.dayGroups[key]

    //     for (let index = 0; index < group.children.length; index++) {
    //       const blockGroup = group.children[index]

    //       let intersects = this.raycaster.intersectObjects(blockGroup.children)
    //       if (intersects.length > 0) {
    //         if (
    //           intersects[0].object === this.state.currentBlockObject ||
    //           intersects[1].object === this.state.currentBlockObject
    //         ) {
    //           this.resetDayView()
    //           return
    //         }

    //         // this.removeTrees()

    //         let blockObject = intersects[0].object
    //         this.focusOnBlock(blockObject)
    //         return
    //       }
    //     }
    //   }
    // }
  }

  createCubeMap (position, dayIndex) {
    if (typeof this.state.dayData[dayIndex] !== 'undefined') {
      this.stage.scene.background = this.bgMap
      this.state.dayData[dayIndex].blockMaterialFront.color.setHex(0xffffff)
      let cubeCamera = new THREE.CubeCamera(100.0, 5000, 1024)
      cubeCamera.position.set(position.x, position.y, position.z)
      cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter
      cubeCamera.update(this.stage.renderer, this.stage.scene)

      this.state.dayData[dayIndex].blockMaterialFront.envMap = cubeCamera.renderTarget.texture
      this.state.dayData[dayIndex].blockMaterialBack.envMap = cubeCamera.renderTarget.texture
      this.state.dayData[dayIndex].merkleMaterial.envMap = cubeCamera.renderTarget.texture

      this.stage.scene.background = new THREE.Color(Config.scene.bgColor)
    }
  }

  animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      this.state.isAnimating = true
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

      // let tweenVars = {
      //   blockPosX: fromPos.x,
      //   blockPosY: fromPos.y,
      //   time: 0
      // }

      // let that = this

      new TWEEN.Tween(blockObject.position)
        .to(toPos, duration)
        .easing(this.easing)
        .onComplete(() => {
          this.state.isAnimating = false
          resolve()
        })
        .start()

      new TWEEN.Tween({time: 0})
        .to({time: 1}, duration)
        .onUpdate(function ({ time }) {
          // slerp to target rotation
          THREE.Quaternion.slerp(fromQuaternion, toQuaternion, moveQuaternion, time)
          blockObject.quaternion.set(moveQuaternion.x, moveQuaternion.y, moveQuaternion.z, moveQuaternion.w)
        })
        .easing(this.easing)
        .start()
    })
  }

  animateBlockOut (blockObject) {
    return new Promise((resolve, reject) => {
      if (blockObject) {
        let fromPos = blockObject.position.clone()
        let toPos = blockObject.initialPosition.clone()

        let targetRotation = blockObject.initialRotation.clone()
        let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
        let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

        this.animateBlock(
          blockObject,
          fromPos,
          fromQuaternion,
          toPos,
          toQuaternion,
          500
        ).then(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  animateBlockIn (blockObject) {
    return new Promise((resolve, reject) => {
      let blockPos = blockObject.position.clone()

      let targetRotation = new THREE.Euler(0.0, 0.0, 0.0)
      let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
      let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

      blockObject.initialPosition = blockObject.position.clone()
      blockObject.initialRotation = blockObject.rotation.clone()

      // focus camera on block
      let blockWorldPos = blockObject.getWorldPosition()

      this.stage.targetCameraLookAt.z = blockWorldPos.z
      this.stage.targetCameraPos.z = blockWorldPos.z + this.cameraBlockFocusDistance
      const toPos = new THREE.Vector3()
      toPos.z = blockObject.position.z

      this.animateBlock(
        blockObject,
        blockPos,
        fromQuaternion,
        // this.stage.targetCameraLookAt,
        toPos,
        toQuaternion,
        2000,
        true
      ).then(() => {
        resolve()
      })
    })
  }

  buildTree (blockObject) {
    let block = blockObject.blockchainData
    if (this.state.currentBlockObject) {
      this.state.currentBlockObject.remove(this.state.currentBlockObject.tree)
      this.audio.unloadSound()
    }
    this.state.currentBlock = block
    // this.removeTrees()

    this.api.getTransactionsForBlock(block.hash)
      .then((transactions) => {
        block.transactions = transactions
        console.log('Building Tree for', block.hash)
        this.treeBuilderWorker.postMessage(
          {
            cmd: 'build',
            block: block
          }
        )
      }).catch((error) => {
        console.log(error)
      })
  }

  setupMaterials (path) {
    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    let map = new THREE.TextureLoader().load(path + 'textures/Marble068_COL_1K.jpg')
    let metalnessMap = new THREE.TextureLoader().load(path + 'textures/Marble068_REFL_1K.jpg')
    let roughnessMap = new THREE.TextureLoader().load(path + 'textures/Marble068_GLOSS_1K.jpg')
    let glossMap = new THREE.TextureLoader().load(path + 'textures/Marble068_GLOSS_1K.jpg')
    let normalMap = new THREE.TextureLoader().load(path + 'textures/Marble068_NRM_1K.jpg')
    let bumpMap = new THREE.TextureLoader().load(path + 'textures/IceBlock008_OVERLAY_1K.jpg')
    this.bgMap = new THREE.CubeTextureLoader().setPath(path + 'textures/').load(this.cubeMapUrls)
    // this.stage.scene.background = this.bgMap

    this.blockMaterialBack = new BlockMaterial({
      color: 0xeeeeee,
      emissive: 0x000000,
      metalness: 0.9,
      roughness: 0.2,
      opacity: 0.5,
      transparent: true,
      side: THREE.BackSide,
      envMap: this.bgMap,
      bumpMap,
      bumpScale: 0.03
    })

    this.blockMaterialFront = new BlockMaterial({
      color: 0xeeeeee,
      emissive: 0x330000,
      metalness: 0.9,
      roughness: 0.2,
      opacity: 0.5,
      transparent: true,
      side: THREE.FrontSide,
      envMap: this.bgMap,
      bumpMap,
      bumpScale: 0.03
    })

    this.centralBlockMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x333333,
      metalness: 0.8,
      roughness: 0.2,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap,
      envMapIntensity: 2.3,
      // bumpMap,
      // bumpScale: 0.03,
      roughnessMap,
      metalnessMap,
      normalMap,
      premultipliedAlpha: true
      // map
    })

    this.blockMaterialOutline = new THREE.LineBasicMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.5
    })

    this.blockMaterialHighlight = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      metalness: 0.9,
      roughness: 0.2,
      opacity: 0.8,
      transparent: true,
      side: THREE.DoubleSide
    })

    this.merkleMaterial = new MerkleMaterial({
      color: 0xffffff,
      emissive: 0x444444,
      flatShading: true,
      metalness: 0.8,
      roughness: 0.3,
      opacity: 0.3,
      /* depthTest: false,
      depthWrite: false, */
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })

    this.pointsMaterial = new PointsMaterial({
      color: 0xfff900,
      size: 30.0,
      // alphaTest: 0.0001,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 1.0,
      depthTest: false
      // depthWrite: false,
      // vertexColors: THREE.VertexColors
    })
  }

  getIntersections () {
    var vector = new THREE.Vector3(this.stage.targetMousePos.x, this.stage.targetMousePos.y, 0.5)
    vector.unproject(this.stage.camera)
    var raycaster = new THREE.Raycaster(this.stage.camera.position, vector.sub(this.stage.camera.position).normalize())

    const allBlocks = Array.from(this.allBlocksObj3d.values())

    const boxes = allBlocks
      // .filter(box => box !== this.state.currentBlockObject)
      .map(group => group.children[0])
      .filter(box => box) // Filter to only those with non null refs

    const intersections = raycaster.intersectObjects(boxes, false)
    const intersected = intersections[0] && intersections[0].object.parent

    return { intersections, allBlocks, intersected }
  }

  checkMouseIntersection () {
    const { intersected, allBlocks } = this.getIntersections()
    /*
      Doing own intersection test as we don't need it recursive or to check front/back objects
    */
    // const intersections = Array.from(this.state.dayGroups)
      // .map(group => raycase.intersectObject(group.children[0], false ))
      // .sort(( a, b ) => a.distance - b.distance)

    // // const nearestIntersectedBlock = intersections[0]

    // For Each block
    allBlocks.forEach(block => {
      // Set the front/back materials to their default
      // block.children.forEach((child, i) => child.material = block.materials[i])
      block.front.material = block.materials.front
      block.back.material = block.materials.back
    })

    /*
      If an intersection occured but not on the selected block, set a highlight
    */
    if (intersected && intersected !== this.state.currentBlockObject) {
      intersected.children.forEach(child => child.material = this.blockMaterialHighlight)
      this.pointLightTarget = intersected.position
    }

    // for (const dayIndex in this.state.dayGroups) {
    //   if (this.state.dayGroups.hasOwnProperty(dayIndex)) {
    //     const group = this.state.dayGroups[dayIndex]

    //     for (let index = 0; index < group.children.length; index++) {
    //       const blockGroup = group.children[index]

    //       let intersects = ray.intersectObjects(blockGroup.children)
    //       if (intersects.length > 0) {
    //         if ( intersects[0].object !== this.intersected && intersects[0].object !== this.state.currentBlockObject ) {
    //           if ( this.intersected && typeof this.state.dayData[dayIndex] !== 'undefined' // this.intersected.material.uuid !== this.centralBlockMaterial.uuid && ) {
    //             this.intersected.material = this.state.dayData[dayIndex].blockMaterialFront
    //           }

    //           this.intersected = intersects[0].object

    //           if (this.intersected.material.uuid !== this.centralBlockMaterial.uuid) {
    //             this.intersected.material = this.blockMaterialHighlight
    //           }

    //           const blockWorldPos = this.intersected.getWorldPosition()

    //           this.pointLightTarget = blockWorldPos
    //         }
    //         return
    //       } else {
    //         if (
    //         this.intersected &&
    //         // this.intersected.material.uuid !== this.centralBlockMaterial.uuid &&
    //         typeof this.state.dayData[dayIndex] !== 'undefined'
    //       ) {
    //           this.intersected.material = this.state.dayData[dayIndex].blockMaterialFront
    //         }
    //         this.intersected = null
    //       }
    //     }
    //   }
    // }
  }

  onCameraMove () {
    if (typeof this.state.dayData[0] === 'undefined') {
      return
    }

    // which day are we closest to?
    let closest = Number.MAX_VALUE
    let closestDayIndex = 0

    for (const dayIndex in this.state.dayData) {
      if (this.state.dayData.hasOwnProperty(dayIndex)) {
        const day = this.state.dayData[dayIndex]
        let dist = Math.abs(day.zPos - (this.stage.camera.position.z) + 1000.0)
        if (dist < closest) {
          closest = dist
          closestDayIndex = parseInt(dayIndex)
        }
      }
    }

    // bubble up event
    if (this.state.currentDay === null) {
      const blocks = this.state.dayData[closestDayIndex].blocks
      const time = blocks[0].time * 1000
      const date = moment(time).startOf('day').toDate()
      const day = {
        date,
        input: blocks.reduce((a, b) => a + b.input, 0),
        output: blocks.reduce((a, b) => a + b.output, 0),
        fee: blocks.reduce((a, b) => a + b.fee, 0)
      }

      this.emit('firstDayLoaded')
      this.emit('dayChanged', day)
    } else {
      if (this.state.closestDayIndex !== closestDayIndex) {
        this.emit('dayChanged', day)
      }
    }

    this.state.currentDay = this.state.dayData[closestDayIndex]

    this.state.closestDayIndex = closestDayIndex

    if (
      this.state.loadDayRequested === false &&
      typeof this.state.currentDay !== 'undefined'
    ) {
      for (let index = 0; index <= Config.daysEitherSide; index++) {
        let dayLoading = false

        for (let innerIndex = 0; innerIndex <= 1; innerIndex++) {
          let signedIndex = parseFloat(index)
          if (innerIndex === 1 && index !== 0) {
            signedIndex = index * -1
          }

          if (typeof this.state.dayData[closestDayIndex + signedIndex] === 'undefined') {
            let day = moment(this.state.currentDay.timeStamp).subtract(signedIndex, 'day').format('YYYY-MM-DD')
            this.loadDay(day, closestDayIndex, signedIndex)
            dayLoading = true
            break
          }
        }

        if (dayLoading) {
          break
        }
      }
    }

    /* this.state.hashRate = this.state.currentDay.hashRate
    this.state.audioFreqCutoff = map(this.state.hashRate, 0.0, 20000000.0, 50.0, 15000) // TODO: set upper bound to max hashrate from blockchain.info

    console.log(this.state.audioFreqCutoff) */

   // this.state.audioFreqCutoff = 20000

    // this.audio.setAmbienceFilterCutoff(this.state.audioFreqCutoff)
  }

  loadDay (day, closestDayIndex, index) {
    this.loadBlocks(day, (closestDayIndex + index))
    let latestDayIndex = Number.MAX_SAFE_INTEGER
    let earliestDayIndex = 0

    for (const key in this.state.dayData) {
      if (this.state.dayData.hasOwnProperty(key)) {
        const data = this.state.dayData[key]
        if (data.blocks.length > 0) {
          latestDayIndex = Math.min(latestDayIndex, parseInt(key))
          earliestDayIndex = Math.max(earliestDayIndex, parseInt(key))
        }
      }
    }

    if (
      typeof this.state.dayData[latestDayIndex] !== 'undefined' &&
      typeof this.state.dayData[earliestDayIndex] !== 'undefined'
    ) {
      this.state.maxCameraZPos = this.state.dayData[latestDayIndex].zPos + this.stage.defaultCameraPos.z
      this.state.minCameraZPos = this.state.dayData[earliestDayIndex].zPos + 1000.0
    }
  }

  loadBlock (hash = null) {
    this.api.getBlock(hash).then((block) => {
      let blockDay = moment(block.time * 1000).format('YYYY-MM-DD')
      this.state.currentHash = block.hash

      this.setDate(blockDay, true)
    })
  }

  focusOnBlock (blockGroup) {
    // let blockGroup = blockObject//.parent
    blockGroup.visible = true
    this.state.view = 'block'

    // if (this.state.currentBlockObject) {
    //   this.animateBlockOut(this.state.currentBlockObject/*.parent.children[0]*/)
    // }
    this.animateBlockOut(this.state.currentBlockObject).then(() => {
      // this.animateBlockIn(blockGroup.children[0])
      if (this.state.currentBlockObject) {
        this.state.currentBlockObject.remove(this.state.currentBlockObject.tree)
        this.audio.unloadSound()
      }

      this.state.currentBlockObject = blockGroup

      this.animateBlockIn(this.state.currentBlockObject).then(() => {
        this.buildTree(this.state.currentBlockObject)
        this.state.isAnimating = false
        // console.log('BLOCK SELECTED')
        const block = this.state.currentBlockObject.blockchainData
        this.emit('blockSelected', { ...block, time: new Date(block.time * 1000)})
      })
    })
  }

  animateTree () {
    // if (this.state.view === 'block') {
    //   if (this.treeGroup) {
    //     this.state.currentBlockObject.rotation.y += 0.001
    //     this.state.currentBlockObject.parent.children[0].rotation.y += 0.001
    //     this.treeGroup.rotation.y += 0.001
    //   }
    // }
  }

  animateBlockVisibility () {
    for (const dayIndex in this.state.dayGroups) {
      if (this.state.dayGroups.hasOwnProperty(dayIndex)) {
        const dayGroup = this.state.dayGroups[dayIndex]
        if (typeof this.state.dayData[dayIndex] !== 'undefined') {
          if (this.state.dayData[dayIndex].visibleCount < dayGroup.children.length) {
            for (let meshIndex = 0; meshIndex < dayGroup.children.length; meshIndex++) {
              const mesh = dayGroup.children[meshIndex]
              if (mesh.visible === false) {
                mesh.visible = true
                this.state.dayData[dayIndex].visibleCount++
                break
              }
            }
            if (this.state.dayData[dayIndex].visibleCount === dayGroup.children.length) {
              // take a cube map of blocks once all are visible
              this.createCubeMap(
                dayGroup.getWorldPosition(),
                dayIndex
              )
            }
          }
        }
      }
    }
  }

  updateLights () {
    this.stage.pointLight.position.lerp(this.pointLightTarget, 0.5)
  }

  onUpdate () {
    this.state.frameCount++
    TWEEN.update()
    this.updateLights()
    this.checkMouseIntersection()
    this.animateTree()
    this.animateBlockVisibility()

    this.uTime = this.clock.getElapsedTime()

    this.pointsMaterial.uniforms.uTime.value = this.uTime

    if (this.merkleMaterial) {
      this.merkleMaterial.uniforms.uAnimTime.value += 0.01
      this.merkleMaterial.uniforms.uTime.value = this.uTime
    }

    if (
      typeof this.audio.pointColors !== 'undefined' &&
      this.audio.pointColors.length > 0
    ) {
      let pointColors = Uint8Array.from(this.audio.pointColors)
      let pointColorsTexture = new THREE.DataTexture(pointColors, pointColors.length / 3, 1, THREE.RGBFormat)

      pointColorsTexture.minFilter = THREE.NearestFilter
      pointColorsTexture.magFilter = THREE.NearestFilter

      pointColorsTexture.needsUpdate = true

      this.pointsMaterial.uniforms.uColor.value = pointColorsTexture
      this.pointsMaterial.uniforms.pointCount.value = pointColors.length / 3
    }
  }
}
