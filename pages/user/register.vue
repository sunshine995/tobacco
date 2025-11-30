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

      <!-- 生日 -->
      <view class="form-item">
        <label class="form-label">出生年月：</label>
        <view class="form-content">
          <u-input 
            v-model="form.birthday" 
            placeholder="" 
            class="full-width"
            type="date"
            @input="handleInput('birthday')"
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

      <!-- 工序段选择 - 复选框形式 - 仅当选择甲班或乙班时显示 -->
      <u-cell-group v-if="needShowSection" title="工序段选择" title-style="font-size: 16px; font-weight: 500;">
        <view class="checkbox-container">
          <up-checkbox-group 
            v-model="form.sections"
            placement="column"
            @change="handleSectionChange"
          >
            <up-checkbox 
              :customStyle="{marginBottom: '10px'}"
              v-for="(item, index) in sectionsList"
              :key="index"
              :label="item.name"
              :name="item.name"
              :disabled="item.disabled"
            >
              {{ item.name }}
            </up-checkbox>
          </up-checkbox-group>
        </view>
      </u-cell-group>
      
      <!-- 岗位选择 - 复选框形式 - 仅当选择了工序段时显示 -->
      <u-cell-group v-if="needShowSection && form.sections && form.sections.length > 0" title="岗位选择" title-style="font-size: 16px; font-weight: 500;">
        <view class="checkbox-container" v-if="currentPositions && currentPositions.length > 0">
          <up-checkbox-group 
            v-model="form.positions"
            placement="column"
            @change="handlePositionChange"
          >
            <up-checkbox 
              :customStyle="{marginBottom: '10px'}"
              v-for="(item, index) in currentPositions"
              :key="index"
              :label="item.name"
              :name="item.name"
              :disabled="item.disabled"
            >
              {{ item.section }} - {{ item.name }}
            </up-checkbox>
          </up-checkbox-group>
        </view>
        <view class="no-positions" v-else-if="form.sections.some(s => s === '中控' || s === '除尘工' || s === '派遣工')">
          该工序段不需要选择岗位
        </view>
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
      showBranchPicker: false,
      showGroupPicker: false,

      
      // 表单项数据
      form: {
        username: '',
        password: '',
        phone: '',
        birthday: '', // 新增：生日字段
        departmentId: '',
        classes: '',
        sections: [],
        positions: [],
        party: '',
        member: '',
        role: 'user',
        subGroup: ''
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
      
      // 工序段数据
      sectionsList: [
        { name: '真空回潮段', disabled: false },
        { name: '储叶加料段', disabled: false },
        { name: '切丝段', disabled: false },
        { name: '掺配加香段', disabled: false },
        { name: '梗线段', disabled: false },
        { name: '中控', disabled: false },
        { name: '除尘工', disabled: false },
        { name: '派遣工', disabled: false }
      ],
      
      // 岗位数据映射
      positionMap: {
        '真空回潮段': ['段长','片烟入库','片烟出库', '机械手A', '机械手B', '切片机A', '切片机B', '真空回潮A', '真空回潮B'],
        '储叶加料段': ['段长','翻箱机A', '翻箱机B', '松散回潮A', '松散回潮B', '激光除杂A', '激光除杂B', '预混柜', '加料机A', '加料机B', '储叶柜'],
        '切丝段': ['段长','增温增湿A', '增温增湿B', '增温增湿C', '切丝机A', '切丝机B', '切丝机C', '烘丝机A', '烘丝机B/C','挑杂工'],
        '掺配加香段': ['段长','膨化烟丝掺兑', '膨化烟丝储丝','膨化烟丝挑杂工', '加香机A', '加香机B', '混丝柜', '装箱站A', '装箱站B', '丝库工/跟班验证员'],
        '梗线段': ['外加梗工‘', '水洗梗工', '梗激光除杂', '梗子回潮工admois', '切梗工', '梗加料工', 'CTD','梗加香','梗丝掺兑',],
        '中控': ['片烟入库中控', '叶线中控','丝线中控','丝库中控','中控室白班'],
        '除尘工': ['除尘工'],
		'派遣工': ['派遣工']
      },
      
      // 岗位数据 - 将根据选择的工序段动态生成
      currentPositions: [],
      // 当前选中的工序段岗位映射
      selectedPositionsMap: {},
      
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
      showSubGroupPicker: false,
      
      // 工序段和岗位选择器（已改为复选框，保留兼容性）
      showSectionPicker: false,
      showPositionPicker: false,
      sectionColumns: [[]],
      positionColumns: [[]]
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
    'form.sections': function(newVal) {
      this.updateCurrentPositions();
      // 清空已选岗位
      this.form.positions = [];
      this.selectedPositionsMap = {};
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
        birthday: '', // 新增：重置生日字段
        departmentId: '',
        classes: '',
        sections: [],
        positions: [],
        party: '',
        member: '',
        role: 'user',
        subGroup: ''
      }
      this.registerTip = ''
      this.currentPositions = []
      this.selectedPositionsMap = {}
      this.groupColumns = [[]]
      this.subGroupColumns = [[]]
    },
    
    // 输入事件：清空提示 + 手机号过滤
    handleInput(type) {
      this.registerTip = ''
      // // 手机号仅保留数字
      // if (type === 'phone') {
      //   this.form.phone = this.form.phone.replace(/[^\d]/g, '')
      // }
    },
    
    // 班级选择确认
    onClassConfirm(e) {
      this.form.classes = e.value[0]
      this.showClassPicker = false
      
      // 如果不是甲班或乙班，清空工序段和岗位
      if (!this.needShowSection) {
        this.form.sections = []
        this.form.positions = []
        this.selectedPositionsMap = {}
        this.currentPositions = []
      }
    },
    
    // 子组选择确认
    onSubGroupConfirm(e) {
      this.form.subGroup = e.value[0]
      this.showSubGroupPicker = false
    },
    
    // 更新当前可选岗位
    updateCurrentPositions() {
      if (!this.form.sections || this.form.sections.length === 0) {
        this.currentPositions = [];
        return;
      }
      
      // 合并所有选中工序段的岗位
      const allPositions = [];
      this.form.sections.forEach(section => {
        if (this.positionMap[section]) {
          const positions = this.positionMap[section].map(pos => ({
            name: pos,
            section: section,
            disabled: false
          }));
          allPositions.push(...positions);
        }
      });
      this.currentPositions = allPositions;
    },
    
    // 工序段复选框变化处理
    handleSectionChange(e) {
      this.form.sections = e;
    },
    
    // 岗位复选框变化处理
    handlePositionChange(e) {
      this.form.positions = e;
      
      // 更新选中岗位的映射关系
      this.selectedPositionsMap = {};
      this.form.positions.forEach(pos => {
        const positionItem = this.currentPositions.find(p => p.name === pos);
        if (positionItem && positionItem.section) {
          if (!this.selectedPositionsMap[positionItem.section]) {
            this.selectedPositionsMap[positionItem.section] = [];
          }
          this.selectedPositionsMap[positionItem.section].push(pos);
        }
      });
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
      // 新增：生日校验
      if (!this.form.birthday) {
        this.registerTip = '请选择生日'
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
        if (!this.form.sections || this.form.sections.length === 0) {
          this.registerTip = '请选择工序段'
          return
        }
        
        // 检查是否所有非中控、非除尘工、非派遣工的工序段都选择了岗位
        const needPositionSections = this.form.sections.filter(section => 
          section !== '中控' && section !== '除尘工' && section !== '派遣工'
        );
        
        if (needPositionSections.length > 0 && this.form.positions.length === 0) {
          this.registerTip = '请选择岗位'
          return
        }
      }

      // 准备提交数据 - 不直接展开this.form，而是逐个添加字段以控制subGroup的处理
      // 明确包含所有可能的字段，并为每个字段提供默认值
      const submitForm = {
        username: this.form.username || '',
        password: this.form.password || '',
        phone: this.form.phone || '',
        birthday: this.form.birthday || '1900-01-01', // 使用默认日期而非空字符串
        department: this.form.departmentId === '1' ? '制丝车间' : this.form.departmentId === '2' ? '卷包车间' : '',
        classes: this.form.classes || '',
        section: this.form.sections && this.form.sections.length > 0 ? this.form.sections.join(',') : '-', // 使用'-'代替空字符串
        party: this.form.party || '-', // 使用'-'代替空字符串
        member: this.form.member || '-', // 使用'-'代替空字符串
        role: 'USER', // 默认值
        line: '-', // 默认值
        position: '-', // 默认值
        support_position: '-' // 默认值
      };
      
      // 根据选择的班级自动设置角色
      if (this.form.classes === '电气组') {
        submitForm.role = 'electrical';
      } else if (this.form.classes === '维修组') {
        submitForm.role = 'mechanical';
      } else if (this.form.classes === '管理组') {
        submitForm.role = 'admin';
      } else {
        submitForm.role = 'user';
      }
      
      if (['维修组', '电气组'].includes(this.form.classes) && this.form.subGroup) {
        if (this.form.subGroup === '组长') {
          // 维修组和电气组的子组是组长时，存到position字段
          submitForm.position = this.form.subGroup;
        } else {
          // 其他子组存到line字段
          submitForm.line = this.form.subGroup;
        }
      } else if (this.form.classes === '管理组' && this.form.subGroup) {
        // 管理组的子组存到position字段
        submitForm.position = this.form.subGroup;
      } else if (!['甲班', '乙班'].includes(this.form.classes)) {
        // 对于非甲班、乙班的其他情况，保持默认值'-'
        // 不做额外修改，确保字段不为null
      }
      
      // 根据岗位设置line字段，并处理多选岗位（仅适用于甲班和乙班）
      if (this.needShowSection && this.form.positions && this.form.positions.length > 0) {
        let mainPosition = this.form.positions[0];
        let line = '';
        
        // 遍历岗位，找到对应的生产线标识
        for (const position of this.form.positions) {
          // 检查岗位所属工序段和生产线标识
          if ((this.form.sections.includes('真空回潮段') || this.form.sections.includes('储叶加料段'))) {
            if (position.includes('A')) {
              line = '叶A';
              mainPosition = position;
              break;
            } else if (position.includes('B')) {
              line = '叶B';
              mainPosition = position;
              break;
            }
          } else if ((this.form.sections.includes('切丝段') || this.form.sections.includes('掺配加香段'))) {
            if (position.includes('A')) {
              line = '丝A';
              mainPosition = position;
              break;
            } else if (position.includes('B') || position.includes('C')) {
              line = '丝B/C';
              mainPosition = position;
              break;
            }
          }
        }
        
        // 设置line字段 - 只有当line有实际值时才覆盖默认值'-'
        if (line && line.trim() !== '') {
          submitForm.line = line;
        }
        
        // 设置position字段 - 只有当mainPosition有实际值时才覆盖默认值'-'
        if (mainPosition && mainPosition.trim() !== '') {
          submitForm.position = mainPosition;
        }
        
        // 设置support_position字段
        if (this.form.positions && this.form.positions.length > 1) {
          // 移除主岗位后，其余岗位作为辅助岗位
          const supportPositions = this.form.positions.filter(pos => pos !== mainPosition);
          submitForm.support_position = supportPositions.join(',') || '';
          console.log('设置support_position:', submitForm.support_position);
        } else {
          // 当只有一个岗位或没有岗位时，设置为空字符串
          submitForm.support_position = '';
          console.log('设置support_position为空字符串');
        }
      }

      // 打印提交内容到控制台
      console.log('注册提交的表单内容:', submitForm);
      
      // 开始注册
      this.loading = true
      this.registerTip = ''

      try {
        const result = await registerApi(submitForm)
		console.log('注册API响应:', result);
        
        // 根据API响应截图，使用code字段判断成功更可靠
        if (result.code === 200 || (result.data && result.data.code === 200)) {
          uni.showToast({
            title: result.data?.msg || '注册成功',
            icon: 'success',
            duration: 2000
          })
          // 跳转登录页
          setTimeout(() => {
            console.log("注册成功，跳转到登录页")
            uni.navigateTo({ url: '/pages/user/login' })
          }, 2000) // 与toast显示时间保持一致
        } else {
          // 错误处理更详细
          this.registerTip = result.data?.msg || result.msg || '注册失败'
          console.warn('注册失败:', this.registerTip)
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

/* 复选框容器样式 */
.checkbox-container {
  padding: 16px;
  background-color: #f5f5f5;
}

/* 无岗位提示样式 */
.no-positions {
  padding: 16px;
  background-color: #f9f9f9;
  color: #999;
  font-size: 14px;
  text-align: center;
}

/* 适配复选框样式 */
:deep(.up-checkbox-group) {
  width: 100%;
}

:deep(.up-checkbox) {
  display: flex;
  align-items: center;
  margin-bottom: 10px !important;
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