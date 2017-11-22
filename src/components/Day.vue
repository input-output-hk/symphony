<template>
  <div class='info'>
    <div class='split'>
      <h1>BTC</h1>
      <h2>${{ Math.round(total).toLocaleString() }}</h2>
    </div>
    <hr/>
    <br/>
    <h4>Date - {{ calendar }}</h4>
    <br/>
    <p>This is a visualisation of Bitcoin. It shows blocks from <b>{{ calendar.toLowerCase() }}</b>. Here blocks are represented by crystal structures distributed in a spiral.</p>
    <p>Each revolution of the spiral is a day</p>
    <hr/>
    <br/>
    <p>$ - There were <u>{{ totalNumTransaction }} transactions</u> made averaging <u>$1.5BTC in fees</u> per transaction. This is the </p>
    <p>For that day each transcation cost around 215 kilowatt-hours of energy</p>

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
    },
    calendar:{
      type: String,
      default: moment().calendar()
    }
  },
  computed:{
    numBlocks({ blocks, date }) {
      const time = moment(date).startOf('day').toDate() / 1000
      return blocks.filter(block => block.time > time).length
    },
    total({ blocks, date }) {
      // const time = moment(date).startOf('day').toDate() / 1000
      return blocks.reduce((value, block) => block.input + value, 0 ) / 10000000
    },
    totalNumTransaction({ blocks, date }) {
      // const time = moment(date).startOf('day').toDate() / 1000
      return blocks.reduce((n, block) => block.n_tx + n, 0 )
    }
  }
}
</script>

<style scoped>
  @import "../assets/common.css";

  .info{
    width: 500px;
  }

  .split{
    display: flex;
  }

  .split > h1{
    flex: 1;
  }
</style>
