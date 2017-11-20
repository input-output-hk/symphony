<template>
  <div>
    <div class='main'>
      <router-view class='big' :blocks='blocks'/>
      <graph/>
    </div>
    <!-- <webgl :blocks='blocks' focusOn='123'/> -->
  </div>
</template>

<script>
import { getLatestBlock, getBlocksSince } from '../data/btc'
import moment from 'moment'
import webgl from './WebGL'
import graph from './Graph'

export default {
  name: 'home',
  components:{ webgl, graph },
  asyncComputed: {

    focusOnBlock: async ({ block }) => block && await getBlock(block),

    blocks: {
      async get({ date }){
        if(!date) return []
        const a = moment(date).subtract(5, 'days').startOf('day').toDate()
        const b = moment(date).endOf('day').toDate()
        // console.log( 'b', b )
        return await getBlocksSince(a, b)
      },
      default: []
    }
  },
  beforeUpdate(){
    console.log('Main: Update')
  },
  props: ['date', 'block'],
  // beforeRouteUpdate(from, to, next){
  //   console.log('Main: Route Update')
  //   next()
  // }
}
</script>
<style scoped>
  @import "../assets/common.css";

  .main{
    position: absolute;
    bottom: 0;
    left: 0;
    width: 90%;
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
