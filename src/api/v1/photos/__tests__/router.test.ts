import request from 'supertest'
import express from 'express'
import { SignJWT, importPKCS8 } from 'jose'
import photosRouter from '../router'
import cookieParser from 'cookie-parser'

describe('GET api/v1/photos', () => {
  const originalEnv = process.env
  const publicKey =
    '-----BEGIN PUBLIC KEY-----MCowBQYDK2VwAyEADPItlNZv8oKHe/TVm4b04lfw1tvY8dde52zmWzk8hg4=-----END PUBLIC KEY-----%'
  const privateKey =
    '-----BEGIN PRIVATE KEY-----MC4CAQAwBQYDK2VwBCIEIG2LxwXdQJFmm2E3jNdvVoDzFp1EUisEuzteaAd3Wpw7-----END PRIVATE KEY-----%'

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      JWT_PUBLIC_KEY: publicKey,
      JWT_PRIVATE_KEY: privateKey
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return OK, given correct parameters', async () => {
    const secretKey = await importPKCS8(
      process.env.JWT_PRIVATE_KEY || '',
      'EdDSA'
    )
    const tokenExpiryTime = new Date(Date.now() + 360000)
    const token = await new SignJWT({ id: '1' })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuedAt()
      .setIssuer('Photos-Map-Web-Api')
      .setAudience('http://localhost:3000')
      .setExpirationTime(tokenExpiryTime)
      .sign(secretKey)

    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter())

    const res = await request(app)
      .get('/api/v1/photos?b=1x2x3x4')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(200)
    expect(res.text).toEqual('Getting photos...')
  })

  it('should return 401 with error message, given no access token', async () => {
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter())

    const res = await request(app).get('/api/v1/photos?b=1x2x3x4')

    expect(res.statusCode).toEqual(401)
    expect(res.body.error).toEqual('Missing access token')
  })

  it('should return 401 with error message, given invalid access token', async () => {
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter())

    const res = await request(app)
      .get('/api/v1/photos?b=1x2x3x4')
      .set('Cookie', ['access_token=1234'])

    expect(res.statusCode).toEqual(401)
    expect(res.body.error).toEqual('Invalid token')
  })
})
