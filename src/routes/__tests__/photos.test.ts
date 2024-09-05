import request from 'supertest'
import express from 'express'
import { SignJWT, importPKCS8 } from 'jose'
import photosRouter from '../photos'
import cookieParser from 'cookie-parser'
import { mock } from 'jest-mock-extended'
import { PhotosRepository } from '../../repositories/PhotosRepository'

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

describe('GET api/v1/photos', () => {
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

  it('should return 200 with correct body response, given correct parameters', async () => {
    const mockPhotosRepository = mock<PhotosRepository>()
    mockPhotosRepository.getPhotosFromBoundary.mockResolvedValue(fakePhotos)
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter(mockPhotosRepository))

    const res = await request(app)
      .get('/api/v1/photos?b=37.822x-123.775x36.771x-120.646')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(200)
    expect(res.body).toEqual(fakePhotos)
  })

  it('should return error code, given error from PhotosRepository', async () => {
    const mockPhotosRepository = mock<PhotosRepository>()
    mockPhotosRepository.getPhotosFromBoundary.mockRejectedValue(
      new Error('Random error')
    )
    const app = express()
    app.use(cookieParser())
    app.use(await photosRouter(mockPhotosRepository))

    const res = await request(app)
      .get('/api/v1/photos?b=37.822x-123.775x36.771x-120.646')
      .set('Cookie', [`access_token=${token}`])

    expect(res.statusCode).toEqual(500)
    expect(res.body).toEqual({})
  })
})
