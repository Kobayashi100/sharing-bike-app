<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="modal-title">貸出登録</h2>

      <div class="field">
        <label class="label">返却予定時刻（任意）</label>

        <select v-model="selected" class="select">
          <option :value="''">未設定</option>
          <option v-for="t in timeOptions" :key="t" :value="t">
            {{ t }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button class="btn secondary" @click="$emit('close')">キャンセル</button>
        <button class="btn primary" @click="submit">貸出</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', plannedReturnTime: string | null): void
}>()

// '' は未設定
const selected = ref<string>('')

// 「現在時刻を基準に15分刻み」で選択肢を作る
const timeOptions = computed(() => {
  const options: string[] = []
  const now = new Date()

  const rounded = new Date(now)
  const m = rounded.getMinutes()
  const add = (15 - (m % 15)) % 15
  rounded.setMinutes(m + add)
  rounded.setSeconds(0)
  rounded.setMilliseconds(0)

  const end = new Date(rounded)
  end.setHours(end.getHours() + 8)

  const cur = new Date(rounded)
  while (cur <= end) {
    const hh = String(cur.getHours()).padStart(2, '0')
    const mm = String(cur.getMinutes()).padStart(2, '0')
    options.push(`${hh}:${mm}`)
    cur.setMinutes(cur.getMinutes() + 15)
  }
  return options
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
  justify-content: flex-end;
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
