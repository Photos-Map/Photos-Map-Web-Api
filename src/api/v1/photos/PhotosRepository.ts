import { MongoClient } from 'mongodb'

export type Coordinate = {
  latitude: number
  longitude: number
}

export type Photo = {
  id?: string
  path?: string
  gphotosAccountName?: string
  thumbnailId?: string
  thumbnailUri?: string
  productUri?: string
  latitude: number
  longitude: number
}

export class PhotosRepository {
  private client: MongoClient

  constructor(mongoDbClient: MongoClient) {
    this.client = mongoDbClient
  }

  public async getPhotosFromBoundary(
    bottomLeftCoordinates: Coordinate,
    topRightCoordinates: Coordinate
  ): Promise<Photo[]> {
    const db = this.client.db('photo_map_db')
    const photosCollection = db.collection('photos')

    const query = {
      location: {
        $geoWithin: {
          $box: [
            [bottomLeftCoordinates.longitude, bottomLeftCoordinates.latitude],
            [topRightCoordinates.longitude, topRightCoordinates.latitude]
          ]
        }
      }
    }
    const cursor = photosCollection.find(query)

    const photos: Photo[] = []
    while (await cursor.hasNext()) {
      const document = await cursor.next()
      if (document == null) {
        break
      }

      photos.push({
        id: document._id.toString(),
        gphotosAccountName: document['gphotos_account_name'],
        thumbnailId: document['thumbnail_id'],
        latitude: Number(document['location']['coordinates'][1]),
        longitude: Number(document['location']['coordinates'][0])
      })
    }

    return photos
  }
}
