import axios from 'axios'
import firebase from 'firebase'
import 'firebase/firestore'

/**
 * API methods for interacting with data store
 */
firebase.initializeApp({
  apiKey: 'AIzaSyCkC_zpHJhgYkS-IbN_OwvZSjb4NfcN28g',
  projectId: 'iohk-orpheus'
  // authDomain: '### FIREBASE AUTH DOMAIN ###',
})

// Initialize Cloud Firestore through Firebase
const blocks = firebase.firestore().collection('block')

export const formatTimeSeries = ({ data }) => {
  const times = []
  const values = []
  data.values.forEach(({ x, y }) => {
    times.push(x)
    values.push(y)
  })
  return { times, values }
}

/**
 * Get a list of BTC transaction over a time period
 */
export const getTransactionFeesOverTime = (start, end) => axios.get('https://api.blockchain.info/charts/transaction-fees?timespan=all&format=json&cors=true')
  .then(formatTimeSeries)

export const getTransactionVolumeOverTime = (start, end) => axios.get('https://api.blockchain.info/charts/estimated-transaction-volume?format=json&cors=true')
  .then(formatTimeSeries)

/**
 * Get hash rate to nearest day
 */
export const getHashRateforDay = startTimestamp => axios.get(`https://api.blockchain.info/charts/hash-rate?timespan=1days&format=json&start=${startTimestamp}&cors=true`)
  .then((data) => {
    let hashRates = formatTimeSeries(data)
    return hashRates && hashRates.values[0] !== undefined && hashRates.values[0]
  })

/**
 * Returns a block from a given hash
 */
export const getBlock = hash => blocks.where('hash', '==', hash)
  .get()
  .then(({docs}) => docs[0].data())
  .then(Block)

/**
 * Returns all the blocks that occured on the current date froim 00:00 - 23:59
 */
export const getBlocksOnDay = date => {
  const fromDay = new Date(date)
  fromDay.setHours(0, 0, 0, 0)

  const toDay = new Date(fromDay)
  toDay.setDate(toDay.getDate() + 1)

  return getBlocksSince(fromDay, toDay)
}

export const getBlocksSince = (fromDate, toDate = new Date()) => blocks
  .orderBy('time', 'asc')
  .startAt(fromDate / 1000)
  .endAt(toDate / 1000)
  .get()
  .then(({ docs }) => docs.map(doc => Block(doc.data())))
  
export const getLatestBlock = _ => blocks
  .orderBy('time')
  .limit(1)
  .get()
  .then(({ docs }) => Block(docs[0].data()))

export const getEarliestBlock = _ => blocks
  .orderBy('time', 'desc')
  .limit(1)
  .get()
  .then(({ docs }) => Block(docs[0].data()))

export const getTransactionsForBlock = (hash, tryCount = 0) => {
  return new Promise((resolve, reject) => {
    blocks.where('hash', '==', hash).get()
      .then(({docs}) => docs[0].ref.collection('metadata').get())
      .then((transactions) => {
        try {
          resolve(transactions.docs[0].data().transaction)
        } catch (error) {
          console.log('Block: ' + hash + ' has no transactions in the DB!')
          reject(error)
        }
      }).catch((error) => {
        if (tryCount < 5) {
          console.log('Couldn\'t get transactions for block, retrying...')
          getTransactionsForBlock(hash, tryCount + 1).catch((error) => {
            reject(error)
          })
        } else {
          console.log('Couldn\'t get transactions for block, retry limit reached')
          reject(error)
        }
      })
  })
}
// }
