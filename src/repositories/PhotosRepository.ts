import { MongoClient, ObjectId } from 'mongodb'
import checkNotNull from '../common/checkNotNull'

export type GetPhotosFromBoundaryArgs = {
  lastId?: string
  limit: number
  bottomLeftCoordinates: Coordinate
  topRightCoordinates: Coordinate
}

export type Coordinate = {
  latitude: number
  longitude: number
}

export type Photo = {
  id?: string
  path?: string
  gphotosAccountName?: string
  thumbnailId?: string
  latitude: number
  longitude: number
}

/**
 * A class that fetches photos from MongoDB
 */
export class PhotosRepository {
  private client: MongoClient

  /**
   * Constructs the {@code PhotosRepository} class
   * @param mongoDbClient the MongoDB client
   */
  constructor(mongoDbClient: MongoClient) {
    this.client = mongoDbClient
  }

  /**
   * Returns a list of photos via pagination
   * @param args the args for the query
   * @returns a list of photos
   */
  public async getPhotosFromBoundary(
    args: GetPhotosFromBoundaryArgs
  ): Promise<Photo[]> {
    const db = this.client.db('photo_map_db')
    const photosCollection = db.collection('photos')

    const baseQuery = {
      location: {
        $geoWithin: {
          $box: [
            [
              args.bottomLeftCoordinates.longitude,
              args.bottomLeftCoordinates.latitude
            ],
            [
              args.topRightCoordinates.longitude,
              args.topRightCoordinates.latitude
            ]
          ]
        }
      }
    }

    const lastId = args.lastId
    const newQuery = lastId
      ? { ...baseQuery, _id: { $gt: new ObjectId(lastId) } }
      : { ...baseQuery }

    const cursor = photosCollection.find(newQuery, { limit: args.limit })

    const photos: Photo[] = []
    while (await cursor.hasNext()) {
      const document = checkNotNull(await cursor.next())

      photos.push({
        id: document._id.toString(),
        path: document['path'],
        gphotosAccountName: document['gphotos_account_name'],
        thumbnailId: document['thumbnail_id'],
        latitude: Number(document['location']['coordinates'][1]),
        longitude: Number(document['location']['coordinates'][0])
      })
    }

    return photos
  }
}
