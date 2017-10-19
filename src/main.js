import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from './Home'
import { getBlocksOnDay, getTransactionFeesOverTime } from './data/btc'

Vue.config.productionTip = false

Vue.use(VueRouter)

const routes = [
  { path: '/', component: Home }
]

const router = new VueRouter({ routes, mode: 'history' })

/*
  Get all blocks that have occured today
*/
const today = Date.now()
const blocks = []
getBlocksOnDay(today).get().then(snapshot => {
  snapshot.forEach(doc => blocks.push(doc.data()))
})

/*
  Get a list of daily transaction fees
*/
getTransactionFeesOverTime().then(console.log)

/*
  Get an array of daily transaction values
*/
getTransactionVolumeOverTime().then(console.log)

/* eslint-disable no-new */
new Vue({ router }).$mount('#app')
