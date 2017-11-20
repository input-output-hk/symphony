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

import DayScene from '../js/scenes/Day'
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
  // data(){
  //   return {
  //     value: 0,
  //     fee: '0',
  //     day: '',
  //     numBlocks: 0,
  //     blocks: [],
  //     nextDay: '',
  //     prevDay: '',
  //     isBeforeToday: false
  //   }
  // },
  // components: { webgl },
  // created(){
  //   console.log('DAY:: CREATED')
  //   // this.fetch(this.date)
  // },
  // beforeUpdate(){ console.log('DAY:: before update')},
  // beforeRouteUpdate(to, from, next){
  //   console.log('Day:: Route Update', moment(this.date).toDate())
  //   this.fetch(to.params.date)
  //   next()
  // },
  // beforeUpdate(){ console.log('Day:: Update')},
  // methods: {
  //   fetch: function(date){
  //
  //     console.log(date)
  //
  //     // let days = []
  //     let fromDate = moment(date).startOf('day')
  //     let toDate = moment(date).add(5, 'days').endOf('day')
  //
  //     // const { blocks } = await
  //     // console.log( fromDate.toDate())
  //     // console.log( toDate.toDate())
  //     this.day = fromDate.format('MMM Do YYYY')
  //     this.nextDay = moment(fromDate).add(2, 'days').format('YYYY-MM-DD')
  //     this.prevDay = moment(fromDate).subtract(1, 'days').format('YYYY-MM-DD')
  //
  //     // const blocks = await getBlocksSince(fromDate.toDate(), toDate.toDate())
  //       // .then(blocks => {
  //
  //
  //         // this.fee = Math.floor( fee / 100000000 ).toLocaleString('USD')
  //         // this.value = Math.floor( output / 100000000 )
  //         // this.day = moment(date).format('MMM Do YYYY')
  //         // this.numBlocks = blocks.length
  //         // this.blocks = blocks
  //         // console.log(blocks)
  //         // this.nextDay = moment(this.date).add(1, 'days').format('YYYY-MM-DD'),
  //         // this.prevDay = moment(this.date).subtract(1, 'days').format('YYYY-MM-DD'),
  //         // this.isBeforeToday = this.dateLiteral < moment(new Date()).startOf('day').toDate()
  //         // new DayScene(days)
  //       // })
  //   }
  // }
}
</script>

<style scoped>
  @import "../assets/common.css";
</style>
