<template>
  <view class="group-container">
    <!-- 创建新组按钮 -->
    <view class="create-btn-container">
      <button class="create-btn" @click="showCreateModal">
        <text class="btn-icon">+</text>
        <text class="btn-text">创建新组</text>
      </button>
    </view>
    
    <!-- 动态组列表 -->
    <view class="group-list">
      <view 
        v-for="group in dynamicGroups" 
        :key="group.id"
        class="group-card"
      >
        <view class="group-header">
          <view class="group-info">
            <text class="group-name">{{ group.name }}</text>
            <text class="group-desc">{{ group.description }}</text>
          </view>
          <view class="group-actions">
            <text class="action-btn edit" @click="editGroup(group)">编辑</text>
            <text class="action-btn delete" @click="deleteGroup(group.id)">删除</text>
          </view>
        </view>
        
        <view class="member-section">
          <view class="member-header">
            <text class="member-title">组成员 ({{ group.members.length }})</text>
            <text class="add-member-btn" @click="showAddMemberModal(group)">
              添加成员
            </text>
          </view>
          
          <view class="member-list">
            <view 
              v-for="member in group.members" 
              :key="member.id"
              class="member-item"
            >
              <text class="member-name">{{ member.username }}</text>
              <text class="remove-member" @click="removeMember(group.id, member.id)">
                ×
              </text>
            </view>
            
            <view v-if="group.members.length === 0" class="empty-members">
              暂无成员
            </view>
          </view>
        </view>
      </view>
      
      <!-- <view v-if="dynamicGroups.length === 0" class="empty-groups">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无动态组</text>
        <text class="empty-desc">点击上方按钮创建第一个动态组</text>
      </view> -->
    </view>
    
    <!-- 创建/编辑组模态框 -->
    <uni-popup ref="groupModalRef" type="dialog">
      <uni-popup-dialog 
        :type="groupModal.type" 
        :title="groupModal.title"
        :content="groupModal.content"
        @confirm="confirmGroup"
        @close="closeGroupModal"
      >
        <view class="modal-content">
				  
          <view class="form-group">
            <label class="form-label">组名称</label>
            <input 
              v-model="groupForm.name" 
              class="form-input" 
              placeholder="请输入组名称"
            />
          </view>
          <view class="form-group">
            <label class="form-label">组描述</label>
            <textarea 
              v-model="groupForm.description" 
              class="form-textarea" 
              placeholder="请输入组描述"
            />
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
    
    <!-- 添加成员模态框 -->
    <uni-popup ref="memberModalRef" type="dialog">
      <uni-popup-dialog 
        type="info" 
        title="添加成员"
        @confirm="confirmAddMember"
        @close="closeMemberModal"
      >
        <view class="modal-content">
          <!-- 🔍 新增：搜索框 -->
          <view class="form-group">
            <label class="form-label">搜索成员</label>
            <input 
              v-model="searchKeyword" 
              class="form-input" 
              placeholder="输入姓名或用户名搜索"
              clearable
            />
          </view>
    
          <!-- 成员列表：使用 filteredUsers 而不是 availableUsers -->
			<view class="modal-content">
			  <view class="form-group">
				<label class="form-label">选择成员</label>
				<checkbox-group @change="onUserSelectChange">
				  <view class="member-select-list">
					<view 
					  v-for="user in availableUsers" 
					  :key="user.id"
					  class="member-select-item"
					>
					  <label class="member-checkbox">
						<checkbox 
						  :value="user.id" 
						  :checked="selectedUserIds.includes(user.id)"
						/>
						<text class="member-info">
						  <text class="member-name">{{ user.username }}</text>
						  <text class="member-role">{{ user.position }}</text>
						</text>
					  </label>
					</view>
				  </view>
				</checkbox-group>
			  </view>
			</view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import{ saveWork, getWorkGroupByUserId, updateWork, GroupAddMember,deleteGroupById, removeMemberById} from '@/api/workGroup.js'
 import { listUsers } from '@/api/auth.js'
// 响应式数据
const dynamicGroups = ref([])

const availableUsers = ref([])

const selectedUserIds = ref([])
const currentGroupId = ref(null)

// 新增：搜索关键词
const searchKeyword = ref('')

const groupForm = reactive({
  id: null,
  name: '',
  description: ''
})

const groupModal = reactive({
  type: 'info',
  title: '创建新组',
  content: ''
})

const groupModalRef = ref(null)
const memberModalRef = ref(null)


// 页面加载
onMounted(async () => {
  await loadDynamicGroups()
})

const loadDynamicGroups = async () => {
  try {
    dynamicGroups.value = await getWorkGroupByUserId(uni.getStorageSync('userId'))
  } catch (error) {
    console.error('加载动态组失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 计算属性：根据搜索关键词过滤用户
const filteredUsers = computed(() => {
  if (!searchKeyword.value.trim()) {
    return availableUsers.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return availableUsers.value.filter(user =>
    (user.username && user.username.toLowerCase().includes(keyword)) ||
    (user.realName && user.realName.toLowerCase().includes(keyword))
  )
})

const showCreateModal = () => {
  Object.assign(groupForm, {
    id: null,
    name: '',
    description: ''
  })
  groupModal.title = '创建新组'
  groupModal.type = 'info'
  groupModalRef.value.open()
}

const editGroup = (group) => {
  Object.assign(groupForm, {
    id: group.id,
    name: group.name,
    description: group.description
  })
  groupModal.title = '编辑组'
  groupModal.type = 'info'
  groupModalRef.value.open()
}

const confirmGroup = async () => {
  if (!groupForm.name.trim()) {
    uni.showToast({
      title: '请输入组名称',
      icon: 'none'
    })
    return
  }

  try {
    let res 

    if (!groupForm.id) {
      const data = {
        ...groupForm,
        creatorId: uni.getStorageSync('userId')
      }
      res = await saveWork(data) // 创建
    } else {
      const data = { ...groupForm }
      res = await updateWork(data) // 更新，注意这里也要赋值给 res！
    }

    if (res) {
      uni.showToast({
        title: groupForm.id ? '更新成功' : '创建成功',
        icon: 'success'
      })
      closeGroupModal()
      await loadDynamicGroups()
    } else {
      uni.showToast({
        title: res?.message || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('操作失败:', error)
    uni.showToast({
      title: '网络或系统错误',
      icon: 'none'
    })
  }
}
const closeGroupModal = () => {
  groupModalRef.value.close()
}

const deleteGroup = async (groupId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个动态组吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const res = await deleteGroupById(groupId)
          if (res) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            await loadDynamicGroups()
          } else {
            uni.showToast({
              title: res.message || '删除失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('删除失败:', error)
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

const showAddMemberModal = async (group) => {
  currentGroupId.value = group.id
  selectedUserIds.value = []
  
  try {
    const res = await listUsers()
	console.log(res)
    availableUsers.value = res
    memberModalRef.value.open()
  } catch (error) {
    console.error('加载用户列表失败:', error)
    uni.showToast({
      title: '加载用户失败',
      icon: 'none'
    })
  }
}

const onUserSelectChange = (e) => {
  selectedUserIds.value = e.detail.value.map(id => Number(id))
}

const confirmAddMember = async () => {
  if (selectedUserIds.value.length === 0) {
    uni.showToast({
      title: '请选择成员',
      icon: 'none'
    })
    return
  }
  
  try {
    const data = {
      groupId: currentGroupId.value,
      userIds: selectedUserIds.value,
      operatorId: uni.getStorageSync('userId')
    }
    
    const res = await GroupAddMember(data)
    
    if (res) {
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
      closeMemberModal()
      await loadDynamicGroups()
    } else {
      uni.showToast({
        title: res.message || '添加失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('添加成员失败:', error)
    uni.showToast({
      title: '添加失败: ' + error.message,
      icon: 'none'
    })
  }
}

const closeMemberModal = () => {
  memberModalRef.value.close()
  selectedUserIds.value = []
  currentGroupId.value = null
  searchKeyword.value = '' // 👈 清空搜索
}

const removeMember = async (groupId, userId) => {
  uni.showModal({
    title: '确认移除',
    content: '确定要将该成员从组中移除吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // const res = await mockRequest('/dynamic-group/remove-member', {
          //   method: 'POST',
          //   data: {
          //     groupId: groupId,
          //     userId: userId,
          //     operatorId: 123 // 模拟操作用户ID
          //   }
          // })
          const res = await removeMemberById(groupId, userId)
          if (res) {
            uni.showToast({
              title: '移除成功',
              icon: 'success'
            })
            await loadDynamicGroups()
          } else {
            uni.showToast({
              title: res.message || '移除失败',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('移除成员失败:', error)
          uni.showToast({
            title: '移除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}
</script>

<style scoped>
.group-container {
  padding: 20rpx;
  min-height: 100vh;
  background: #f5f7fa;
}

.create-btn-container {
  margin-bottom: 30rpx;
}

.create-btn {
  width: 100%;
  background: #1E6FBA;
  color: white;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.btn-icon {
  font-size: 36rpx;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.group-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.group-info {
  flex: 1;
}

.group-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
  color: #333;
}

.group-desc {
  font-size: 28rpx;
  color: #666;
}

.group-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.action-btn.edit {
  background: #f0f8ff;
  color: #1E6FBA;
}

.action-btn.delete {
  background: #fff0f0;
  color: #e74c3c;
}

.member-section {
  margin-top: 20rpx;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.member-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.add-member-btn {
  font-size: 24rpx;
  color: #1E6FBA;
  font-weight: 500;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.member-name {
  font-size: 28rpx;
  color: #333;
}

.remove-member {
  width: 40rpx;
  height: 40rpx;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
}

.empty-members {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.empty-groups {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.empty-desc {
  display: block;
  font-size: 28rpx;
  color: #999;
}

/* 模态框样式 */
.modal-content {
  padding: 20rpx 0;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.form-textarea {
  width: 100%;
  height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.member-select-list {
  max-height: 400rpx;
  overflow-y: auto;
}

.member-select-item {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.member-checkbox {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.member-role {
  font-size: 24rpx;
  color: #999;
}

/* 搜索无结果提示 */
.empty-search {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 28rpx;
}

/* 确保搜索框与其他表单一致 */
.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>



