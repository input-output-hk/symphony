<template>
  <div id="block-data">
    <br><b>Block:</b> <span id="block-data-hash">{{ block.hash }}</span>
    <br><b>Time:</b> <span id="block-data-time">{{ block.time }}</span>
    <br><b>Previous Block:</b> <router-link :to='block.prev_block'>{{ block.prev_block }}</router-link>
    <br><b>Next Block:</b> <router-link :to='block.next_block'>{{ block.next_block }}</router-link>
    <br><b>Size:</b> <span id="block-data-size">{{ block.size }}</span>
    <br><b>Height:</b> <span id="block-data-height"> {{ block.height }}</span>
    <br><b>Number of Transactions: </b> <span id="block-data-tx">{{ block.n_tx }}</span>
    <br><b>Bits:</b> <span id="block-data-bits"> {{ block.bits }}</span>
    <br><b>Fee:</b> BTC <span id="block-data-fee"> {{ Math.floor(block.fee / 100000000).toLocaleString('USD') }}</span>
    <br><b>Value</b> BTC <span id="block-data-value">{{ Math.floor(block.output / 100000000).toLocaleString('USD') }}</span>
  </div>
</template>

<script>

// import BlockScene from '../js/scenes/Block'
// import webgl from './WebGL'
// import { getBlock, getTransactionsForBlock } from '../data/btc'

export default {
  name: 'home',
  data: _ => ({
    block: { hash: '', time: 0, prev_block: '', next_block: '', size: 0, height: 0, relayed_by: '', n_tx: 0, bits: 0, fee: 0, input: 0, output: 0}
  })
}
</script>

<style scoped>
</style>
