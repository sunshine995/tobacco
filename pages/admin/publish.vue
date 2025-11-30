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
	  
	    <text class="section-title">文件上传</text>
	    <UploadFile 
	      ref="fileRef"
	      title="添加文件" 
	      maxCount="5"
	      accept=".pdf,.doc,.docx"
	      @success="onFileSuccess"
	    />
      <VideoUploader
          ref="videoUploader"
          :max-count="3"
          @success="onVideoSuccess"
      />
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
        <checkbox-group @change="onWorkGroupChange">
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
                />
                <text class="checkbox-text">{{ group.name }}</text>
              </label>
            </view>
          </view>
        </checkbox-group>
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
            <!-- 父级分支 - 只作为全选控制器，不返回其ID -->
            <view class="branch-header">
              <view class="checkbox-label" @click.stop="toggleExpand(branch)">
                <view class="parent-checkbox" @click.stop="toggleParentBranch(branch)">
                  <checkbox 
                    :checked="isBranchChecked(branch)"
                    style="display: none;" 
                  />
                  <text class="custom-checkbox" :class="{checked: isBranchChecked(branch)}">
                    {{ isBranchChecked(branch) ? '✓' : '' }}
                  </text>
                </view>
                <text class="branch-name">{{ branch.name }}</text>
                <text class="expand-icon">{{ branch.expanded ? '▲' : '▼' }}</text>
              </view>
            </view>
      
            <!-- 子级分支 - 这些才是实际返回的数据 -->
            <view v-if="branch.expanded && branch.children" class="children-group">
              <checkbox-group @change="(e) => onChildrenBranchChange(e, branch)">
                <view 
                  v-for="child in branch.children" 
                  :key="child.id"
                  class="checkbox-item child-item"
                >
                  <label class="checkbox-label">
                    <checkbox 
                      :value="child.id" 
                      :checked="form.partyBranchIds.includes(child.id)"
                    />
                    <text class="checkbox-text">└─ {{ child.name }}</text>
                  </label>
                </view>
              </checkbox-group>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 动态组选择 -->
      <view class="form-group" v-if="form.sendRangeType === 'DYNAMIC_GROUP'">
        <label class="form-label">选择动态组</label>
        <checkbox-group @change="onDynamicGroupChange">
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
                />
                <text class="checkbox-text">{{ group.name }}</text>
              </label>
            </view>
          </view>
        </checkbox-group>
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
import { getWorkGroupByUserId } from '@/api/workGroup.js'
import { publishNotice } from '@/api/notice.js'
import UploadFile from '@/components/UploadMedia.vue';
import VideoUploader from '@/components/VideoUploader.vue';

const uploadRef = ref(null);
const fileRef = ref();
const videoUploader = ref(null);

const onFileSuccess = (result) => {
  console.log('文件上传成功:', result);
};

const form = reactive({
  title: '',
  content: '',
  images: [],
  sendRangeType: 'WORK_GROUP',
  workGroupIds: [],
  partyBranchIds: [],
  dynamicGroupIds: [],
  userIds: []
});

const rangeOptions = ref([
  { label: '全部人员', value: 'ALL' },
  { label: '班组', value: 'WORK_GROUP' },
  { label: '党支部', value: 'PARTY_BRANCH' },
  { label: '动态组', value: 'DYNAMIC_GROUP' }
]);

const workGroups = ref([
  { id: "管理组", name: '管理组' },
  { id: "甲班", name: '甲班' },
  { id: "乙班", name: '乙班' },
  { id: "维修组", name: '维修组' },
  { id: '电气组', name: '电气组' }
]);

const partyBranchesTree = ref([
  {
    id: "1",
    name: "第一党支部",
    expanded: false,
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

const dynamicGroups = ref([]);
const sending = ref(false);

const onVideoSuccess = (result) => {
  console.log('✅ 视频上传成功');
  console.log('提取的 URL:', result.url);
  console.log('原始响应:', result.rawResponse);
};

const loadDynamicGroups = async () => {
  try {
    const res = await getWorkGroupByUserId(uni.getStorageSync('userId'));
    dynamicGroups.value = res;
  } catch (error) {
    console.error('加载动态组失败:', error);
  }
};

const onWorkGroupChange = (e) => {
  form.workGroupIds = e.detail.value.map(id => String(id));
};

const onDynamicGroupChange = (e) => {
  form.dynamicGroupIds = e.detail.value.map(id => String(id));
};

const isBranchChecked = (branch) => {
  if (!branch.children || branch.children.length === 0) {
    return false;
  }
  return branch.children.every(child => form.partyBranchIds.includes(child.id));
};

const toggleParentBranch = (branch) => {
  if (!branch.children || branch.children.length === 0) return;
  
  const allChildrenSelected = isBranchChecked(branch);
  
  if (allChildrenSelected) {
    branch.children.forEach(child => {
      const index = form.partyBranchIds.indexOf(child.id);
      if (index > -1) {
        form.partyBranchIds.splice(index, 1);
      }
    });
  } else {
    branch.children.forEach(child => {
      if (!form.partyBranchIds.includes(child.id)) {
        form.partyBranchIds.push(child.id);
      }
    });
  }
  
  console.log('父级分支切换后选中的党支部ID:', form.partyBranchIds);
};

const onChildrenBranchChange = (e, parentBranch) => {
  const selectedChildIds = e.detail.value;
  
  const childIds = parentBranch.children.map(child => child.id);
  form.partyBranchIds = form.partyBranchIds.filter(id => !childIds.includes(id));
  form.partyBranchIds.push(...selectedChildIds);
  
  console.log('当前选中的党支部ID:', form.partyBranchIds);
};

const toggleExpand = (branch) => {
  branch.expanded = !branch.expanded;
};

const cleanPartyBranchIds = (partyBranchIds) => {
  const parentIds = partyBranchesTree.value.map(branch => branch.id);
  return partyBranchIds.filter(id => !parentIds.includes(id));
};

const sendMessage = async () => {
  if (!form.title.trim()) {
    uni.showToast({ title: '请输入消息标题', icon: 'none' });
    return;
  }
  if (!form.content.trim()) {
    uni.showToast({ title: '请输入消息内容', icon: 'none' });
    return;
  }

  sending.value = true;

  try {
    // 上传图片
    await uploadRef.value.triggerUpload();
    const imageUrls = uploadRef.value.getUploadedUrls();

    // 上传文件
    const fileResults = await fileRef.value.triggerUpload();
    const filesUrls = fileRef.value.getUploadedUrls();
    const originalFileNames = fileResults
      .filter(item => item.success)
      .map(item => item.file.originalFileName);

    const videoUrls = videoUploader.value.getUploadedUrls();

    let rangeIds = [];
    let rangeType = form.sendRangeType;

    switch (rangeType) {
      case 'WORK_GROUP':
        if (form.workGroupIds.length === 0) {
          uni.showToast({ title: '请选择班组', icon: 'none' });
          sending.value = false;
          return;
        }
        rangeIds = form.workGroupIds;
        break;
        
      case 'PARTY_BRANCH':
        if (form.partyBranchIds.length === 0) {
          uni.showToast({ title: '请选择党支部', icon: 'none' });
          sending.value = false;
          return;
        }
        rangeIds = cleanPartyBranchIds(form.partyBranchIds);
        break;
        
      case 'DYNAMIC_GROUP':
        if (form.dynamicGroupIds.length === 0) {
          uni.showToast({ title: '请选择动态组', icon: 'none' });
          sending.value = false;
          return;
        }
        rangeIds = form.dynamicGroupIds;
        break;
        
      case 'ALL':
        rangeIds = [];
        break;
        
      default:
        uni.showToast({ title: '请选择发送范围', icon: 'none' });
        sending.value = false;
        return;
    }

    const messageData = {
      title: form.title,
      content: form.content,
      images: imageUrls,
      type: rangeType,
      filesUrl: filesUrls,
      originalFileNames: originalFileNames,
      videoUrls: videoUrls,
      rangeIds: rangeIds,
      userId: uni.getStorageSync('userId'),
      username: uni.getStorageSync('userInfo').name,
    };

    console.log('完整的发送数据:', messageData);
    await publishNotice(messageData);

    uni.showToast({ title: '发送成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    
  } catch (error) {
    console.error('发送消息失败:', error);
    uni.showToast({ title: '发送失败，请重试', icon: 'none' });
  } finally {
    sending.value = false;
  }
};

const saveDraft = () => {
  uni.showToast({ title: '已保存草稿', icon: 'success' });
};

onMounted(async () => {
  await loadDynamicGroups();
});
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

.form-input,
.form-textarea {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.form-textarea {
  height: 200rpx;
}

.range-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.range-option {
  padding: 20rpx 30rpx;
  background: #f5f7fa;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666;
  transition: all 0.2s;
  cursor: pointer;
}

.range-option.active {
  background: #1E6FBA;
  color: white;
  border-color: #1E6FBA;
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

.parent-checkbox {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
}

.custom-checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ccc;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: white;
  background: white;
}

.custom-checkbox.checked {
  background: #1E6FBA;
  border-color: #1E6FBA;
}

.branch-header .checkbox-label {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.branch-name {
  flex: 1;
  font-weight: bold;
}

.expand-icon {
  color: #999;
  font-size: 24rpx;
  margin-left: 20rpx;
}

.children-group {
  margin-left: 40rpx;
  border-left: 2rpx solid #e5e5e5;
  padding-left: 20rpx;
  margin-top: 10rpx;
}

.child-item {
  margin-bottom: 10rpx;
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
</style>