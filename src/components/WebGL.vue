<template>
  <div>
    <div id='loading' v-if='blocks.length == 0'>
      <div class='c'>
        <h1>Project Orpheus</h1>
        <br/>
        <h4>Orpheus is an audio visual exploration of the block chain. Blocks are represented as crystal strucures distributed in a spiral. Each rotation of the spiral represents a day in the blockchain</h4>
      </div>
    </div>
    <canvas id="stage" :blocks='blocks' :focusOnBlock='focusOnBlock'/>
  </div>
</template>

<script>
import DayScene from '../js/scenes/Day'
import moment from 'moment'

const getDayInMs = time => moment(time ).startOf('day').toDate().valueOf()

export default {
  name: 'webgl',
  props: ['blocks', 'focusOnBlock'],
  mounted(){
    // console.log('create webgl', this.blocks, this.focusOnBlock)
    this.app = new DayScene(this.blocks, this.focusOnBlock)
  },
  beforeUpdate(){
    // console.log('update webgl', this.blocks, this.focusOnBlock)
    // if( this.blocks && this.blocks.length > 0 ){
    //
    // }
    // console.log( moment(this.blocks[0].time * 1000 ).startOf('day').toDate().valueOf() )
    const days = this.blocks.reduce((map, block) => {
      const dayMs = getDayInMs(block.time * 1000)
      if( map.has(dayMs)) map.get(dayMs).push(block)
      else map.set(dayMs, [block])
      return map
    }, new Map())

    let i = 0

    const BreakException = {}

    try {
      days.forEach((day, index) => {
        this.app.addDay(day, i++)

        // pass box positions/scales/rotations to raymarcher
        let boxes = []
        this.app.state.dayGroups.forEach((group, dayIndex) => {
          group.children.forEach((blockObject, blockIndex) => {
            if (blockIndex < 50) {
              const boxData = {
                position: [parseInt(blockObject.position.x), parseInt(blockObject.position.y), parseInt(blockObject.position.z)],
                rotation: [parseInt(blockObject.rotation.x), parseInt(blockObject.rotation.y), parseInt(blockObject.rotation.z)],
                scale: [parseInt(blockObject.geometry.parameters.width/3), parseInt(blockObject.geometry.parameters.height/3), parseInt(blockObject.geometry.parameters.depth/3)]
            }
            boxes.push(boxData)
            }
          })
        })
    
        let params = {
          boxes: boxes
        }
        this.app.raymarcher.setFragmentShader(params)

        throw BreakException
      })
    } catch (e) {
      //
    }
  }
}
</script>

<style scoped>
  @import "../assets/common.css";

  #loading {
    position: absolute;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .c{
    width: 500px;
  }

</style>
