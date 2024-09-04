import { MongoMemoryServer } from 'mongodb-memory-server'
import { PhotosRepository } from '../PhotosRepository'
import { MongoClient } from 'mongodb'

describe('getPhotosFromBoundary()', () => {
  let mongoDb: MongoMemoryServer
  let mongoDbClient: MongoClient

  beforeAll(async () => {
    mongoDb = await MongoMemoryServer.create()
    const uri = mongoDb.getUri()

    mongoDbClient = new MongoClient(uri)
    mongoDbClient.connect()

    await mongoDbClient
      .db('photo_map_db')
      .collection('photos')
      .insertMany([
        {
          location: {
            type: 'Point',
            coordinates: [-122.050536, 37.388385]
          },
          gphotos_account_name: 'a@gmail.com',
          thumbnail_id: '1',
          path: 'Mountain View Research Park.jpg'
        },
        {
          location: {
            type: 'Point',
            coordinates: [-122.010797, 37.383952]
          },
          gphotos_account_name: 'a@gmail.com',
          thumbnail_id: '2',
          path: 'Movement Sunnyvale.jpg'
        },
        {
          location: {
            type: 'Point',
            coordinates: [-122.030624, 37.377541]
          },
          gphotos_account_name: 'a@gmail.com',
          thumbnail_id: '3',
          path: 'Caltrain Sunnyvale.jpg'
        }
      ])
  })

  afterAll(async () => {
    await mongoDbClient.close()
    await mongoDb.stop()
  })

  it('should return the first page of photos in a boundary', async () => {
    const photosRepository = new PhotosRepository(mongoDbClient)

    const responses = await photosRepository.getPhotosFromBoundary({
      limit: 50,
      bottomLeftCoordinates: { latitude: 37.372425, longitude: -122.070878 },
      topRightCoordinates: { latitude: 37.396022, longitude: -121.991742 }
    })

    expect(responses.length).toEqual(3)
  })
})
