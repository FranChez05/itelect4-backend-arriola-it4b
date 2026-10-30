import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMocks = vi.hoisted(() => ({ connectDatabase: vi.fn().mockResolvedValue(undefined) }))
const modelMocks = vi.hoisted(() => ({
  bookingFind: vi.fn(),
  bookingCreate: vi.fn(),
  userFind: vi.fn(),
  courtFind: vi.fn(),
}))

vi.mock('../src/config/database', () => databaseMocks)
vi.mock('../src/models', () => ({
  BookingModel: { find: modelMocks.bookingFind, create: modelMocks.bookingCreate },
  UserModel: { find: modelMocks.userFind },
  CourtModel: { find: modelMocks.courtFind },
}))

import app from '../src/app'

describe('GET /api/bookings authentication', () => {
  beforeEach(() => {
    modelMocks.bookingFind.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) })
    databaseMocks.connectDatabase.mockClear()
  })

  it('returns 401 when no token is supplied', async () => {
    const response = await request(app).get('/api/bookings')

    expect(response.status).toBe(401)
    expect(response.text).toBe('No token. Send Authorization: Bearer <token>')
  })

  it('lets a valid token pass requireAuth and reach the bookings handler', async () => {
    const token = jwt.sign({ id: 'user-123', role: 'player' }, process.env.JWT_SECRET as string)
    const response = await request(app).get('/api/bookings').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
    expect(modelMocks.bookingFind).toHaveBeenCalledWith({ userId: 'user-123' })
  })
})
