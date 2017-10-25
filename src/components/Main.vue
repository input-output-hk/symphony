<template>
  <div>
    <div class='main'>
      <router-view class='big'/>
      <graph/>
    </div>
    <webgl />
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

  .main{
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    /*height: 100vh;*/
  }

  .big{
    flex: 1;
  }
</style>
