'use strict'

// libs
import * as THREE from 'three'
import { map } from '../../utils/math'
import moment from 'moment'

// Global config
import Config from '../Config'

// Audio
import Audio from '../audio/audio'

// API
import API from '../api/btc'

const dat = require('dat-gui')

const DayBuilderWorker = require('worker-loader!../workers/dayBuilder.js')
const TreeBuilderWorker = require('worker-loader!../workers/treeBuilder.js')

const TWEEN = require('@tweenjs/tween.js')

export default class MainScene {
  constructor ({
      params = {}
    } = {}
  ) {
    this.params = params

    this.api = new API()

    this.stage = params.stage // reference to the stage

    this.currentDate = this.params.date

    this.initProperties() // class properties
    this.initState(this.params.date)
    this.addInteraction()

    this.audio = new Audio(this.stage.camera)

    this.audio.init()

    this.addEvents()
    this.setupMaterials()
    this.initGui()

    this.state.loadDayRequested = true
    this.dayBuilderWorker = new DayBuilderWorker()
    this.dayBuilderWorker.addEventListener('message', this.addBlocksToStage.bind(this), false)
    this.loadBlocks() // load in new blocks via webworker
  }

  initGui () {
    this.gui = new dat.GUI({ width: 300 })
    this.gui.open()

    let param = {
      blockRoughness: 0.9,
      blockMetalness: 0.2,
      merkleMetalness: 0.9,
      merkleRoughness: 0.1
    }

    let blockMaterialFolder = this.gui.addFolder('Block Material')

    blockMaterialFolder.add(param, 'blockMetalness', 0.0, 1.0).step(0.01).onChange(function (val) {
      this.crystalMaterial.metalness = val
    }.bind(this))

    blockMaterialFolder.add(param, 'blockRoughness', 0.0, 1.0).step(0.01).onChange(function (val) {
      this.crystalMaterial.roughness = val
    }.bind(this))

    let merkleMaterialFolder = this.gui.addFolder('Merkle Material')

    merkleMaterialFolder.add(param, 'merkleMetalness', 0.0, 1.0).step(0.01).onChange(function (val) {
      this.merkleMaterial.metalness = val
    }.bind(this))

    merkleMaterialFolder.add(param, 'merkleRoughness', 0.0, 1.0).step(0.01).onChange(function (val) {
      this.merkleMaterial.roughness = val
    }.bind(this))
  }

  initState (blocks, currentDate) {
    this.state = {
      currentDate: currentDate,
      dayGroups: [],
      currentBlock: null,
      currentBlockObject: null,
      view: 'day', // can be 'day' or 'block'
      dayData: [], // all blocks grouped by day
      currentDay: null, // which day is the camera closest to
      blocksToAnimate: [],
      closestDayIndex: 0,
      totalBlockCount: 0 // keep track of the total number of blocks loaded into the scene
    }
  }

  /**
   * Load in blocks for one day
   */
  loadBlocks (date = this.currentDate, dayIndex = 0) {
    // prune days too far away from viewer
    for (const key in this.state.dayData) {
      if (this.state.dayData.hasOwnProperty(key)) {
        if (Math.abs(key - this.state.closestDayIndex) > 5) {
          delete this.state.dayData[key]
          this.stage.scene.remove(this.state.dayGroups[key])
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

        this.dayBuilderWorker.postMessage({
          cmd: 'build',
          blocks: day.blocks,
          timeStamp: day.timeStamp,
          dayIndex: dayIndex
        })
      })
    } else {
      console.log('Webworkers not supported. Sad')
    }
  }

  addBlocksToStage (e) {
    if (typeof e.data.sizes === 'undefined') {
      return
    }

    try {
      let workerData = e.data
      let sizes = workerData.sizes
      let blockCount = workerData.blockCount
      let timeStamp = workerData.timeStamp
      let dayIndex = workerData.dayIndex
      let blocks = workerData.blocks

      this.state.dayData[dayIndex] = {
        blocks: blocks,
        timeStamp: timeStamp
      }

      this.state.totalBlockCount += blocks.length

      let group = new THREE.Group()
      this.state.dayGroups[dayIndex] = group
      this.stage.scene.add(group)
      this.blocksToAnimate = []

      for (let index = 0; index < sizes.length; index++) {
        const size = sizes[index]
        const block = blocks[index]

        if (
          size.x === 0 ||
          size.y === 0 ||
          size.z === 0
        ) {
          continue
        }

        let blockMesh = new THREE.Mesh(this.boxGeometry, this.crystalMaterial)

        blockMesh.renderOrder = ((index * -dayIndex) + 1000000)

        // blockMesh.material.opacity = 0.0
        blockMesh.material.visible = false
        blockMesh.scale.set(size.x, size.y, size.z)

        // align all front faces
        blockMesh.translateZ(-(size.z / 2))

        let rotation = ((25 * Math.PI) / blockCount) * index
        blockMesh.rotation.z = rotation
        blockMesh.translateY(700 + (index))
        blockMesh.rotation.z += Math.PI / 2
        blockMesh.translateZ((index * 18))
        blockMesh.blockchainData = block

        group.add(blockMesh)
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

      if (this.treeGroup) {
        that.stage.scene.remove(this.treeGroup)
        that.stage.scene.add(this.treeGroup)
      }
    } catch (error) {
      console.log(error)
    }
  }

  initProperties () {
    this.boxGeometry = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0) // block geo instance
    this.dayZOffset = -3500 // offset for each day on z-axis
    this.treeGroup = null
    this.blockLoadZThreshold = 10000 // how far away from the last block until we load in another?
    this.crystalOpacity = 0.5
    this.pointLightTarget = new THREE.Vector3(0.0, 0.0, 0.0)
  }

  addInteraction () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = null
  }

  addEvents () {
    document.addEventListener('preUpdate', this.onUpdate.bind(this), false)
    document.addEventListener('cameraMove', this.onCameraMove.bind(this), false)

    this.selectBlock = new Event('selectBlock')

    this.dayChangedEvent = document.createEvent('CustomEvent')

    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
    document.addEventListener('keydown', this.onKeyDown.bind(this), false)

    if (window.Worker) {
      this.treeBuilderWorker = new TreeBuilderWorker()
      this.treeBuilderWorker.addEventListener('message', this.addTreeToStage.bind(this), false)
    }
  }

  addTreeToStage (e) {
    if (typeof e.data.vertices === 'undefined') {
      return
    }

    let boxCenter = e.data.boxCenter
    let endNodes = e.data.endNodes
    let vertices = e.data.vertices

    this.removeTrees()

    this.treeGroup = new THREE.Group()
    this.stage.scene.add(this.treeGroup)

    let blockObjectPosition = this.state.currentBlockObject.getWorldPosition().clone()
    let rotation = this.state.currentBlockObject.getWorldRotation().clone()

    let treeGeo = new THREE.BufferGeometry()
    treeGeo.addAttribute('position', new THREE.BufferAttribute(vertices, 3))

    treeGeo.computeVertexNormals()
    treeGeo.computeFaceNormals()

    let mesh = new THREE.Mesh(treeGeo, this.merkleMaterial)

    mesh.translateX(-boxCenter.x)
    mesh.translateY(-boxCenter.y)
    mesh.translateZ(-boxCenter.z)

    mesh.renderOrder = 10000000
    mesh.onBeforeRender = (renderer) => {
      renderer.clearDepth()
    }

    this.treeGroup.add(mesh)

    this.treeGroup.rotation.set(rotation.x, rotation.y, rotation.z)
    this.treeGroup.position.set(blockObjectPosition.x, blockObjectPosition.y, blockObjectPosition.z)

    let seen = []
    let reducedArray = []

    for (let index = 0; index < endNodes.length; index++) {
      const nodePos = endNodes[index]
      let position = {
        x: Math.ceil(nodePos.x / 10) * 10,
        y: Math.ceil(nodePos.y / 10) * 10,
        z: Math.ceil(nodePos.z / 10) * 10
      }

      let key = JSON.stringify(position)

      if (seen.indexOf(key) === -1) {
        seen.push(key)
        nodePos.y = Math.abs(nodePos.y)
        reducedArray.push(nodePos)
      }
    }

    this.audio.generateMerkleSound(reducedArray, blockObjectPosition)
  }

  onKeyDown (event) {
    let isEscape = false
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
    this.removeTrees()

    this.animateBlockOut(this.state.currentBlockObject).then(() => {
      this.state.view = 'day'
      this.animateCamera(
        new THREE.Vector3(0.0, 0.0, this.state.currentDay.zPos + 400),
        new THREE.Vector3(0.0, 0.0, this.state.currentDay.zPos),
        3000
      )
      this.isAnimating = false
    })
  }

  removeTrees () {
    if (typeof this.treeGroup !== 'undefined') {
      this.stage.scene.remove(this.treeGroup)
      this.treeGroup = null
    }
    this.audio.unloadSound()
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    if (event.target.className !== 'main') {
      return
    }

    if (this.isAnimating) {
      return
    }

    this.raycaster.setFromCamera({x: this.stage.targetMousePos.x, y: this.stage.targetMousePos.y}, this.stage.camera)

    const BreakException = {}

    try {
      for (const key in this.state.dayGroups) {
        if (this.state.dayGroups.hasOwnProperty(key)) {
          const group = this.state.dayGroups[key]
          var intersects = this.raycaster.intersectObjects(group.children)
          if (intersects.length > 0) {
            if (intersects[0].object === this.state.currentBlockObject) {
              throw BreakException
            }
            this.state.view = 'block'
            this.removeTrees()
            this.isAnimating = true
            let blockObject = intersects[0].object
            this.animateBlockOut(this.state.currentBlockObject).then(() => {
              this.animateBlockIn(blockObject).then(() => {
                this.buildTree(blockObject)
                this.isAnimating = false
                document.dispatchEvent(this.selectBlock)
              })
            })
            throw BreakException
          }
        }
      }
    } catch (error) {
      // ¯\_(ツ)_/¯
    }
  }

  animateBlock (blockObject, fromPos, fromQuaternion, toPos, toQuaternion, duration) {
    return new Promise((resolve, reject) => {
      let moveQuaternion = new THREE.Quaternion()
      blockObject.quaternion.set(moveQuaternion)

      this.easing = TWEEN.Easing.Quartic.InOut

      let tweenVars = {
        blockPosX: fromPos.x,
        blockPosY: fromPos.y,
        time: 0
      }

      new TWEEN.Tween(tweenVars)
        .to(
        {
          blockPosX: toPos.x,
          blockPosY: toPos.y,
          time: 1
        },
          duration
        )
        .onUpdate(function () {
          blockObject.position.x = tweenVars.blockPosX
          blockObject.position.y = tweenVars.blockPosY

          // slerp to target rotation
          THREE.Quaternion.slerp(fromQuaternion, toQuaternion, moveQuaternion, tweenVars.time)
          blockObject.quaternion.set(moveQuaternion.x, moveQuaternion.y, moveQuaternion.z, moveQuaternion.w)
        })
        .easing(this.easing)
        .onComplete(function () {
          resolve()
        })
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
      this.state.currentBlockObject = blockObject

      let blockPos = blockObject.position.clone()

      let targetRotation = new THREE.Euler(0.0, 0.0, 0.0)
      let fromQuaternion = new THREE.Quaternion().copy(blockObject.quaternion)
      let toQuaternion = new THREE.Quaternion().setFromEuler(targetRotation)

      blockObject.initialPosition = blockObject.position.clone()
      blockObject.initialRotation = blockObject.rotation.clone()

      // focus camera on block
      let blockWorldPos = blockObject.getWorldPosition()

      this.stage.targetCameraLookAt.z = blockWorldPos.z
      this.stage.targetCameraPos.z = blockWorldPos.z + 450

      this.animateBlock(
        blockObject,
        blockPos,
        fromQuaternion,
        this.stage.targetCameraLookAt,
        toQuaternion,
        1000,
        true
      ).then(() => {
        resolve()
      })
    })
  }

  buildTree (blockObject) {
    let block = blockObject.blockchainData
    this.state.currentBlock = block
    this.removeTrees()
    this.treeBuilderWorker.postMessage(
      {
        cmd: 'build',
        block: block
      }
    )
  }

  animateCamera (target, lookAt, duration) {
    return new Promise((resolve, reject) => {
      if (this.isAnimating) {
        console.log('animating')
        return
      }
      this.isAnimating = true

      this.stage.targetCameraPos = target.clone()
      this.stage.targetCameraLookAt = lookAt.clone()

      // grab initial postion/rotation
      let fromPosition = new THREE.Vector3().copy(this.stage.camera.position)

      // reset original position and rotation
      this.stage.camera.position.set(fromPosition.x, fromPosition.y, fromPosition.z)
    })
  }

  addDay (dayData, index) {

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

    // this.stage.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xaaaaaa,
      metalness: 0.9,
      roughness: 0.2,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
      envMap: this.bgMap
    })

    this.crystalMaterialHighlight = this.crystalMaterial.clone()
    this.crystalMaterialHighlight.opacity = 1.0
    this.crystalMaterialHighlight.color.setHex(0xffffff)

    this.merkleMaterial = new THREE.MeshStandardMaterial({
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
  }

  checkMouseIntersection () {
    var vector = new THREE.Vector3(this.stage.targetMousePos.x, this.stage.targetMousePos.y, 0.5)
    vector.unproject(this.stage.camera)
    var ray = new THREE.Raycaster(this.stage.camera.position, vector.sub(this.stage.camera.position).normalize())

    for (const dayIndex in this.state.dayGroups) {
      if (this.state.dayGroups.hasOwnProperty(dayIndex)) {
        const group = this.state.dayGroups[dayIndex]
        let intersects = ray.intersectObjects(group.children)
        if (intersects.length > 0) {
          if (
              intersects[0].object !== this.intersected &&
              intersects[0].object !== this.state.currentBlockObject
            ) {
            if (this.intersected) {
              this.intersected.material = this.crystalMaterial
            }

            this.intersected = intersects[0].object

            this.intersected.material = this.crystalMaterialHighlight

            const blockWorldPos = this.intersected.getWorldPosition()

            this.pointLightTarget = blockWorldPos
          }
          break
        } else {
          if (this.intersected) {
            this.intersected.material = this.crystalMaterial
          }
          this.intersected = null
        }
      }
    }
  }

  onCameraMove () {
    // which day are we closest to?
    let closest = Number.MAX_VALUE
    let closestDayIndex = 0

    for (const dayIndex in this.state.dayData) {
      if (this.state.dayData.hasOwnProperty(dayIndex)) {
        const day = this.state.dayData[dayIndex]
        let dist = Math.abs(day.zPos - this.stage.camera.position.z)
        if (dist < closest) {
          closest = dist
          closestDayIndex = parseInt(dayIndex)
        }
      }
    }

    this.state.currentDay = this.state.dayData[closestDayIndex]

    // bubble up event
    if (this.state.closestDayIndex !== closestDayIndex) {
      // Dispatch an event
      this.dayChangedEvent.initCustomEvent('dayChanged', true, true, this.state.currentDay)
      window.dispatchEvent(this.dayChangedEvent)
    }

    this.state.closestDayIndex = closestDayIndex

    if (this.state.loadDayRequested === false) {
      if (this.currentDate !== moment().format('YYYY-MM-DD')) {
        let latestDayIndex = Math.min(...Object.keys(this.state.dayData))
        let latestLoadedDay = this.state.dayData[latestDayIndex]
        let latestDayDist = Math.abs(latestLoadedDay.zPos - this.stage.camera.position.z)
        if (latestDayDist < this.blockLoadZThreshold) {
          console.log('load later')
          this.state.loadDayRequested = true
          let nextDay = moment(latestLoadedDay.timeStamp).add(1, 'day').toDate().valueOf()
          this.loadBlocks(nextDay, latestDayIndex - 1)
        }
      }
    }

    if (this.state.loadDayRequested === false) {
        // how far are we away from the zpos of the last loaded day?
      let earliestDayIndex = Math.max(...Object.keys(this.state.dayData))
      let earliestLoadedDay = this.state.dayData[earliestDayIndex]

      let dist = Math.abs(earliestLoadedDay.zPos - this.stage.camera.position.z)
      if (dist < this.blockLoadZThreshold) {
        console.log('load earlier')
        this.state.loadDayRequested = true
        let prevDay = moment(earliestLoadedDay.timeStamp).subtract(1, 'day').toDate().valueOf()
        this.loadBlocks(prevDay, earliestDayIndex + 1)
      }
    }

    /* this.state.hashRate = this.state.currentDay.hashRate
    this.state.audioFreqCutoff = map(this.state.hashRate, 0.0, 20000000.0, 50.0, 15000) // TODO: set upper bound to max hashrate from blockchain.info

    console.log(this.state.audioFreqCutoff)

    this.audio.setAmbienceFilterCutoff(this.state.audioFreqCutoff)
    */
  }

  animateTree () {
    if (this.state.view === 'block') {
      if (this.treeGroup) {
        this.state.currentBlockObject.rotation.y += 0.001
        this.treeGroup.rotation.y += 0.001
      }
    }
  }

  animateBlockOpacity () {
    for (const dayIndex in this.state.dayGroups) {
      if (this.state.dayGroups.hasOwnProperty(dayIndex)) {
        const dayGroup = this.state.dayGroups[dayIndex]
        for (let meshIndex = 0; meshIndex < dayGroup.children.length; meshIndex++) {
          const mesh = dayGroup.children[meshIndex]
          if (mesh.material.visible === false) {
            mesh.material.visible = true
            break
          }
        }
      }
    }
  }

  updateLights () {
    this.stage.pointLight.position.lerp(this.pointLightTarget, 0.5)
  }

  onUpdate () {
    TWEEN.update()
    this.updateLights()
    this.checkMouseIntersection()
    this.animateTree()
    this.animateBlockOpacity()
  }
}
