'use strict'

// libs
import * as THREE from 'three'
import { map } from '../../utils/math'
import moment from 'moment'
import EventEmitter from 'eventemitter3'

// Global config
import Config from '../Config'

// Audio
import Audio from '../audio/audio'

// API
import {getBlocksSince, getTransactionsForBlock, getBlock} from '../api/btc'

// Custom Materials
import BlockMaterial from '../materials/BlockMaterial/BlockMaterial'
import PointsMaterial from '../materials/PointsMaterial/PointsMaterial'
import MerkleMaterial from '../materials/MerkleMaterial/MerkleMaterial'

const dat = require('dat-gui')
const work = require('webworkify-webpack')
const DayBuilderWorker = work(require.resolve('../workers/dayBuilder.js'))
const TreeBuilderWorker = work(require.resolve('../workers/treeBuilder.js'))
const TWEEN = require('@tweenjs/tween.js')

export default class MainScene extends EventEmitter {
  constructor ({ stage, cubeMap, textures, earliestDate, latestDate, path = './static/assets/' }) {
    super()
    // this.params = params

    this.cubeCamera = null
    this.cubeMap = cubeMap

    this.path = path
    this.font = null
    this.fontLoader = new THREE.FontLoader()

    this.allBlocksObj3d = new Map()
    this.allBlocks = new Map()
    this.lastHoveredBlock = null
    this.earliestDate = earliestDate
    this.latestDate = latestDate

    this.stage = stage // reference to the stage

    this.initProperties() // class properties
    this.initState()
    this.addInteraction()

    this.audio = new Audio(this.stage.camera, path)

    this.audio.init()

    this.addEvents()

    this.setupMaterials(textures, cubeMap)

    if (process.env.NODE_ENV !== 'production') {
      /*
        Dead code elimination. Only create the GUI if in dev mode
        See: https://webpack.js.org/guides/tree-shaking/
      */
      this.initGui()
    }

    this.clock = new THREE.Clock()

    DayBuilderWorker.addEventListener('message', this.addBlocksToStage.bind(this), false)
  }

  // start(){ console.warn("'start' method yet to be implemented") }
  destroy () {
    document.removeEventListener('preUpdate', this.onUpdateBound, false)
    cancelAnimationFrame(this.stage.reqID)
    // const scene = this.stage.scene

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
    if (date < this.earliestDate) return Promise.reject('Requested date is before the earliest available block date of ' + moment(this.earlestDate).format('MMM Do YYYY'))
    if (date > this.latestDate) return Promise.reject('Requested date is after the lateset available block date of ' + moment(this.latestDate).format('MMM Do YYYY'))

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

    return this.loadBlocks(inputDate.valueOf(), dayIndex, focusOnBlock, dayIndex)
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

      getBlocksSince(fromDate, toDate).then((blocks) => {
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
    try {
      // let workerData = e.data
      const { sizes, blockCount, timeStamp, dayIndex, blocks, focusOnBlock } = data

      this.state.dayData[dayIndex] = {
        blocks,
        timeStamp,
        blockMaterialFront: this.blockMaterialFront.clone(), // each day has it's own material
        blockMaterialBack: this.blockMaterialBack.clone(),
        // merkleMaterial: this.merkleMaterial.clone(),
        visibleCount: 0
      }

      const displayDate = moment(timeStamp).startOf('day').format('MMM Do YYYY').toUpperCase()

      let group = new THREE.Group()
      this.state.dayGroups[dayIndex] = group
      this.stage.scene.add(group)

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
        front.translateZ(-(size.z / 2))
        back.translateZ(-(size.z / 2))

        let rotation = -(((25 * Math.PI) / 200) * index)

        block.dayIndex = dayIndex

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

        this.allBlocksObj3d.set(block.hash, blockGroup)
        this.allBlocks.set(blockGroup, block)
        blockGroup.visible = false

        blockGroup.add(back)
        blockGroup.add(front)

        group.add(blockGroup)
      }

      let circleGroup = new THREE.Group()
      let circleGeometry = new THREE.CircleGeometry(900, 128)
      circleGeometry.vertices.shift()
      let circleMesh = new THREE.LineLoop(circleGeometry, this.circleMat)
      circleGroup.add(circleMesh)

      let circleGeometryOuter = new THREE.CircleGeometry(920, 128)
      circleGeometryOuter.vertices.shift()
      let circleMeshOuter = new THREE.LineLoop(circleGeometryOuter, this.circleMatOuter)
      circleGroup.add(circleMeshOuter)

      const addText = function () {
        let textGeometry = new THREE.TextGeometry(displayDate, {
          font: this.font,
          size: 30,
          height: 1,
          curveSegments: 12,
          bevelEnabled: false
        })

        let textMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7
        })

        let textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.position.x = -840.0
        circleGroup.add(textMesh)
      }.bind(this)

      if (!this.font) {
        this.fontLoader.load(this.path + 'fonts/helvetiker_regular.typeface.json', function (font) {
          this.font = font
          addText()
        }.bind(this))
      } else {
        addText()
      }

      this.stage.scene.add(circleGroup)
      let zPos = this.dayZOffset * dayIndex
      group.translateZ(zPos)

      circleGroup.position.z = zPos + this.dayZOffset - 550

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
    this.stage.canvas.addEventListener('click', this.onDocumentMouseDown.bind(this), false)

    if (window.Worker) {
      this.treeBuilderWorker = TreeBuilderWorker
      this.treeBuilderWorker.addEventListener('message', this.addTreeToStage.bind(this), false)
    }
  }

  setSize (w, h) {
    this.stage.resize(w, h)
  }

  addTreeToStage ({ data }) {
    const { boxCenter, offset, size, vertices, endPoints, block } = data
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
    let merkleMaterial = this.merkleMaterial.clone()
    let mesh = new THREE.Mesh(treeGeo, merkleMaterial)
    mesh.position.add(offset)
    // mesh.renderOrder = 10000000
    // mesh.onBeforeRender = renderer => renderer.clearDepth()

    // align with box
    mesh.translateZ(-(size.z / 2))

    /*
      Sound Wave Geometry
    */
    let positions = new THREE.BufferAttribute(endPoints, 3, 1)
    // const indices = new Array(endPoints.length / 3).fill(0).map((a, i) => i)

    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', positions)
    geometry.addAttribute('soundData', new THREE.BufferAttribute(new Float32Array(endPoints.length), 3))

    // per instance data
    this.pointsMesh = new THREE.Points(geometry, this.pointsMaterial)
    this.pointsMesh.position.add(offset)
    this.pointsMesh.translateZ(-(size.z / 2))

    const blockObj3D = this.allBlocksObj3d.get(block.hash)
    blockObj3D.add(this.pointsMesh)
    blockObj3D.add(mesh)
    blockObj3D.tree = mesh

    // start animation
    merkleMaterial.uniforms.uAnimTime.value = 0.0

    this.audio.generateMerkleSound(endPoints, blockObjectPosition, block, this.pointsMaterial, this.pointsMesh)
  }

  resetDayView () {
    if (this.state.isAnimating) {
      return
    }

    this.emit('blockUnselected')

    // this.removeTrees()
    this.audio.unloadSound()

    if (this.state.currentBlockObject) {
      this.state.currentBlockObject.remove(this.state.currentBlockObject.tree)
      this.animateBlockOut(this.state.currentBlockObject).then(() => {
        this.state.currentBlock = null
        this.state.currentBlockObject = null
      })
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
    if (this.state.isAnimating) return

    const { intersected } = this.getIntersections()

    if (intersected && intersected !== this.state.currentBlockObject) this.focusOnBlock(intersected)
    else if (this.state.currentBlockObject) this.resetDayView()
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
      // this.state.dayData[dayIndex].merkleMaterial.envMap = cubeCamera.renderTarget.texture

      this.stage.scene.background = new THREE.Color(Config.scene.bgColor)
    }
  }

  animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      this.state.isAnimating = true
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

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

    getTransactionsForBlock(block.hash)
      .then((transactions) => {
        block.transactions = transactions
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

  setupMaterials (textures, cubeTextures) {
    this.bgMap = new THREE.CubeTexture(cubeTextures)
    this.bgMap.needsUpdate = true
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
      ...textures,
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
      ...textures,
      bumpScale: 0.03
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
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })

    this.pointsMaterial = new PointsMaterial({
      color: 0xfff900,
      size: 100.0,
      // alphaTest: 0.0001,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 1.0,
      depthTest: false,
      depthWrite: false
      // vertexColors: THREE.VertexColors
    })

    this.circleMat = new THREE.LineBasicMaterial({
      color: 0xffffff
    })

    this.circleMatOuter = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    })
  }

  getIntersections () {
    var vector = new THREE.Vector3(this.stage.targetMousePos.x, this.stage.targetMousePos.y, 0.5)
    vector.unproject(this.stage.camera)
    this.raycaster.set(this.stage.camera.position, vector.sub(this.stage.camera.position).normalize())

    const allBlocks = Array.from(this.allBlocksObj3d.values())

    const boxes = allBlocks
      // .filter(box => box !== this.state.currentBlockObject)
      .map(group => group.children[0])
      .filter(box => box && box.visible) // Filter to only those with non null refs

    const intersections = this.raycaster.intersectObjects(boxes, false)
    const intersected = intersections[0] && intersections[0].object.parent

    return { intersections, allBlocks, intersected }
  }

  checkMouseIntersection () {
    const { intersected, allBlocks } = this.getIntersections()

    // For Each block
    allBlocks.forEach(block => {
      block.front.material = block.materials.front
      block.back.material = block.materials.back
    })

    /*
      If an intersection occured but not on the selected block, set a highlight
    */
    if (intersected && intersected !== this.state.currentBlockObject) {
      intersected.children.forEach(child => child.material = this.blockMaterialHighlight)
      if (intersected !== this.lastHoveredBlock) {
        this.lastHoveredBlock = intersected
        this.emit('blockHovered', this.allBlocks.get(intersected))
      }
      this.pointLightTarget = intersected.position
    }
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

    const blocks = this.state.dayData[closestDayIndex].blocks
    const time = blocks[0].time * 1000
    const date = moment(time).startOf('day').toDate()
    const day = {
      date,
      input: blocks.reduce((a, b) => a + b.input, 0),
      output: blocks.reduce((a, b) => a + b.output, 0),
      fee: blocks.reduce((a, b) => a + b.fee, 0)
    }

    // bubble up event
    if (this.state.currentDay === null) {
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

  async goToBlock (blockhash) {
    if (!blockhash) return
    const existingBlock = Array.from(this.allBlocks.values()).find(({ hash }) => hash === blockhash)
    let block = existingBlock
    if (!existingBlock) block = await getBlock(blockhash)
    let day = moment(block.time * 1000).toDate()// .format('YYYY-MM-DD')
    this.state.currentHash = block.hash
    this.setDate(day, true)
  }

  focusOnBlock (blockGroup) {
    // let blockGroup = blockObject//.parent
    blockGroup.visible = true

    this.animateBlockOut(this.state.currentBlockObject).then(() => {
      // this.animateBlockIn(blockGroup.children[0])
      if (this.state.currentBlockObject) {
        this.state.currentBlockObject.remove(this.state.currentBlockObject.tree)
        this.audio.unloadSound()
      }

      this.state.currentBlockObject = blockGroup

      this.buildTree(this.state.currentBlockObject)
      this.animateBlockIn(this.state.currentBlockObject).then(() => {
        this.state.isAnimating = false
        // console.log('BLOCK SELECTED')
        const block = this.state.currentBlockObject.blockchainData
        this.emit('blockSelected', {...block, time: new Date(block.time * 1000)})
      })
    })
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
      let pointColors = Float32Array.from(this.audio.pointColors)
      this.pointsMesh.geometry.attributes.soundData.array.set(pointColors)
      this.pointsMesh.geometry.attributes.soundData.needsUpdate = true
      // let pointColorsTexture = new THREE.DataTexture(pointColors, pointColors.length / 3, 1, THREE.RGBFormat)

      // pointColorsTexture.minFilter = THREE.NearestFilter
      // pointColorsTexture.magFilter = THREE.NearestFilter
      // pointColorsTexture.needsUpdate = true

      // this.pointsMaterial.uniforms.uColor.value = pointColorsTexture
      // this.pointsMaterial.uniforms.pointCount.value = pointColors.length / 3
    }
  }
}
