export type HistoryType = 'RENT' | 'RETURN' | 'CHARGE_START' | 'CHARGE_COMPLETE'

export type HistoryItem = {
  id: string
  type: HistoryType
  user: string
  at: string
  plannedReturnTime: string | null
  battery: string | null
  plannedChargeCompleteAt: string | null
  createdAt: string
}

export type UserName = 'ひなた' | 'まなみ'

export type HistoryPayload = {
  type: HistoryType
  user: UserName
  at?: string
  plannedReturnTime?: string | null
  battery?: string | null
  plannedChargeCompleteAt?: string | null
}

// TODO 後で環境変数に変更
const BASE = 'http://localhost:3000'

export async function postHistory(payload: HistoryPayload) {
  const res = await fetch(`${BASE}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to post history: ${res.status} ${text}`)
  }

  return (await res.json()) as HistoryItem
}

export type AppState = {
  status: 'IDLE' | 'RENTING' | 'CHARGING'
  usingUserName: UserName | null
  chargingUserName: UserName | null
  returnTime: string | null
  plannedChargeCompleteAt: string | null
  lastBatteryLevel: string | null
}

export async function fetchHistory(limit = 50) {
  const res = await fetch(`${BASE}/api/history?limit=${limit}`)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch history: ${res.status} ${text}`)
  }

  return (await res.json()) as HistoryItem[]
}

export async function fetchAppState() {
  const res = await fetch(`${BASE}/api/state`)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch app state: ${res.status} ${text}`)
  }

  return (await res.json()) as AppState
}
