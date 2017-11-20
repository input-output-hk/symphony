<template>
  <div>
    <br><b>Day:</b> {{ this.day }}</br>
    <br><b>Number of Blocks:</b> {{ this.numBlocks }}</br>
    <br><b>Fee:</b> {{ this.fee }}</br>
    <br><b>Value:</b> {{ this.value.toLocaleString('USD') }}</br>
    <router-link :to='this.prevDay'>{{ this.prevDay }}</router-link>
    <router-link v-if='this.isBeforeToday' :to='this.nextDay'>{{ this.nextDay }}</router-link>
  </div>
</template>

<script>

import DayScene from '../js/scenes/Day'

import { getDay } from '../data/btc'
import format from '../utils/dateformat'
import moment from 'moment'

export default {
  name: 'day',
  props: {
    date: {
      default: new Date()
    }
  },
  data(){
    return {
      value: 0,
      fee: '0',
      day: '',
      numBlocks: 0,
      blocks: [],
      nextDay: '',
      prevDay: '',
      isBeforeToday: false
    }
  },
  created(){this.asyncFetch()},
  //beforeUpdate(){this.asyncFetch()},
  methods: {
    asyncFetch: function(){

      getDay(moment(this.date).toDate(), 0, true)
        .then(({ blocks, fee, date, input, output }) => {
          
          this.dateLiteral = moment(this.date).startOf('day').toDate()
          this.fee = Math.floor( fee / 100000000 ).toLocaleString('USD')
          this.value = Math.floor( output / 100000000 )
          this.day = moment(date).format('MMM Do YYYY')
          this.numBlocks = blocks.length
          this.blocks = blocks
          this.nextDay = moment(this.date).add(1, 'days').format('YYYY-MM-DD'),
          this.prevDay = moment(this.date).subtract(1, 'days').format('YYYY-MM-DD'),
          this.isBeforeToday = this.dateLiteral < moment(new Date()).startOf('day').toDate()

          new DayScene(blocks, this.date)

        })
    }
  }
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
