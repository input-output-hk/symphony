<template>
  <div>
    <router-view/>
    <graph/>
    <webgl/>
  </div>
</template>

<script>
import { getDay } from '../data/btc'
import moment from 'moment'
import webgl from './webgl'
import graph from './graph'

export default {
  name: 'home',
  components:{ webgl, graph },
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
