import http from 'http'
import express from 'express'
import cors from 'cors'
import { WebSocket, WebSocketServer } from 'ws'
import { PrismaClient, HistoryType } from '@prisma/client'

type AppState = {
  status: 'IDLE' | 'RENTING' | 'CHARGING'
  usingUserName: string | null
  chargingUserName: string | null
  returnTime: string | null
  plannedChargeCompleteAt: string | null
  lastBatteryLevel: string | null
}

type ServerMessage = {
  type: 'state'
  payload: AppState
}

const prisma = new PrismaClient()
const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const broadcastState = async () => {
  const latest = await prisma.history.findFirst({
    orderBy: [{ at: 'desc' }, { createdAt: 'desc' }],
  })

  const state: AppState = {
    status: 'IDLE',
    usingUserName: null,
    chargingUserName: null,
    returnTime: null,
    plannedChargeCompleteAt: null,
    lastBatteryLevel: null,
  }

  if (latest) {
    switch (latest.type) {
      case HistoryType.RENT:
        state.status = 'RENTING'
        state.usingUserName = latest.user
        state.returnTime = latest.plannedReturnTime
        break
      case HistoryType.RETURN:
        state.status = 'IDLE'
        state.lastBatteryLevel = latest.battery ?? null
        break
      case HistoryType.CHARGE_START:
        state.status = 'CHARGING'
        state.chargingUserName = latest.user
        state.plannedChargeCompleteAt = latest.plannedChargeCompleteAt
          ? latest.plannedChargeCompleteAt.toISOString()
          : null
        break
      case HistoryType.CHARGE_COMPLETE:
        state.status = 'IDLE'
        state.lastBatteryLevel = 'FL'
        break
    }
  }

  const payload = JSON.stringify({ type: 'state', payload: state })
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

wss.on('connection', async (ws: WebSocket) => {
  const latest = await prisma.history.findFirst({
    orderBy: [{ at: 'desc' }, { createdAt: 'desc' }],
  })

  const state: AppState = {
    status: 'IDLE',
    usingUserName: null,
    chargingUserName: null,
    returnTime: null,
    plannedChargeCompleteAt: null,
    lastBatteryLevel: null,
  }

  if (latest) {
    switch (latest.type) {
      case HistoryType.RENT:
        state.status = 'RENTING'
        state.usingUserName = latest.user
        state.returnTime = latest.plannedReturnTime
        break
      case HistoryType.RETURN:
        state.status = 'IDLE'
        state.lastBatteryLevel = latest.battery ?? null
        break
      case HistoryType.CHARGE_START:
        state.status = 'CHARGING'
        state.chargingUserName = latest.user
        state.plannedChargeCompleteAt = latest.plannedChargeCompleteAt
          ? latest.plannedChargeCompleteAt.toISOString()
          : null
        break
      case HistoryType.CHARGE_COMPLETE:
        state.status = 'IDLE'
        state.lastBatteryLevel = 'FL'
        break
    }
  }

  ws.send(JSON.stringify({ type: 'state', payload: state }))
})

app.use(cors({ origin: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 一覧取得
app.get('/api/history', async (req, res) => {
  const limitRaw = req.query.limit
  const limit = Math.min(200, Math.max(1, Number(limitRaw ?? 50) || 50))

  const items = await prisma.history.findMany({
    orderBy: [{ at: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })

  res.json(items)
})

app.get('/api/state', async (_req, res) => {
  const latest = await prisma.history.findFirst({
    orderBy: [{ at: 'desc' }, { createdAt: 'desc' }],
  })

  const state: {
    status: 'IDLE' | 'RENTING' | 'CHARGING'
    usingUserName: string | null
    chargingUserName: string | null
    returnTime: string | null
    plannedChargeCompleteAt: string | null
    lastBatteryLevel: string | null
  } = {
    status: 'IDLE',
    usingUserName: null,
    chargingUserName: null,
    returnTime: null,
    plannedChargeCompleteAt: null,
    lastBatteryLevel: null,
  }

  if (latest) {
    switch (latest.type) {
      case HistoryType.RENT:
        state.status = 'RENTING'
        state.usingUserName = latest.user
        state.returnTime = latest.plannedReturnTime
        break
      case HistoryType.RETURN:
        state.status = 'IDLE'
        state.lastBatteryLevel = latest.battery ?? null
        break
      case HistoryType.CHARGE_START:
        state.status = 'CHARGING'
        state.chargingUserName = latest.user
        state.plannedChargeCompleteAt = latest.plannedChargeCompleteAt
          ? latest.plannedChargeCompleteAt.toISOString()
          : null
        break
      case HistoryType.CHARGE_COMPLETE:
        state.status = 'IDLE'
        state.lastBatteryLevel = 'FL'
        break
    }
  }

  res.json(state)
})

// 追加
app.post('/api/history', async (req, res) => {
  const body = req.body as {
    type: 'RENT' | 'RETURN' | 'CHARGE_START' | 'CHARGE_COMPLETE'
    user: string
    at?: string
    plannedReturnTime?: string | null
    battery?: string | null
    plannedChargeCompleteAt?: string | null
  }

  if (!body?.type || !body?.user) {
    res.status(400).json({ error: 'type and user are required' })
    return
  }
  if (!(body.type in HistoryType)) {
    res.status(400).json({ error: 'invalid type' })
    return
  }

  const at = body.at ? new Date(body.at) : new Date()
  if (Number.isNaN(at.getTime())) {
    res.status(400).json({ error: 'invalid at' })
    return
  }

  const plannedChargeCompleteAt = body.plannedChargeCompleteAt
    ? new Date(body.plannedChargeCompleteAt)
    : null

  if (plannedChargeCompleteAt && Number.isNaN(plannedChargeCompleteAt.getTime())) {
    res.status(400).json({ error: 'invalid plannedChargeCompleteAt' })
    return
  }

  const created = await prisma.history.create({
    data: {
      type: HistoryType[body.type],
      user: body.user,
      at,
      plannedReturnTime: body.plannedReturnTime ?? null,
      battery: body.battery ?? null,
      plannedChargeCompleteAt: plannedChargeCompleteAt ?? null,
    },
  })

  await broadcastState()

  res.status(201).json(created)
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
server.listen(PORT, () => console.log(`API running: http://localhost:${PORT}`))
