import express from 'express'
import cors from 'cors'
import { PrismaClient, HistoryType } from '@prisma/client'

const prisma = new PrismaClient()
const app = express()

app.use(cors({ origin: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// 一覧取得
app.get('/api/history', async (req, res) => {
  const limitRaw = req.query.limit
  const limit = Math.min(200, Math.max(1, Number(limitRaw ?? 50) || 50))

  const items = await prisma.history.findMany({
    orderBy: { at: 'desc' },
    take: limit,
  })

  res.json(items)
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

  res.status(201).json(created)
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
app.listen(PORT, () => console.log(`API running: http://localhost:${PORT}`))
