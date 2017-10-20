<template>
  <div>
    <br><b>Day:</b> {{ this.day }}</br>
    <br><b>Number of Blocks:</b> {{ this.numBlocks }}</br>
    <br><b>Fee:</b> {{ this.fee }}</br>
    <router-link :to='this.prevDay'>{{ this.prevDay }}</router-link>
    <router-link v-if='this.isBeforeToday' :to='this.nextDay'>{{ this.nextDay }}</router-link>
  </div>
</template>

<script>
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
      nextDay: '',
      prevDay: '',
      isBeforeToday: false
    }
  },
  // computed: {
  //   dateLiteral: _ => moment(this.date).startOf('day').toDate()
  // },
  created(){this.asyncFetch()},
  beforeUpdate(){this.asyncFetch()},
  methods: {
    asyncFetch: function(){
      getDay(moment(this.date).toDate())
        .then(({ blocks, fee, date }) => {
          this.dateLiteral = moment(this.date).startOf('day').toDate()
          this.fee = fee.toLocaleString('USD')
          this.day = moment(date).format('MMM Do YYYY')
          this.numBlocks = blocks.length
          this.nextDay = moment(this.date).add(1, 'days').format('YYYY-MM-DD'),
          this.prevDay = moment(this.date).subtract(1, 'days').format('YYYY-MM-DD'),
          this.isBeforeToday = this.dateLiteral < moment(new Date()).startOf('day').toDate()
        })
    }
  }
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
