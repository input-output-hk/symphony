<template>
  <div>
    <router-view></router-view>
    <webgl/>
  </div>
</template>

<script>
import { getDay } from '../data/btc'
import moment from 'moment'
import webgl from './webgl'

export default {
  name: 'home',
  components:{ webgl },
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
