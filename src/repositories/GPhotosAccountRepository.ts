import { MongoClient } from 'mongodb'
import { BehaviorSubject, Subscription } from 'rxjs'
import { GPhotosClient, GPhotosCredentials } from './GPhotosClient'
import { Config, getConfig } from '../common/config'

export class GPhotosAccountRepository {
  private mongoDbClient: MongoClient
  private config: Config
  private gPhotoClients = new Map<string, GPhotosClient>()
  private subscriptions = Array<Subscription>()

  constructor(mongoDbClient: MongoClient) {
    this.mongoDbClient = mongoDbClient
    this.config = getConfig()
  }

  async getGPhotosClient(gphotosAccountName: string): Promise<GPhotosClient> {
    const collection = this.mongoDbClient
      .db('photo_map_db')
      .collection('gphoto_accounts')

    const cachedGPhotosClient = this.gPhotoClients.get(gphotosAccountName)
    if (cachedGPhotosClient) {
      return Promise.resolve(cachedGPhotosClient)
    }

    const accountCredentials = await collection.findOne({
      name: gphotosAccountName
    })

    if (accountCredentials === null) {
      throw new NoGPhotosAccountFound(gphotosAccountName)
    }

    const initialCredentials = {
      accessToken: accountCredentials['token'],
      refreshToken: accountCredentials['refresh_token'],
      clientId: this.config.googleClientId,
      clientSecret: this.config.googleClientSecret
    }
    const credentials = new BehaviorSubject<GPhotosCredentials>(
      initialCredentials
    )

    // Update the database async-ly when new credentials are refreshed
    const subscriber = credentials.subscribe((newCredentials) => {
      if (newCredentials !== initialCredentials) {
        const newValuesQuery = {
          $set: {
            token: newCredentials.accessToken,
            refresh_token: newCredentials.refreshToken
          }
        }
        collection.updateOne({ name: gphotosAccountName }, newValuesQuery)
      }
    })
    this.subscriptions.push(subscriber)

    const gPhotosClient = new GPhotosClient(gphotosAccountName, credentials)
    this.gPhotoClients.set(gphotosAccountName, gPhotosClient)
    return gPhotosClient
  }

  public close() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    this.subscriptions = Array<Subscription>()
  }
}

export class NoGPhotosAccountFound extends Error {
  constructor(gphotosAccountName: string) {
    super(`No google photos account found with name ${gphotosAccountName}`)
  }
}
