import Vue from 'vue'
import VueRouter from 'vue-router'
import Block from './components/Block'
import Day from './components/Day'
import moment from 'moment'

Vue.config.productionTip = false

Vue.use(VueRouter)

const routes = [
  { path: '/block/:blockid', component: Block, props: true },
  { path: '/:date', component: Day, props: true },
  { path: '/', redirect: to => `/${moment().format('YYYY-MM-DD')}` }
]

const router = new VueRouter({ routes, mode: 'history' })

/* eslint-disable no-new */
new Vue({ router }).$mount('#app')
