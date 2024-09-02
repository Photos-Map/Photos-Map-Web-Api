import { MongoClient, Collection, Document } from 'mongodb'
import { BehaviorSubject } from 'rxjs'
import { GPhotosClient, GPhotosCredentials } from './GPhotosClient'

export class GPhotosAccountRepository {
  private gPhotoAccountsCollection: Collection<Document>
  private gPhotoClients = new Map<string, GPhotosClient>()

  constructor(mongoDbClient: MongoClient) {
    this.gPhotoAccountsCollection = mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')
  }

  async getGPhotosClient(gphotosAccountName: string): Promise<GPhotosClient> {
    const cachedGPhotosClient = this.gPhotoClients.get(gphotosAccountName)
    if (cachedGPhotosClient) {
      return Promise.resolve(cachedGPhotosClient)
    }

    const accountCredentials = await this.gPhotoAccountsCollection.findOne({
      name: gphotosAccountName
    })

    if (accountCredentials === null) {
      throw new NoGPhotosAccountFound(gphotosAccountName)
    }

    const credentials = new BehaviorSubject<GPhotosCredentials>({
      accessToken: accountCredentials['token'],
      refreshToken: accountCredentials['refresh_token'],
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })

    // Update the database async-ly when new credentials are refreshed
    credentials.subscribe((newCredentials) => {
      const newValuesQuery = {
        $set: {
          token: newCredentials.accessToken,
          refresh_token: newCredentials.refreshToken
        }
      }
      this.gPhotoAccountsCollection.updateOne(
        { name: gphotosAccountName },
        newValuesQuery
      )
    })

    return new GPhotosClient(gphotosAccountName, credentials)
  }
}

export class NoGPhotosAccountFound extends Error {
  constructor(gphotosAccountName: string) {
    super(`No google photos account found with name ${gphotosAccountName}`)
  }
}
