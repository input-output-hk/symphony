<template>
  <div>
    <div id="loading">
      <div class='c'>
        <h1>Project Orpheus</h1>
        <br/>
        <h4>
          Orpheus is an audio-visual exploration of the blockchain. 
          Blocks are represented as crystal structures distributed in a spiral. 
          Each rotation of the spiral represents a day in the blockchain.
        </h4>
        <p>&nbsp;</p>
        <h4>... Loading ...</h4>
      </div>
    </div>
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
      default: _ => console.log('Block Selected, but no event listener declared')
    },
    onDayChanged: {
      type: Function,
      default: _ => console.log('Day changed, but no event listener declared')
    }
  },
  mounted(){
    this.app = new SceneManager()
    if (this.date) {
      this.app.scene.setDate(this.date)
    }
    if (this.block) {
      this.app.scene.loadBlock(this.block)
    }

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
          this.app.scene.resetDayView()
        }
    }, false)

    
    const dayChanged = (event) => {
      console.log(event)
    }

    /*this.app.scene.on('blockSelected', block => {
      if(!this.block){
        this.onBlockSelected(block)
      }
    })
    this.app.scene.on('dayChanged', ({ timeStamp }) => this.onDayChanged(new Date(timeStamp)))*/
    
  },
  beforeUpdate(){

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
