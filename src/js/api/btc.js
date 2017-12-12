import axios from 'axios'
import firebase from 'firebase'
import 'firebase/firestore'

/**
 * API methods for interacting with data store
 */
export default class BTC {
  constructor () {
    this.init()
  }

  init () {
    this.initDataStore()
  }

  initDataStore () {
    firebase.initializeApp({
      apiKey: 'AIzaSyCkC_zpHJhgYkS-IbN_OwvZSjb4NfcN28g',
      projectId: 'iohk-orpheus'
      // authDomain: '### FIREBASE AUTH DOMAIN ###',
    })

    // Initialize Cloud Firestore through Firebase
    this.blocks = firebase.firestore().collection('block')
  }

  formatTimeSeries ({ data }) {
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
  getTransactionFeesOverTime (start, end) {
    axios.get('https://api.blockchain.info/charts/transaction-fees?timespan=all&format=json&cors=true')
    .then(this.formatTimeSeries)
  }

  getTransactionVolumeOverTime (start, end) {
    axios.get('https://api.blockchain.info/charts/estimated-transaction-volume?format=json&cors=true')
    .then(this.formatTimeSeries)
  }

  /**
   * Get hash rate to nearest day
   */
  getHashRateforDay (startTimestamp) {
    return new Promise((resolve, reject) => {
      axios.get(`https://api.blockchain.info/charts/hash-rate?timespan=1days&format=json&start=${startTimestamp}&cors=true`)
      .then((data) => {
        let hashRates = this.formatTimeSeries(data)
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
  assignHashRates (daysArray) {
    let numberOfDays = daysArray.length
    let daysProcessed = 0
    return new Promise((resolve, reject) => {
      daysArray.forEach((dayData) => {
        let timestampInMs = dayData.timeStamp / 1000
        this.getHashRateforDay(timestampInMs)
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

  /**
   * Returns a block from a given hash
   */
  getBlock (hash) {
    return new Promise((resolve, reject) => {
      this.blocks.where('hash', '==', hash)
      .get()
      .then(({docs}) => {
        resolve(docs[0].data())
      })
    })
  }

  /**
   * Returns all the blocks that occured on the current date 00:01 - 00:00
   */
  getBlocksOnDay (date, sortDateAsc) {
    const fromDay = new Date(date)
    fromDay.setMilliseconds(0)
    fromDay.setSeconds(0)
    fromDay.setMinutes(0)
    fromDay.setHours(0)

    const toDay = new Date(fromDay.getTime())
    toDay.setHours(toDay.getHours() + 24)

    return this.getBlocksSince(fromDay, toDay)
  }

  getBlocksSince (fromDate, toDate = new Date()) {
    return new Promise((resolve, reject) => {
      let blocksArray = []
      this.blocks
        .orderBy('time', 'asc')
        .startAt(fromDate / 1000)
        .endAt(toDate / 1000)
        .get()
        .then(({ docs }) => {
          for (let index = 0; index < docs.length; index++) {
            const block = docs[index]
            blocksArray.push(block.data())
          }
          resolve(blocksArray)
        }).catch((error) => {
          console.log(error)
        })
    })
  }

  getDay (date, toDate = new Date()) {
    return new Promise((resolve, reject) => {
      this.getBlocksSince(date, toDate).then((blocks) => {
        const fee = blocks.reduce((a, { fee }) => a + fee, 0) || 0
        const input = blocks.reduce((a, { input }) => a + input, 0) || 0
        const output = blocks.reduce((a, { output }) => a + output, 0) || 0
      // const value = blocks.reduce((a, b => a + b.value, 0))
        resolve({ date, blocks, fee, input, output })
      }).catch((error) => {
        console.log(error)
      })
    })
  }

  getLatestBlock () {
    this.blocks.orderBy('time', 'desc')
      .limit(1)
      .get()
      .then(({ docs }) => docs[0].data())
  }

  getTransactionsForBlock (hash) {
    return new Promise((resolve, reject) => {
      this.blocks.where('hash', '==', hash).get()
        .then(({docs}) => docs[0].ref.collection('metadata').get())
        .then((transactions) => {
          resolve(transactions.docs[0].data().transaction)
        })
    })
  }
}
