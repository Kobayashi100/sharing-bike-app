import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { postHistory, fetchAppState, type AppState } from '@/api/history'

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
  const STORAGE_KEY = 'sharing-bike-app/loginUserName'

  // 初期復元
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'ひなた' || saved === 'まなみ') {
    loginUserName.value = saved
  }

  const setLoginUser = (user: UserName) => {
    loginUserName.value = user
    localStorage.setItem(STORAGE_KEY, user)
  }

  const logout = () => {
    loginUserName.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

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

  const rent = async (plannedReturnTime?: string | null) => {
    if (!loginUserName.value) return
    if (status.value !== 'IDLE') return

    status.value = 'RENTING'
    usingUserName.value = loginUserName.value
    chargingUserName.value = null
    returnTime.value = plannedReturnTime ?? null

    // 次の貸出が行われるまで表示したいものをリセットするならここ
    lastBatteryLevel.value = null

    try {
      await postHistory({
        type: 'RENT',
        user: loginUserName.value,
        plannedReturnTime: plannedReturnTime ?? null,
      })
    } catch (e) {
      console.warn('history post failed (RENT)', e)
    }
  }

  const returnBike = async (battery?: string | null) => {
    if (!isMeRenting.value) return

    // 先に状態更新（アプリは止めない）
    lastBatteryLevel.value = battery ?? null
    status.value = 'IDLE'
    usingUserName.value = null
    returnTime.value = null

    try {
      await postHistory({
        type: 'RETURN',
        user: loginUserName.value!, // isMeRentingがtrueならnullではない想定
        battery: battery ?? null,
      })
    } catch (e) {
      console.warn('history post failed (RETURN)', e)
    }
  }

  const startCharging = async (plannedCompleteAt?: string | null) => {
    if (!loginUserName.value) return
    if (status.value !== 'IDLE') return

    status.value = 'CHARGING'
    chargingUserName.value = loginUserName.value
    usingUserName.value = null

    plannedChargeCompleteAt.value = plannedCompleteAt ?? null

    try {
      await postHistory({
        type: 'CHARGE_START',
        user: loginUserName.value,
        plannedChargeCompleteAt: plannedCompleteAt ?? null,
      })
    } catch (e) {
      console.warn('history post failed (CHARGE_START)', e)
    }
  }

  const completeCharging = async () => {
    if (!isMeCharging.value) return

    status.value = 'IDLE'
    chargingUserName.value = null
    plannedChargeCompleteAt.value = null

    // 仕様：充電完了後は次の貸出まで「残FL」を出す
    lastBatteryLevel.value = 'FL'

    try {
      await postHistory({
        type: 'CHARGE_COMPLETE',
        user: loginUserName.value!, // isMeChargingがtrueならnullではない想定
      })
    } catch (e) {
      console.warn('history post failed (CHARGE_COMPLETE)', e)
    }
  }

  const applyState = (appState: AppState) => {
    status.value = appState.status
    usingUserName.value = appState.usingUserName
    chargingUserName.value = appState.chargingUserName
    returnTime.value = appState.returnTime
    plannedChargeCompleteAt.value = appState.plannedChargeCompleteAt
    lastBatteryLevel.value = appState.lastBatteryLevel
  }

  const hydrate = async () => {
    try {
      const appState = await fetchAppState()
      applyState(appState)
    } catch (e) {
      console.warn('failed to hydrate app state', e)
    }
  }

  const connectWebSocket = () => {
    if (typeof window === 'undefined') return
    const url = 'ws://localhost:3000'

    const create = () => {
      try {
        const ws = new WebSocket(url)

        ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data?.type === 'state' && data?.payload) {
              applyState(data.payload as AppState)
            }
          } catch (error) {
            console.warn('Invalid websocket message', error)
          }
        })

        ws.addEventListener('close', () => {
          console.warn('WebSocket closed, reconnecting...')
          setTimeout(create, 2000)
        })

        ws.addEventListener('error', () => {
          ws.close()
        })
      } catch (error) {
        console.warn('WebSocket connection failed, retrying...', error)
        setTimeout(create, 2000)
      }
    }

    create()
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
    logout,
    rent,
    returnBike,
    startCharging,
    completeCharging,
    hydrate,
    connectWebSocket,
  }
})
