import { MongoClient, ObjectId } from 'mongodb'

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

export class PhotosRepository {
  private client: MongoClient

  constructor(mongoDbClient: MongoClient) {
    this.client = mongoDbClient
  }

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
      const document = await cursor.next()
      if (document == null) {
        break
      }

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
