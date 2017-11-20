<template>
  <div>
    <br><b>Day:</b> {{ this.date }}</br>
    <br><b>Number of Blocks:</b> {{ this.numBlocks }}</br>
    <!-- <br><b>Fee:</b> {{ this.fee }}</br>
    <br><b>Value:</b> {{ this.value.toLocaleString('USD') }}</br>
    <router-link to='/2017-11-02'>PREV DAY</router-link> -->
    <!-- <router-link :to='this.prevDay'>{{ this.prevDay }}</router-link> -->
    <!-- <router-link v-if='this.isBeforeToday' :to='this.nextDay'>{{ this.nextDay }}</router-link> -->
    <!-- <webgl/> -->
  </div>
</template>

<script>
import { getBlocksSince } from '../data/btc'
import format from '../utils/dateformat'
import moment from 'moment'
import webgl from './WebGL'

export default {
  name: 'day',
  props: {
    blocks: {
      type: Array,
      default: _ => []
    },
    date:{
      type: String,
      default: moment().format('YYYY-MM-DD')
    }
  },
  computed:{
    numBlocks({ blocks, date }) {
      const time = moment(date).startOf('day').toDate() / 1000
      return blocks.filter(block => block.time > time).length
    }
  }
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
