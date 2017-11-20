<template>
  <canvas id="stage"/>
</template>

<script>
import moment from 'moment'

export default {
  name: 'webgl',
  props: ['blocks', 'focusOnBlock'],
  created(){ console.log('created webgl', this.blocks, this.focusOnBlock)},
  beforeUpdate(){
    console.log('update webgl', this.blocks, this.focusOnBlock)
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
