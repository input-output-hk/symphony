<template>
  <div>
    <div class='main'>
      <router-view class='big' :block='block'/>
      <!--<graph v-if='blocks.length > 0'/>-->
    </div>
    <webgl :date='date' :block='block' :onBlockSelected='changeToBlockView' :onDayChanged='changeDate'/>
  </div>
</template>

<script>
import moment from 'moment'
import webgl from './WebGL'
import graph from './Graph'
import cfg from '../js/Config'
import BTC from '../js/api/btc'
import SceneManager from '../js/SceneManager'

export default {
  name: 'home',
  components:{ webgl, graph },
  props: ['date', 'block'],
  methods:{
    changeToBlockView({ hash }){
      this.$router.push('block/'+hash)
    },
    changeDate(date){
      const dateStr = moment(date).format('YYYY-MM-DD')
      this.$router.push('/' + dateStr)
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
