// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueRouter from 'vue-router'
import { sync } from 'vuex-router-sync'

import ElementUI from 'element-ui'
import locale from 'element-ui/src/locale/lang/en'
import 'element-ui/lib/theme-default/index.css'

import BootstrapVue from 'bootstrap-vue'

import iView from 'iview'
import 'iview/dist/styles/iview.css'
import VueWidgets from 'vue-widgets'
import 'vue-widgets/dist/styles/vue-widgets.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import VueParticles from 'vue-particles'

import VueSweetAlert from 'vue-sweetalert'

import { store } from './store'
import psl from 'psl'
Vue.use(iView)
Vue.use(VueWidgets)

Vue.use(BootstrapVue)
Vue.use(VueParticles)
Vue.use(VueSweetAlert)

Vue.config.productionTip = false

Vue.use(ElementUI, { locale })

var VueCookie = require('vue-cookie')
Vue.use(VueCookie)

// Routing logic
Vue.use(VueRouter)
// Some middleware to help us ensure the user is authenticated.
router.beforeEach((to, from, next) => {
	// window.console.log('Transition', transition)
	// router.app.$store.state.token
	let obId = false
	let location = psl.parse(window.location.hostname) // get parent domain
	location = location.domain === null ? location.input : location.domain

	if (to.query.ob_id) {
		obId = to.query.ob_id
	}
	if (to.query.token) {
		router.app.$cookie.set('auth_token', to.query.token, { expires: 1, domain: location })
		console.log('After social login: ', router.app.$cookie.get('auth_token'))
	}
	const token = router.app.$cookie.get('auth_token')
	if (to.matched.some(record => record.meta.requiresAuth) && obId) {
		window.console.log('ob_id obtained')
		next({
			path: '/email-verification',
			query: { ob_id: obId }
		})
	} else if (to.matched.some(record => record.meta.requiresAuth) && (!token || token === 'null')) {
		window.console.log('Not authenticated', token)
		next({
			path: '/login',
			query: { redirect: to.fullPath }
		})
	} else {
		if (to.matched.some(record => record.meta.requiresAuth)) {
			store.dispatch('authenticate', token).then(response => {
				next()
			}).catch(error => {
				console.log(error)
				if (error.response.data === 'invalid token') {
					router.app.$cookie.delete('auth_token')
				}
				// window.console.log('Not authenticated')
				next({
					path: '/login',
					query: { redirect: to.fullPath }
				})
			})
		} else {
			if (to.path === '/login' && token) {
				next({
					path: '/user-dashboard'
				})
			} else {
				next()
			}
		}
	}
})

sync(store, router)

/* eslint-disable no-new */
new Vue({
	store,
	el: '#app',
	router,
	template: '<App/>',
	components: { App }
})
