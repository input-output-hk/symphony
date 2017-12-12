<template>
  <div>
    <!--<div id='loading' v-if='blocks.length == 0'>
      <div class='c'>
        <h1>Project Orpheus</h1>
        <br/>
        <h4>Orpheus is an audio visual exploration of the blockchain. Blocks are represented as crystal strucures distributed in a spiral. Each rotation of the spiral represents a day in the blockchain</h4>
      </div>
    </div>-->
    <canvas id="stage" />
  </div>
</template>

<script>
import SceneManager from '../js/SceneManager'

export default {
  name: 'webgl',
  props: {
    date: String,
    block: String,
    onBlockSelected: {
      type: Function,
      default: _ => console.log( 'Block Selected, but no event listener declared')
    },
    onDayChanged: {
      type: Function,
      default: _ => console.log( 'Day changed, but no event listener declared')
    }
  },
  mounted(){
    this.app = new SceneManager()
    if(this.date) this.app.scene.setDate(this.date)
    if(this.block) this.app.scene.loadBlock(this.block)

    document.addEventListener('keydown', event => {
        let isEscape = false
        if ('key' in event) {
          isEscape = (event.key === 'Escape' || event.key === 'Esc')
        } else {
          isEscape = (event.keyCode === 27)
        }
        if (isEscape) {
          const date = new Date(this.app.scene.state.currentBlock.time * 1000)
          this.onDayChanged(date)
          this.resetDayView()
        }
    }, false)

    
    const dayChanged = (event) => {
      console.log('Fuck Nuggets')
    }

    this.app.scene.on('blockSelected', block => {
      if(!this.block){
        this.onBlockSelected(block)
      }
    })
    this.app.scene.on('dayChanged', ({ timeStamp }) => this.onDayChanged(new Date(Math.min(Date.now(), timeStamp))))
    // console.log('create webgl', this.blocks, this.focusOnBlock)
  },
  beforeUpdate(){
    // console.log('update webgl', this.blocks, this.focusOnBlock)
    // if( this.blocks && this.blocks.length > 0 ){
    //
    // }
    //console.log( moment(this.blocks[0].time * 1000 ).startOf('day').toDate().valueOf() )
    /*const days = this.blocks.reduce((map, block) => {
      const dayMs = getDayInMs(block.time * 1000)
      if (map.has(dayMs)) {
        map.get(dayMs).push(block)
      } else {
        map.set(dayMs, [block])
      } 
      return map
    }, new Map())

    let daysArray = []
    days.forEach((day, timeStamp) => {
      let dayData = {
        blocks: day,
        timeStamp: timeStamp
      }
      daysArray.push(dayData)
    })

    // sort by days desc
    daysArray.sort((a, b) => {
      return b.timeStamp - a.timeStamp
    })

    // assign hash rates to days
    assignHashRates(daysArray).then(() => {

      let i = 0

      const BreakException = {}

      try {
        daysArray.forEach((dayData) => {
          this.app.addDay(dayData, i++)
          //throw BreakException
        })
      } catch (e) {
        //
      }

      if (this.blocks && this.blocks.length > 0 && this.focusOnBlock) {
        this.app.movetoBlock(this.focusOnBlock.hash)
      }

    })*/

  }
}
</script>

<style scoped>
  @import "../assets/common.css";

  #loading {
    position: absolute;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .c{
    width: 500px;
  }

</style>
