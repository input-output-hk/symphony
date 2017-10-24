<template>
  <div class='graph'>
    <div>Graph</div>
    <svg :width='width + 100' :height='height'>
      <rect x="0" y="0" :width='width' :height='height' stroke='black' fill='none'/>
      <polyline fill="none" stroke="black" :points='graph.map((n, i) => [i*width/graph.length, n].join(","))'/>
      <text :x='width + 5' y='10' >{{ this.max }}</text>
      <text :x='width + 5' :y='height' >{{ this.min }}</text>
    </svg>
  </div>
</template>

<script>
import { getTransactionFeesOverTime } from '../data/btc'
import { map } from '../utils/math'

export default {
  name: 'graph',
  data: _ => ({
    graph: [],
    width: 500,
    height: 100,
    min: 0,
    max: 0,
  }),
  created(){
    // const height = this.height
    getTransactionFeesOverTime()
      .then(({ values }) => {

        // Calculate the domain of the data
        this.max = Math.max(...values)
        this.min = Math.min(...values)

        // Map data domain to height of graph
        this.graph = values.map(value => map(value, this.min, this.max, this.height, 0))
      })
  }
}

</script>

<style scoped>
</style>
