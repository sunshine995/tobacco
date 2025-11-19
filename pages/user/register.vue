<template>
  <!-- 根容器：uni-app 规范 -->
  <view class="register-container">
    <form>
      <!-- 用户名 -->
      <view class="form-item">
        <label class="form-label">用户名：</label>
        <view class="form-content">
          <u-input 
            v-model="form.username" 
                 placeholder="请输入用户名" 
            class="full-width"
            type="text"
            clearable 
            @input="handleInput('username')"
          />
        </view>
      </view>

      <!-- 密码 -->
      <view class="form-item">
        <label class="form-label">密码：</label>
        <view class="form-content">
          <u-input 
            v-model="form.password" 
            placeholder="请输入密码" 
            class="full-width"
            type="password"
            clearable
            @input="handleInput('password')"
          />
        </view>
      </view>

      <!-- 手机号 -->
      <view class="form-item">
        <label class="form-label">手机号：</label>
        <view class="form-content">
          <u-input 
            v-model="form.phone" 
            placeholder="请输入手机号" 
            class="full-width"
            type="text"
            clearable
            input-align="left"
            maxlength="11"
            @input="handleInput('phone')"
            :input-filter="(val) => val.replace(/[^\d]/g, '')"
          />
        </view>
      </view>

      <!-- 部门ID -->
      <view class="form-item">
        <label class="form-label">部门ID：</label>
        <view class="form-content">
          <u-input 
            v-model="form.departmentId" 
            placeholder="制丝部门ID为1"
            class="full-width"
            type="number"
            clearable
            @input="handleInput('departmentId')"
          />
        </view>
      </view>

      <!-- 班级选择 - 使用 u-picker -->
      <u-cell-group title="班级选择" title-style="font-size: 16px; font-weight: 500;">
        <u-picker 
          :show="showClassPicker" 
          :columns="classColumns" 
          @confirm="onClassConfirm" 
          @cancel="showClassPicker = false"
          z-index="9999"
        />
        <u-cell 
          title="选择班级" 
          :value="form.classes" 
          is-link 
          @click="showClassPicker = true" 
          :arrow="true"
        />
      </u-cell-group>

      <!-- 工序段选择 - 仅当选择甲班或乙班时显示 -->
      <u-cell-group v-if="needShowSection" title="工序段选择" title-style="font-size: 16px; font-weight: 500;">
        <!-- 工序段选择器 -->
        <u-picker 
          :show="showSectionPicker" 
          :columns="sectionColumns" 
          @confirm="onSectionConfirm" 
          @cancel="showSectionPicker = false"
          z-index="9999"
        />
        <u-cell 
          title="选择工序段" 
          :value="form.section" 
          is-link 
          @click="showSectionPicker = true" 
          :arrow="true"
        />
        
        <!-- 岗位选择器 - 仅当不是中控时显示 -->
        <template v-if="form.section && form.section !== '中控'">
          <u-picker 
            :show="showPositionPicker" 
            :columns="positionColumns" 
            @confirm="onPositionConfirm" 
            @cancel="showPositionPicker = false"
            z-index="9999"
          />
          <u-cell 
            title="选择岗位" 
            :value="form.position" 
            is-link 
            @click="showPositionPicker = true" 
            :arrow="true"
            v-if="form.section"
          />
        </template>
      </u-cell-group>

      <!-- 子组选择 - 仅当选择维修组、电气组或管理组时显示 -->
      <u-cell-group v-if="['维修组', '电气组', '管理组'].includes(form.classes)" title="子组选择" title-style="font-size: 16px; font-weight: 500;">
        <u-picker 
          :show="showSubGroupPicker" 
          :columns="subGroupColumns" 
          @confirm="onSubGroupConfirm" 
          @cancel="showSubGroupPicker = false"
          z-index="9999"
        />
        <u-cell 
          title="选择子组" 
          :value="form.subGroup" 
          is-link 
          @click="showSubGroupPicker = true" 
          :arrow="true"
        />
      </u-cell-group>

      <!-- 党员信息 - 使用 u-picker -->
      <u-cell-group title="党员信息" title-style="font-size: 16px; font-weight: 500;">
        <!-- 支部选择器 -->
        <u-picker 
          :show="showBranchPicker" 
          :columns="branchColumns" 
          @confirm="onBranchConfirm" 
          @cancel="showBranchPicker = false"
          z-index="9999"
        />
        <u-cell 
          title="选择支部" 
          :value="form.party" 
          is-link 
          @click="showBranchPicker = true" 
          :arrow="true"
        />
        
        <!-- 小组选择器 -->
        <u-picker 
          v-if="form.party" 
          :show="showGroupPicker" 
          :columns="groupColumns" 
          @confirm="onGroupConfirm" 
          @cancel="showGroupPicker = false"
          z-index="9999"
        />
        <u-cell 
          v-if="form.party" 
          title="选择小组" 
          :value="form.member" 
          is-link 
          @click="showGroupPicker = true" 
          :arrow="true"
        />
      </u-cell-group>

      <!-- 注册按钮 -->
      <u-button 
        type="primary"
        class="register-btn"
        :loading="loading"
        @click="register"
        :gradient="true" 
        :bg-color="['#25b579', '#1d9567']" 
      >
        注册
      </u-button>

      <!-- 提示文本 -->
      <view v-if="registerTip" class="register-tip">{{ registerTip }}</view>
    </form>
  </view>
</template>

<script>
// 引入注册接口
import { registerApi } from '@/api/auth'

export default {
  data() {
    return {
      loading: false,
      registerTip: '',
      
      // 选择器显示控制
      showClassPicker: false,
      showSectionPicker: false,
      showPositionPicker: false,
      showBranchPicker: false,
      showGroupPicker: false,
      
      // 表单项数据
      form: {
        username: '',
        password: '',
        phone: '',
        departmentId: '',
        classes: '',
        section: '',
        position: '',
        party: '',
        member: '',
        role: 'USER',
        subGroup: '' // 新增子组字段
      },
      
      // 班级选择列
      classColumns: [
        ['甲班', '乙班', '维修组', '电气组', '服务组', '管理组']
      ],
      
      // 子组数据映射
      subGroupMap: {
        '维修组': ['叶组', '丝组', '组长'],
        '电气组': ['叶组', '丝组', '组长'],
        '管理组': ['主任', '副主任（设备）', '副主任（工艺 现场）', '副主任（党建）', '电器管理员', '机械管理员', '工艺管理员', '甲班班长', '乙班班长', '统计员', '核算员', '安全员', '信息员']
      },
      
      // 子组选择列
      subGroupColumns: [[]],
      
      // 工序段选择列
      sectionColumns: [
        ['真空回潮段', '储叶加料段', '切丝段', '掺配加香段', '梗线段', '中控']
      ],
      
      // 岗位数据映射
      positionMap: {
        '真空回潮段': ['片烟入库', '片烟出库', '机械手A', '机械手B', '切片机A', '切片机B', '真空回潮A', '真空回潮B'],
        '储叶加料段': ['翻箱机A', '翻箱机B', '松散回潮A', '松散回潮B', '激光除杂A', '激光除杂B', '预混柜', '加料机A', '加料机B', '储叶柜'],
        '切丝段': ['增温增湿A', '增温增湿B', '增温增湿C', '切丝机A', '切丝机B', '切丝机C', '烘丝机A', '烘丝机B', 'HDT'],
        '掺配加香段': ['膨化烟丝掺兑', '梗丝掺兑', '加香机A', '加香机B', '混丝柜', '装箱站A', '装箱站B', '丝库'],
        '梗线段': ['梗丝生产线岗位']
      },
      
      // 岗位选择列
      positionColumns: [[]],
      
      // 支部选择列
      branchColumns: [
        ['第一支部', '第二支部']
      ],
      
      // 小组数据映射
      groupMap: {
        '第一支部': ['甲小组', '白小组'],
        '第二支部': ['乙小组', '白小组']
      },
      
      // 小组选择列
      groupColumns: [[]],
      
      // 子组选择器显示控制
      showSubGroupPicker: false
    }
  },
  
  // 页面加载初始化表单
  onLoad() {
    this.resetForm()
  },
  
  computed: {
    // 判断是否需要显示工序段选择
    needShowSection() {
      return this.form.classes === '甲班' || this.form.classes === '乙班'
    }
  },
  
  watch: {
    // 监听工序段变化，更新岗位选项
    'form.section': function(newVal) {
      if (newVal && this.positionMap[newVal]) {
        this.positionColumns = [this.positionMap[newVal]]
        this.form.position = '' // 清空岗位选择
      } else {
        this.positionColumns = [[]]
        this.form.position = ''
      }
    },
    
    // 监听支部变化，更新小组选项
    'form.party': function(newVal) {
      if (newVal && this.groupMap[newVal]) {
        this.groupColumns = [this.groupMap[newVal]]
        this.form.member = '' // 清空小组选择
      } else {
        this.groupColumns = [[]]
        this.form.member = ''
      }
    },
    
    // 监听班级变化，更新子组选项
    'form.classes': function(newVal) {
      if (newVal && this.subGroupMap[newVal]) {
        this.subGroupColumns = [this.subGroupMap[newVal]]
        this.form.subGroup = '' // 清空子组选择
      } else {
        this.subGroupColumns = [[]]
        this.form.subGroup = ''
      }
    }
  },
  
  methods: {
    // 重置表单数据
    resetForm() {
      this.form = {
        username: '',
        password: '',
        phone: '',
        departmentId: '',
        classes: '',
        section: '',
        position: '',
        party: '',
        member: '',
        role: 'USER'
      }
      this.registerTip = ''
      this.positionColumns = [[]]
      this.groupColumns = [[]]
      this.subGroupColumns = [[]]
      this.form.subGroup = ''
    },
    
    // 输入事件：清空提示 + 手机号过滤
    handleInput(type) {
      this.registerTip = ''
      // 手机号仅保留数字
      if (type === 'phone') {
        this.form.phone = this.form.phone.replace(/[^\d]/g, '')
      }
    },
    
    // 班级选择确认
    onClassConfirm(e) {
      this.form.classes = e.value[0]
      this.showClassPicker = false
      
      // 如果不是甲班或乙班，清空工序段和岗位
      if (!this.needShowSection) {
        this.form.section = ''
        this.form.position = ''
      }
    },
    
    // 子组选择确认
    onSubGroupConfirm(e) {
      this.form.subGroup = e.value[0]
      this.showSubGroupPicker = false
    },
    
    // 工序段选择确认
    onSectionConfirm(e) {
      this.form.section = e.value[0]
      this.showSectionPicker = false
      
      // 如果是中控，不需要选择岗位
      if (this.form.section === '中控') {
        this.form.position = ''
      }
    },
    
    // 岗位选择确认
    onPositionConfirm(e) {
      this.form.position = e.value[0]
      this.showPositionPicker = false
    },
    
    // 支部选择确认
    onBranchConfirm(e) {
      this.form.party = e.value[0]
      this.showBranchPicker = false
    },
    
    // 小组选择确认
    onGroupConfirm(e) {
      this.form.member = e.value[0]
      this.showGroupPicker = false
    },
    
    // 注册核心逻辑
    async register() {
      // 表单验证
      if (!this.form.username.trim()) {
        this.registerTip = '请输入用户名'
        return
      }
      if (!this.form.password.trim()) {
        this.registerTip = '请输入密码'
        return
      }
      if (this.form.password.length < 6) {
        this.registerTip = '密码长度不能少于6位'
        return
      }
      if (!this.form.phone.trim()) {
        this.registerTip = '请输入手机号'
        return
      }
      if (!/^1[3-9]\d{9}$/.test(this.form.phone)) {
        this.registerTip = '请输入正确的手机号格式'
        return
      }
      if (!this.form.departmentId.trim()) {
        this.registerTip = '请输入部门ID'
        return
      }
      if (!this.form.classes) {
        this.registerTip = '请选择班级'
        return
      }
      
      // 维修组、电气组、管理组需要选择子组
      if (['维修组', '电气组', '管理组'].includes(this.form.classes) && !this.form.subGroup) {
        this.registerTip = '请选择子组'
        return
      }
      
      // 只有甲班和乙班需要验证工序段和岗位
      if (this.needShowSection) {
        if (!this.form.section) {
          this.registerTip = '请选择工序段'
          return
        }
        // 中控不需要验证岗位
        if (this.form.section !== '中控' && !this.form.position) {
          this.registerTip = '请选择岗位'
          return
        }
      }

      // 开始注册
      this.loading = true
      this.registerTip = ''
	  

      try {
        const result = await registerApi(this.form)
		
        if (result.msg) {
          uni.showToast({
            title: '注册成功',
            icon: 'success',
            duration: 2000
          })
          // 跳转登录页
          setTimeout(() => {
            console.log("注册成功，跳转到登录页")
            uni.navigateTo({ url: '/pages/user/login' })
          }, 2000) // 与toast显示时间保持一致
        } else {
          this.registerTip = result.msg || '注册失败'
        }
      } catch (error) {
        this.registerTip = '注册失败，请稍后重试'
        console.error('注册接口异常:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
/* 基础样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 14px;
}

/* 根容器样式 */
.register-container {
  font-family: "Microsoft YaHei", Arial, sans-serif;
  padding: 30px 20px;
  background-color: #f5f5f5;
  color: #333;
  min-width: 320px;
  max-width: 620px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

/* 表单项容器 */
.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  height: 44px;
  overflow: visible;
}

/* 表单项标签 */
.form-label {
  width: 90px;
  text-align: right;
  padding-right: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

/* 表单项内容区 */
.form-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

/* 适配 u-input 样式：统一高度和边框 */
:deep(.u-input__wrapper) {
  width: 100% !important;
  height: 44px !important;
  border-radius: 4px !important;
  border: 1px solid #ccc !important;
}
:deep(.u-input__input) {
  width: 100% !important;
  height: 100% !important;
  padding: 0 12px !important;
  color: #333 !important;
}
/* 输入框聚焦样式 */
:deep(.u-input__input:focus) {
  border-color: #666 !important;
  box-shadow: 0 0 0 2px rgba(102, 102, 102, 0.2) !important;
}

/* 适配 u-cell-group 样式 */
:deep(.u-cell-group) {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}
:deep(.u-cell-group__title) {
  padding: 10px 15px;
  font-size: 14px !important;
  color: #666 !important;
  background-color: #f5f5f5;
}

/* 适配 u-cell 样式 */
:deep(.u-cell) {
  height: 44px !important;
  padding: 0 15px !important;
  border-bottom: 1px solid #f0f0f0;
}
:deep(.u-cell__title) {
  font-size: 14px !important;
  color: #333 !important;
  font-weight: 500 !important;
}
:deep(.u-cell__value) {
  font-size: 14px !important;
  color: #999 !important;
}
:deep(.u-cell--arrow) {
  padding-right: 25px !important;
}

/* 适配 u-picker 样式 */
:deep(.u-picker) {
  z-index: 9999 !important;
}

/* 宽度类：控制组件占比 */
.full-width {
  width: 100%;
}

/* 注册按钮样式 */
.register-btn {
  margin: 20px auto 0 !important;
  height: 44px !important;
  padding: 0 48px !important;
  border-radius: 4px !important;
  font-weight: 500 !important;
  font-size: 18px !important; /* 增大字体大小 */
  width: calc(100% - 40px); /* 相对于父容器宽度，左右各留20px边距 */
  max-width: 400px; /* 设置一个合适的最大宽度 */
  display: block !important;
  background-color: #00cc66 !important; /* 设置为绿色背景 */
  border-color: #00cc66 !important; /* 设置边框颜色 */
}

/* 提示文本：错误提示红色 */
.register-tip {
  margin: 10px 0 0 102px;
  font-size: 12px;
  color: #f00;
}

/* 响应式适配：小屏幕垂直布局 */
@media (max-width: 480px) {
  .register-container {
    padding: 20px 15px;
    border: none;
    box-shadow: none;
    min-width: auto;
  }
  
  .form-item {
    flex-direction: column;
    align-items: flex-start;
    height: auto;
    margin-bottom: 15px;
  }
  
  .form-label {
    width: 100%;
    text-align: left;
    padding-right: 0;
    margin-bottom: 5px;
  }
  
  .form-content {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .register-btn, .register-tip {
    margin-left: 0 !important;
    width: 100%;
  }
  
  :deep(.u-cell-group) {
    margin-left: 0 !important;
  }
}

/* 确保picker能正确显示 */
:deep(.u-picker__content) {
  z-index: 10000 !important;
}

/* 增强可点击区域 */
:deep(.u-cell__content) {
  cursor: pointer;
}

/* 优化标题样式 */
:deep(.u-cell-group__title) {
  font-weight: 500 !important;
  color: #333 !important;
}
</style>
