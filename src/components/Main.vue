<template>
  <div>
    <div class='main'>
      <router-view class='big' :blocks='blocks' :block='focusOnBlock'/>
      <graph v-if='blocks.length > 0'/>
    </div>
    <webgl :blocks='blocks' :focusOnBlock='focusOnBlock'/>
  </div>
</template>

<script>
import { getBlock, getBlocksSince } from '../data/btc'
import moment from 'moment'
import webgl from './WebGL'
import graph from './Graph'
import cfg from '../js/Config'

export default {
  name: 'home',
  components:{ webgl, graph },
  props: ['date', 'block'],
  asyncComputed: {

    focusOnBlock: ({ block }) => getBlock(block),

    blocks: {
      async get({ date }){
        console.log( date )
        if(!date && !this.focusOnBlock) return []
        if(!date) date = new Date(this.focusOnBlock.time * 1000)
        console.log( date )
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
    padding: 3rem;
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
