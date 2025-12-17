import App from './App'

// #ifndef MP
// 处理 mqtt.js app环境下兼容问题，强制返回 SocketTask
// App 启动后启动前台服务
uni.connectSocket = (function(connectSocket) {
	return function(options) {
		console.log(options)
		options.success = options.success || function() {}
		return connectSocket.call(this, options)
	}
})(uni.connectSocket)
// #endif

// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import uView from 'uview-plus'

export function createApp() {
  const app = createSSRApp(App)
  app.use(uView)
  return {
    app
  }
}
// #endif

