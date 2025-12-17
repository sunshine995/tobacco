<script>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { pushNotification } from '@/utils/notificationHelper.js'
import { mqttClient } from '@/utils/MqttService.js'

export default {
  onLaunch(options) {
    console.log('App Launch')
    
    // 初始化通知服务
    pushNotification.init()
    
    // 监听通知点击
    pushNotification.addClickListener((data) => {
      console.log('App全局: 通知被点击', data)
      
      // 可以根据不同的通知类型处理
      if (data.payload && data.payload.type === 'mqtt') {
        // MQTT消息通知
        uni.$emit('notification-clicked-mqtt', data)
      }
    })
    
    // 检查自动登录
    this.checkAutoLogin()
  },
  
  onShow(options) {
    console.log('App Show')
    
    // 应用回到前台时，可以处理一些逻辑
    uni.$emit('app-foreground')
  },
  
  onHide() {
    console.log('App Hide')
    
    // 应用进入后台
    uni.$emit('app-background')
  },
  
  methods: {
    // 检查自动登录
    async checkAutoLogin() {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userId')
      
      if (token && userId) {
        try {
          // 自动连接MQTT
          await mqttClient.connect()
          
          // 自动订阅主题
          await mqttClient.subscribe(`user/${userId}/notice`, (message) => {
            console.log('自动登录后收到消息:', message)
          })
          
          await mqttClient.subscribe('workshop/notice', (message) => {
            console.log('自动登录后收到车间通知:', message)
          })
          
          console.log('自动登录成功，MQTT已连接')
        } catch (error) {
          console.error('自动登录失败:', error)
        }
      }
    }
  }
}
</script>