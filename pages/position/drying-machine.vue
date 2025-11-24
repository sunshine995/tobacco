<template>
  <view class="container">
    <view class="form-container">
    
      <!-- 顶部卡片区域 -->
      <view class="header-card">
        <WorkOrderInfoCard :order-info="myOrder" />
      </view>

      <!-- 一、开班检查项目 -->
      <view class="form-group" v-if="myOrder.number && (myOrder.number.includes('预混柜') || myOrder.number.trim() === '1' || myOrder.number.includes('1'))">
        <h2 class="group-title">开班检查项目</h2>
        <view class="form-row">
          <label class="form-label">风选皮带状态</label>
          <up-picker-data
            v-model="formData.beltStatus"
            title="请选择风选皮带状态"
            :options="statusList"
            valueKey="id"
            labelKey="name">
          </up-picker-data>
        </view>
        
        <!-- 风选皮带照片上传 -->
        <view class="form-row" id="beltPhotoUploadContainer">
          <label class="form-label">风选皮带照片</label>
          <upload-image 
            ref="beltPhotoRef"
            :max-count="1"
            title="风选皮带照片"
            @select="onImageSelect('beltPhoto', $event)"
            @success="onImageUploadSuccess('beltPhoto', $event)"
            @fail="onImageUploadFail('beltPhoto', $event)"
          />
          <view class="photo-tip">提示：拍摄皮带整体状态，重点展示是否跑偏、破损</view>
        </view>
        
        <!-- 开班三压检查照片上传 -->
        <view class="form-row" style="margin-top: 25px;" id="startupThreePressureUploadContainer">
          <label class="form-label">开班三压检查照片</label>
          <upload-image 
            ref="startupThreePressureRef"
            :max-count="3"
            title="三压检查照片"
            @select="onImageSelect('startupThreePressure', $event)"
            @success="onImageUploadSuccess('startupThreePressure', $event)"
            @fail="onImageUploadFail('startupThreePressure', $event)"
          />
          <view class="photo-tip">提示：拍摄三压仪表显示状态，确保压力值清晰可见</view>
        </view>
        
        <!-- 提交验证按钮 -->
        <button type="button" class="submit-btn section-submit-btn" 
                @click="submitStartupSection" 
                :loading="localSaving.startup" 
                :disabled="localSaving.startup">
          {{ localSaving.startup ? '保存中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="localSaveStatus.startup">
          <text class="status-icon" :class="localSaveStatus.startup === 'success' ? 'success' : 'error'">{{ localSaveStatus.startup === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ localSaveStatus.startup === 'success' ? '已保存本地' : '保存失败' }}</text>
        </view>

        <!-- 开班参数折叠面板 -->
        <!-- <view class="collapse-header" @click="toggleCollapse('startupParam')">
          <span>开班参数信息收集</span>
          <span class="collapse-icon" :class="{ 'rotate': collapsed.startupParam }">▼</span>
        </view> -->
        <!-- <view class="collapse-content" :class="{ 'show': collapsed.startupParam }">
          <view class="param-data-card">
            <form id="startup-form">
              <view class="param-process-title">SIROX开班参数</view>
              <view class="param-form-grid">
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-sirox-volume-flow">体积流量显示值 (m³/h)</label>
                  <input type="number" step="0.1" id="startup-sirox-volume-flow" class="param-form-input" 
                         v-model="startupParams.siroxVolumeFlow" placeholder="例：8500.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-sirox-film-valve">薄膜阀开度 (%)</label>
                  <input type="number" step="0.1" id="startup-sirox-film-valve" class="param-form-input" 
                         v-model="startupParams.siroxFilmValve" placeholder="例：30.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-sirox-film-pressure">薄膜阀后压力值 (bar)</label>
                  <input type="number" step="0.1" id="startup-sirox-film-pressure" class="param-form-input" 
                         v-model="startupParams.siroxFilmPressure" placeholder="例：4.5" required>
                </view>
                <view class="param-form-group">
                  <view class="param-checkbox-group">
                    <input type="checkbox" id="startup-sirox-waste-reject" class="param-checkbox" 
                           v-model="startupParams.siroxWasteReject" required>
                    <label class="param-form-label" for="startup-sirox-waste-reject" style="display: inline; margin: 0;">出口废物剔除功能正常</label>
                  </view>
                </view>
                <view class="param-form-group">
                  <view class="param-checkbox-group">
                    <input type="checkbox" id="startup-sirox-water-close" class="param-checkbox" 
                           v-model="startupParams.siroxWaterClose" required>
                    <label class="param-form-label" for="startup-sirox-water-close" style="display: inline; margin: 0;">清洗水关闭</label>
                  </view>
                </view>
                <view class="param-form-group">
                  <view class="param-checkbox-group">
                    <input type="checkbox" id="startup-sirox-condensate-valve" class="param-checkbox" 
                           v-model="startupParams.siroxCondensateValve" required>
                    <label class="param-form-label" for="startup-sirox-condensate-valve" style="display: inline; margin: 0;">冷凝水旁通阀开（2-5分钟排空）</label>
                  </view>
                </view>
              </view>

              <view class="param-process-title">叶丝干燥开班参数</view>
              <view class="param-form-grid">
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-drying-radiator-valve">进散热器薄膜阀开度 (%)</label>
                  <input type="number" step="0.1" id="startup-drying-radiator-valve" class="param-form-input" 
                         v-model="startupParams.dryingRadiatorValve" placeholder="例：85.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-drying-air-ratio">风速配比翻板开度 (%)</label>
                  <input type="number" step="0.1" id="startup-drying-air-ratio" class="param-form-input" 
                         v-model="startupParams.dryingAirRatio" placeholder="例：40.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-drying-sheet-valve">进薄板薄膜阀开度 (%)</label>
                  <input type="number" step="0.1" id="startup-drying-sheet-valve" class="param-form-input" 
                         v-model="startupParams.dryingSheetValve" placeholder="例：90.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-drying-exhaust-valve">排潮风门开度 (%)</label>
                  <input type="number" step="0.1" id="startup-drying-exhaust-valve" class="param-form-input" 
                         v-model="startupParams.dryingExhaustValve" placeholder="例：35.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-drying-sheet-temp">进薄板温度显示（预热）(℃)</label>
                  <input type="number" step="0.1" id="startup-drying-sheet-temp" class="param-form-input" 
                         v-model="startupParams.dryingSheetTemp" placeholder="例：180.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="startup-drying-condensate-temp">冷凝水温度显示（预热）(℃)</label>
                  <input type="number" step="0.1" id="startup-drying-condensate-temp" class="param-form-input" 
                         v-model="startupParams.dryingCondensateTemp" placeholder="例：75.0" required>
                </view>
                <view class="param-form-group">
                  <view class="param-checkbox-group">
                    <input type="checkbox" id="startup-drying-water-close" class="param-checkbox" 
                           v-model="startupParams.dryingWaterClose" required>
                    <label class="param-form-label" for="startup-drying-water-close" style="display: inline; margin: 0;">清洗水关闭</label>
                  </view>
                </view>
                <view class="param-form-group">
                  <view class="param-checkbox-group">
                    <input type="checkbox" id="startup-drying-condensate-drain" class="param-checkbox" 
                           v-model="startupParams.dryingCondensateDrain" required>
                    <label class="param-form-label" for="startup-drying-condensate-drain" style="display: inline; margin: 0;">（首批生产）旁通阀2-5分钟排空冷凝水</label>
                  </view>
                </view>
              </view>

              <button type="button" id="startup-submit-btn" class="param-btn param-btn-primary" 
                      @click="submitStartupParams">提交开班参数</button>
            </form>
          </view>

          <view class="param-data-card">
            <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.8rem; color: #343a40;">开班参数数据概览</h2>
            <view class="param-data-overview">
              <view class="param-data-card-small">
                <view class="param-data-label">总记录数</view>
                <view class="param-data-value">{{ startupParamData.length }}</view>
              </view>
              <view class="param-data-card-small">
                <view class="param-data-label">今日记录</view>
                <view class="param-data-value">{{ todayStartupCount }}</view>
              </view>
            </view>
            <view class="param-btn-group">
              <button id="startup-export-excel" class="param-btn param-btn-success" 
                      @click="exportStartupExcel">导出开班参数Excel</button>
              <button id="startup-view-data" class="param-btn param-btn-secondary" 
                      @click="viewStartupData">查看所有开班参数</button>
              <button id="startup-clear-data" class="param-btn param-btn-danger" 
                      @click="clearStartupData">清空开班参数记录</button>
            </view>
          </view>
        </view> -->
      </view>

      <!-- 二、开料前检查项目 -->
      <view class="form-group feed-pre-check-group">
        <h2 class="group-title">开料前检查项目</h2>
        
        <!-- 牌号与批次号照片上传 -->
        <view class="form-row" id="brandBatchUploadContainer">
          <label class="form-label">牌号与批次号照片</label>
          <upload-image 
            ref="brandBatchRef"
            :max-count="1"
            title="牌号批次照片"
            @select="onImageSelect('brandBatch', $event)"
            @success="onImageUploadSuccess('brandBatch', $event)"
            @fail="onImageUploadFail('brandBatch', $event)"
          />
          
        </view>
        
        <!-- 水分仪通道照片上传 -->
        <view class="form-row" style="margin-top: 25px;" id="moistureUploadContainer">
          <label class="form-label">水分仪通道照片</label>
          <upload-image 
            ref="moistureRef"
            :max-count="1"
            title="水分仪通道照片"
            @select="onImageSelect('moisture', $event)"
            @success="onImageUploadSuccess('moisture', $event)"
            @fail="onImageUploadFail('moisture', $event)"
          />

        </view>
        
        <!-- 蒸汽阀照片上传 -->
        <view class="form-row" style="margin-top: 25px;" id="valveUploadContainer">
          <label class="form-label">蒸汽阀照片</label>
          <upload-image 
            ref="valveRef"
            :max-count="1"
            title="阀门状态照片"
            @select="onImageSelect('valve', $event)"
            @success="onImageUploadSuccess('valve', $event)"
            @fail="onImageUploadFail('valve', $event)"
          />
          
        </view>
        
        <!-- 参数界面照片上传 -->
        <view class="form-row" style="margin-top: 25px;" id="paramUploadContainer">
          <label class="form-label">参数界面照片</label>
          <upload-image 
            ref="paramRef"
            :max-count="1"
            title="参数照片"
            @select="onImageSelect('param', $event)"
            @success="onImageUploadSuccess('param', $event)"
            @fail="onImageUploadFail('param', $event)"
          />

        </view>
        
        <!-- 提交验证按钮 -->
        <button type="button" class="submit-btn section-submit-btn" 
                @click="submitFeedPreSection" 
                :loading="localSaving.feedPre" 
                :disabled="localSaving.feedPre">
          {{ localSaving.feedPre ? '保存中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="localSaveStatus.feedPre">
          <text class="status-icon" :class="localSaveStatus.feedPre === 'success' ? 'success' : 'error'">{{ localSaveStatus.feedPre === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ localSaveStatus.feedPre === 'success' ? '已保存本地' : '保存失败' }}</text>
        </view>
      </view>

      <!-- 三、过料中检查项目 -->
      <!-- <view class="form-group feed-ingroup">
        <h2 class="group-title">过料中检查项目</h2>
        
        
        <view class="form-row" id="feedIngParamUploadContainer">
          <label class="form-label">过料中参数照片</label>
          <upload-image 
            ref="feedIngParamRef"
            :max-count="1"
            title="过料参数照片"
            @select="onImageSelect('feedIngParam', $event)"
            @success="onImageUploadSuccess('feedIngParam', $event)"
            @fail="onImageUploadFail('feedIngParam', $event)"
          />
         
        </view>

        
        <view class="collapse-header" @click="toggleCollapse('feedingParam')">
          <span>过料中参数信息收集</span>
          <span class="collapse-icon" :class="{ 'rotate': collapsed.feedingParam }">▼</span>
        </view>
        <view class="collapse-content" :class="{ 'show': collapsed.feedingParam }">
          <view class="param-data-card">
            <form id="feeding-form">
              <view class="param-process-title">SIROX过料参数</view>
              <view class="param-form-grid">
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-sirox-inlet-moisture">入口水分 (%)</label>
                  <input type="number" step="0.01" id="feeding-sirox-inlet-moisture" class="param-form-input" 
                         v-model="feedingParams.siroxInletMoisture" placeholder="例：19.50" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-sirox-steam-jet">蒸汽喷射流量 (kg/h)</label>
                  <input type="number" step="1" id="feeding-sirox-steam-jet" class="param-form-input" 
                         v-model="feedingParams.siroxSteamJet" placeholder="例：550" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-sirox-outlet-temp">出口温度 (℃)</label>
                  <input type="number" step="0.1" id="feeding-sirox-outlet-temp" class="param-form-input" 
                         v-model="feedingParams.siroxOutletTemp" placeholder="例：80.0" required>
                </view>
              </view>

              <view class="param-process-title">叶丝干燥过料参数</view>
              <view class="param-form-grid">
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-wall-temp">筒壁温度 (℃)</label>
                  <input type="number" step="0.1" id="feeding-drying-wall-temp" class="param-form-input" 
                         v-model="feedingParams.dryingWallTemp" placeholder="例：144.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-hot-air-temp">热风温度 (℃)</label>
                  <input type="number" step="0.1" id="feeding-drying-hot-air-temp" class="param-form-input" 
                         v-model="feedingParams.dryingHotAirTemp" placeholder="例：95.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-negative-pressure">排潮负压 (mbar)</label>
                  <input type="number" step="0.01" id="feeding-drying-negative-pressure" class="param-form-input" 
                         v-model="feedingParams.dryingNegativePressure" placeholder="例：-0.02" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-exhaust-opening">排潮开度 (%)</label>
                  <input type="number" step="0.1" id="feeding-drying-exhaust-opening" class="param-form-input" 
                         v-model="feedingParams.dryingExhaustOpening" placeholder="例：32.0" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-hot-air-speed">热风风速 (m/s)</label>
                  <input type="number" step="0.1" id="feeding-drying-hot-air-speed" class="param-form-input" 
                         v-model="feedingParams.dryingHotAirSpeed" placeholder="例：12.5" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-final-moisture">烘后水分 (%)</label>
                  <input type="number" step="0.01" id="feeding-drying-final-moisture" class="param-form-input" 
                         v-model="feedingParams.dryingFinalMoisture" placeholder="例：12.50" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-drying-final-temp">烘后温度 (℃)</label>
                  <input type="number" step="0.1" id="feeding-drying-final-temp" class="param-form-input" 
                         v-model="feedingParams.dryingFinalTemp" placeholder="例：52.0" required>
                </view>
              </view>

              <view class="param-form-group" style="margin-top: 1rem;">
                <label class="param-form-label">生产时间</label>
                <view class="time-group">
                  <view class="time-item">
                    <input type="datetime-local" id="feeding-production-start" class="param-form-input" 
                           v-model="feedingParams.productionStart" required>
                  </view>
                  <view class="time-separator">至</view>
                  <view class="time-item">
                    <input type="datetime-local" id="feeding-production-end" class="param-form-input" 
                           v-model="feedingParams.productionEnd" required>
                  </view>
                </view>
              </view>

              <view class="param-process-title">冷却风选过料参数</view>
              <view class="param-form-grid">
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-selection-valve">风门开度 (%)</label>
                  <input type="number" step="1" id="feeding-selection-valve" class="param-form-input" 
                         v-model="feedingParams.selectionValve" placeholder="例：50" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-selection-moisture">风选水分 (%)</label>
                  <input type="number" step="0.01" id="feeding-selection-moisture" class="param-form-input" 
                         v-model="feedingParams.selectionMoisture" placeholder="例：12.00" required>
                </view>
                <view class="param-form-group">
                  <label class="param-form-label" for="feeding-selection-reject">风选剔除量 (kg/h)</label>
                  <input type="number" step="0.1" id="feeding-selection-reject" class="param-form-input" 
                         v-model="feedingParams.selectionReject" placeholder="例：2.5" required>
                </view>
              </view>

              <button type="button" id="feeding-submit-btn" class="param-btn param-btn-primary" 
                      @click="submitFeedingParams">提交过料参数</button>
            </form>
          </view>

          <view class="param-data-card">
            <h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.8rem; color: #343a40;">过料参数数据概览</h2>
            <view class="param-data-overview">
              <view class="param-data-card-small">
                <view class="param-data-label">总记录数</view>
                <view class="param-data-value">{{ feedingParamData.length }}</view>
              </view>
              <view class="param-data-card-small">
                <view class="param-data-label">今日记录</view>
                <view class="param-data-value">{{ todayFeedingCount }}</view>
              </view>
            </view>
            <view class="param-btn-group">
              <button id="feeding-export-excel" class="param-btn param-btn-success" 
                      @click="exportFeedingExcel">导出过料参数Excel</button>
              <button id="feeding-view-data" class="param-btn param-btn-secondary" 
                      @click="viewFeedingData">查看所有过料参数</button>
              <button id="feeding-clear-data" class="param-btn param-btn-danger" 
                      @click="clearFeedingData">清空过料参数记录</button>
            </view>
          </view>
        </view>
      </view> -->

      <!-- 四、过料后检查项目（包含重量输入） -->
      <view class="form-group feed-post-group">
        <h2 class="group-title">梗签子统计</h2>
        
        <!-- 过料后梗签字照片 + 重量输入区域 -->
        <view class="form-row" id="postStemSignUploadContainer">
          <!-- 合并标题（包含“及重量”） -->
          <label class="form-label">梗签子照片及重量</label>
          
          <!-- 用flex布局并排显示“照片上传”和“重量输入” -->
          <view class="flex-row-container">
            <!-- 原照片上传区域 -->
            <view class="upload-section">
              <upload-image 
            ref="postStemSignRef"
            :max-count="1"
            title="过料后烟梗签字照片"
            @select="onImageSelect('postStemSign', $event)"
            @success="onImageUploadSuccess('postStemSign', $event)"
            @fail="onImageUploadFail('postStemSign', $event)"
          />
            </view>
           
            <!-- 新增：梗料重量输入项 -->
            <view class="weight-input-section">
              <view class="form-label weight-label">梗料重量（kg）</view>
              <input type="digit" class="form-input" v-model="formData.stemWeight" 
                     placeholder="例：40.50" confirm-type="done" 
                     @input="onStemWeightInput"
                     style="pointer-events: auto; -webkit-user-select: text; user-select: text;" />
            </view>
          </view>
        </view>
        
        <!-- 提交验证按钮 -->
        <button type="button" class="submit-btn section-submit-btn" 
                @click="submitStemSignSection" 
                :loading="localSaving.stemSign" 
                :disabled="localSaving.stemSign">
          {{ localSaving.stemSign ? '保存中...' : '提交验证' }}
        </button>
        <view class="save-status" v-if="localSaveStatus.stemSign">
          <text class="status-icon" :class="localSaveStatus.stemSign === 'success' ? 'success' : 'error'">{{ localSaveStatus.stemSign === 'success' ? '✓' : '✗' }}</text>
          <text class="status-text">{{ localSaveStatus.stemSign === 'success' ? '已保存本地' : '保存失败' }}</text>
        </view>
      </view>


      <!-- 三级验证按钮 -->
      <VerifyButton 
        buttonText="三级验证" 
        :batchId="myOrder.batchNo" 
        :brand="myOrder.brand" 
        segment="烘丝机" 
        :dataCount="8" 
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail" 
        @validate="handleValidate" 
      />
    </view>

    <!-- 数据查看模态框 -->
    <!-- <view id="data-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          :class="{ 'hidden': !showDataModal }">
      <view class="modal-content bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <view class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
          <button id="close-modal" class="close-modal" @click="showDataModal = false">&times;</button>
        </view>
        <view id="modal-data" class="param-data-preview">
          
          <template v-if="currentModalData.length === 0">
            <p class="text-gray-500 text-center py-4">暂无参数记录</p>
          </template>
          <template v-else-if="modalType === 'startup'">
            <view v-for="(item, idx) in currentModalData" :key="idx" 
                  class="param-data-row" :class="{ 'bg-f8fafc': idx % 2 === 0 }">
              <view style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 500;">记录 {{ idx + 1 }}</span>
                <span style="color: #718096; font-size: 0.85rem;">{{ formatDate(item.time) }}</span>
              </view>
              <view style="font-size: 0.85rem; color: #4a5568; gap: 1rem; display: flex; flex-wrap: wrap;">
                <view>SIROX体积流量: {{ item.siroxVolumeFlow }} m³/h</view>
                <view>薄膜阀开度: {{ item.siroxFilmValve }}%</view>
                <view>干燥散热器阀: {{ item.dryingRadiatorValve }}%</view>
              </view>
            </view>
          </template>
          <template v-else-if="modalType === 'feeding'">
            <view v-for="(item, idx) in currentModalData" :key="idx" 
                  class="param-data-row" :class="{ 'bg-f8fafc': idx % 2 === 0 }">
              <view style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 500;">记录 {{ idx + 1 }}</span>
                <span style="color: #718096; font-size: 0.85rem;">{{ formatDate(item.productionStart) }} - {{ formatDate(item.productionEnd) }}</span>
              </view>
              <view style="font-size: 0.85rem; color: #4a5568; gap: 1rem; display: flex; flex-wrap: wrap;">
                <view>SIROX入口水分: {{ item.siroxInletMoisture }}%</view>
                <view>干燥筒壁温度: {{ item.dryingWallTemp }}℃</view>
                <view>排潮开度: {{ item.dryingExhaustOpening }}%</view>
                <view>风选水分: {{ item.selectionMoisture }}%</view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view> -->
    
    <!-- 图片预览模态框 -->
    <view id="image-preview-modal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" 
          :class="{ 'hidden': !showImageModal }">
      <button id="close-image-modal" class="absolute top-4 right-4 text-white text-3xl" 
              @click="showImageModal = false">&times;</button>
      <img id="preview-image" :src="previewImageUrl" alt="预览图片" class="max-w-[90%] max-h-[90vh]">
    </view>
    
    <!-- 提示消息 -->
    <view id="toast" class="toast" :class="{ 'show': showToast, 'error': toastType === 'error', 'warning': toastType === 'warning' }">
      {{ toastMessage }}
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import UploadImage from '@/components/UploadImage.vue'; // 正确导入组件
import WorkOrderInfoCard from '@/components/orderInfo.vue';
import VerifyButton from '@/components/VerifyButton.vue';
import { submitMaterialCheck, byBatchIdAndSegment } from '@/api/production.js';

// 本地保存状态
const localSaving = ref({
  startup: false,
  feedPre: false,
  stemSign: false
});

// 本地保存状态显示
const localSaveStatus = ref({
  startup: '',
  feedPre: '',
  stemSign: ''
});

// 本地存储的各部分数据
const localData = ref({
  startup: null,
  feedPre: null,
  stemSign: null
});

// 状态选项列表
const statusList = ref([
  {
    id: '',
    name: '请选择状态'
  },
  {
    id: 'normal',
    name: '正常（无跑偏、破损、异响）'
  },
  {
    id: 'abnormal',
    name: '异常（需停机维修）'
  }
]);

// 表单数据
const formData = ref({
  beltStatus: '',
  stemWeight: '',
  images: {
    beltPhoto: [],
    startupThreePressure: [],
    brandBatch: [],
    moisture: [],
    valve: [],
    param: [],
    feedIngParam: [],
    postStemSign: []
  }
});

// 风选皮带状态选项数据（用于picker组件，确保跨平台兼容性）
const beltStatusOptions = [
  { value: 'normal', label: '正常（无跑偏、破损、异响）' },
  { value: 'abnormal', label: '异常（需停机维修）' }
];

// 创建订单信息响应式对象
const myOrder = ref({
  id: '',
  batchNo: '',
  brand: '',
  number: '',
  yield: ''
});

// 从全局状态获取数据的函数
const getDataFromGlobal = () => {
  try {
    // 尝试获取全局数据
    const app = getApp();
    console.log('获取app实例:', app);
    
    if (app && app.globalData && app.globalData.currentOrder) {
      console.log('从全局状态找到订单信息:', app.globalData.currentOrder);
      // 更新myOrder对象
      myOrder.value = {
        id: app.globalData.currentOrder.id || '',
        batchNo: app.globalData.currentOrder.batchNo || '',
        brand: app.globalData.currentOrder.brand || '',
        number: app.globalData.currentOrder.number || '',
        yield: app.globalData.currentOrder.yield || ''
      };
      console.log('通过全局状态更新订单信息:', myOrder.value);
      return true;
    }
  } catch (e) {
    console.error('从全局状态获取数据失败:', e);
  }
  return false;
};

// 折叠面板状态
// const collapsed = ref({
//   startupParam: false,
//   feedingParam: false
// });

// 上传组件引用（保持ref名称不变，仅组件内部实现替换）
const beltPhotoRef = ref(null);
const startupThreePressureRef = ref(null);
const brandBatchRef = ref(null);
const moistureRef = ref(null);
const valveRef = ref(null);
const paramRef = ref(null);
const feedIngParamRef = ref(null);
const postStemSignRef = ref(null);

// 上传组件引用数组，用于提交后重置
// const uploadRefs = [
//   beltPhotoRef,
//   startupThreePressureRef,
//   brandBatchRef,
//   moistureRef,
//   valveRef,
//   paramRef,
//   feedIngParamRef,
//   postStemSignRef
// ];

// 提交状态
const submitting = ref(false);
// 是否已提交（用于控制提交按钮隐藏）
const hasSubmitted = ref(false);

// 模态框状态
// const showDataModal = ref(false);
// const modalTitle = ref('');
// const modalType = ref('');
// const currentModalData = ref([]);

// 图片预览状态
const showImageModal = ref(false);
const previewImageUrl = ref('');

// 提示消息状态
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// 梗料重量输入事件处理
const onStemWeightInput = () => {
  // 确保stemWeight是数字类型
  const stemWeight = parseFloat(formData.value.stemWeight);
  if (!isNaN(stemWeight)) {
    // 显示核对提示
    if(stemWeight < 40){
      showToastMessage(myOrder.value.yield<=2500?myOrder.value.yield+'kg '+myOrder.value.brand+'不少于10kg重量':myOrder.value.yield<=5000?myOrder.value.yield+'kg '+myOrder.value.brand+'不少于20kg重量':myOrder.value.yield+'kg '+myOrder.value.brand+'不少于40kg重量', 'warning');
    }
  }
};

// 开班参数
// const startupParams = ref({
//   siroxVolumeFlow: '',
//   siroxFilmValve: '',
//   siroxFilmPressure: '',
//   siroxWasteReject: false,
//   siroxWaterClose: false,
//   siroxCondensateValve: false,
//   dryingRadiatorValve: '',
//   dryingAirRatio: '',
//   dryingSheetValve: '',
//   dryingExhaustValve: '',
//   dryingSheetTemp: '',
//   dryingCondensateTemp: '',
//   dryingWaterClose: false,
//   dryingCondensateDrain: false
// });

// 过料参数
const feedingParams = ref({
  productionStart: '',
  productionEnd: '',
  siroxInletMoisture: '',
  siroxSteamJet: '',
  siroxOutletTemp: '',
  dryingWallTemp: '',
  dryingHotAirTemp: '',
  dryingNegativePressure: '',
  dryingExhaustOpening: '',
  dryingHotAirSpeed: '',
  dryingFinalMoisture: '',
  dryingFinalTemp: '',
  selectionValve: '',
  selectionMoisture: '',
  selectionReject: ''
});

// 初始化生产时间默认值
onMounted(() => {
  const now = new Date().toISOString().slice(0, 16);
  feedingParams.value.productionStart = now;
  feedingParams.value.productionEnd = now;
  
  // 加载本地存储的参数数据
  loadStartupData();
  loadFeedingData();
  
  // 加载本地保存的各部分数据
  loadLocalSavedData();
  
  // 如果当前myOrder还没有有效的数据，再尝试从全局获取一次
  if (!myOrder.value.batchNo || !myOrder.value.brand || !myOrder.value.yield) {
    console.log('onMounted: 尝试从全局状态获取数据...');
    getDataFromGlobal();
  }
});

// 加载已有核对记录 - 优化图片回显功能
// 加载已有核对记录 - 优化图片回显功能 (参考 strip-tobacco-warehousing 模式) 
 const loadExistingCheckRecord = async (batchNo) => { 
   if (!batchNo) return; 
   
   try { 
     const res = await byBatchIdAndSegment(batchNo, "烘丝机"); 
     console.log('加载历史记录结果:', res); 
     
     if (res) { 
       const record = res; 
       // 处理verificationResult：如果是JSON字符串则解析成对象 
       let verificationResult = record.verificationResult || {}; 
       if (typeof verificationResult === 'string') { 
         try { 
           verificationResult = JSON.parse(verificationResult); 
           console.log('成功解析verificationResult:', verificationResult); 
         } catch (e) { 
           console.error('解析verificationResult失败:', e); 
           verificationResult = {}; 
         } 
       } 
       
       // 回显表单数据 
       formData.value.stemWeight = verificationResult.stemWeight || ''; 
       formData.value.beltStatus = verificationResult.beltStatus || ''; 
       
       // 如果有历史记录，则设置为已提交状态 
       hasSubmitted.value = true; 
       
       // 确保images对象存在 
       const images = verificationResult.images || {}; 
       console.log('需要回显的图片数据:', images); 
 
       // 等待所有 UploadImage 组件都已挂载到DOM 
       await nextTick(); 
 
       // 定义需要回显的图片类型及其对应的组件引用 
       const imageTypesToEcho = [ 
         { key: 'beltPhoto', ref: beltPhotoRef, urls: images.beltPhoto }, 
         { key: 'startupThreePressure', ref: startupThreePressureRef, urls: images.startupThreePressure }, 
         { key: 'brandBatch', ref: brandBatchRef, urls: images.brandBatch }, 
         { key: 'moisture', ref: moistureRef, urls: images.moisture }, 
         { key: 'valve', ref: valveRef, urls: images.valve }, 
         { key: 'param', ref: paramRef, urls: images.param }, 
         { key: 'postStemSign', ref: postStemSignRef, urls: images.postStemSign } 
       ]; 
 
       // 遍历并执行回显操作 
       for (const { key, ref: componentRef, urls } of imageTypesToEcho) { 
         // 检查组件是否存在且有 setPreviewImages 方法 
         if (componentRef.value && typeof componentRef.value.setPreviewImages === 'function') { 
           // 统一处理 urls 为数组 
           const imageUrls = Array.isArray(urls) ? urls : urls ? [urls] : []; 
           
           // 直接调用组件方法进行回显，组件内部应处理好URL格式化 
           componentRef.value.setPreviewImages(imageUrls); 
           console.log(`✅ ${key} 图片回显成功，共 ${imageUrls.length} 张。`); 
         } else { 
           console.warn(`⚠️ ${key} 组件未找到或不支持 setPreviewImages 方法，跳过回显。`); 
         } 
       } 
       
       console.log('已加载历史核对记录并完成图片回显。'); 
     } else { 
       console.log('该批次无历史核对记录'); 
       // 当无历史记录时，重置已提交状态 
       hasSubmitted.value = false; 
     } 
   } catch (error) { 
     console.error('加载历史核对记录失败:', error); 
     // 出错时重置已提交状态 
     hasSubmitted.value = false; 
   } 
 };

// 页面加载时接收参数并更新订单信息
onLoad((options) => {
  // 注意：options 中的值都是字符串，且可能包含编码后的中文
  console.log('接收到的URL参数:', options);
  
  // 获取并解码URL参数，直接更新myOrder对象
  myOrder.value = {
    id: options.id ? decodeURIComponent(options.id) : '',
    batchNo: options.batchNo ? decodeURIComponent(options.batchNo) : '',
    brand: options.brand ? decodeURIComponent(options.brand) : '',
    number: options.number ? decodeURIComponent(options.number) : options.orderNo ? decodeURIComponent(options.orderNo) : '',
    yield: options.yield ? decodeURIComponent(options.yield) : ''
  };
  
  console.log('通过URL参数更新后的订单信息:', myOrder.value);
  
  // 如果URL没有参数或参数不完整，尝试从全局状态获取
  if (!myOrder.value.batchNo || !myOrder.value.brand || !myOrder.value.number || !myOrder.value.yield) {
    getDataFromGlobal();
  }
  
  // ✅ 参考strip-tobacco-warehousing模式：无论数据来源，只要有批次号就加载历史记录
  if (myOrder.value.batchNo) {
    loadExistingCheckRecord(myOrder.value.batchNo);
  }
});

// 折叠面板切换
// const toggleCollapse = (key) => {
//   collapsed.value[key] = !collapsed.value[key];
// };

// 图片选择事件
const onImageSelect = (imageType, files) => {
  console.log(`${imageType} 选择图片:`, files);
};

// 图片上传成功事件
const onImageUploadSuccess = (imageType, result) => {
  console.log(`${imageType} 上传成功:`, result);
  if (result.file && result.file.previewUrl) {
    const index = formData.value.images[imageType].findIndex(
      f => f.localFilePath === result.file.localFilePath
    );
    if (index !== -1) {
      formData.value.images[imageType][index].url = result.file.previewUrl;
      formData.value.images[imageType][index].uploaded = true;
    }
  }
};

// 图片上传失败事件
const onImageUploadFail = (imageType, result) => {
  console.log(`${imageType} 上传失败:`, result);
  showToastMessage(`上传失败: ${result.error.message || '未知错误'}`, 'error');
};

// 显示提示消息（跨平台实现）
const showToastMessage = (message, type = 'success') => {
  // 先尝试使用uni-app原生toast API
  try {
    // 根据类型选择图标
    let icon = 'success';
    if (type === 'error') {
      icon = 'error';
    } else if (type === 'warning') {
      icon = 'warn';
    }
    
    // 使用uni-app的toast API
    uni.showToast({
      title: message,
      icon: icon,
      duration: 2000
    });
    return;
  } catch (e) {
    console.warn('uni.showToast API不可用，回退到自定义实现:', e);
  }
  
  // 回退到自定义实现（兼容旧版本）
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  
  setTimeout(() => {
    showToast.value = false;
  }, 4000);
};

// 格式化日期
// const formatDate = (dateString) => {
//   if (!dateString) return '';
//   return new Date(dateString).toLocaleString('zh-CN');
// };

// ===================== 开班参数数据处理 =====================
const startupParamData = ref([]);

const loadStartupData = () => {
  try {
    const saved = uni.getStorageSync('startupParamData');
    startupParamData.value = saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('加载开班数据失败:', error);
    startupParamData.value = [];
  }
};

// const saveStartupData = () => {
//   try {
//     uni.setStorageSync('startupParamData', startupParamData.value);
//   } catch (error) {
//     console.error('保存开班数据失败:', error);
//   }
// };

// const todayStartupCount = computed(() => {
//   const today = new Date().toISOString().slice(0, 10);
//   return startupParamData.value.filter(item => item.time.startsWith(today)).length;
// });

// 提交开班参数
// const submitStartupParams = () => {
//   const formData = {
//     time: new Date().toISOString(),
//     ...startupParams.value
//   };
//   startupParamData.value.push(formData);
//   saveStartupData();
//   showToastMessage('开班参数提交成功！');
  
//   // 重置表单
//   Object.keys(startupParams.value).forEach(key => {
//     if (typeof startupParams.value[key] === 'boolean') {
//       startupParams.value[key] = false;
//     } else {
//       startupParams.value[key] = '';
//     }
//   });
// };

// 导出开班参数Excel
// const exportStartupExcel = () => {
//   if (startupParamData.value.length === 0) {
//     showToastMessage('暂无开班参数可导出', 'warning');
//     return;
//   }
//   // 使用简单的方式处理数据，避免依赖XLSX库
//   showToastMessage('数据已准备好，可联系技术人员获取导出功能');
// };

// 查看开班参数
// const viewStartupData = () => {
//   modalTitle.value = '开班参数记录';
//   modalType.value = 'startup';
//   currentModalData.value = [...startupParamData.value].sort(
//     (a, b) => new Date(b.time) - new Date(a.time)
//   );
//   showDataModal.value = true;
// };

// 清空开班参数
// const clearStartupData = () => {
//   if (confirm('确定清空所有开班参数记录？')) {
//     startupParamData.value = [];
//     saveStartupData();
//     showToastMessage('开班参数记录已清空');
//   }
// };

// ===================== 过料参数数据处理 =====================
const feedingParamData = ref([]);

const loadFeedingData = () => {
  try {
    const saved = uni.getStorageSync('feedingParamData');
    feedingParamData.value = saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('加载过料数据失败:', error);
    feedingParamData.value = [];
  }
};

// const saveFeedingData = () => {
//   try {
//     uni.setStorageSync('feedingParamData', feedingParamData.value);
//   } catch (error) {
//     console.error('保存过料数据失败:', error);
//   }
// };

// const todayFeedingCount = computed(() => {
//   const today = new Date().toISOString().slice(0, 10);
//   return feedingParamData.value.filter(item => item.productionStart.startsWith(today)).length;
// });

// 提交过料参数
// const submitFeedingParams = () => {
//   const formData = { ...feedingParams.value };
//   feedingParamData.value.push(formData);
//   saveFeedingData();
//   showToastMessage('过料参数提交成功！');
  
//   // 重置表单
//   const now = new Date().toISOString().slice(0, 16);
//   Object.keys(feedingParams.value).forEach(key => {
//     if (key === 'productionStart' || key === 'productionEnd') {
//       feedingParams.value[key] = now;
//     } else {
//       feedingParams.value[key] = '';
//     }
//   });
// };

// 导出过料参数Excel
// const exportFeedingExcel = () => {
//   if (feedingParamData.value.length === 0) {
//     showToastMessage('暂无过料参数可导出', 'warning');
//     return;
//   }
//   // 使用简单的方式处理数据，避免依赖XLSX库
//   showToastMessage('数据已准备好，可联系技术人员获取导出功能');
// };

// 查看过料参数
// const viewFeedingData = () => {
//   modalTitle.value = '过料参数记录';
//   modalType.value = 'feeding';
//   currentModalData.value = [...feedingParamData.value].sort(
//     (a, b) => new Date(b.productionStart) - new Date(a.productionStart)
//   );
//   showDataModal.value = true;
// };

// 清空过料参数
// const clearFeedingData = () => {
//   if (confirm('确定清空所有过料参数记录？')) {
//     feedingParamData.value = [];
//     saveFeedingData();
//     showToastMessage('过料参数记录已清空');
//   }
// };

// 保存数据到本地存储（跨平台实现）
const saveToLocalStorage = (key, data) => {
  try {
    const storageKey = `dryingMachine_${myOrder.value.batchNo}_${key}`;
    uni.setStorageSync(storageKey, data);
    return true;
  } catch (error) {
    console.error('保存到本地失败:', error);
    return false;
  }
};

// 从本地存储加载数据（跨平台实现）
const loadFromLocalStorage = (key) => {
  try {
    const storageKey = `dryingMachine_${myOrder.value.batchNo}_${key}`;
    const data = uni.getStorageSync(storageKey);
    return data || null;
  } catch (error) {
    console.error('从本地加载失败:', error);
    return null;
  }
};

// 获取风选皮带状态显示文本（用于picker组件）
const getBeltStatusLabel = (value) => {
  const option = beltStatusOptions.find(opt => opt.value === value);
  return option ? option.label : '';
};

// 风选皮带状态选择事件处理（跨平台兼容）
const onBeltStatusChange = (e) => {
  // picker组件会自动更新v-model绑定的值
  console.log('风选皮带状态已更改为:', formData.value.beltStatus);
};

// 加载所有本地保存的数据
const loadLocalSavedData = () => {
  if (!myOrder.value.batchNo) return;
  
  // 加载开班检查数据
  const startupData = loadFromLocalStorage('startup');
  if (startupData) {
    localData.value.startup = startupData;
    localSaveStatus.value.startup = 'success';
    // 如果有本地数据，回显到表单
    if (startupData.beltStatus) {
      formData.value.beltStatus = startupData.beltStatus;
    }
    // 回显图片
    if (startupData.images) {
      if (startupData.images.beltPhoto && beltPhotoRef.value && beltPhotoRef.value.setPreviewImages) {
        beltPhotoRef.value.setPreviewImages(startupData.images.beltPhoto);
      }
      if (startupData.images.startupThreePressure && startupThreePressureRef.value && startupThreePressureRef.value.setPreviewImages) {
        startupThreePressureRef.value.setPreviewImages(startupData.images.startupThreePressure);
      }
    }
  }
  
  // 加载开料前检查数据
  const feedPreData = loadFromLocalStorage('feedPre');
  if (feedPreData) {
    localData.value.feedPre = feedPreData;
    localSaveStatus.value.feedPre = 'success';
    // 回显图片
    if (feedPreData.images) {
      if (feedPreData.images.brandBatch && brandBatchRef.value && brandBatchRef.value.setPreviewImages) {
        brandBatchRef.value.setPreviewImages(feedPreData.images.brandBatch);
      }
      if (feedPreData.images.moisture && moistureRef.value && moistureRef.value.setPreviewImages) {
        moistureRef.value.setPreviewImages(feedPreData.images.moisture);
      }
      if (feedPreData.images.valve && valveRef.value && valveRef.value.setPreviewImages) {
        valveRef.value.setPreviewImages(feedPreData.images.valve);
      }
      if (feedPreData.images.param && paramRef.value && paramRef.value.setPreviewImages) {
        paramRef.value.setPreviewImages(feedPreData.images.param);
      }
    }
  }
  
  // 加载梗签字统计数据
  const stemSignData = loadFromLocalStorage('stemSign');
  if (stemSignData) {
    localData.value.stemSign = stemSignData;
    localSaveStatus.value.stemSign = 'success';
    // 回显数据
    if (stemSignData.stemWeight) {
      formData.value.stemWeight = stemSignData.stemWeight;
    }
    // 回显图片
    if (stemSignData.images && stemSignData.images.postStemSign && postStemSignRef.value && postStemSignRef.value.setPreviewImages) {
      postStemSignRef.value.setPreviewImages(stemSignData.images.postStemSign);
    }
  }
};

// 提交开班检查项目到数据库
const submitStartupSection = async () => {
  // 验证风选皮带状态
  if (!formData.value.beltStatus) {
    showToastMessage('请选择风选皮带状态', 'error');
    return;
  }
  
  // 验证照片
  if (beltPhotoRef.value && beltPhotoRef.value.getAllFiles && beltPhotoRef.value.getAllFiles().length === 0) {
    showToastMessage('请上传风选皮带照片', 'error');
    return;
  }
  
  if (startupThreePressureRef.value && startupThreePressureRef.value.getAllFiles && startupThreePressureRef.value.getAllFiles().length === 0) {
    showToastMessage('请上传开班三压检查照片', 'error');
    return;
  }
  
  localSaving.value.startup = true;
  
  try {
    // 触发图片上传
    const uploadComponents = [
      { ref: beltPhotoRef, name: '风选皮带照片' },
      { ref: startupThreePressureRef, name: '开班三压检查照片' }
    ];
    
    for (const { ref: uploadRef, name } of uploadComponents) {
      if (uploadRef.value && uploadRef.value.getFiles && uploadRef.value.getFiles().length > 0) {
        try {
          await uploadRef.value.triggerUpload();
        } catch (error) {
          console.error(`${name}上传失败:`, error);
          showToastMessage(`${name}上传失败，请重试`, 'error');
          localSaving.value.startup = false;
          return;
        }
      }
    }
    
    // 收集图片URL
    const images = {
      beltPhoto: beltPhotoRef.value?.getAllImageUrls() || [],
      startupThreePressure: startupThreePressureRef.value?.getAllImageUrls() || []
    };
    
    // 构建保存数据
    const data = {
      beltStatus: formData.value.beltStatus,
      images: images,
      savedAt: new Date().toISOString()
    };
    
    // 保存到本地
    if (saveToLocalStorage('startup', data)) {
      localData.value.startup = data;
      localSaveStatus.value.startup = 'success';
    } else {
      localSaveStatus.value.startup = 'error';
      showToastMessage('本地保存失败，请重试', 'error');
    }
    
    // 构建提交数据
    const verificationResult = {
      stemWeight: localData.value.stemSign?.stemWeight ? parseFloat(localData.value.stemSign.stemWeight) : null,
      beltStatus: data.beltStatus,
      images: {
        ...(localData.value.feedPre?.images || {}),
        ...(localData.value.stemSign?.images || {}),
        ...images
      }
    };
    
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "烘丝机",
      verificationResult: verificationResult,
      dataCount: 8,
      operatorId: uni.getStorageSync('userId') || ''
    };
    
    // 确保至少有一个方式获取品牌信息
    if (!submitData.brand || !submitData.brand.trim()) {
      showToastMessage('未获取到物料牌号信息，请确认工单信息是否正确', 'error');
      return;
    }
    
    console.log('提交的表单数据:', submitData);
    
    // 调用API提交数据到服务器
    await submitMaterialCheck(submitData);
    
    showToastMessage('开班检查项目已上传到数据库');
    hasSubmitted.value = true;
  } catch (error) {
    console.error('上传失败:', error);
    localSaveStatus.value.startup = 'error';
    showToastMessage('上传失败，请重试', 'error');
  } finally {
    localSaving.value.startup = false;
  }
};

// 提交开料前检查项目到数据库
const submitFeedPreSection = async () => {
  // 验证照片
  const requiredImages = [
    { ref: brandBatchRef, name: '牌号与批次号照片' },
    { ref: moistureRef, name: '水分仪通道照片' },
    { ref: valveRef, name: '蒸汽阀照片' },
    { ref: paramRef, name: '参数界面照片' }
  ];
  
  for (const { ref: uploadRef, name } of requiredImages) {
    if (uploadRef.value && uploadRef.value.getAllFiles && uploadRef.value.getAllFiles().length === 0) {
      showToastMessage(`请上传${name}`, 'error');
      return;
    }
  }
  
  localSaving.value.feedPre = true;
  
  try {
    // 触发图片上传
    const uploadComponents = requiredImages;
    
    for (const { ref: uploadRef, name } of uploadComponents) {
      if (uploadRef.value && uploadRef.value.getFiles && uploadRef.value.getFiles().length > 0) {
        try {
          await uploadRef.value.triggerUpload();
        } catch (error) {
          console.error(`${name}上传失败:`, error);
          showToastMessage(`${name}上传失败，请重试`, 'error');
          localSaving.value.feedPre = false;
          return;
        }
      }
    }
    
    // 收集图片URL
    const images = {
      brandBatch: brandBatchRef.value?.getAllImageUrls() || [],
      moisture: moistureRef.value?.getAllImageUrls() || [],
      valve: valveRef.value?.getAllImageUrls() || [],
      param: paramRef.value?.getAllImageUrls() || []
    };
    
    // 构建保存数据
    const data = {
      images: images,
      savedAt: new Date().toISOString()
    };
    
    // 保存到本地
    if (saveToLocalStorage('feedPre', data)) {
      localData.value.feedPre = data;
      localSaveStatus.value.feedPre = 'success';
    } else {
      localSaveStatus.value.feedPre = 'error';
      showToastMessage('本地保存失败，请重试', 'error');
    }
    
    // 构建提交数据
    const verificationResult = {
      stemWeight: localData.value.stemSign?.stemWeight ? parseFloat(localData.value.stemSign.stemWeight) : null,
      beltStatus: localData.value.startup?.beltStatus || null,
      images: {
        ...(localData.value.startup?.images || {}),
        ...(localData.value.stemSign?.images || {}),
        ...images
      }
    };
    
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "烘丝机",
      verificationResult: verificationResult,
      dataCount: 8,
      operatorId: uni.getStorageSync('userId') || ''
    };
    
    // 确保至少有一个方式获取品牌信息
    if (!submitData.brand || !submitData.brand.trim()) {
      showToastMessage('未获取到物料牌号信息，请确认工单信息是否正确', 'error');
      return;
    }
    
    console.log('提交的表单数据:', submitData);
    
    // 调用API提交数据到服务器
    await submitMaterialCheck(submitData);
    
    showToastMessage('开料前检查项目已上传到数据库');
    hasSubmitted.value = true;
  } catch (error) {
    console.error('上传失败:', error);
    localSaveStatus.value.feedPre = 'error';
    showToastMessage('上传失败，请重试', 'error');
  } finally {
    localSaving.value.feedPre = false;
  }
};

// 提交梗签字统计到数据库
const submitStemSignSection = async () => {
  // 验证重量
  if (!formData.value.stemWeight.trim()) {
    showToastMessage('请填写梗料重量', 'error');
    return;
  }
  
  // 验证照片
  if (postStemSignRef.value && postStemSignRef.value.getAllFiles && postStemSignRef.value.getAllFiles().length === 0) {
    showToastMessage('请上传梗签子照片', 'error');
    return;
  }
  
  localSaving.value.stemSign = true;
  
  try {
    // 触发图片上传
    if (postStemSignRef.value && postStemSignRef.value.getFiles && postStemSignRef.value.getFiles().length > 0) {
      try {
        await postStemSignRef.value.triggerUpload();
      } catch (error) {
        console.error('梗签子照片上传失败:', error);
        showToastMessage('梗签子照片上传失败，请重试', 'error');
        localSaving.value.stemSign = false;
        return;
      }
    }
    
    // 收集图片URL
    const images = {
      postStemSign: postStemSignRef.value?.getAllImageUrls() || []
    };
    
    // 构建保存数据
    const data = {
      stemWeight: formData.value.stemWeight,
      images: images,
      savedAt: new Date().toISOString()
    };
    
    // 保存到本地
    if (saveToLocalStorage('stemSign', data)) {
      localData.value.stemSign = data;
      localSaveStatus.value.stemSign = 'success';
    } else {
      localSaveStatus.value.stemSign = 'error';
      showToastMessage('本地保存失败，请重试', 'error');
    }
    
    // 构建提交数据
    const verificationResult = {
      stemWeight: parseFloat(formData.value.stemWeight),
      beltStatus: localData.value.startup?.beltStatus || null,
      images: {
        ...(localData.value.startup?.images || {}),
        ...(localData.value.feedPre?.images || {}),
        ...images
      }
    };
    
    const submitData = {
      batchId: myOrder.value.batchNo,
      brand: myOrder.value.brand,
      segment: "烘丝机",
      verificationResult: verificationResult,
      dataCount: 8,
      operatorId: uni.getStorageSync('userId') || ''
    };
    
    // 确保至少有一个方式获取品牌信息
    if (!submitData.brand || !submitData.brand.trim()) {
      showToastMessage('未获取到物料牌号信息，请确认工单信息是否正确', 'error');
      return;
    }
    
    console.log('提交的表单数据:', submitData);
    
    // 调用API提交数据到服务器
    await submitMaterialCheck(submitData);
    
    showToastMessage('梗签字统计已上传到数据库');
    hasSubmitted.value = true;
  } catch (error) {
    console.error('上传失败:', error);
    localSaveStatus.value.stemSign = 'error';
    showToastMessage('上传失败，请重试', 'error');
  } finally {
    localSaving.value.stemSign = false;
  }
};



// 重置表单
const resetForm = () => {
  formData.value = {
    beltStatus: '',
    stemWeight: '',
    images: {
      beltPhoto: [],
      startupThreePressure: [],
      brandBatch: [],
      moisture: [],
      valve: [],
      param: [],
      feedIngParam: [],
      postStemSign: []
    }
  };
  
  // 重置图片上传组件
  const resetRefs = [beltPhotoRef, startupThreePressureRef, brandBatchRef, moistureRef, valveRef, paramRef, postStemSignRef];
  resetRefs.forEach(ref => {
    if (ref.value && ref.value.reset) {
      ref.value.reset();
    }
  });
};
// 三级验证成功处理
const handleVerifySuccess = () => {
  uni.showToast({
    title: '三级验证成功',
    icon: 'success',
    duration: 2000
  });
};

// 三级验证失败处理
const handleVerifyFail = () => {
  uni.showToast({
    title: '三级验证失败',
    icon: 'error',
    duration: 2000
  });
};

// 三级验证过程数据处理
const handleValidate = (data) => {
  console.log('三级验证过程数据:', data);
};
</script>

<style scoped>
/* 顶部卡片样式 */
.header-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}
* { margin: 0; padding: 0; box-sizing: border-box; font-family: "Microsoft YaHei", sans-serif; }
.container { 
  padding: 20px; 
  background: #f5f5f5; 
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.form-container { 
  max-width: 1000px; 
  margin: 0 auto; 
  background: #fff; 
  padding: 30px; 
  border-radius: 8px; 
  box-shadow: 0 0 10px rgba(0,0,0,0.1); 
}
.form-title { 
  text-align: center; 
  font-size: 22px; 
  font-weight: bold; 
  color: #333; 
  margin-bottom: 30px; 
  padding-bottom: 15px; 
  border-bottom: 2px solid #333; 
}
.form-group { margin-bottom: 35px; }
.group-title { 
  font-size: 18px; 
  font-weight: bold; 
  color: #2c3e50; 
  margin-bottom: 15px; 
  padding-left: 10px; 
  border-left: 4px solid #3498db; 
}
.form-row { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 20px; 
  margin-bottom: 20px; 
  align-items: center; 
}
.form-label { 
  flex: 0 0 160px; 
  font-weight: 500; 
  color: #444; 
}
.form-input, .form-select { 
  flex: 1; 
  min-width: 220px; 
  padding: 1px; 
  border: 1px solid #ddd; 
  border-radius: 4px; 
  font-size: 16px; 
}
.form-input:focus, .form-select:focus { 
  outline: none; 
  border-color: #3498db; 
  box-shadow: 0 0 5px rgba(52,152,219,0.3); 
}

/* 上传组件容器样式 */
.upload-container {
  flex: 1;
  min-width: 220px;
}
.upload-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
}
.file-item, .add-btn {
  width: 120px;
  height: 120px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f8f8;
}
.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.delete-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 20px;
  line-height: 30px;
  text-align: center;
  padding: 0;
  margin: 0;
  z-index: 10;
  border: none;
  cursor: pointer;
}
.file-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 12px;
  padding: 2px 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
}
.progress-bar {
  height: 100%;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.add-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  cursor: pointer;
}
.icon {
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
}
.add-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}
.external-badge {
  position: absolute;
  top: 5px;
  left: 5px;
  background: rgba(0, 122, 255, 0.8);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 5;
}
.photo-tip {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.submit-btn { 
  width: 100%;
  padding: 20rpx;
  background-color: #007AFF;
  color: white;
  text-align: center;
  font-size: 28rpx;
  border-radius: 8rpx;
  margin-top: 20rpx;
}
.submit-btn:hover { 
  background: #2980b9; 
  transform: translateY(-2px); 
  box-shadow: 0 3px 8px rgba(52,152,219,0.2); 
}
.submit-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.feed-pre-check-group { 
  border-top: 2px dashed #eee; 
  padding-top: 25px; 
  margin-top: 10px; 
}
.feed-pre-check-group .group-title { border-left-color: #27ae60; }
.feed-ingroup { 
  border-top: 2px dashed #eee; 
  padding-top: 25px; 
  margin-top: 10px; 
}
.feed-ingroup .group-title { border-left-color: #f39c12; }
.feed-post-group { 
  border-top: 2px dashed #eee; 
  padding-top: 25px; 
  margin-top: 10px; 
}
.feed-post-group .group-title { border-left-color: #e74c3c; }

/* 过料后检查项目的flex布局样式 */
.flex-row-container {
  display: flex;
  gap: 20px;
  flex: 1;
  align-items: flex-start;
  width: 100%;
  flex-wrap: wrap;
}

.upload-section {
  flex: 0 0 auto;
}

.weight-input-section {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
}

.weight-label {
  margin-bottom: 8px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .flex-row-container > div {
    flex: 1 0 100%;
  }
  
  .weight-input-section {
    margin-top: 15px;
  }
}

/* 折叠面板样式 */
.collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-weight: 500;
  color: #2c3e50;
  margin-top: 15px;
  user-select: none;
  transition: background-color 0.3s ease;
}
.collapse-header:hover { background-color: #f1f3f5; }
.collapse-icon {
  transition: transform 0.3s ease;
  font-size: 18px;
}
.rotate { transform: rotate(180deg); }
.collapse-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, padding 0.3s ease-in-out;
  padding-top: 0;
  margin-top: 5px;
}
.show {
  max-height: 2000px;
  padding-top: 15px;
}

/* 参数卡片样式 */
.param-data-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.2rem;
  margin-bottom: 1.2rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
}
.param-process-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #e9ecef;
  color: #343a40;
}
.param-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 1.2rem;
}
.param-form-group { margin-bottom: 0; }
.param-form-label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #495057;
  font-size: 0.95rem;
}
.param-form-input {
  width: 100%;
  padding: 9px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}
.param-form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.param-checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
}
.param-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.param-btn {
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  display: block;
  width: 100%;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}
.param-btn-primary {
  background-color: #2563eb;
  color: white;
}
.param-btn-primary:hover { background-color: #1d4ed8; }
.param-btn-success {
  background-color: #10b981;
  color: white;
}
.param-btn-success:hover { background-color: #059669; }
.param-btn-secondary {
  background-color: #a855f7;
  color: white;
}
.param-btn-secondary:hover { background-color: #9333ea; }
.param-btn-danger {
  background-color: #ef4444;
  color: white;
}
.param-btn-danger:hover { background-color: #dc2626; }
.param-data-overview {
  display: flex;
  gap: 15px;
  margin-bottom: 1rem;
}
.param-data-card-small {
  flex: 1;
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
}
.param-data-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.3rem;
}
.param-data-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
}
.param-btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.param-data-preview {
  max-height: 280px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}
.param-data-preview::-webkit-scrollbar { width: 6px; }
.param-data-preview::-webkit-scrollbar-track { background: #f8fafc; }
.param-data-preview::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.param-data-row {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.6rem 0;
  font-size: 0.9rem;
}
.param-data-row:last-child { border-bottom: none; }
.bg-f8fafc { background-color: #f8fafc; }

/* 时间选择样式 */
.time-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}
.time-item {
  flex: 1;
  min-width: 220px;
}
.time-separator {
  flex: 0 0 30px;
  text-align: center;
  font-weight: 500;
  color: #64748b;
}

/* 提示消息样式 */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #10b981;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  transform: translateX(-50%) translateY(10px);
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.toast.error { background-color: #ef4444; }
.toast.warning { background-color: #f59e0b; }

/* 模态框样式 */
#data-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
#data-modal.hidden {
  display: none;
}
#data-modal .modal-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.modal-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
}
.close-modal {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

/* 图片预览模态框 */
#image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
#image-preview-modal.hidden {
  display: none;
}
#preview-image {
  max-width: 90%;
  max-height: 90vh;
}
#close-image-modal {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 30px;
  cursor: pointer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-container {
    padding: 15px;
  }
  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-label {
    flex: none;
    margin-bottom: 8px;
  }
  .form-input, .form-select, .upload-container {
    width: 100%;
    flex: none;
  }
  .param-form-grid {
    grid-template-columns: 1fr;
  }
  .submit-btn {
    width: 100%;
  }
}
</style>
