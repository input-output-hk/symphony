const functions = require('firebase-functions')
const admin = require('firebase-admin')
import { getLatestFullBlock } from './blockchain'

try {
  admin.initializeApp(functions.config().firebase)
}
catch (error) {
  console.log('No Firebase config available. Using IAM Service Account')
  admin.initializeApp({
    credential: admin.credential.cert(require('./iohk-orpheus-firebase-adminsdk-h3mtt-db8c7a2957.json')),
    databaseURL: 'https://iohk-orpheus.firebaseio.com'
  })
}

export const db = admin.firestore().collection('block')

export const lastKnownBlock = async () => db.orderBy('time', 'desc')
  .limit(1).get()
  .then(snapshot => snapshot.empty ? getLatestFullBlock() : snapshot.docs[0].data())

export const earliestKnownBlock = async () => db.orderBy('time')
  .limit(1)
  .get()
  .then(snapshot => snapshot.empty ? getLatestFullBlock() : snapshot.docs[0].data())
  // .then(doc => doc.exists ? )

const dbBlock = ({hash = '', time = 0, prev_block = '', next_block = '', size = 0, height = 0, relayed_by = '0.0.0.0', n_tx = 0, bits = 0, fee = 0 }) => ({
  hash, time, prev_block, size, height, relayed_by, n_tx, bits, fee, next_block
})

const dbTransaction = ({ time = 0, relayed_by = '0.0.0.0', hash = 0, tx_index = 0, size = 0, weight = 0, out = [], inputs = [] }) => {
  const input = inputs.reduce((a, b) => a + (b.prev_out ? b.prev_out.value : 0), 0) || 0
  const output = out.reduce((a, b) => a + b.value, 0) || 0
  return { time, tx_index, size, weight, input, output }
}

export const addBlock = async block => {
  const transaction = block.tx.map(dbTransaction)
  const output = transaction.reduce((a, { output }) => a + output, 0) || 0
  const input = transaction.reduce((a, { input }) => a + input, 0) || 0
  // const fee = output - input
  const dbBlockRef = db.doc(String(block.block_index))
  await dbBlockRef.set({ ...dbBlock(block), input, output }, { merge: true })
  await dbBlockRef.collection('metadata').add({ transaction })
}
