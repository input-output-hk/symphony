import axios from 'axios'
import firebase from 'firebase'
import 'firebase/firestore'

firebase.initializeApp({
  apiKey: 'AIzaSyCkC_zpHJhgYkS-IbN_OwvZSjb4NfcN28g',
  projectId: 'iohk-orpheus'
  // authDomain: '### FIREBASE AUTH DOMAIN ###',
})

// Initialize Cloud Firestore through Firebase
const blocks = firebase.firestore().collection('block')

const formatTimeSeries = function ({ data }) {
  const times = []
  const values = []
  data.values.forEach(({ x, y }) => {
    times.push(x)
    values.push(y)
  })
  return { times, values }
}

const Block = block => ({ ...block, fee: block.output - block.input })

/*
  Get a list of BTC transaction over a time period
*/
export const getTransactionFeesOverTime = (start, end) => axios.get('https://api.blockchain.info/charts/transaction-fees?timespan=all&format=json&cors=true')
  .then(formatTimeSeries)

export const getTransactionVolumeOverTime = (start, end) => axios.get('https://api.blockchain.info/charts/estimated-transaction-volume?format=json&cors=true')
  .then(formatTimeSeries)

/*
  Returns a block from a given hash
*/
export const getBlock = hash => blocks.where('hash', '==', hash)
  .get()
  .then(({ docs }) => Block(docs[0].data()))

/*
  Returns all the blocks that occured on the current date 00:01 - 00:00
*/
export const getBlocksOnDay = async (date, sortDateAsc) => {
  const fromDay = new Date(date)
  fromDay.setMilliseconds(0)
  fromDay.setSeconds(0)
  fromDay.setMinutes(0)
  fromDay.setHours(0)

  const toDay = new Date(fromDay.getTime())
  toDay.setHours(toDay.getHours() + 24)

  let blocksArr = await blocks
    .where('time', '>=', fromDay / 1000)
    .where('time', '<', toDay / 1000)
    .get()
    .then(({ docs }) => docs.map(doc => Block(doc.data())))

  if (sortDateAsc) {
    blocksArr.sort((a, b) => {
      return a.time - b.time
    })
  }

  return blocksArr
}

export const getBlocksSince = (fromDate, toDate = new Date()) => blocks
  .where('time', '>=', fromDate / 1000)
  .where('time', '<=', toDate / 1000)
  .get()
  .then(({ docs }) => docs.map(doc => Block(doc.data())))

export const getDay = async (date, toDate = new Date()) => {
  const blocks = await getBlocksSince(date, toDate)
  const fee = blocks.reduce((a, { fee }) => a + fee, 0) || 0
  const input = blocks.reduce((a, { input }) => a + input, 0) || 0
  const output = blocks.reduce((a, { output }) => a + output, 0) || 0
  // const value = blocks.reduce((a, b => a + b.value, 0))
  return { date, blocks, fee, input, output, index }
}

export const getLatestBlock = _ => blocks.orderBy('time', 'desc')
  .limit(1)
  .get()
  .then(({ docs }) => docs[0].data())

export const getTransactionsForBlock = async hash => blocks.where('hash', '==', hash).get()
  .then(({docs}) => docs[0].ref.collection('metadata').get())
  .then(transactions => transactions.docs[0].data().transaction)

if (process.env.NODE_ENV === 'development') {
  window.blocks = blocks
  window.btc = { getDay, getBlocksSince, getBlock, getTransactionVolumeOverTime, getTransactionFeesOverTime, getLatestBlock, getTransactionsForBlock }
}
