// utils/push-notification.js
/**
 * 5+ 本地通知管理工具
 * 用于在 App 后台时显示本地通知
 */

class PushNotification {
  constructor() {
    this.initialized = false
    this.clickListeners = []
    this.messageQueue = []
    this.isAppInForeground = true
    this.initAppStateListener()
  }
  
  /**
   * 初始化应用状态监听
   */
  initAppStateListener() {
    // #ifdef APP-PLUS
    // 监听应用前后台切换
    uni.onAppShow(() => {
      this.isAppInForeground = true
      console.log('应用进入前台，处理队列消息')
      this.processMessageQueue()
    })
    
    uni.onAppHide(() => {
      this.isAppInForeground = false
      console.log('应用进入后台，启用本地通知')
    })
    // #endif
  }
  
  /**
   * 初始化通知服务
   */
  init() {
    if (this.initialized) return
    
    // #ifdef APP-PLUS
    try {
      console.log('初始化5+推送服务')
      
      // 监听通知点击事件
      plus.push.addEventListener('click', (msg) => {
        console.log('通知被点击:', JSON.stringify(msg))
        this.handleNotificationClick(msg)
      })
      
      // 监听通知接收事件
      plus.push.addEventListener('receive', (msg) => {
        console.log('收到通知:', JSON.stringify(msg))
      })
      
      this.initialized = true
      console.log('5+推送服务初始化成功')
      
    } catch (error) {
      console.error('初始化5+推送服务失败:', error)
    }
    // #endif
  }
  
  /**
   * 创建本地通知
   * @param {Object} options 通知配置
   */
  createNotification(options) {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      try {
        const {
          title = '新消息',
          content = '',
          payload = {},
          sound = 'system',
          cover = false,
          when = new Date(),
          delay = 0
        } = options
        
        console.log('创建本地通知:', { title, content, payload })
        
        // 构建通知参数
        const notificationOptions = {
          title: title,
          cover: cover,
          when: when,
          sound: sound,
          delay: delay
        }
        
        // 构建 payload
        const notificationPayload = JSON.stringify({
          ...payload,
          timestamp: Date.now(),
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
        
        // 创建通知
        plus.push.createMessage(content, notificationPayload, notificationOptions)
        
        console.log('本地通知创建成功')
        resolve(true)
        
      } catch (error) {
        console.error('创建本地通知失败:', error)
        reject(error)
      }
      // #else
      console.warn('非App环境，无法使用5+推送')
      resolve(false)
      // #endif
    })
  }
  
  /**
   * 处理通知点击
   */
  handleNotificationClick(msg) {
    try {
      let payload = {}
      try {
        payload = JSON.parse(msg.payload) || {}
      } catch (e) {
        payload = { content: msg.payload }
      }
      
      // 触发点击事件
      this.triggerClickEvent({
        id: payload.id,
        title: msg.title || '通知',
        content: msg.content,
        payload: payload,
        timestamp: payload.timestamp || Date.now()
      })
      
      // 全局事件
      uni.$emit('notification-clicked', {
        title: msg.title,
        content: msg.content,
        payload: payload
      })
      
      // 跳转到对应页面（如果有path）
      if (payload.path) {
        setTimeout(() => {
          this.navigateToPage(payload.path, payload.params || {})
        }, 500)
      }
      
    } catch (error) {
      console.error('处理通知点击失败:', error)
    }
  }
  
  /**
   * 页面跳转
   */
  navigateToPage(path, params = {}) {
    try {
      if (params && Object.keys(params).length > 0) {
        const query = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
        path = `${path}${path.includes('?') ? '&' : '?'}${query}`
      }
      
      uni.navigateTo({
        url: path,
        fail: () => {
          uni.switchTab({ url: path })
        }
      })
    } catch (error) {
      console.error('跳转页面失败:', error)
    }
  }
  
  /**
   * 处理MQTT消息，根据应用状态显示通知
   */
  handleMqttMessage(message, topic) {
    try {
      let notificationData = {}
      
      // 解析消息
      if (typeof message === 'string') {
        try {
          notificationData = JSON.parse(message)
        } catch (e) {
          notificationData = {
            title: '新通知',
            content: message,
            timestamp: Date.now()
          }
        }
      } else if (typeof message === 'object') {
        notificationData = message
      }
      
      // 确保必要的字段
      const notification = {
        title: notificationData.title || '新通知',
        content: notificationData.content || '您有新的消息',
        payload: {
          ...notificationData,
          topic: topic,
          type: 'mqtt',
          path: notificationData.path || '/pages/user/notice-list',
          params: notificationData.params || {}
        }
      }
      
      // 根据应用状态处理
      if (this.isAppInForeground) {
        // 应用在前台，添加到队列，等待处理
        this.messageQueue.push(notification)
        console.log('应用在前台，消息加入队列:', notification.title)
      } else {
        // 应用在后台，直接显示通知
        this.createNotification(notification)
      }
      
    } catch (error) {
      console.error('处理MQTT消息失败:', error)
    }
  }
  
  /**
   * 处理队列中的消息
   */
  processMessageQueue() {
    if (this.messageQueue.length === 0) return
    
    console.log('处理队列消息，数量:', this.messageQueue.length)
    
    // 应用回到前台时，可以显示一个汇总通知
    if (this.messageQueue.length > 0) {
      const lastMessage = this.messageQueue[this.messageQueue.length - 1]
      
      this.createNotification({
        title: '您有新的未读消息',
        content: `共收到 ${this.messageQueue.length} 条新消息`,
        payload: {
          type: 'summary',
          count: this.messageQueue.length,
          path: '/pages/user/notice-list'
        }
      })
      
      // 清空队列
      this.messageQueue = []
    }
  }
  
  /**
   * 显示MQTT通知的快捷方法
   */
  showMqttNotification(topic, message) {
    return this.handleMqttMessage(message, topic)
  }
  
  /**
   * 获取所有通知
   */
  getAllNotifications() {
    // #ifdef APP-PLUS
    try {
      return plus.push.getAllMessage() || []
    } catch (error) {
      console.error('获取通知列表失败:', error)
      return []
    }
    // #else
    return []
    // #endif
  }
  
  /**
   * 清空所有通知
   */
  clearAllNotifications() {
    // #ifdef APP-PLUS
    try {
      plus.push.clear()
      console.log('已清空所有通知')
    } catch (error) {
      console.error('清空通知失败:', error)
    }
    // #endif
  }
  
  /**
   * 删除指定通知
   */
  removeNotification(message) {
    // #ifdef APP-PLUS
    try {
      plus.push.remove(message)
    } catch (error) {
      console.error('删除通知失败:', error)
    }
    // #endif
  }
  
  /**
   * 获取客户端信息
   */
  getClientInfo() {
    // #ifdef APP-PLUS
    try {
      return plus.push.getClientInfo()
    } catch (error) {
      console.error('获取客户端信息失败:', error)
      return null
    }
    // #else
    return null
    // #endif
  }
  
  /**
   * 检查通知权限
   */
  checkNotificationPermission() {
    return new Promise((resolve) => {
      // #ifdef APP-PLUS
      try {
        const main = plus.android.runtimeMainActivity()
        const pkName = main.getPackageName()
        const uid = main.getApplicationInfo().plusGetAttribute('uid')
        
        // 尝试使用 AndroidX 的 NotificationManagerCompat
        let NotificationManagerCompat
        try {
          NotificationManagerCompat = plus.android.importClass('androidx.core.app.NotificationManagerCompat')
        } catch (e) {
          // 如果 AndroidX 不存在，尝试使用 support 包
          try {
            NotificationManagerCompat = plus.android.importClass('android.support.v4.app.NotificationManagerCompat')
          } catch (e2) {
            console.error('无法导入 NotificationManagerCompat', e2)
            resolve(false)
            return
          }
        }
        
        const areNotificationsEnabled = NotificationManagerCompat.from(main).areNotificationsEnabled()
        
        if (!areNotificationsEnabled) {
          // 未开启通知权限，提示用户
          uni.showModal({
            title: '通知权限开启提醒',
            content: '您还没有开启通知权限，无法接受到消息通知，请前往设置！',
            showCancel: false,
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                this.openNotificationSettings()
              }
            }
          })
          resolve(false)
        } else {
          resolve(true)
        }
      } catch (error) {
        console.error('检查通知权限失败:', error)
        resolve(false)
      }
      // #else
      resolve(true) // 非App环境默认有权限
      // #endif
    })
  }
  
  /**
   * 打开通知设置
   */
  openNotificationSettings() {
    // #ifdef APP-PLUS
    try {
      const main = plus.android.runtimeMainActivity()
      const pkName = main.getPackageName()
      const uid = main.getApplicationInfo().plusGetAttribute('uid')
      
      const Intent = plus.android.importClass('android.content.Intent')
      const Build = plus.android.importClass('android.os.Build')
      const Settings = plus.android.importClass('android.provider.Settings')
      const Uri = plus.android.importClass('android.net.Uri')
      
      let intent = new Intent()
      
      if (Build.VERSION.SDK_INT >= 26) {
        // Android 8.0及以上
        intent.setAction('android.settings.APP_NOTIFICATION_SETTINGS')
        intent.putExtra('android.provider.extra.APP_PACKAGE', pkName)
      } else if (Build.VERSION.SDK_INT >= 21) {
        // Android 5.0-7.0
        intent.setAction('android.settings.APP_NOTIFICATION_SETTINGS')
        intent.putExtra('app_package', pkName)
        intent.putExtra('app_uid', uid)
      } else {
        // Android 5.0以下
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        const uri = Uri.fromParts('package', main.getPackageName(), null)
        intent.setData(uri)
      }
      
      // 跳转到设置页面
      main.startActivity(intent)
    } catch (error) {
      console.error('打开通知设置失败:', error)
      uni.showToast({
        title: '打开设置失败',
        icon: 'none'
      })
    }
    // #endif
  }
  
  /**
   * 添加通知点击监听器
   */
  addClickListener(callback) {
    this.clickListeners.push(callback)
  }
  
  /**
   * 移除通知点击监听器
   */
  removeClickListener(callback) {
    const index = this.clickListeners.indexOf(callback)
    if (index > -1) {
      this.clickListeners.splice(index, 1)
    }
  }
  
  /**
   * 触发点击事件
   */
  triggerClickEvent(data) {
    this.clickListeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('通知点击监听器错误:', error)
      }
    })
  }
}

// 创建单例实例
export const pushNotification = new PushNotification()