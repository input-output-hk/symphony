import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from './Home'

Vue.config.productionTip = false

Vue.use(VueRouter)

const routes = [
  { path: '/', component: Home }
]

const router = new VueRouter({ routes, mode: 'history' })

/* eslint-disable no-new */
new Vue({ router }).$mount('#app')
