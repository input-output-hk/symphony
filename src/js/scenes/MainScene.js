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
const dayZOffset = 4500 // offset for each day on z-axis


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
      resolve(data)
      worker.terminate()
    }
    worker.postMessage({ cmd: 'build', block })
  })
}


export default class MainScene extends EventEmitter {
  constructor ({ stage, cubeMap, textures, earliestDate, latestDate, path = './static/assets/' }) {
    super()

    /*
      Initialization params
    */
    this.earliestDate = earliestDate
    this.latestDate = latestDate
    this.stage = stage
    
    /*
      Properties
    */
    this.cubeCamera = null
    this.dayObj3Ds = new THREE.Group()
    this.cubeMap = cubeMap
    this.clock = new THREE.Clock()
    this.materials = new Map()
    this.days = new Map()
    this.allBlocksObj3d = new Map()
    this.lastHoveredBlock = null    
    this.raycaster = new THREE.Raycaster()
    this.boxGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0) // block geo instance
    this.pointLightTarget = new THREE.Vector3(0.0, 0.0, 0.0)
    this.cameraBlockFocusDistance = -300

    console.log("DATE RANGE :", this.earliestDate, this.latestDate )
    
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
    this.stage.camera.position.z = this.getPositionForDate(today) + 1000
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
    group.add(...obj3ds)

    /*
      Orientates, positions and sorts block objects
      TODO: implmenent a better depth sorting algo
    */
    const dayIndex = Math.round(this.getPositionForDate(day) / dayZOffset) * 100000
    // const n = obj3ds.length
    const center = obj3ds.length * 0.5 * 30
    obj3ds.forEach((obj3d, i) => {
      const index = i * 4
      obj3d.front.renderOrder = index + dayIndex + 1
      obj3d.back.renderOrder = index + dayIndex

      obj3d.rotation.z = -(((25 * Math.PI) / 200) * i)
      obj3d.translateY(800 + i)
      obj3d.rotation.z += Math.PI / 2
      obj3d.translateZ(i * 30 - center)
    })

    // group.add(new THREE.Mesh(new THREE.SphereGeometry(100, 100)))

    /*
      Make blocks visible
    */
    obj3ds.forEach((obj, i) => setTimeout(_ => obj.visible = true, i * 30))
    setTimeout(_ => this.createCubeMap(day), (obj3ds.length + 1) * 30)
    
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

    /* let edgeGeo = new THREE.EdgesGeometry(blockMesh.geometry)
    let wireframe = new THREE.LineSegments(edgeGeo, this.blockMaterialOutline)
    blockMesh.add(wireframe) */

    let group = new THREE.Group()
    group.materials = materials
    group.front = front
    group.back = back
    group.block = block
    group.visible = false
    group.contents = new THREE.Group()
    
    this.allBlocksObj3d.set(block.hash, group)

    group.add(back)
    group.add(group.contents)
    group.add(front)

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
      back: this.blockMaterialBack.clone(),
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
  async setDate(date){ 
    if( date < this.earliestDate ) return Promise.reject('Requested date is before the earliest available block date of ' + moment(this.earlestDate).format("MMM Do YYYY"))
    if( date > this.latestDate ) return Promise.reject('Requested date is after the lateset available block date of ' + moment(this.latestDate).format("MMM Do YYYY"))
    if(this.currentBlockObject) this.resetDayView()
    this.stage.targetCameraPos.z = this.getPositionForDate(date) + 1000
    this.stage.targetCameraLookAt.z = this.stage.targetCameraPos.z - 1000

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

    console.log('LOAD DATE :', this.date)
    // console.log('DAYS TO ADD :', Array.from(daysToLoad).map(date => new Date(date)))
    // console.log('DAYS TO REMOVE :', Array.from(daysToRemove).map(date => new Date(date)))
    // console.log('=========================================')

    /*
      If the day is in memory, then emit an event straight away
    */
    const dayMS = date.valueOf()
    const dayIsLoaded = daysAlreadyLoaded.has(dayMS)
    if(dayIsLoaded){
      const blocks = Array.from(this.allBlocksObj3d.values())
        .map(({ block }) => block)
        .filter(block => block.day === dayMS )

      this.emit('dayChanged', { ...this.getSumOfBlocks(blocks), date: new Date(date) })
    }

    /*
      Remove unused days
    */
    Array.from(daysToRemove).map(day => {
      const group = this.getGroupForDay(day)
      group.children.forEach(({ block }) => {
        if(block) this.allBlocksObj3d.delete(block.hash)
      })
      this.dayObj3Ds.remove(group)
      this.days.delete(day)
    })

    this.date = date

    /*
      This load
    */
    const isWithinAvailableDates = day => day <= this.latestDate && day >= this.earliestDate
    const constrainedDaysToLoad = Array.from(daysToLoad).filter(isWithinAvailableDates)
    constrainedDaysToLoad.forEach(day => this.getGroupForDay(day))

    const blocksGroupedByDay = constrainedDaysToLoad.map(day => getBlocksOnDay(day)
      .then(generateBlockGeometries)
      .then(day => this.addDay(day)))

    const allBlocksForDays = await Promise.all(blocksGroupedByDay)

    if(!dayIsLoaded){
      const blocks = Array.from(this.allBlocksObj3d.values())
        .map(({ block }) => block)
        .filter(block => block.day === dayMS )
      this.emit('dayChanged', { ...this.getSumOfBlocks(blocks), date: new Date(date) })
    }

    return allBlocksForDays
  }

  getSumOfBlocks(blocks){
    return {
      input: blocks.reduce((a, b) => a + b.input, 0),
      output: blocks.reduce((a, b) => a + b.output, 0),
      fee: blocks.reduce((a, b) => a + b.fee, 0)
    }
  }

  getNearestDateForPosition(z){
    const hOffset = dayZOffset * 0.5
    return new Date((z + dayZOffset) / dayZOffset * msInADay + this.earliestDate.valueOf())
  }

  getPositionForDate(date){
    const hOffset = dayZOffset * 0.5
    return ((date - this.earliestDate) / msInADay * dayZOffset) - hOffset
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
    let mesh = new THREE.Mesh(treeGeo, this.getMaterialsForDay(block.day).merkle)
    mesh.position.add(offset)

    // start animation
    this.merkleMaterial.uniforms.uAnimTime.value = 0.0
    new TWEEN.Tween(mesh.material.uniforms.uAnimTime)
      .to({value: 5}, 3000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()
    // mesh.renderOrder = 10000000
    // mesh.onBeforeRender = renderer => renderer.clearDepth()

    /*
      Sound Wave Geometry
    */
    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(endPoints, 3, 1))
    geometry.addAttribute('soundData', new THREE.BufferAttribute(new Float32Array(endPoints.length), 3))

    // per instance data
    this.pointsMesh = new THREE.Points(geometry, this.pointsMaterial)
    this.pointsMesh.position.add(offset)


    const blockObj3D = this.allBlocksObj3d.get(block.hash)
    blockObj3D.tree = mesh


    const dayIndex = Math.round(this.getPositionForDate(blockObj3D.block.day) / dayZOffset) * 100000
    const index = blockObj3D.parent.children.indexOf(blockObj3D) * 4
    this.pointsMesh.renderOrder = index + dayIndex + 3
    mesh.renderOrder = index + dayIndex + 2

    if( this.currentBlockObject === blockObj3D ){
      blockObj3D.contents.add(this.pointsMesh)
      blockObj3D.contents.add(blockObj3D.tree)
      this.audio.generateMerkleSound(endPoints, this.currentBlockObject.getWorldPosition().clone(), block, this.pointsMaterial,  this.pointsMesh)
    }
  }

  setSize (w, h) {
    this.stage.resize(w, h)
  }

  goToNextBlock(){
    if(this.currentBlockObject && this.currentBlockObject.block.next_block){
      this.goToBlock(this.currentBlockObject.block.next_block)
    }
  }

  goToPrevBlock(){
    if(this.currentBlockObject && this.currentBlockObject.block.prev_block){
      this.goToBlock(this.currentBlockObject.block.prev_block)
    }
  }

  resetDayView () {
    return this.goToBlock(null)
  }

  onDocumentMouseDown (event) {
    event.preventDefault()
    if (this.isAnimating) return

    const { intersected } = this.getIntersections()

    if (intersected && intersected !== this.currentBlockObject) this.goToBlock(intersected.block.hash)
    else if (this.currentBlockObject) this.goToBlock(null)
  }

  createCubeMap (day) {
    // if (typeof this.state.dayData[dayIndex] !== 'undefined') {
    this.stage.scene.background = this.bgMap
    
    const { front, back, merkle } = this.getMaterialsForDay(day)
    const group = this.getGroupForDay(day)
    front.color.setHex(0xffffff)
    let cubeCamera = new THREE.CubeCamera(100.0, 5000, 1024)
    cubeCamera.position.copy(group.position)
    cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter
    cubeCamera.update(this.stage.renderer, this.stage.scene)
    front.envMap = cubeCamera.renderTarget.texture
    back.envMap = cubeCamera.renderTarget.texture
    merkle.envMap = cubeCamera.renderTarget.texture

    this.stage.scene.background = new THREE.Color(Config.scene.bgColor)
  }

  animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      this.isAnimating = true
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

      new TWEEN.Tween(blockObject.position)
        .to(toPos, duration)
        .easing(this.easing)
        .onComplete(() => {
          this.isAnimating = false
          resolve()
        })
        .start()

      new TWEEN.Tween(this.merkleMaterial.uniforms.uAnimTime)
        .to({ value: 10}, 3)
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

  setupMaterials (textures, cubeTextures) {
    const bumpMap =  new THREE.Texture(textures[0])
    this.bgMap = new THREE.CubeTexture(cubeTextures)
    this.bgMap.needsUpdate = true
    // this.stage.scene.background = this.bgMap

    this.blockMaterialBack = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      emissive: 0x000000,
      metalness: 0.9,
      roughness: 0.2,
      opacity: 0.5,
      transparent: true,
      depthWrite: false,
      // depthTest: false,
      side: THREE.BackSide,
      envMap: this.bgMap,
      bumpMap,
      bumpScale: 0.3
    })

    this.blockMaterialFront = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      emissive: 0x330000,
      metalness: 0.9,
      roughness: 0.2,
      opacity: 0.5,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.FrontSide,
      envMap: this.bgMap,
      bumpMap,
      bumpScale: 0.3
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
      this.pointLightTarget.copy(intersected.getWorldPosition())
    }
  }

  async onCameraMove () {

    /*
      Get the nearest day on to the cameras target location
    */
    const date = this.getNearestDateForPosition(this.stage.targetCameraPos.z)
    date.setHours(0, 0, 0, 0)

    /*
      Load the relevant blocks around this date and fire an event
    */
    if (Math.abs(this.date - date) >= msInADay) {
      console.log('onCameraMove:  changing date', date) 
      await this.loadDate(date)
    }

    /* this.state.hashRate = this.state.currentDay.hashRate
    this.state.audioFreqCutoff = map(this.state.hashRate, 0.0, 20000000.0, 50.0, 15000) // TODO: set upper bound to max hashrate from blockchain.info
    // this.state.audioFreqCutoff = 20000
    // this.audio.setAmbienceFilterCutoff(this.state.audioFreqCutoff)
    */
  }

  async goToBlock (blockhash) {
    
    if (this.currentBlockObject) {
      this.audio.unloadSound()
      this.currentBlockObject.contents.remove(this.currentBlockObject.tree)
      this.currentBlockObject.contents.remove(this.pointsMesh)
      this.animateBlockOut(this.currentBlockObject)
      this.currentBlockObject = null
    }

    if (!blockhash) {
      this.emit('blockUnselected')
      return
    }

    console.log('NAVIGATING TO BLOCK :', blockhash )
    let block = this.allBlocksObj3d.has(blockhash) ? this.allBlocksObj3d.get(blockhash).block : null
    if (!block) block = await getBlock(blockhash)

    this.emit('blockSelected', {...block, time: new Date(block.day)})
    
    await this.setDate(block.day)

    this.currentBlockObject = this.allBlocksObj3d.get(blockhash)
    this.currentBlockObject.front.material = this.currentBlockObject.materials.front
    this.currentBlockObject.back.material = this.currentBlockObject.materials.back
    this.currentBlockObject.visible = true

    this.animateBlockIn(this.currentBlockObject)

    /*
      Generate the tree
    */
    const transactions = await getTransactionsForBlock(block.hash)
    const data = await generateTreeGeometry({ ...block, transactions })
    this.addTreeToStage(data)
  }

  updateLights () {
    this.stage.pointLight.position.lerp(this.pointLightTarget, 0.1)
  }

  onUpdate () {
    TWEEN.update()
    this.updateLights()
    this.checkMouseIntersection()

    this.uTime = this.clock.getElapsedTime()

    // this.pointsMaterial.uniforms.uTime.value = this.uTime
    if (this.audio.pointColors && this.audio.pointColors.length > 0) {
      let pointColors = Float32Array.from(this.audio.pointColors).subarray(0, this.pointsMesh.geometry.attributes.soundData.array.length)
      this.pointsMesh.geometry.attributes.soundData.array.set(pointColors)
      this.pointsMesh.geometry.attributes.soundData.needsUpdate = true
    }
  }
}
