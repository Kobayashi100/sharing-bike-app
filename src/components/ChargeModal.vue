<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="modal-title">充電</h2>

      <div class="field">
        <label class="label">充電完了予定日時（任意）</label>

        <select v-model="selected" class="select">
          <option :value="''">未設定</option>
          <option v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button class="btn secondary" @click="$emit('close')">キャンセル</button>
        <button class="btn primary" @click="submit">充電</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  // valueはISO文字列（例: 2026-02-08T15:00:00.000Z みたいな）かnull
  (e: 'submit', plannedCompleteAt: string | null): void
}>()

const selected = ref('')

// 3時間単位で、今から最大48時間先まで（必要なら増やしてOK）
const options = computed(() => {
  const out: { label: string; value: string }[] = []
  const now = new Date()

  // 直近の「3時間区切り」に切り上げ
  const start = new Date(now)
  start.setMinutes(0, 0, 0)
  const h = start.getHours()
  const addHours = (3 - (h % 3)) % 3
  start.setHours(h + addHours)

  const end = new Date(start)
  end.setHours(end.getHours() + 48)

  const cur = new Date(start)
  while (cur <= end) {
    // 表示用：MM/DD(曜) HH:00 みたいにして日跨ぎが分かる
    const mm = String(cur.getMonth() + 1).padStart(2, '0')
    const dd = String(cur.getDate()).padStart(2, '0')
    const hh = String(cur.getHours()).padStart(2, '0')

    const weekday = ['日', '月', '火', '水', '木', '金', '土'][cur.getDay()]
    const label = `${mm}/${dd}(${weekday}) ${hh}:00`

    out.push({ label, value: cur.toISOString() })
    cur.setHours(cur.getHours() + 3)
  }

  return out
})

const submit = () => {
  emit('submit', selected.value === '' ? null : selected.value)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 14px;
  padding: 20px 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.modal-title {
  margin: 4px 0 14px;
  font-size: 18px;
  font-weight: 800;
  color: #444;
  text-align: center;
}

.field {
  text-align: left;
  margin: 12px 0 18px;
}

.label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.select {
  width: 100%;
  padding: 12px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #fff;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  font-weight: 800;
  font-size: 14px;
  width: 120px;
}

.btn.primary {
  background: #ffdead;
}
.btn.primary:active {
  background: #ffefd5;
  transform: translateY(1px);
}

.btn.secondary {
  background: #eee;
}
.btn.secondary:active {
  background: #e0e0e0;
  transform: translateY(1px);
}
</style>
