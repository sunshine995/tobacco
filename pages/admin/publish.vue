<template>
  <view class="send-container">
    <view class="form-card">
      <view class="form-group">
        <label class="form-label">消息标题</label>
        <input 
          v-model="form.title" 
          class="form-input" 
          placeholder="请输入消息标题"
          maxlength="100"
        />
      </view>
      
      <view class="form-group">
        <label class="form-label">消息内容</label>
        <textarea 
          v-model="form.content" 
          class="form-textarea" 
          placeholder="请输入消息内容..."
          maxlength="1000"
        />
      </view>
      
      <!-- 图片上传组件 -->
      <view class="form-group">
		  <label class="form-label">上传图片</label>
        <upload-image
          ref="uploadRef"
          :max-count="3"
        />
      </view>
    </view>
    
    <view class="form-card">
      <view class="form-group">
        <label class="form-label">发送范围</label>
        <view class="range-options">
          <view 
            v-for="range in rangeOptions" 
            :key="range.value"
            :class="['range-option', { active: form.sendRangeType === range.value }]"
            @click="form.sendRangeType = range.value"
          >
            {{ range.label }}
          </view>
        </view>
      </view>
      
      <!-- 班组选择 -->
      <view class="form-group" v-if="form.sendRangeType === 'WORK_GROUP'">
        <label class="form-label">选择班组</label>
        <view class="checkbox-group">
          <view 
            v-for="group in workGroups" 
            :key="group.id"
            class="checkbox-item"
          >
            <label class="checkbox-label">
              <checkbox 
                :value="group.id" 
                :checked="form.workGroupIds.includes(group.id)"
                @change="(e) => onWorkGroupChange(e, group.id)"
              />
              <text class="checkbox-text">{{ group.name }}</text>
            </label>
          </view>
        </view>
      </view>
      
      <!-- 党支部选择 -->
		<view class="form-group" v-if="form.sendRangeType === 'PARTY_BRANCH'">
		  <label class="form-label">选择党支部</label>
		  <view class="checkbox-group">
		    <view 
		      v-for="branch in partyBranchesTree" 
		      :key="branch.id"
		      class="branch-item"
		    >
		      <!-- 父级：整行可点击切换展开 -->
		      <view 
		        class="branch-header" 
		        @click="toggleExpand(branch)"
		      >
		        <checkbox 
		          :value="branch.id" 
		          :checked="isBranchChecked(branch)"
		          @change="(e) => onParentBranchChange(e, branch)"
		          @click.stop="" 
		        />
		        <text class="branch-name">{{ branch.name }}</text>
		        <text class="expand-icon">{{ branch.expanded ? '▲' : '▼' }}</text>
		      </view>
		
		      <!-- 子项：根据 expanded 决定是否显示 -->
		      <view 
		        v-if="branch.expanded && branch.children" 
		        class="children-group"
		      >
		        <view 
		          v-for="child in branch.children" 
		          :key="child.id"
		          class="checkbox-item child-item"
		        >
		          <label class="checkbox-label">
		            <checkbox 
		              :value="child.id" 
		              :checked="form.partyBranchIds.includes(child.id)"
		              @change="(e) => onChildBranchChange(e, child, branch)"
		            />
		            <text class="checkbox-text">└─ {{ child.name }}</text>
		          </label>
		        </view>
		      </view>
		    </view>
		  </view>
		</view>
      <!-- 动态组选择 -->
      <view class="form-group" v-if="form.sendRangeType === 'DYNAMIC_GROUP'">
        <label class="form-label">选择动态组</label>
        <view class="checkbox-group">
          <view 
            v-for="group in dynamicGroups" 
            :key="group.id"
            class="checkbox-item"
          >
            <label class="checkbox-label">
              <checkbox 
                :value="group.id" 
                :checked="form.dynamicGroupIds.includes(group.id)"
                @change="(e) => onDynamicGroupChange(e, group.id)"
              />
              <text class="checkbox-text">{{ group.name }}</text>
            </label>
          </view>
        </view>
      </view>
    </view>
    
    <view class="action-buttons">
      <button class="btn btn-secondary" @click="saveDraft">保存草稿</button>
      <button class="btn btn-primary" @click="sendMessage" :disabled="sending">
        {{ sending ? '发送中...' : '发送消息' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import UploadImage from '@/components/UploadImage.vue';
import{ getWorkGroupByUserId } from '@/api/workGroup.js'

const uploadRef = ref(null); // 上传组件的ref
const imageFiles = ref([]); // 存原始 file 对象 { url: '临时路径' }

// 响应式数据
const form = reactive({
  title: '',
  content: '',
  images: [],
  sendRangeType: 'WORK_GROUP',
  workGroupIds: [],
  partyBranchIds: [],
  dynamicGroupIds: [],
  userIds: []
})

const rangeOptions = ref([
  { label: '全车间', value: 'ALL' },
  { label: '班组', value: 'WORK_GROUP' },
  { label: '党支部', value: 'PARTY_BRANCH' },
  { label: '动态组', value: 'DYNAMIC_GROUP' }
])

const workGroups = ref([
  { id: "1", name: '管理组' },
  { id: "2", name: '甲班' },
  { id: "3", name: '乙班' },
  { id: "4", name: '维修组' },
  { id: '5', name: '电气组' }
])

const partyBranchesTree = ref([
  {
    id: "1",
    name: "第一党支部",
    expanded: false, // ← 新增：控制是否展开
    children: [
      { id: "3", name: "甲小组" },
      { id: "4", name: "白小组" }
    ]
  },
  {
    id: "2",
    name: "第二党支部",
    expanded: false,
    children: [
      { id: "5", name: "乙小组" },
      { id: "6", name: "白小组" }
    ]
  }
]);

const dynamicGroups = ref([])
const sending = ref(false)
const imageUploadRef = ref(null)

// 模拟接口请求函数
const toggleExpand = (branch) => {
  branch.expanded = !branch.expanded;
};

// 加载数据
onMounted(async () => {
  await loadDynamicGroups()
})

const loadDynamicGroups = async () => {
  try {
    const res = await getWorkGroupByUserId(uni.getStorageSync('userId'))
	console.log(res)
    dynamicGroups.value = res
  } catch (error) {
    console.error('加载动态组失败:', error)
  }
}

const onWorkGroupChange = (e, groupId) => {
  if (e.detail.value.includes(String(groupId))) {
    form.workGroupIds.push(groupId)
  } else {
    const index = form.workGroupIds.indexOf(groupId)
    if (index > -1) {
      form.workGroupIds.splice(index, 1)
    }
  }
}

const onPartyBranchChange = (e, branchId) => {
  if (e.detail.value.includes(String(branchId))) {
    form.partyBranchIds.push(branchId)
  } else {
    const index = form.partyBranchIds.indexOf(branchId)
    if (index > -1) {
      form.partyBranchIds.splice(index, 1)
    }
  }
}

const onDynamicGroupChange = (e, groupId) => {
  if (e.detail.value.includes(String(groupId))) {
    form.dynamicGroupIds.push(groupId)
  } else {
    const index = form.dynamicGroupIds.indexOf(groupId)
    if (index > -1) {
      form.dynamicGroupIds.splice(index, 1)
    }
  }
}

// 判断父级是否被选中（全选 or 半选）
const isBranchChecked = (branch) => {
  if (!branch.children || branch.children.length === 0) {
    return form.partyBranchIds.includes(branch.id);
  }
  const allChildrenSelected = branch.children.every(child => 
    form.partyBranchIds.includes(child.id)
  );
  return allChildrenSelected;
};

// 父级 checkbox 变化
const onParentBranchChange = (e, branch) => {
  const checked = e.detail.value.includes(branch.id);
  
  if (checked) {
    // 选中父级 → 选中所有子级 + 父级本身（可选）
    const allIds = [branch.id, ...(branch.children?.map(c => c.id) || [])];
    allIds.forEach(id => {
      if (!form.partyBranchIds.includes(id)) {
        form.partyBranchIds.push(id);
      }
    });
  } else {
    // 取消父级 → 取消所有子级 + 父级
    const allIds = [branch.id, ...(branch.children?.map(c => c.id) || [])];
    form.partyBranchIds = form.partyBranchIds.filter(id => !allIds.includes(id));
  }
};

// 子级 checkbox 变化
const onChildBranchChange = (e, child, parentBranch) => {
  const checked = e.detail.value.includes(child.id);
  
  if (checked) {
    if (!form.partyBranchIds.includes(child.id)) {
      form.partyBranchIds.push(child.id);
    }
  } else {
    const index = form.partyBranchIds.indexOf(child.id);
    if (index > -1) form.partyBranchIds.splice(index, 1);
  }

  // 检查是否要自动取消父级（如果子级未全选）
  const allChildrenSelected = parentBranch.children.every(c => 
    form.partyBranchIds.includes(c.id)
  );
  if (!allChildrenSelected && form.partyBranchIds.includes(parentBranch.id)) {
    // 自动取消父级（半选状态不保留父ID，除非你想要“部分选中”样式）
    const idx = form.partyBranchIds.indexOf(parentBranch.id);
    if (idx > -1) form.partyBranchIds.splice(idx, 1);
  }
};

const sendMessage = async () => {
  if (!form.title.trim()) {
    uni.showToast({
      title: '请输入消息标题',
      icon: 'none'
    })
    return
  }
  
  if (!form.content.trim()) {
    uni.showToast({
      title: '请输入消息内容',
      icon: 'none'
    })
    return
  }
  
  sending.value = true
  
  try {
    // 模拟上传图片
    let imageUrls = []
    if (form.images.length > 0 && imageUploadRef.value) {
      // 模拟上传图片
      imageUrls = form.images.map((_, index) => `http://example.com/image${index}.jpg`)
    }
    
    // 模拟发送消息
    const messageData = {
      ...form,
      images: imageUrls
    }
    
    console.log('发送消息数据:', messageData)
    
    const res = await mockRequest('/message/send', {
      method: 'POST',
      data: messageData
    })
    
    if (res.code === 200) {
      uni.showToast({
        title: '发送成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({
        title: res.message || '发送失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    uni.showToast({
      title: '发送失败，请重试',
      icon: 'none'
    })
  } finally {
    sending.value = false
  }
}

const saveDraft = () => {
  // 保存草稿逻辑
  uni.showToast({
    title: '已保存草稿',
    icon: 'success'
  })
}
</script>

<style scoped>
.send-container {
  padding: 20rpx;
  min-height: 100vh;
  background: #f5f7fa;
}

.form-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 30rpx;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 20rpx;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  padding: 24rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.range-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.range-option {
  flex: 1;
  min-width: 150rpx;
  text-align: center;
  padding: 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  transition: all 0.3s;
}

.range-option.active {
  border-color: #1E6FBA;
  background: #f0f8ff;
  color: #1E6FBA;
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.checkbox-item {
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.checkbox-text {
  flex: 1;
  font-size: 28rpx;
}

.member-count {
  font-size: 24rpx;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 0;
}

.btn {
  flex: 1;
  padding: 24rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.btn-primary {
  background: #1E6FBA;
  color: white;
}

.btn-primary:disabled {
  background: #ccc;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}
.branch-item {
  margin-bottom: 20rpx;
}

.branch-label {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  font-weight: bold;
}

.child-item {
  padding-left: 40rpx;
  margin-top: 10rpx;
}

.expand-icon {
  margin-left: auto;
  color: #999;
  font-size: 24rpx;
}

.branch-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  cursor: pointer; /* uni-app 中可能无效，但无害 */
}

.branch-name {
  flex: 1;
  font-weight: bold;
  margin-left: 20rpx;
}

.expand-icon {
  color: #999;
  font-size: 24rpx;
}
</style>



