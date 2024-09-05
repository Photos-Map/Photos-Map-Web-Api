import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient, WithId, Document } from 'mongodb'
import flushPromises from 'flush-promises'
import { GPhotosAccountRepository } from '../GPhotosAccountRepository'
import { NoGPhotosAccountFound } from '../GPhotosAccountRepository'
import nock from 'nock'

const mockAccount = {
  name: 'bob@gmail.com',
  token: 'accessToken123',
  refresh_token: 'refreshToken123'
}

const mockMediaItemInfoResponse = {
  id: '123456789',
  description: '',
  productUrl: 'http://google.com/photos/123456789',
  baseUrl: 'http://google.com/photos/123456789/thumbnail',
  mimeType: 'image/jpeg',
  filename: 'image.jpg',
  mediaMetadata: {
    width: '200',
    height: '200',
    creationTime: '2024-08-19 10:30:09',
    photo: {
      cameraMake: '',
      cameraModel: '',
      focalLength: 8,
      apertureFNumber: 2.8,
      isoEquivalent: 800,
      exposureTime: ''
    }
  },
  contributorInfo: {
    profilePictureBaseUrl: '',
    displayName: ''
  }
}

describe('getGPhotosClient()', () => {
  let mongoDb: MongoMemoryServer
  let mongoDbClient: MongoClient
  let gPhotosAccountRepository: GPhotosAccountRepository

  beforeEach(async () => {
    mongoDb = await MongoMemoryServer.create()
    const uri = mongoDb.getUri()

    mongoDbClient = new MongoClient(uri)
    await mongoDbClient.connect()

    gPhotosAccountRepository = new GPhotosAccountRepository(mongoDbClient)
  })

  afterEach(async () => {
    gPhotosAccountRepository.close()
    await mongoDbClient.close()
    await mongoDb.stop()
  })

  it('should return Google Photos client given correct parameters', async () => {
    const object = { ...mockAccount }
    await mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')
      .insertOne(object)

    const gPhotosClient =
      await gPhotosAccountRepository.getGPhotosClient('bob@gmail.com')

    expect(gPhotosClient.getName()).toEqual('bob@gmail.com')
  })

  it('should update credentials in MongoDB when Google Photos client updates credentials', async () => {
    const object = { ...mockAccount }
    await mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')
      .insertOne(object)
    nock('https://photoslibrary.googleapis.com')
      .get('/v1/mediaItems/123456789')
      .matchHeader('Authorization', `Bearer ${mockAccount.token}`)
      .reply(401)
    nock('https://oauth2.googleapis.com')
      .post('/token')
      .reply(200, { access_token: 'accessToken2' })
    nock('https://photoslibrary.googleapis.com')
      .get('/v1/mediaItems/123456789')
      .matchHeader('Authorization', 'Bearer accessToken2')
      .reply(200, mockMediaItemInfoResponse)

    const gPhotosClient =
      await gPhotosAccountRepository.getGPhotosClient('bob@gmail.com')
    await gPhotosClient.getMediaItem('123456789')

    await flushPromises()
    const newObject = await getGPhotosAccount()
    expect(newObject['token']).toEqual('accessToken2')
    expect(newObject['refresh_token']).toEqual(mockAccount.refresh_token)
  })

  it('should throw NoGPhotosAccountFound when no account is found', async () => {
    const object = { ...mockAccount }
    await mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')
      .insertOne(object)

    const promise = gPhotosAccountRepository.getGPhotosClient('sam@gmail.com')

    await expect(promise).rejects.toThrow(NoGPhotosAccountFound)
  })

  it('should return the same Google Photos client when the same account is requested more than once', async () => {
    const object = { ...mockAccount }
    await mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')
      .insertOne(object)

    const firstGPhotosClient =
      await gPhotosAccountRepository.getGPhotosClient('bob@gmail.com')
    const secondGPhotosClient =
      await gPhotosAccountRepository.getGPhotosClient('bob@gmail.com')

    expect(firstGPhotosClient).toEqual(secondGPhotosClient)
  })

  async function getGPhotosAccount(): Promise<WithId<Document>> {
    const newObject = await mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')
      .findOne({ name: 'bob@gmail.com' })

    if (newObject === null) {
      throw new Error('No object found')
    }

    return newObject
  }
})
