import axios from 'axios'
import firebase from 'firebase'
import 'firebase/firestore'

firebase.initializeApp({
  apiKey: 'AIzaSyCkC_zpHJhgYkS-IbN_OwvZSjb4NfcN28g',
  projectId: 'iohk-orpheus'
  // authDomain: '### FIREBASE AUTH DOMAIN ###',
})

// Initialize Cloud Firestore through Firebase
const blocks = firebase.firestore().collection('blocks')

window.blocks = blocks

/*
  Get a list of BTC transaction over a time period
*/
export const getTransactionFeesOverTime = (start, end) => axios.get('https://api.blockchain.info/charts/transaction-fees?timespan=all&format=json&cors=true')
  .then(({ data }) => data.values)

export const getTransactionVolumeOverTime = (start, end) => axios.get('https://api.blockchain.info/charts/estimated-transaction-volume?format=json&cors=true')
  .then(({ data }) => data.values)

/*
  Returns a block from a given hash
*/
export const getBlock = hash => blocks.where('hash', '==', hash)

/*
  Returns all the blocks that occured on the current date 00:01 - 00:00
*/
export const getBlocksOnDay = async date => {
  const fromDay = new Date(date)
  fromDay.setMilliseconds(0)
  fromDay.setSeconds(0)
  fromDay.setMinutes(0)
  fromDay.setHours(0)

  const toDay = new Date(fromDay.getTime())
  toDay.setHours(toDay.getHours() + 24)

  const blockData = await blocks.where('time', '>=', fromDay / 1000)
    .where('time', '<', toDay / 1000)
    .get()
    .then(({ docs }) => docs.map(doc => doc.data()))

  return blockData
}

export const getDay = async date => {
  const blocks = await getBlocksOnDay(date)
  const fee = blocks.reduce((a, b) => a + b.fee, 0)
  // const value = blocks.reduce((a, b => a + b.value, 0))
  return { date, blocks, fee }
}
