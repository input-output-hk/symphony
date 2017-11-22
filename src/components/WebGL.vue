<template>
  <canvas id="stage" :blocks='blocks' :focusOnBlock='focusOnBlock'/>
</template>

<script>
import DayScene from '../js/scenes/Day'

export default {
  name: 'webgl',
  props: ['blocks', 'focusOnBlock'],
  mounted(){
    // console.log('create webgl', this.blocks, this.focusOnBlock)
    this.app = new DayScene(this.blocks, this.focusOnBlock)
  },
  beforeUpdate(){
    // console.log('update webgl', this.blocks, this.focusOnBlock)
    this.app.addDay(this.blocks, 0)
  }
}
</script>

<style scoped>
  @import "../assets/common.css";

  #loading {
    position: absolute;
    width: 100vw;
    height: 100vh;
    text-align: center;
    line-height: 100vh;
  }

</style>
