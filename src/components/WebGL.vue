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

    // console.log(days)
    let i = 0
    days.forEach(day => this.app.addDay(day, i++))
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
