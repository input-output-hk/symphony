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
import {getBlocksOnDay, getTransactionsForBlock, getBlock} from '../api/btc'

// Custom Materials
import BlockMaterial from '../materials/BlockMaterial/BlockMaterial'
import PointsMaterial from '../materials/PointsMaterial/PointsMaterial'
import MerkleMaterial from '../materials/MerkleMaterial/MerkleMaterial'

const dat = require('dat-gui')
import DayBuilderWorker from '../workers/day.worker.js'
import TreeBuilderWorker from '../workers/tree.worker.js'
const TWEEN = require('@tweenjs/tween.js')
const msInADay = 86400000
const dayZOffset = -5500 // offset for each day on z-axis
const intersection = (a, b) => new Set( [...a].filter(x => b.has(x)))
const difference = (a, b) => new Set([...a].filter(x => !b.has(x)))
const groupBy = (arr, key) => arr.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x)
    return rv;
  }, {})

const generateBlockGeometries = blocks => {
  return new Promise((resolve, reject) => {
    const worker = new DayBuilderWorker()
    worker.onmessage = ({ data }) => {
      resolve(data.blocks)
      worker.terminate()
    }
    worker.postMessage({ cmd: 'build', blocks })
  })
}

const generateTreeGeometry = block => {
  return new Promise((resolve, reject) => {
    const worker = new TreeBuilderWorker()
    worker.onmessage = ({ data }) => {
      resolve(data.blocks)
      this.terminate()
    }
    worker.postMessage({ cmd: 'build', block })
  })
}
  


export default class MainScene extends EventEmitter {
  constructor ({ stage, cubeMap, textures, earliestDate, latestDate, path = './static/assets/' }) {
    super()
    this.cubeCamera = null
    this.dayObj3Ds = new THREE.Group()
    this.cubeMap = cubeMap
    this.clock = new THREE.Clock()
    this.materials = new Map()
    this.days = new Map()
    this.allBlocksObj3d = new Map()
    this.allBlocks = new Map()
    this.lastHoveredBlock = null
    this.earliestDate = earliestDate
    this.latestDate = latestDate
    this.raycaster = new THREE.Raycaster()
    this.stage = stage // reference to the stage
    this.initProperties() // class properties
    this.initState()
    
    this.audio = new Audio(this.stage.camera, path)
    this.audio.init()
    this.addEvents()
    this.setupMaterials(textures, cubeMap)

    this.stage.scene.add(this.dayObj3Ds)


    if (process.env.NODE_ENV !== 'production') {

      /*
        Dead code elimination. Only create the GUI if in dev mode
        See: https://webpack.js.org/guides/tree-shaking/
      */
  
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    this.stage.camera.position.z = this.getPositionForDate(today) - 1000
    this.stage.cameraPos.z = this.stage.camera.position.z
    this.stage.targetCameraPos.z = this.stage.cameraPos.z
    this.setDate(today)
  }

  /*
    Groups blocks by days and adds them
  */
  addDay(blocks){
    if(!blocks || blocks.length === 0) return
    const obj3ds = blocks.map(block => this.addBlock(block))
      .filter(block => block) // Remove null blocks
    const day = blocks[0].day
    const group = this.getGroupForDay(day)
    group.position.z = this.getPositionForDate(day)
    console.log("LOADING DAY :", new Date(day))
    group.add(...obj3ds)

    /*
      TODO: implmenent a better depth sorting algo
    */
    const dayIndex = group.parent.children.indexOf(group) - (Config.daysEitherSide * 0.5)
    obj3ds.forEach((obj3d, i) => {
      obj3d.back.renderOrder = ((i - 1 * -dayIndex) + 1000000)
      obj3d.front.renderOrder = ((i * -dayIndex) + 1000000)

      obj3d.rotation.z = -(((25 * Math.PI) / 200) * i)
      obj3d.translateY(800 + i)
      obj3d.rotation.z += Math.PI / 2
      obj3d.translateZ(i * 30)

    })

    return blocks
  }
  
  addBlock(block){
    const {day, size, time} = block
    
    if (!day) return
    if (size.x === 0 || size.y === 0 || size.z === 0) return
    const materials = this.getMaterialsForDay(day)

    let front = new THREE.Mesh(this.boxGeometry, materials.front)
    let back = new THREE.Mesh(this.boxGeometry, materials.back)
    front.name = 'front'
    back.name = 'back'
    front.scale.copy(size)
    back.scale.copy(size)

    // align all front faces
    // front.translateZ(-(size.z / 2))
    // back.translateZ(-(size.z / 2))

    /* let edgeGeo = new THREE.EdgesGeometry(blockMesh.geometry)
    let wireframe = new THREE.LineSegments(edgeGeo, this.blockMaterialOutline)
    blockMesh.add(wireframe) */

    let group = new THREE.Group()
    group.materials = materials
    group.front = front
    group.back = back
    group.block = block
    // blockGroup.blockchainData = block
    
    // blockGroup.name = block.hash
    this.allBlocksObj3d.set(block.hash, group)
    // this.allBlocks.set(blockGroup, block)
    // group.visible = false

    group.add(back, front)
    return group
  }

  getGroupForDay(day){
    if(!this.days.has(day)){
      const group = new THREE.Group() 
      group.day = new Date(day)
      this.days.set(day, group)
      this.dayObj3Ds.add(group)      
    }
    return this.days.get(day)
  }

  getMaterialsForDay(day){
    const materials = this.materials.get(day) || {
      front: this.blockMaterialFront.clone(),
      back: this.blockMaterialFront.clone(),
      merkle: this.merkleMaterial
    }
    this.materials.set(day, materials)
    return materials
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

  /*
    Moves the camera to a new date in the block chain and loads data
  */
  setDate(date){
    this.stage.targetCameraPos.z = this.getPositionForDate(date) - 1000
    return this.loadDate(date)
  }

  /*
    loads new blocks around a date
  */
  async loadDate (date) {

    if( date < this.earliestDate ) return Promise.reject('Requested date is before the earliest available block date of ' + moment(this.earlestDate).format("MMM Do YYYY"))
    if( date > this.latestDate ) return Promise.reject('Requested date is after the lateset available block date of ' + moment(this.latestDate).format("MMM Do YYYY"))

    date = new Date(new Date(date).setHours(0, 0, 0, 0))
    if (Math.abs(this.date - date) < msInADay) return
    this.date = date

    const numDaysToLoad = Config.daysEitherSide * 2 + 1
    const days = new Array(numDaysToLoad).fill(0).map((v, i) => {
      return new Date(this.date).setDate(this.date.getDate()- (i - Config.daysEitherSide)).valueOf()
    })

    const daysToDisplay = new Set(days)
    const daysAlreadyLoaded = new Set(this.days.keys())
    const daysToRemove = difference(daysAlreadyLoaded, daysToDisplay)
    const daysToLoad = difference(daysToDisplay, daysAlreadyLoaded)

    // const loadBlocksForDay = day => getBlocksOnDay(day)
    //   .then(blocks => blocks.map(block => {
    //     // const { size } = GenerateBlockGeometry(block, false)   
    //     return { ...block, size }
    //   }))
      // .then(this.addDays)
      // DayBuilderWorker.postMessage({ cmd: 'build', blocks })

    /*
      Remove unused days
    */
    Array.from(daysToRemove).map(day => {
      const group = this.getGroupForDay(day)
      group.children.forEach(({ block }) => this.allBlocksObj3d.delete(block.hash))
      this.dayObj3Ds.remove(group)
      this.days.delete(day)
    })

    // /*
    //   TODO: Need to sum all values for the day and send this as a value
    // */
    this.emit('dayChanged')
    this.date = date

    /*
      This load
    */

    const isWithinAvailableDates = day => day < this.latestDate && day > this.earliestDate
    const blocksGroupedByDay = Array.from(daysToLoad)
      .filter(isWithinAvailableDates)
      .map(day => getBlocksOnDay(day)
        .then(generateBlockGeometries)
        .then(day => this.addDay(day)))

    return Promise.all(blocksGroupedByDay)
  }

  initState (blocks, currentDate) {
    this.state = {
      // frameCount: 0,
      currentDate: null,
      dayGroups: [],
      // loadDayRequested: false,
      currentBlock: null,
      currentBlockObject: null,
      // view: 'day', // can be 'day' or 'block'
      dayData: [], // all blocks grouped by day
      currentDay: null, // which day is the camera closest to
      // closestDayIndex: 0,
      // minCameraZPos: 0,
      // maxCameraZPos: 0
    }
  }

  initProperties () {
    this.boxGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0) // block geo instance
    
    this.treeGroup = null
    this.pointLightTarget = new THREE.Vector3(0.0, 0.0, 0.0)
    this.cameraBlockFocusDistance = 500
  }

  getNearestDateForPosition(z){
    return new Date(Math.round(z / dayZOffset) * msInADay +  this.earliestDate.valueOf())
  }

  getPositionForDate(date){
    return (date - this.earliestDate) / msInADay * dayZOffset// - 1000
  }

  addEvents () {
    this.onUpdateBound = this.onUpdate.bind(this)
    document.addEventListener('preUpdate', this.onUpdateBound, false)
    document.addEventListener('cameraMove', this.onCameraMove.bind(this), false)
    this.stage.canvas.addEventListener('click', this.onDocumentMouseDown.bind(this), false)
  }

  addTreeToStage(data){
    const { offset, size, vertices, endPoints, block } = data
    if (!vertices) return

    let treeGeo = new THREE.BufferGeometry()
    treeGeo.addAttribute('position', new THREE.BufferAttribute(vertices, 3))
    treeGeo.computeVertexNormals()
    treeGeo.computeFaceNormals()

    /*
      Tree Mesh
    */
    let mesh = new THREE.Mesh(treeGeo, this.getMaterialsForDay(block.day).merkleMaterial)
    mesh.position.add(offset)
    // mesh.renderOrder = 10000000
    // mesh.onBeforeRender = renderer => renderer.clearDepth()

    // align with box
    // mesh.translateZ(-(size.z / 2))

    /*
      Sound Wave Geometry
    */
    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(endPoints, 3, 1))
    geometry.addAttribute('soundData', new THREE.BufferAttribute(new Float32Array(endPoints.length), 3))

    // per instance data
    this.pointsMesh = new THREE.Points(geometry, this.pointsMaterial)
    this.pointsMesh.position.add(offset)
    // this.pointsMesh.translateZ(-(size.z / 2))

    const blockObj3D = this.allBlocksObj3d.get(block.hash)
    blockObj3D.add(this.pointsMesh)
    blockObj3D.add(mesh)
    blockObj3D.tree = mesh

    // start animation
    this.merkleMaterial.uniforms.uAnimTime.value = 0.0

    this.audio.generateMerkleSound(
      endPoints, 
      this.currentBlockObject.getWorldPosition().clone(), 
      block, 
      this.pointsMaterial, 
      this.pointsMesh)
  }

  setSize (w, h) {
    this.stage.resize(w, h)
  }


  async resetDayView () {
    // if (this.state.isAnimating) return

    this.emit('blockUnselected')

    // this.removeTrees()
    this.audio.unloadSound()

    if (this.currentBlockObject) {
      this.currentBlockObject.remove(this.currentBlockObject.tree)
      await this.animateBlockOut(this.currentBlockObject)
      this.state.currentBlock = null
      this.currentBlockObject = null
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

    if (intersected && intersected !== this.currentBlockObject) this.goToBlock(intersected.block.hash)
    else if (this.currentBlockObject) this.resetDayView()
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
      this.stage.targetCameraPos.z = blockWorldPos.z - this.cameraBlockFocusDistance
      this.stage.targetCameraPos.z
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

  async buildTree (blockObj) {
    // let block = blockObj.block
    // if (this.currentBlockObject) {
    //   this.currentBlockObject.remove(this.currentBlockObject.tree)
    //   this.audio.unloadSound()
    // }
    // // this.state.currentBlock = block
    // const transactions = await getTransactionsForBlock(block.hash)
    // block.transactions = transactions
    // TreeBuilderWorker.postMessage({ cmd: 'build', block: block })
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
  }

  getIntersections () {
    var vector = new THREE.Vector3(this.stage.targetMousePos.x, this.stage.targetMousePos.y, 0.5)
    vector.unproject(this.stage.camera)
    this.raycaster.set(this.stage.camera.position, vector.sub(this.stage.camera.position).normalize())

    const allBlocks = Array.from(this.allBlocksObj3d.values())

    const boxes = allBlocks
      // .filter(box => box !== this.currentBlockObject)
      .map(group => group.children[0])
      .filter(box => box && box.visible) // Filter to only those visible with non null refs

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
    if (intersected && intersected !== this.currentBlockObject) {
      intersected.children.forEach(child => child.material = this.blockMaterialHighlight)
      if (intersected !== this.lastHoveredBlock) {
        this.lastHoveredBlock = intersected
        this.emit('blockHovered', intersected.block)
      }
      this.pointLightTarget = intersected.position
    }
  }

  getInfoForDay(){
    
  }

  onCameraMove () {
    // if(!this.state.dayData[0]) return

    /*
      Get the closest day on the block chain near the camera 
    */
    const nearestDay = this.getNearestDateForPosition(this.stage.camera.position.z + 1000)

    /*
      Load the relevant blocks around this date
    */
    this.loadDate(nearestDay)

    /* this.state.hashRate = this.state.currentDay.hashRate
    this.state.audioFreqCutoff = map(this.state.hashRate, 0.0, 20000000.0, 50.0, 15000) // TODO: set upper bound to max hashrate from blockchain.info

    console.log(this.state.audioFreqCutoff) */

   // this.state.audioFreqCutoff = 20000

    // this.audio.setAmbienceFilterCutoff(this.state.audioFreqCutoff)
  }

  // loadDay (day, closestDayIndex, index) {
  //   this.loadBlocks(day, (closestDayIndex + index))
  //   let latestDayIndex = Number.MAX_SAFE_INTEGER
  //   let earliestDayIndex = 0

  //   for (const key in this.state.dayData) {
  //     if (this.state.dayData.hasOwnProperty(key)) {
  //       const data = this.state.dayData[key]
  //       if (data.blocks.length > 0) {
  //         latestDayIndex = Math.min(latestDayIndex, parseInt(key))
  //         earliestDayIndex = Math.max(earliestDayIndex, parseInt(key))
  //       }
  //     }
  //   }

  //   if (
  //     typeof this.state.dayData[latestDayIndex] !== 'undefined' &&
  //     typeof this.state.dayData[earliestDayIndex] !== 'undefined'
  //   ) {
  //     this.state.maxCameraZPos = this.state.dayData[latestDayIndex].zPos + this.stage.defaultCameraPos.z
  //     this.state.minCameraZPos = this.state.dayData[earliestDayIndex].zPos + 1000.0
  //   }
  // }

  async goToBlock (blockhash) {
    if (!blockhash) return

    console.log('NAVIGATING TO BLOCK :', blockhash )
    
    let block = this.allBlocksObj3d.has(blockhash) ? this.allBlocksObj3d.get(blockhash).block : null
    if (!block) block = await getBlock(blockhash)
    
    await this.setDate(block.day)
    

    if(this.currentBlockObject) {
      await this.animateBlockOut(this.currentBlockObject)
      this.currentBlockObject.remove(this.currentBlockObject.tree)
    }

    this.audio.unloadSound()

    this.currentBlockObject = this.allBlocksObj3d.get(blockhash)
    this.currentBlockObject.visible = true

    this.animateBlockIn(this.currentBlockObject)
    this.emit('blockSelected', {...block, time: new Date(block.time * 1000)})

    /*
      Generate the tree
    */
    const transactions = await getTransactionsForBlock(block.hash)
    generateTreeGeometry({ ...block, transactions }).then(this.addTreeToStage)
 
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
    // this.state.frameCount++
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

    if (this.audio.pointColors && this.audio.pointColors.length > 0) {
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
