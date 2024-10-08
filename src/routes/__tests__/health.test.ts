import request from 'supertest'
import express from 'express'
import healthRouter from '../health'

describe('GET api/v1/health', () => {
  it('should return OK', async () => {
    const app = express()
    app.use(healthRouter())

    const res = await request(app).get('/api/v1/health')

    expect(res.statusCode).toEqual(200)
    expect(res.text).toEqual('OK')
  })
})
