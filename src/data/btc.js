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

/**
 * Get hash rate to nearest day
 */
export const getHashRateforDay = (startTimestamp) => {
  return new Promise((resolve, reject) => {
    axios.get(`https://api.blockchain.info/charts/hash-rate?timespan=1days&format=json&start=${startTimestamp}&cors=true`)
      .then((data) => {
        let hashRates = formatTimeSeries(data)
        if (typeof hashRates.values[0] !== 'undefined') {
          resolve(hashRates.values[0])
        } else {
          resolve(null)
        }
      })
      .catch((error) => {
        reject(error)
      })
  })
}

/**
 * Attach hash rates to days array
 */
export const assignHashRates = (daysArray) => {
  let numberOfDays = daysArray.length
  let daysProcessed = 0
  return new Promise((resolve, reject) => {
    daysArray.forEach((dayData) => {
      let timestampInMs = dayData.timeStamp / 1000
      getHashRateforDay(timestampInMs)
      .then((hashRate) => {
        dayData.hashRate = hashRate
        daysProcessed++
        if (daysProcessed === numberOfDays) {
          // add hash rate from previous day to current day if it doesn't exist
          if (daysArray[0].hashRate === null) {
            daysArray[0].hashRate = daysArray[1].hashRate
          }
          resolve()
        }
      })
      .catch((error) => {
        daysProcessed++
        dayData.hashRate = null
        console.log(error)
      })
    })
  })
}

/*
  Returns a block from a given hash
*/
export const getBlock = hash => blocks.where('hash', '==', hash)
  .get()
  .then(({ docs }) => Block(docs[0].data()))

/*
  Returns all the blocks that occured on the current date 00:01 - 00:00
*/
export const getBlocksOnDay = (date, sortDateAsc) => {
  const fromDay = new Date(date)
  fromDay.setMilliseconds(0)
  fromDay.setSeconds(0)
  fromDay.setMinutes(0)
  fromDay.setHours(0)

  const toDay = new Date(fromDay.getTime())
  toDay.setHours(toDay.getHours() + 24)

  return getBlocksSince(fromDay, toDay)
}

export const getBlocksSince = (fromDate, toDate = new Date()) => blocks
  .orderBy('time', 'asc')
  .startAt(fromDate / 1000)
  .endAt(toDate / 1000)
  .get()
  .then(({ docs }) => docs.map(doc => Block(doc.data())))

export const getDay = async (date, toDate = new Date()) => {
  const blocks = await getBlocksSince(date, toDate)
  const fee = blocks.reduce((a, { fee }) => a + fee, 0) || 0
  const input = blocks.reduce((a, { input }) => a + input, 0) || 0
  const output = blocks.reduce((a, { output }) => a + output, 0) || 0
  // const value = blocks.reduce((a, b => a + b.value, 0))
  return { date, blocks, fee, input, output }
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
