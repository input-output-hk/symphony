<template>
  <div>
    <br><b>Day:</b> {{ this.day }}</br>
    <br><b>Number of Blocks:</b> {{ this.numBlocks }}</br>
    <br><b>Fee:</b> {{ this.fee }}</br>
  </div>
</template>

<script>
import { getDay } from '../data/btc'
import moment from 'moment'

export default {
  name: 'day',
  props: ['date'],
  data(){
    return {
      value: 0,
      fee: 0,
      numBlocks: 0,
      day: ''
    }
  },
  created(){
    getDay(moment(this.date).toDate())
      .then(({ blocks, fee, date }) => {
        this.fee = fee
        this.day = moment(date).format('MMM Do YYYY')
        this.numBlocks = blocks.length
      })
  }
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
