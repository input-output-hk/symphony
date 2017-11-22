import Vue from 'vue'
import VueRouter from 'vue-router'
import Block from './components/Block'
import Day from './components/Day'
import Main from './components/Main'
import moment from 'moment'
import AsyncComputed from 'vue-async-computed'

Vue.config.productionTip = false

Vue.use(VueRouter)
Vue.use(AsyncComputed)

const routes = [
  {
    path: '/',
    component: Main,
    props: true,
    children: [
      { path: '', redirect: to => `/${moment().format('YYYY-MM-DD')}` },
      // { path: '/block/', component: Block, props: true },
      { path: '/block/:block', component: Block },
      { path: '/:date', component: Day },
    ]
  }
]

const router = new VueRouter({ routes, mode: 'history' })

/* eslint-disable no-new */
new Vue({ router }).$mount('#app')
