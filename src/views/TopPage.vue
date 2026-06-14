<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="title">自転車シェア状況確認</h1>
      <!-- ようこそ -->
      <p class="welcome">ようこそ {{ displayLoginUserName }} さん</p>

      <!-- ステータスカード -->
      <div class="status-card">
        <div class="status-box" :data-status="status">
          <div class="status-text">{{ statusLabel }}</div>
        </div>

        <!-- 条件付き：貸出中なら利用者名を表示 -->
        <p v-if="status === 'RENTING'" class="rent-user">by {{ usingUserName }}</p>
        <p v-if="status === 'RENTING' && returnTime" class="rent-note">
          （返却予定 {{ returnTime }}）
        </p>
        <p v-if="status === 'IDLE' && lastBatteryLabel" class="rent-note">{{ lastBatteryLabel }}</p>

        <p v-if="status === 'CHARGING'" class="rent-note">
          （完了予定
          {{ plannedChargeCompleteAt ? formatDateTime(plannedChargeCompleteAt) : '未入力' }}）
        </p>
      </div>

      <p v-if="noticeMessage" class="notice">{{ noticeMessage }}</p>

      <div class="action-area">
        <button class="primary" :disabled="isPrimaryDisabled" @click="onPrimary">
          {{ primaryButtonLabel }}
        </button>

        <button class="secondary" :disabled="isChargeDisabled" @click="onCharge">
          {{ chargeButtonLabel }}
        </button>
      </div>
      <button class="back" @click="router.push('/history')">利用履歴を見る</button>

      <!-- ログインに戻る -->
      <button class="back" @click="goLogin">ログイン画面に戻る</button>
    </div>
    <RentRegisterModal v-if="showRentModal" @close="closeRentModal" @submit="onRentSubmit" />
    <ReturnModal v-if="showReturnModal" @close="closeReturnModal" @submit="onReturnSubmit" />
    <ChargeModal v-if="showChargeModal" @close="closeChargeModal" @submit="onChargeSubmit" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import RentRegisterModal from '@/components/RentRegisterModal.vue'
import ReturnModal from '@/components/ReturnModal.vue'
import ChargeModal from '@/components/ChargeModal.vue'
import { ref } from 'vue'

const router = useRouter()
const app = useAppStore()
const showRentModal = ref(false)
const showReturnModal = ref(false)
const showChargeModal = ref(false)

// 表示用ログインユーザー名
const displayLoginUserName = computed(() => app.loginUserName ?? 'ゲスト')

// 利用状況（未使用/貸出中/充電中）
const status = computed(() => app.status)
const statusLabel = computed(() => app.statusLabel)

// 利用者名
const usingUserName = computed(() => app.usingUserName ?? '')
const returnTime = computed(() => app.returnTime)

// ボタンラベル(貸出/返却)
const primaryButtonLabel = computed(() => app.primaryButtonLabel)
// ボタンラベル(充電開始/充電完了)
const chargeButtonLabel = computed(() => app.chargeButtonLabel)

const isPrimaryDisabled = computed(() => app.isPrimaryDisabled)
const isChargeDisabled = computed(() => app.isChargeDisabled)

const noticeMessage = computed(() => app.noticeMessage)
const plannedChargeCompleteAt = computed(() => app.plannedChargeCompleteAt)

const onPrimary = () => {
  // 貸出中なら返却
  if (app.status === 'RENTING') {
    showReturnModal.value = true
    return
  }

  // 未使用なら「貸出登録モーダル」を出す
  if (app.status === 'IDLE') {
    showRentModal.value = true
    return
  }
}

const lastBatteryLabel = computed(() => {
  const v = app.lastBatteryLevel
  if (!v) return ''
  return v === 'FL' ? '残FL' : `残${v}%`
})

const onCharge = () => {
  if (app.status === 'CHARGING') {
    // 充電中なら「充電完了」
    app.completeCharging()
    return
  }

  // 未使用のときは「充電モーダル」
  if (app.status === 'IDLE') {
    showChargeModal.value = true
  }
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]

  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`
}

const onRentSubmit = async (plannedReturnTime: string | null) => {
  // モーダルは楽観的にすぐ閉じる
  showRentModal.value = false
  try {
    await app.rent(plannedReturnTime)
  } catch (e) {
    // エラー時は通知を表示するだけに留める
    console.error('rent failed', e)
  }
}

const closeRentModal = () => {
  showRentModal.value = false
}

const onReturnSubmit = async (battery: string | null) => {
  // モーダルは楽観的にすぐ閉じる
  showReturnModal.value = false
  try {
    await app.returnBike(battery)
  } catch (e) {
    console.error('return failed', e)
  }
}

const closeReturnModal = () => {
  showReturnModal.value = false
}

const onChargeSubmit = (plannedCompleteAt: string | null) => {
  app.startCharging(plannedCompleteAt)
  showChargeModal.value = false
}

const closeChargeModal = () => {
  showChargeModal.value = false
}

const goLogin = () => router.push('/login')
</script>

<style scoped>
/* 画面全体 */
.login-wrapper {
  min-height: 100dvh;
  min-height: 100svh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(#ffffff, #eeeeee);
  padding: 16px;
}

/* 中央カード */
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 20px;
  text-align: center;
}

/* タイトル */
.title {
  font-weight: bold;
  color: #444;

  margin-top: 16px;
  margin-bottom: 22px;

  font-size: 22px;
  white-space: nowrap;
}

.welcome {
  color: #666;
  margin-bottom: 24px;
}

.status-card {
  margin: 24px auto 32px;
  padding: 28px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.status-box {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0 0 8px;
}

.status-text {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 1px;
}

.status-box[data-status='IDLE'] .status-text {
  color: #555;
}
.status-box[data-status='RENTING'] .status-text {
  color: #f4a460;
}
.status-box[data-status='CHARGING'] .status-text {
  color: #6495ed;
}

.status-pill[data-status='IDLE'] {
  background: #9e9e9e; /* 未使用 */
}
.status-pill[data-status='RENTING'] {
  background: #ffefd5; /* 貸出中 */
}
.status-pill[data-status='CHARGING'] {
  background: #e0ffff; /* 充電中 */
}

.rent-user {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 6px 0;
}

.rent-note {
  color: #666;
  margin-top: 6px;
}

.action-area {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
}

button.primary {
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  background: #ffdead;
  font-size: 16px;
  font-weight: bold;
  transition:
    background 0.15s ease,
    transform 0.05s ease;
}
button.primary:active {
  background: #ffe4b5;
  transform: translateY(1px);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.notice {
  margin: 8px 0 0;
  color: #666;
}

button.secondary {
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  background: #e6e6e6;
  font-size: 16px;
  font-weight: bold;
  transition:
    background 0.15s ease,
    transform 0.05s ease;
}
button.secondary:active {
  background: #d6d6d6;
  transform: translateY(1px);
}

button.back {
  margin-top: 22px;
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  background: #f5f5f5;
  color: #555;
  font-size: 14px;
}
button.back:active {
  background: #332828;
  transform: translateY(1px);
}
</style>

/* Mobile tweaks */
<style scoped>
@media (max-width: 420px) {
  .login-wrapper {
    padding: 12px;
    align-items: center;
    justify-content: center;
    padding-top: env(safe-area-inset-top, 20px);
    padding-bottom: env(safe-area-inset-bottom, 12px);
    min-height: 100svh;
  }

  .login-card {
    padding: 20px 16px;
  }

  .title {
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 20px;
    white-space: normal;
  }

  .status-text {
    font-size: 28px;
  }
}
</style>
