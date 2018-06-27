'use strict'
import * as THREE from 'three'
import moment from 'moment'
import EventEmitter from 'eventemitter3'
import AddText from '../geometry/circleGeometry'
import Config from '../Config'
import Audio from '../audio/audio'
import { getBlocksOnDay, getTransactionsForBlock, getBlock, getHashRateforDay } from '../api/btc'
import Materials from '../materials/materials'
import DayBuilderWorker from '../workers/day.worker.js'
import TreeBuilderWorker from '../workers/tree.worker.js'

require('../lights/RectAreaLightUniforms')

const dat = require('dat-gui')
const TWEEN = require('@tweenjs/tween.js')

const MS_IN_A_DAY = 86400000
const DAY_OFFSET = 6500 // offset for each day on z-axis

const difference = (a, b) => new Set([...a].filter(x => !b.has(x)))

const generateBlockGeometries = async blocks => {
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

    this.path = path

    this.allBlocksObj3d = new Map()
    this.lastHoveredBlock = null
    this.raycaster = new THREE.Raycaster()
    this.boxGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0) // block geo instance
    this.pointLightTarget = new THREE.Vector3(0.0, 0.0, 0.0)
    // pull camera in closer on landscape screens
    if (window.innerWidth < window.innerHeight) {
      this.cameraBlockFocusDistance = -750
    } else {
      this.cameraBlockFocusDistance = -450
    }

    console.log('DATE RANGE :', this.earliestDate, this.latestDate)

    this.audio = new Audio(this.stage.camera, path)
    this.audio.init()
    this.addEvents()
    this.allMaterials = Materials(textures, cubeMap)
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
        blockColor: this.allMaterials.blockMaterialFront.color.getHex(),
        blockEmissive: this.allMaterials.blockMaterialFront.emissive.getHex(),
        blockLightIntesity: 5.0,
        //
        merkleMetalness: 0.9,
        merkleRoughness: 0.1,
        merkleColor: this.allMaterials.merkleMaterial.color.getHex(),
        merkleEmissive: this.allMaterials.merkleMaterial.emissive.getHex(),
        //
        backgroundColor: Config.scene.bgColor,
        vignetteAmount: 1.4,
        cameraFOV: Config.camera.fov
      }

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

    const threeHoursBeforeLastBlock = new Date(this.latestDate)
    threeHoursBeforeLastBlock.setHours(threeHoursBeforeLastBlock.getHours() - 3)
    this.stage.camera.position.z = this.getPositionForDate(threeHoursBeforeLastBlock)
    this.stage.cameraPos.z = this.stage.camera.position.z
    this.stage.targetCameraPos.z = this.stage.cameraPos.z
    this.setDate(threeHoursBeforeLastBlock)

    this.goToHash()
  }

  goToHash () {
    const regex = new RegExp('[?&]hash=([^&#]*)', 'i')
    let regexResult = regex.exec(window.location.href)

    if (regexResult !== null && typeof regexResult[1] !== 'undefined') {
      try {
        this.goToBlock(regexResult[1])
      } catch (error) {
        console.log(error)
      }
    }
  }

  /*
    Groups blocks by days and adds them
  */
  async addDay (blocks) {
    if (!blocks || blocks.length === 0) {
      return
    }

    const obj3ds = blocks.map(block => this.addBlock(block))
      .filter(block => block) // Remove null blocks
    const day = blocks[0].day
    const group = this.getGroupForDay(day)
    group.hashRate = await getHashRateforDay(day)
    group.position.z = this.getPositionForDate(day)
    group.add(...obj3ds)

    /*
      Orientates, positions and sorts block objects
      TODO: implmenent a better depth sorting algo
    */
    const dayIndex = Math.round(this.getPositionForDate(day) / DAY_OFFSET)
    console.log(new Date(day), dayIndex)
    obj3ds.forEach((obj3d, i) => {
      const index = i * 4
      obj3d.front.renderOrder = index + dayIndex + 1
      obj3d.back.renderOrder = index + dayIndex

      obj3d.rotation.z = -(((25 * Math.PI) / 200) * i)
      obj3d.translateY(800 + i)
      obj3d.rotation.z += Math.PI / 2
      obj3d.translateZ(-(obj3d.block.size.z * 0.5))
      obj3d.translateZ((i * 30))
    })

    const circleGroup = AddText(this.path, moment(day).startOf('day').format('MMM Do YYYY').toUpperCase())
    circleGroup.position.z += (DAY_OFFSET - 1000.0)
    group.add(circleGroup)

    /*
      Make blocks visible
    */
    obj3ds.forEach((obj, i) => setTimeout(_ => { obj.visible = true }, i * 30))
    setTimeout(_ => this.createCubeMap(day), (obj3ds.length + 1) * 30)

    return blocks
  }

  addBlock (block) {
    const { day, size } = block

    if (!day) {
      return
    }

    size.x += 20.0
    size.y += 20.0
    size.z += 20.0

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

  getGroupForDay (day) {
    if (!this.days.has(day)) {
      const group = new THREE.Group()
      group.day = new Date(day)
      this.days.set(day, group)
      this.dayObj3Ds.add(group)
    }
    return this.days.get(day)
  }

  getMaterialsForDay (day) {
    const materials = this.materials.get(day) || {
      front: this.allMaterials.blockMaterialFront.clone(),
      back: this.allMaterials.blockMaterialBack.clone(),
      merkle: this.allMaterials.merkleMaterial
    }
    this.materials.set(day, materials)
    return materials
  }

  destroy () {
    document.removeEventListener('preUpdate', this.onUpdateBound, false)
    window.cancelAnimationFrame(this.stage.reqID)

    const dispose = function (object) {
      if (object.geometry) {
        object.geometry.dispose()
      }
      if (object.material) {
        if (object.material.map) {
          object.material.map.dispose()
        }
        object.material.dispose()
      }
    }

    this.stage.scene.traverse(dispose)
  }

  /*
    Moves the camera to a new date in the blockchain and loads data
  */
  async setDate (date) {
    if (date < this.earliestDate) {
      return Promise.reject(new Error('Requested date is before the earliest available block date of ' + moment(this.earliestDate).format('MMM Do YYYY')))
    }
    if (date > this.latestDate) {
      return Promise.reject(new Error('Requested date is after the latest available block date of ' + moment(this.latestDate).format('MMM Do YYYY')))
    }
    if (this.currentBlockObject) {
      this.resetDayView()
    }
    this.stage.targetCameraPos.z = this.getPositionForDate(date)
    this.stage.targetCameraLookAt.z = this.stage.targetCameraPos.z - 1000

    return this.loadDate(date)
  }

  /*
    loads new blocks around a date
  */
  async loadDate (date) {
    if (date < this.earliestDate) {
      return Promise.reject(new Error('Requested date is before the earliest available block date of ' + moment(this.earliestDate).format('MMM Do YYYY')))
    }
    if (date > this.latestDate) {
      return Promise.reject(new Error('Requested date is after the latest available block date of ' + moment(this.latestDate).format('MMM Do YYYY')))
    }

    date = new Date(new Date(date).setHours(0, 0, 0, 0))
    if (Math.abs(this.date - date) < MS_IN_A_DAY) {
      return
    }
    this.date = date

    const numDaysToLoad = Config.daysEitherSide * 2 + 1
    const days = new Array(numDaysToLoad).fill(0).map((v, i) => {
      return new Date(this.date).setDate(this.date.getDate() - (i - Config.daysEitherSide)).valueOf()
    })

    const daysToDisplay = new Set(days)
    const daysAlreadyLoaded = new Set(this.days.keys())
    const daysToRemove = difference(daysAlreadyLoaded, daysToDisplay)
    const daysToLoad = difference(daysToDisplay, daysAlreadyLoaded)

    console.log('LOAD DATE :', this.date)

    /*
      If the day is in memory, then emit an event straight away
    */
    const dayMS = date.valueOf()
    const dayIsLoaded = daysAlreadyLoaded.has(dayMS)
    if (dayIsLoaded) {
      const blocks = Array.from(this.allBlocksObj3d.values())
        .map(({ block }) => block)
        .filter(block => block.day === dayMS)

      this.emit('dayChanged', { ...this.getSumOfBlocks(blocks), date: new Date(date) })
    }

    /*
      Remove unused days
    */
    Array.from(daysToRemove).map(day => {
      const group = this.getGroupForDay(day)
      group.children.forEach(({ block }) => {
        if (block) {
          this.allBlocksObj3d.delete(block.hash)
        }
      })
      this.dayObj3Ds.remove(group)
      this.days.delete(day)
    })

    this.date = date

    const isWithinAvailableDates = day => day <= this.latestDate && day >= this.earliestDate
    const constrainedDaysToLoad = Array.from(daysToLoad).filter(isWithinAvailableDates)
    constrainedDaysToLoad.forEach(day => this.getGroupForDay(day))

    const blocksGroupedByDay = constrainedDaysToLoad.map(day => getBlocksOnDay(day)
      .then(generateBlockGeometries)
      .then(day => this.addDay(day)))

    const allBlocksForDays = await Promise.all(blocksGroupedByDay)

    if (!dayIsLoaded) {
      const blocks = Array.from(this.allBlocksObj3d.values())
        .map(({ block }) => block)
        .filter(block => block.day === dayMS)
      this.emit('dayChanged', { ...this.getSumOfBlocks(blocks), date: new Date(date) })
    }

    return allBlocksForDays
  }

  getSumOfBlocks (blocks) {
    return {
      input: blocks.reduce((a, b) => a + b.input, 0),
      output: blocks.reduce((a, b) => a + b.output, 0),
      fee: blocks.reduce((a, b) => a + b.fee, 0)
    }
  }

  getNearestDateForPosition (z) {
    const hOffset = DAY_OFFSET * 0.5
    return new Date((z - hOffset) / DAY_OFFSET * MS_IN_A_DAY + this.earliestDate.valueOf())
  }

  getPositionForDate (date) {
    const hOffset = DAY_OFFSET * 0.5
    return (((date - this.earliestDate) / MS_IN_A_DAY) * DAY_OFFSET) + hOffset
  }

  addEvents () {
    this.onUpdateBound = this.onUpdate.bind(this)
    document.addEventListener('preUpdate', this.onUpdateBound, false)
    document.addEventListener('cameraMove', this.onCameraMove.bind(this), false)
    this.stage.canvas.addEventListener('click', this.onDocumentMouseDown.bind(this), false)

    this.on('dayChanged', function ({ date }) {
      const hashRate = this.getGroupForDay(date.valueOf()).hashRate
      if (hashRate) {
        this.audio.setAmbienceFilterCutoff(hashRate)
      }
    })
  }

  addTreeToStage (data) {
    const { offset, vertices, endPoints, block } = data
    if (!vertices) {
      return
    }

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
    this.allMaterials.merkleMaterial.uniforms.uAnimTime.value = 0.0
    new TWEEN.Tween(mesh.material.uniforms.uAnimTime)
      .to({value: 5}, 3000)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .start()

    /*
      Sound Wave Geometry
    */
    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(endPoints, 3, 1))
    geometry.addAttribute('soundData', new THREE.BufferAttribute(new Float32Array(endPoints.length), 3))

    // per instance data
    this.pointsMesh = new THREE.Points(geometry, this.allMaterials.pointsMaterial)
    this.pointsMesh.position.add(offset)

    const blockObj3D = this.allBlocksObj3d.get(block.hash)
    blockObj3D.tree = mesh

    const dayIndex = Math.round(this.getPositionForDate(blockObj3D.block.day) / DAY_OFFSET)
    const index = blockObj3D.parent.children.indexOf(blockObj3D) * 4
    this.pointsMesh.renderOrder = index + dayIndex + 3
    mesh.renderOrder = index + dayIndex + 2

    if (this.currentBlockObject === blockObj3D) {
      blockObj3D.contents.add(this.pointsMesh)
      blockObj3D.contents.add(blockObj3D.tree)
      this.audio.generateSound(
        endPoints,
        this.currentBlockObject.getWorldPosition(new THREE.Vector3()).clone(),
        block,
        this.allMaterials.pointsMaterial,
        this.pointsMesh
      )
    }
  }

  setSize (w, h) {
    this.stage.resize(w, h)
  }

  goToNextBlock () {
    if (this.currentBlockObject && this.currentBlockObject.block.next_block) {
      this.goToBlock(this.currentBlockObject.block.next_block)
    }
  }

  goToPrevBlock () {
    if (this.currentBlockObject && this.currentBlockObject.block.prev_block) {
      this.goToBlock(this.currentBlockObject.block.prev_block)
    }
  }

  resetDayView () {
    return this.goToBlock(null)
  }

  onDocumentMouseDown (event) {
    event.preventDefault()
    if (this.isAnimating) {
      return
    }

    const { intersected } = this.getIntersections()

    if (intersected && intersected !== this.currentBlockObject) {
      this.goToBlock(intersected.block.hash)
    } else if (this.currentBlockObject) {
      this.goToBlock(null)
    }
  }

  createCubeMap (day) {
    this.stage.scene.background = this.allMaterials.bgMap

    const { front, back } = this.getMaterialsForDay(day)
    const group = this.getGroupForDay(day)
    front.color.setHex(0xffffff)
    let cubeCamera = new THREE.CubeCamera(100.0, 5000, 512)
    cubeCamera.position.copy(group.getWorldPosition(new THREE.Vector3()))
    cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter
    cubeCamera.update(this.stage.renderer, this.stage.scene)
    front.envMap = cubeCamera.renderTarget.texture
    back.envMap = cubeCamera.renderTarget.texture

    this.stage.scene.background = new THREE.Color(Config.scene.bgColor)
  }

  async animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

      new TWEEN.Tween(blockObject.position)
        .to(toPos, duration)
        .easing(this.easing)
        .onComplete(() => {
          resolve()
        })
        .start()

      new TWEEN.Tween(this.allMaterials.merkleMaterial.uniforms.uAnimTime)
        .to({value: 10}, 10)
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
          300
        ).then(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  animateBlockIn (blockObject) {
    this.isAnimating = true

    let blockPos = blockObject.position.clone()

    let targetRotation = new THREE.Euler(0.0, 0.0, 0.0)
    let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
    let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

    blockObject.initialPosition = blockObject.position.clone()
    blockObject.initialRotation = blockObject.rotation.clone()

    const toPos = new THREE.Vector3()
    toPos.z = blockObject.position.clone().z

    this.animateBlock(
      blockObject,
      blockPos,
      fromQuaternion,
      toPos,
      toQuaternion,
      1500,
      true
    ).then(() => {
      // focus camera on block
      let blockWorldPos = blockObject.getWorldPosition(new THREE.Vector3())
      this.stage.targetCameraLookAt.z = blockWorldPos.z
      this.stage.targetCameraPos.z = blockWorldPos.z - this.cameraBlockFocusDistance
      this.isAnimating = false
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
      .filter(({ distance }) => distance < DAY_OFFSET * 1.5) // Only boxes in the next days and a half are allowed
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
      intersected.children.forEach(child => {
        child.material = this.allMaterials.blockMaterialHighlight
      })

      this.emit('blockMouseOver', intersected.block)
      if (intersected !== this.lastHoveredBlock) {
        this.lastHoveredBlock = intersected
      }

      let blockWorldPos = intersected.getWorldPosition(new THREE.Vector3())
      this.pointLightTarget.copy(blockWorldPos)
      this.pointLightTarget.z += (intersected.block.size.z * 0.5) + 100.0
    } else {
      this.emit('blockMouseOut')
    }
  }

  onCameraMove () {
    /*
      Bound the camera movement to the available block chain range
    */
    const start = this.getPositionForDate(this.earliestDate) + 1000
    const end = this.getPositionForDate(this.latestDate) + 2000

    this.stage.targetCameraPos.z = Math.max(start, Math.min(end, this.stage.targetCameraPos.z))

    /*
      Get the nearest day to the camera's target location
    */
    const date = this.getNearestDateForPosition(this.stage.targetCameraPos.z)

    // const postionOfCurrentDate = this.getPositionForDate(this.date)
    date.setHours(0, 0, 0, 0)

    /*
      Load the relevant blocks around this date and fire an event
    */
    if (Math.abs(date - this.date) >= MS_IN_A_DAY) {
      this.loadDate(date)
    }
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

    console.log('NAVIGATING TO BLOCK :', blockhash)
    const obj3d = this.allBlocksObj3d.get(blockhash)

    let block
    let noBlockInMemory = true
    if (typeof obj3d !== 'undefined') {
      noBlockInMemory = false
      block = obj3d.block
    } else {
      try {
        block = await getBlock(blockhash)
      } catch (error) {
        console.log(error)
        return
      }
    }

    // blocks with a large number of transactions are stored as a JSON string
    if (typeof block.tx === 'string') {
      block.tx = JSON.parse(block.tx)
    }

    if (noBlockInMemory) {
      await this.loadDate(block.day)
    }
    this.currentBlockObject = this.allBlocksObj3d.get(blockhash)

    this.animateBlockIn(this.currentBlockObject)
    this.emit('blockSelected', {...block, time: new Date(block.time * 1000)})

    this.currentBlockObject.front.material = this.currentBlockObject.materials.front
    this.currentBlockObject.back.material = this.currentBlockObject.materials.back
    this.currentBlockObject.visible = true

    let transactions
    if (typeof block.tx === 'undefined') {
      transactions = await getTransactionsForBlock(block.hash)
    } else {
      transactions = block.tx
    }

    const data = await generateTreeGeometry({ ...block, transactions })
    this.addTreeToStage(data)
  }

  onUpdate () {
    TWEEN.update()

    this.checkMouseIntersection()

    this.stage.pointLight.position.lerp(this.pointLightTarget, 0.3)

    this.uTime = this.clock.getElapsedTime()

    this.allMaterials.pointsMaterial.uniforms.uTime.value = this.uTime
    if (this.audio.pointColors && this.audio.pointColors.length > 0) {
      let pointColors = Float32Array.from(this.audio.pointColors.slice(0, 10000))
      this.pointsMesh.geometry.attributes.soundData.array.set(pointColors)
      this.pointsMesh.geometry.attributes.soundData.needsUpdate = true
    }
  }
}
