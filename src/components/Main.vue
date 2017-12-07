<template>
  <div>
    <div class='main'>
      <router-view class='big' :blocks='blocks' :block='focusOnBlock'/>
      <!--<graph v-if='blocks.length > 0'/>-->
    </div>
    <webgl :date='date' />
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
  props: ['date'],
  mounted () {
    this.app = new SceneManager()
    this.app.scene.setDate(this.date)
    this.app.scene.loadBlocks()
  },
  asyncComputed: {

    focusOnBlock: ({block}) => {
      //console.log( 'block', block )
      //return block && getBlock(block)
    },

    blocks: {

      async get({ date }){

       /* if (!date && !this.focusOnBlock) {
          return []
        } 
        if (!date) {
          date = new Date(this.focusOnBlock.time * 1000)
        } 
        
        const a = moment(date).subtract(cfg.daysToLoad, 'days').startOf('day').toDate()
        const b = moment(date).endOf('day').toDate()

        /*this.$worker.run((a, b, btc) => {

          console.log(btc)

          btc.getDay(a, b).then((blocks) => {
            console.log(blocks)
          })

          //return `Hello, ${arg}!`
        }, [a, b, btc])
        .then(result => {
          console.log(result)
        })
        .catch(e => {
          console.error(e)
        })*/

        

        /*if (window.Worker) {
          let worker = new Worker()

          worker.addEventListener('message', function(e) {
            console.log(e.data)
            return e.data
          }, false)

          worker.postMessage(
            {
              'cmd': 'start', 
              'msg': {
                start: a, 
                end: b
              }
            }
          )
        }

        return await BTC.getBlocksSince(a, b)*/
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
