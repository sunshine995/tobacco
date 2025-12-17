// utils/mqtt-with-notification.js
import mqtt from 'mqtt/dist/mqtt'
import { pushNotification } from './notificationHelper.js'

// MQTT 配置
const MQTT_CONFIG = {
  host: '192.168.3.185',
  port: 8083,
  username: 'admin',
  password: 'yyg198295',
  clientId: `uniapp_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`
}

class MQTTClientWithNotification {
  constructor() {
    this.client = null
    this.isConnected = false
    this.subscriptions = new Map()
    this.reconnectInterval = 5000
    this.maxReconnectAttempts = 10
    this.reconnectAttempts = 0
    this.config = null
    
    // 初始化通知服务
    pushNotification.init()
  }
  
  // 初始化配置
  init(config = null) {
    const defaultConfig = {
      ...MQTT_CONFIG,
      options: {
        keepalive: 60,
        clean: true,
        reconnectPeriod: 4000,
        connectTimeout: 4000,
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        clientId: MQTT_CONFIG.clientId,
      }
    }
    
    this.config = config || defaultConfig
    
    if (!this.config.options.clientId) {
      this.config.options.clientId = `uniapp_${Date.now()}_${Math.random().toString(16).substr(2, 8)}`
    }
  }
  
  // 连接 MQTT
  connect() {
    return new Promise((resolve, reject) => {
      if (!this.config) {
        this.init()
      }
      
      if (this.isConnected && this.client) {
        resolve(this.client)
        return
      }
      
      // 检查通知权限
      pushNotification.checkNotificationPermission().then((hasPermission) => {
        if (!hasPermission) {
          console.warn('没有通知权限，消息将无法显示')
        }
        
        // 构建 WebSocket URL (App使用wx://)
        const wsUrl = `wx://${this.config.host}:${this.config.port}/mqtt`
        
        console.log('正在连接 MQTT:', wsUrl)
        
        try {
          this.client = mqtt.connect(wsUrl, this.config.options)
          
          // 连接成功
          this.client.on('connect', () => {
            console.log('MQTT 连接成功')
            this.isConnected = true
            this.reconnectAttempts = 0
            resolve(this.client)
          })
          
          // 接收消息
          this.client.on('message', (topic, message) => {
            console.log(`收到 MQTT 消息 [${topic}]:`, message.toString())
            
            // 1. 处理订阅的回调
            this.handleMessage(topic, message)
            
            // 2. 显示本地通知（无论应用在前台还是后台）
            pushNotification.showMqttNotification(topic, message)
          })
          
          // 连接错误
          this.client.on('error', (error) => {
            console.error('MQTT 连接错误:', error)
            reject(error)
          })
          
          // 连接断开
          this.client.on('close', () => {
            console.log('MQTT 连接断开')
            this.isConnected = false
            this.handleReconnect()
          })
          
          // 断开连接
          this.client.on('disconnect', () => {
            console.log('MQTT 客户端断开连接')
            this.isConnected = false
          })
          
        } catch (error) {
          console.error('MQTT 连接异常:', error)
          reject(error)
        }
      })
    })
  }
  
  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('已达到最大重连次数')
      return
    }
    
    this.reconnectAttempts++
    console.log(`正在重连... 第 ${this.reconnectAttempts} 次`)
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect().catch(err => {
          console.error('重连失败:', err)
        })
      }
    }, this.reconnectInterval)
  }
  
  // 订阅主题
  subscribe(topic, callback, options = { qos: 0 }) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.client) {
        reject(new Error('MQTT 客户端未连接'))
        return
      }
      
      this.client.subscribe(topic, options, (err) => {
        if (err) {
          console.error(`订阅失败 [${topic}]:`, err)
          reject(err)
        } else {
          console.log(`订阅成功: ${topic}`)
          if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, [])
          }
          this.subscriptions.get(topic).push(callback)
          resolve()
        }
      })
    })
  }
  
  // 处理消息（调用订阅回调）
  handleMessage(topic, message) {
    const callbacks = this.subscriptions.get(topic)
    if (callbacks) {
      let payload
      try {
        payload = JSON.parse(message.toString())
      } catch (e) {
        payload = message.toString()
      }
      
      callbacks.forEach(callback => {
        try {
          callback(payload, topic)
        } catch (error) {
          console.error('消息回调错误:', error)
        }
      })
    }
  }
  
  // 发布消息
  publish(topic, message, options = { qos: 0, retain: false }) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.client) {
        reject(new Error('MQTT 客户端未连接'))
        return
      }
      
      const payload = typeof message === 'object' ? JSON.stringify(message) : String(message)
      
      this.client.publish(topic, payload, options, (err) => {
        if (err) {
          console.error(`发布失败 [${topic}]:`, err)
          reject(err)
        } else {
          console.log(`发布成功 [${topic}]:`, message)
          resolve()
        }
      })
    })
  }
  
  // 断开连接
  disconnect() {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(false, () => {
          this.client = null
          this.isConnected = false
          this.subscriptions.clear()
          console.log('MQTT 已断开连接')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
  
  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.config?.options?.clientId,
      host: this.config?.host,
      port: this.config?.port
    }
  }
}

// 创建单例
export const mqttClient = new MQTTClientWithNotification()
export { MQTT_CONFIG }