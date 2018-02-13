import { addBlock } from './db'
const btc = require('blockchain.info/blockexplorer')
export const apiCode = 'f1dd94da-bfc0-46b2-932c-935f53bb352d'
export const getLatestFullBlock = async () => btc.getLatestBlock({apiCode}).then(({ hash }) => btc.getBlock(hash, {apiCode}))

// Builds the chain of blocks from the latest to the current hash
export const getLatestBlocksSince = async function (lastKnownHash) {
  let block = await getLatestFullBlock()
  let blockhash = block.hash

  while (block.next_block !== lastKnownHash) {
    console.log('adding', block)
    await addBlock(block)
    block = await btc.getBlock(block.prev_block, {apiCode})
    block.next_block = blockhash
    blockhash = block.hash
  }
}
