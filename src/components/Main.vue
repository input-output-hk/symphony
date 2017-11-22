<template>
  <div>
    <div class='main'>
      <router-view class='big' :blocks='blocks' :focusOnBlock='focusOnBlock'/>
      <graph v-if='blocks.length > 0'/>
    </div>
    <webgl :blocks='blocks' :focusOnBlock='focusOnBlock'/>
  </div>
</template>

<script>
import { getLatestBlock, getBlocksSince } from '../data/btc'
import moment from 'moment'
import webgl from './WebGL'
import graph from './Graph'
import cfg from '../js/Config'

export default {
  name: 'home',
  components:{ webgl, graph },
  props: ['date', 'block'],
  asyncComputed: {

    focusOnBlock: async ({ block }) => block && await getBlock(block),

    blocks: {
      async get({ date }){
        if(!date) return []
        const a = moment(date).subtract(cfg.daysToLoad, 'days').startOf('day').toDate()
        const b = moment(date).endOf('day').toDate()
        return await getBlocksSince(a, b)
      },
      default: []
    }
  }
}
</script>
<style scoped>
  @import "../assets/common.css";

  .main{
    position: absolute;
    /*bottom: 0;*/
    /*left: 0;*/
    width: 90vw;
    padding: 5rem;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    height: 90vh;
  }

  .flex{
    display:flex;
    flex-direction: column;
  }

  .big{
    flex: 1;
  }
</style>
