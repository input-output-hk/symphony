<template>
  <div class='graph'>
    <svg width='100%' :height='height' viewBox='0 0 100 100' preserveAspectRatio='none'>
      <!-- <rect x="0" y="0" width='100%' :height='height' stroke='black' fill='none'/> -->
      <polyline fill="rgba(0, 0, 0, 1.0)" stroke="black" :points='graph.map((n, i) => [`${i/graph.length*100}`, n].join(","))'/>
      <text :x='width' y='10' >{{ this.max }}</text>
      <text :x='width' :y='height' >{{ this.min }}</text>
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

        // To fill the graph we need 2 additional points at the start and end
        this.graph = [ 100 ].concat(this.graph, [ 100 ])
      })
  }
}

</script>
<style scoped>

  rect, polyline {
    vector-effect: non-scaling-stroke;
    shape-rendering: geometricPrecision;
  }

  /*.graph{
    position: absolute;
    bottom: 0;
    width: 100vw;
  }*/

</style>
