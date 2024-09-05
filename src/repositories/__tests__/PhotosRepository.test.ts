import { MongoMemoryServer } from 'mongodb-memory-server'
import { PhotosRepository } from '../PhotosRepository'
import { MongoClient, ObjectId } from 'mongodb'
import times from 'lodash/times'
import cloneDeep from 'lodash/cloneDeep'
import last from 'lodash/last'
import difference from 'lodash/difference'

const mockData = [
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
]

describe('getPhotosFromBoundary()', () => {
  let mongoDb: MongoMemoryServer
  let mongoDbClient: MongoClient

  beforeEach(async () => {
    mongoDb = await MongoMemoryServer.create()
    const uri = mongoDb.getUri()

    mongoDbClient = new MongoClient(uri)
    mongoDbClient.connect()
  })

  afterEach(async () => {
    await mongoDbClient.close()
    await mongoDb.stop()
  })

  it('should return the first page of photos in a boundary', async () => {
    const objects = [...cloneDeep(mockData)]
    await mongoDbClient
      .db('photo_map_db')
      .collection('photos')
      .insertMany(objects)
    const photosRepository = new PhotosRepository(mongoDbClient)

    const responses = await photosRepository.getPhotosFromBoundary({
      limit: 50,
      bottomLeftCoordinates: { latitude: 37.372425, longitude: -122.070878 },
      topRightCoordinates: { latitude: 37.396022, longitude: -121.991742 }
    })

    expect(responses.length).toEqual(3)
  })

  it('should paginate correctly', async () => {
    const objects = times(90, () => cloneDeep(mockData[0])).flat()
    await mongoDbClient
      .db('photo_map_db')
      .collection('photos')
      .insertMany(objects)
    const photosRepository = new PhotosRepository(mongoDbClient)

    // Assert: check the first page contains the first 50 items
    const firstPage = await photosRepository.getPhotosFromBoundary({
      limit: 50,
      bottomLeftCoordinates: { latitude: 37.372425, longitude: -122.070878 },
      topRightCoordinates: { latitude: 37.396022, longitude: -121.991742 }
    })
    expect(firstPage.length).toEqual(50)

    // Assert: check the second page contains the next 40 items
    const secondPage = await photosRepository.getPhotosFromBoundary({
      limit: 50,
      lastId: last(firstPage)?.id || '',
      bottomLeftCoordinates: { latitude: 37.372425, longitude: -122.070878 },
      topRightCoordinates: { latitude: 37.396022, longitude: -121.991742 }
    })
    expect(secondPage.length).toEqual(40)

    // Assert: check the third page contains no items
    const thirdPage = await photosRepository.getPhotosFromBoundary({
      limit: 50,
      lastId: last(secondPage)?.id || '',
      bottomLeftCoordinates: { latitude: 37.372425, longitude: -122.070878 },
      topRightCoordinates: { latitude: 37.396022, longitude: -121.991742 }
    })
    expect(thirdPage.length).toEqual(0)

    // Assert: check total pagination equals all of the items in the db
    const idsFromPages = firstPage
      .map((a) => a.id)
      .concat(secondPage.map((b) => b.id))
      .concat(thirdPage.map((c) => c.id))
    const idsFromDb = objects.map((a) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((a as any)?._id as ObjectId).toString()
    )
    expect(difference(idsFromPages, idsFromDb).length).toEqual(0)
  })
})
