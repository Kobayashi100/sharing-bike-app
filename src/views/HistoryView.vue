<template>
  <div class="login-wrapper">
    <div class="login-card">
      <!-- ヘッダー -->
      <div class="header">
        <h1 class="title">利用履歴</h1>
        <button class="icon-btn" @click="goTop" aria-label="TOPへ戻る">←</button>
      </div>

      <p class="description">直近の操作履歴を表示します。</p>

      <!-- 状態 -->
      <div v-if="loading" class="state">読み込み中...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <!-- リスト -->
      <div v-else class="list">
        <div v-if="history.length === 0" class="empty">まだ履歴がありません</div>

        <div v-for="h in history" :key="h.id" class="item">
          <div class="row">
            <span class="badge" :data-type="h.type">{{ typeLabel(h.type) }}</span>
            <span class="user">{{ h.user }}</span>
          </div>

          <div class="meta">
            {{ formatDateTime(h.at) }}
          </div>

          <div class="detail" v-if="hasDetail(h)">
            <span v-if="h.plannedReturnTime">返却予定 {{ h.plannedReturnTime }}</span>
            <span v-if="h.battery">残{{ h.battery === 'FL' ? 'FL' : h.battery + '%' }}</span>
            <span v-if="h.plannedChargeCompleteAt">
              充電完了予定 {{ formatDateTime(h.plannedChargeCompleteAt) }}
            </span>
          </div>
        </div>
      </div>

      <button class="back" @click="goTop">TOPに戻る</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchHistory, type HistoryItem, type HistoryType } from '@/api/history'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const history = ref<HistoryItem[]>([])

onMounted(async () => {
  try {
    history.value = await fetchHistory(100)
  } catch (e) {
    error.value = '履歴の取得に失敗しました'
  } finally {
    loading.value = false
  }
})

const goTop = () => router.push('/top')

const typeLabel = (t: HistoryType) => {
  switch (t) {
    case 'RENT':
      return '貸出'
    case 'RETURN':
      return '返却'
    case 'CHARGE_START':
      return '充電開始'
    case 'CHARGE_COMPLETE':
      return '充電完了'
  }
}

const hasDetail = (h: HistoryItem) =>
  !!h.plannedReturnTime || !!h.battery || !!h.plannedChargeCompleteAt

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]

  return `${mm}/${dd}(${weekday}) ${hh}:${mi}`
}
</script>

<style scoped>
/* Login/Topと同じ土台 */
.login-wrapper {
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(#ffffff, #eeeeee);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 20px;
  text-align: center;
}

/* ヘッダー */
.header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.title {
  font-weight: bold;
  color: #444;
  margin-top: 45px;
  margin-bottom: 8px;
  font-size: 22px;
  white-space: nowrap;
}

.icon-btn {
  position: absolute;
  right: 0;
  top: 46px;
  border: none;
  background: transparent;
  font-size: 18px;
  padding: 8px 10px;
  border-radius: 10px;
}
.icon-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.description {
  color: #666;
  margin-bottom: 18px;
}

.state {
  color: #666;
  margin-top: 16px;
}
.state.error {
  color: #b24b4b;
}

.list {
  text-align: left;
  margin-top: 10px;
  display: grid;
  gap: 12px;
}

.empty {
  text-align: center;
  color: #666;
  padding: 18px 0;
}

.item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.badge {
  font-size: 12px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  letter-spacing: 1px;
}

.badge[data-type='RENT'] {
  background: rgba(244, 164, 96, 0.18);
  color: #8b4513;
}
.badge[data-type='RETURN'] {
  background: rgba(90, 160, 120, 0.18);
  color: #2f6b46;
}
.badge[data-type='CHARGE_START'] {
  background: rgba(100, 149, 237, 0.18);
  color: #2f4f96;
}
.badge[data-type='CHARGE_COMPLETE'] {
  background: rgba(120, 120, 120, 0.14);
  color: #444;
}

.user {
  font-weight: 800;
  color: #444;
}

.meta {
  margin-top: 6px;
  font-size: 12px;
  color: #666;
}

.detail {
  margin-top: 8px;
  font-size: 13px;
  color: #555;
  display: grid;
  gap: 4px;
}

.back {
  margin-top: 22px;
  width: 100%;
  padding: 14px 0;
  border: none;
  border-radius: 10px;
  background: #f2f2f2;
  color: #555;
  font-size: 14px;
}
.back:active {
  background: #e7e7e7;
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
    margin-bottom: 8px;
    font-size: 20px;
    white-space: normal;
  }

  .icon-btn {
    top: 18px;
  }
}
</style>
