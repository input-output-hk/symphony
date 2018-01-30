import 'babel-polyfill'
import { earliestKnownBlock, lastKnownBlock, getBlock, db } from './db'
import { getLatestBlocksSince, apiCode } from './blockchain'
const admin = require('firebase-admin')
// import { getBlock } from 'blockchain.info/blockexplorer'

const update = async () => {
  const earliest = await earliestKnownBlock()
  let block = await lastKnownBlock()
  let dbBlock
  let blockhash = block.prev_block
  let transactions
  // let next_block

  // console.log( 'Starting from', block.height )
  let i = 0
  // while (blockhash !== earliest.hash) {
  while (i < 1) {
    i++
    // console.log( block)
    // dbBlock = db.where('hash', '==', blockhash)
    // block = await dbBlock.get().then(({ docs }) => docs[docs.length - 1].data())
    // update Value
    transactions = db.where('hash', '==', blockhash).get()
      .then(({ docs }) => docs[0].ref.collection('metadata')).get()
      .then(({ docs }) => docs[0].data())
      .then(console.log)

    console.log(transactions)

    // dbBlock.update({ next_block: blockhash,  })
    blockhash = block.prev_block
    // console.log( 'Adding block', block.height )
    // await addBlock(block)
  }
  // return block.block_index
}

/*
  Sometimes we run into rate limiting on the BTC api, so we pause for 10 seconds
  before starting again
*/
// const run = async () => {
//   console.log( '--- RESUMING ----')
//   try{
//     await populate()
//   } catch(e){
//     console.error( e)
//     console.log( '--- PAUSING FOR 10 ----' )
//     setTimeout( run, 10000 )
//   }
// }

// console.log(checkForNewBlocks())
update()
