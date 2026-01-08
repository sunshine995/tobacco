<template>
    <view>
        <up-grid
			:border="false"
			column-num="3"  
        >
		<up-grid-item
			v-for="(item, index) in moduleList"
			:key="index"
			@click="handleModuleClick(item)"
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

// 创建响应式数据：5个功能模块（图标+标题+跳转路径）
const moduleList = ref([    
    {  
        icon: 'error-circle', // 安全准则
        title: '操作规程',
        path: '/pages/study/category-list',
		categoryId: 1
    },  
    {  
        icon: 'grid',       // 设备维修
        title: '设备维修',
        path: '/pages/study/category-list',
		categoryId: 2
    },  
    {  
        icon: 'level',        // 设备保养
        title: '设备保养',
        path: '/pages/study/category-list',
		categoryId: 3
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
const handleModuleClick = (item) => {
    if (!item.path) return;

    let url = item.path;

    if (item.categoryId) {
        url += `?categoryId=${item.categoryId}&title=${item.title}`;
    }

    uni.navigateTo({ url });
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