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

export type HistoryPayload = {
  type: HistoryType
  user: 'ひなた' | 'まなみ'
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

export async function fetchHistory(limit = 50) {
  const res = await fetch(`${BASE}/api/history?limit=${limit}`)

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch history: ${res.status} ${text}`)
  }

  return (await res.json()) as HistoryItem[]
}
