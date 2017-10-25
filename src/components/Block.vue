<template>
  <div>
    <br><b>Block</b> <a :href='"https://blockchain.info/block/"+block.hash' target='_blank'>{{ block.hash }}</a>
    <br><b>Time</b> {{ block.time }}
    <br><b>Previous Block</b> <router-link :to='block.prev_block'>{{ block.prev_block }}</router-link>
    <br><b>Size</b> {{ block.size }}
    <br><b>Height</b> {{ block.height }}
    <br><b>Number of Transactions</b> {{ block.n_tx }}
    <br><b>Bits</b> {{ block.bits }}
    <br><b>Fee</b> {{ block.fee }}
  </div>
</template>

<script>

import BlockScene from '../js/scenes/block'

import { getBlock, getTransactionsForBlock } from '../data/btc'

export default {
  name: 'home',
  props: ['blockhash'],
  data: _ => ({
    block: { hash: '', time: 0, prev_block: '', size: 0, height: 0, relayed_by: '', n_tx: 0, bits: 0, fee: 0}
  }),
  created(){ this.asyncFetch() },
  // beforeUpdate(){ this.asyncFetch() },
  methods: {
    asyncFetch: function(){
      getBlock(this.blockhash)
        // .then(({ hash, time, prev_block, size, height, relayed_by, n_tx, bits, fee }) => {
        .then((block) => {

          this.block = block

          getTransactionsForBlock(this.blockhash).then((tx) => {

            this.block.tx = tx

            new BlockScene(block)

          })

        })
    }
  }
}
</script>

<style scoped>
</style>
