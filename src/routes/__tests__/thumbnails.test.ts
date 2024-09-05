import request from 'supertest'
import express from 'express'
import { SignJWT, importPKCS8 } from 'jose'
import thumbnailsRouter from '../thumbnails'
import cookieParser from 'cookie-parser'
import { mock } from 'jest-mock-extended'
import { ThumbnailUriRepository } from '../../repositories/ThumbnailUriRepository'

describe('GET /api/v1/thumbnails/:id', () => {
  const originalEnv = process.env
  const fakePublicKey =
    '-----BEGIN PUBLIC KEY-----MCowBQYDK2VwAyEADPItlNZv8oKHe/TVm4b04lfw1tvY8dde52zmWzk8hg4=-----END PUBLIC KEY-----%'
  const fakePrivateKey =
    '-----BEGIN PRIVATE KEY-----MC4CAQAwBQYDK2VwBCIEIG2LxwXdQJFmm2E3jNdvVoDzFp1EUisEuzteaAd3Wpw7-----END PRIVATE KEY-----%'
  let token = ''

  beforeEach(async () => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      JWT_PUBLIC_KEY: fakePublicKey,
      JWT_PRIVATE_KEY: fakePrivateKey
    }

    const secretKey = await importPKCS8(
      process.env.JWT_PRIVATE_KEY || '',
      'EdDSA'
    )
    const tokenExpiryTime = new Date(Date.now() + 360000)
    token = await new SignJWT({ id: '1' })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuedAt()
      .setIssuer('Photos-Map-Web-Api')
      .setAudience('http://localhost:3000')
      .setExpirationTime(tokenExpiryTime)
      .sign(secretKey)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return 301 given correct access token and correct resources', async () => {
    const thumbnailUri = 'http://thumbnail.com'
    const mockThumbnailsUriRepository = mock<ThumbnailUriRepository>()
    mockThumbnailsUriRepository.getThumbnailUri.mockResolvedValue(thumbnailUri)
    const app = express()
    app.use(cookieParser())
    app.use(await thumbnailsRouter(mockThumbnailsUriRepository))

    const res = await request(app)
      .get('/api/v1/thumbnails/123?account=bob@gmail.com')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(302)
    expect(res.headers['location']).toEqual(thumbnailUri)
  })

  it('should return error code given ThumbnailUriRepository throws an exception', async () => {
    const mockThumbnailsUriRepository = mock<ThumbnailUriRepository>()
    mockThumbnailsUriRepository.getThumbnailUri.mockRejectedValue(
      new Error('Unknown error')
    )
    const app = express()
    app.use(cookieParser())
    app.use(await thumbnailsRouter(mockThumbnailsUriRepository))

    const res = await request(app)
      .get('/api/v1/thumbnails/123?account=bob@gmail.com')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(500)
    expect(res.body).toEqual({})
  })

  it('should return 400 code given no account', async () => {
    const app = express()
    app.use(cookieParser())
    app.use(await thumbnailsRouter(mock<ThumbnailUriRepository>()))

    const res = await request(app)
      .get('/api/v1/thumbnails/123')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(400)
    expect(res.body).toEqual({ error: 'Missing account query param' })
  })
})
