<template>
  <div>
    <div>WebGL Canvas</div>
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
</style>
