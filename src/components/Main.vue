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
      console.log(hash)
      this.$router.push('block/'+hash)
    },
    changeDate(date){
      console.log( date )
      const dateStr = moment(date).format('YYYY-MM-DD')
      this.$router.push('/' + dateStr)
    }
  },
  // asyncComputed: {

  //   focusOnBlock: ({block}) => {
  //     //console.log( 'block', block )
  //     //return block && getBlock(block)
  //   },

  //   blocks: {

  //     async get({ date }){

  //      /* if (!date && !this.focusOnBlock) {
  //         return []
  //       } 
  //       if (!date) {
  //         date = new Date(this.focusOnBlock.time * 1000)
  //       } 
        
  //       const a = moment(date).subtract(cfg.daysToLoad, 'days').startOf('day').toDate()
  //       const b = moment(date).endOf('day').toDate()

  //       /*this.$worker.run((a, b, btc) => {

  //         console.log(btc)

  //         btc.getDay(a, b).then((blocks) => {
  //           console.log(blocks)
  //         })

  //         //return `Hello, ${arg}!`
  //       }, [a, b, btc])
  //       .then(result => {
  //         console.log(result)
  //       })
  //       .catch(e => {
  //         console.error(e)
  //       })*/

        

  //       /*if (window.Worker) {
  //         let worker = new Worker()

  //         worker.addEventListener('message', function(e) {
  //           console.log(e.data)
  //           return e.data
  //         }, false)

  //         worker.postMessage(
  //           {
  //             'cmd': 'start', 
  //             'msg': {
  //               start: a, 
  //               end: b
  //             }
  //           }
  //         )
  //       }

  //       return await BTC.getBlocksSince(a, b)*/
  //     },
  //     default: []
  //   }
  // }
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
