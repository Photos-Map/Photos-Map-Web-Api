import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import { GPhotosAccountRepository } from '../GPhotosAccountRepository'
import { NoGPhotosAccountFound } from '../GPhotosAccountRepository'

const mockAccount = {
  name: 'bob@gmail.com',
  token: '123',
  refresh_token: '456'
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

    const gPhotosClient =
      await gPhotosAccountRepository.getGPhotosClient('bob@gmail.com')

    expect(gPhotosClient.getName()).toEqual('bob@gmail.com')
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
})
