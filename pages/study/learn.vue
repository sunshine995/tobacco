<template>
    <view>
        <up-grid
                :border="false"
                column-num="3"  
        >
            <up-grid-item
                    v-for="(item, index) in moduleList"
                    :key="index"
                    @click="handleModuleClick(item.path)" 
            >
                <up-icon
                        :customStyle="{paddingTop: 20 + 'rpx'}"
                        :name="item.icon" 
                        :size="36"  
                        color="#000000"  
                ></up-icon>
                <text class="grid-text">{{ item.title }}</text>
            </up-grid-item>
        </up-grid>
        <up-toast ref="uToastRef" />
    </view>
</template>

<script setup>  
import { ref } from 'vue';  
import { useRouter } from 'vue-router';  // uni-app Vue3 路由钩子

// 路由实例（用于页面跳转）
const router = useRouter();

// 创建响应式数据：5个功能模块（图标+标题+跳转路径）
const moduleList = ref([  
    {  
        icon: 'file-text',    // 政策会议：文件文本图标（uview-plus 内置）
        title: '政策会议',
        path: '/pages/study/policy-meeting'  
    },  
    {  
        icon: 'error-circle', // 安全准则
        title: '安全准则',
        path: '/pages/study/safety-rules'
    },  
    {  
        icon: 'grid',       // 设备维修
        title: '设备维修',
        path: '/pages/study/equipment-repair'
    },  
    {  
        icon: 'level',        // 设备保养
        title: '设备保养',
        path: '/pages/study/equipment-maintenance'
    },  
    {  
        icon: 'bookmark',    // 我的考试
        title: '我的考试',
        path: '/pages/study/my-exam'
    }
]);  

// 对 uToast 的引用（可选，用于提示）
const uToastRef = ref(null);  

// 模块点击事件：跳转对应页面
const handleModuleClick = (path) => {
    if (!path) return;
    
    // 1. 路由跳转（uni-app 兼容多端的跳转方式）
    router.push({
        path: path
    }).catch(err => {
        console.error('页面跳转失败：', err);
        // 跳转失败提示（比如页面未创建）
        uToastRef.value?.error('页面暂未开发');
    });

    // 2. 可选：添加点击提示（不需要可删除）
    uToastRef.value?.success(`进入${moduleList.value.find(item => item.path === path)?.title}`);
};  
</script>

<style lang="scss">
    .grid-text {
        font-size: 14px;
        color: #303133;  // 字体颜色加深，更清晰
        padding: 10rpx 0 20rpx;
        text-align: center;  // 文字居中（避免偏左）
        /* #ifndef APP-PLUS */
        box-sizing: border-box;
        /* #endif */
    }

    /* 可选：给 grid-item 添加点击反馈 */
    ::v-deep(.up-grid-item) {
        &:active {
            background-color: #f5f7fa;  // 点击时灰色背景，提升体验
        }
    }
</style>