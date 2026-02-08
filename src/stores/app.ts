import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type BikeStatus = 'IDLE' | 'RENTING' | 'CHARGING'
export type UserName = 'ひなた' | 'まなみ'

export const useAppStore = defineStore('app', () => {
  const loginUserName = ref<UserName | null>(null)

  const status = ref<BikeStatus>('IDLE')
  const usingUserName = ref<UserName | null>(null)
  const chargingUserName = ref<UserName | null>(null)
  const returnTime = ref<string | null>(null)
  const lastBatteryLevel = ref<string | null>(null)
  const plannedChargeCompleteAt = ref<string | null>(null)

  const statusLabel = computed(() => {
    if (status.value === 'RENTING') return '貸出中'
    if (status.value === 'CHARGING') return '充電中'
    return '未使用'
  })

  // 自分が当事者か
  const isMeRenting = computed(
    () => status.value === 'RENTING' && usingUserName.value === loginUserName.value,
  )
  const isMeCharging = computed(
    () => status.value === 'CHARGING' && chargingUserName.value === loginUserName.value,
  )

  // メイン/サブボタンのラベル
  const primaryButtonLabel = computed(() => (status.value === 'RENTING' ? '返却' : '貸出'))
  const chargeButtonLabel = computed(() => (status.value === 'CHARGING' ? '充電完了' : '充電'))

  // disabled判定
  const isPrimaryDisabled = computed(() => {
    // 未使用なら貸出できる
    if (status.value === 'IDLE') return false

    // 貸出中：本人だけ返却できる
    if (status.value === 'RENTING') return !isMeRenting.value

    // 充電中：貸出中は常に不可
    return true
  })

  const isChargeDisabled = computed(() => {
    // 未使用なら充電開始できる
    if (status.value === 'IDLE') return false

    // 充電中：本人だけ充電完了できる
    if (status.value === 'CHARGING') return !isMeCharging.value

    // 貸出中：充電は不可（本人でも不可にする）
    return true
  })

  // 状態に応じた「説明メッセージ」（Topで表示用）
  const noticeMessage = computed(() => {
    // 貸出中 かつ 自分以外が利用中の場合にメッセージ表示
    if (status.value === 'RENTING' && usingUserName.value && !isMeRenting.value) {
      return `現在、${usingUserName.value} さんが利用中です。`
    }
    // 充電中かつ自分以外が充電担当者の場合
    if (status.value === 'CHARGING' && chargingUserName.value && !isMeCharging.value) {
      return `現在、充電中です（担当：${chargingUserName.value} さん）。`
    }
    return ''
  })

  const setLoginUser = (user: UserName) => {
    loginUserName.value = user
  }

  const rent = (plannedReturnTime?: string | null) => {
    if (!loginUserName.value) return
    if (status.value !== 'IDLE') return
    status.value = 'RENTING'
    usingUserName.value = loginUserName.value
    chargingUserName.value = null
    returnTime.value = plannedReturnTime ?? null
  }

  const returnBike = (battery?: string | null) => {
    if (!isMeRenting.value) return
    lastBatteryLevel.value = battery ?? null
    status.value = 'IDLE'
    usingUserName.value = null
    returnTime.value = null
  }

  const startCharging = (plannedCompleteAt?: string | null) => {
    if (!loginUserName.value) return
    if (status.value !== 'IDLE') return

    status.value = 'CHARGING'
    chargingUserName.value = loginUserName.value
    usingUserName.value = null

    plannedChargeCompleteAt.value = plannedCompleteAt ?? null
  }

  const completeCharging = () => {
    if (!isMeCharging.value) return
    status.value = 'IDLE'
    chargingUserName.value = null
    plannedChargeCompleteAt.value = null
    lastBatteryLevel.value = 'FL'
  }

  return {
    loginUserName,
    status,
    usingUserName,
    chargingUserName,
    returnTime,

    statusLabel,
    primaryButtonLabel,
    chargeButtonLabel,

    isPrimaryDisabled,
    isChargeDisabled,
    noticeMessage,
    lastBatteryLevel,
    plannedChargeCompleteAt,

    setLoginUser,
    rent,
    returnBike,
    startCharging,
    completeCharging,
  }
})
