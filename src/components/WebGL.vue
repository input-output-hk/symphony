<template>
  <div>
    <div id="loading">Loading...</div>
    <canvas id="stage" />
  </div>
</template>

<script>
import { getDay } from '../data/btc'
import moment from 'moment'

export default {
  name: 'webgl'
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
