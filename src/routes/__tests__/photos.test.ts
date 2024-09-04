import request from 'supertest'
import express from 'express'
import { SignJWT, importPKCS8 } from 'jose'
import photosRouter from '../photos'
import cookieParser from 'cookie-parser'
import { mock } from 'jest-mock-extended'
import { PhotosRepository } from '../../repositories/PhotosRepository'

describe('GET api/v1/photos', () => {
  const originalEnv = process.env
  const fakePublicKey =
    '-----BEGIN PUBLIC KEY-----MCowBQYDK2VwAyEADPItlNZv8oKHe/TVm4b04lfw1tvY8dde52zmWzk8hg4=-----END PUBLIC KEY-----%'
  const fakePrivateKey =
    '-----BEGIN PRIVATE KEY-----MC4CAQAwBQYDK2VwBCIEIG2LxwXdQJFmm2E3jNdvVoDzFp1EUisEuzteaAd3Wpw7-----END PRIVATE KEY-----%'

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      JWT_PUBLIC_KEY: fakePublicKey,
      JWT_PRIVATE_KEY: fakePrivateKey
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
    const fakePhotos = [
      {
        id: '123',
        path: 'Archives/Photos/2010/1.jpg',
        gphotosAccountName: 'bob@gmail.com',
        thumbnailId: '1234',
        latitude: 128,
        longitude: 30
      }
    ]
    const mockPhotosRepository = mock<PhotosRepository>()
    mockPhotosRepository.getPhotosFromBoundary.mockReturnValue(
      Promise.resolve(fakePhotos)
    )
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter(mockPhotosRepository))

    const res = await request(app)
      .get('/api/v1/photos?b=37.822x-123.775x36.771x-120.646')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(200)
    expect(res.body).toEqual(fakePhotos)
  })

  it('should return 401 with error message, given no access token', async () => {
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter(mock<PhotosRepository>()))

    const res = await request(app).get(
      '/api/v1/photos?b=37.822x-123.775x36.771x-120.646'
    )

    expect(res.statusCode).toEqual(401)
    expect(res.body.error).toEqual('Missing access token')
  })

  it('should return 401 with error message, given invalid access token', async () => {
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter(mock<PhotosRepository>()))

    const res = await request(app)
      .get('/api/v1/photos?b=37.822x-123.775x36.771x-120.646')
      .set('Cookie', ['access_token=1234'])

    expect(res.statusCode).toEqual(401)
    expect(res.body.error).toEqual('ERR_JWS_INVALID')
  })
})
