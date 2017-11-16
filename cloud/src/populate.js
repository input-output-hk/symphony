import "babel-polyfill"
import { addBlock, earliestKnownBlock, lastKnownBlock } from './db'
import { getLatestBlocksSince, apiCode } from './blockchain'
import { getBlock } from 'blockchain.info/blockexplorer'
import axios from 'axios'

// Should really remove this
const getAverageBlockTime = async () => axios('https://blockchain.info/q/interval').then(({ data }) => data )

const populate = async () => {
  let earliest = await earliestKnownBlock()
  let block = await getBlock(earliest.hash, {apiCode})
  console.log( 'Starting from', block.height )
  while( block ){

    block = await getBlock(block.prev_block, {apiCode})
    console.log( 'Adding block', block.height )
    await addBlock(block)
  }
  return block.block_index
}

export const checkForNewBlocks = async function () {
  // Get the last block in the database
  const block = await lastKnownBlock()
  console.log('checking from block', block)

  // and the average block time
  const blocktime = await getAverageBlockTime()

  // If enough time has passed since the last block, then check for any new ones
  console.log('Time passed', Date.now() / 1000 - block.time)
  console.log('block time', blocktime)
  if (Date.now() / 1000 - block.time > blocktime) {
    console.log('Enough time has passed for a new block to appear', Date.now() / 1000 , block.time, blocktime )
    // Get all the latest BTC blocks since the last one in the db
    await getLatestBlocksSince(block.hash)
    // block.forEach(block => addBlock(block))
    return 'Blocks addeds'
  }

  return 'no blocks added'
}

/*
  Sometimes we run into rate limiting on the BTC api, so we pause for 10 seconds
  before starting again
*/
const run = async () => {
  console.log( '--- RESUMING ----')
  try{
    await populate()
  } catch(e){
    console.error( e)
    console.log( '--- PAUSING FOR 10 ----' )
    setTimeout( run, 10000 )
  }
}

// run()
