import axios, { AxiosError } from 'axios'
import qs from 'qs'
import { backOff } from 'exponential-backoff'
import { BehaviorSubject } from 'rxjs'
import logger from '../common/logger'

export type GPhotosCredentials = {
  accessToken: string
  refreshToken: string
  clientId: string
  clientSecret: string
}

export type MediaItem = {
  id: string
  description: string
  productUrl: string
  baseUrl: string
  mimeType: string
  filename: string
  mediaMetadata: PhotoMediaMetadata | VideoMediaMetadata
  contributorInfo: {
    profilePictureBaseUrl: string
    displayName: string
  }
}

export type VideoMediaMetadata = {
  width: string
  height: string
  creationTime: string
  photo: {
    cameraMake: string
    cameraModel: string
    focalLength: string
    apertureFNumber: string
    isoEquivalent: string
    exposureTime: string
  }
}

export type PhotoMediaMetadata = {
  width: string
  height: string
  creationTime: string
  video: {
    cameraMake: string
    cameraModel: string
    fps: string
    status: string
  }
}

export class GPhotosClient {
  private credentialsSubject: BehaviorSubject<GPhotosCredentials>
  private latestCredentials?: GPhotosCredentials
  private name: string

  constructor(name: string, credentials: BehaviorSubject<GPhotosCredentials>) {
    this.name = name
    this.credentialsSubject = credentials
    this.credentialsSubject.subscribe((credentials) => {
      this.latestCredentials = credentials
    })
  }

  async getMediaItem(mediaItemId: string): Promise<MediaItem> {
    const response = await backOff(async () => {
      logger.debug("I am here")
      const url = `https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.latestCredentials?.accessToken}`
      }

      try {
        return await axios.get(url, { headers })
      } catch (error) {
        logger.debug(`Error fetching ${url} - retrying`)

        if (axios.isAxiosError(error)) {
          if ((error as AxiosError).response?.status === 401) {
            logger.debug('Refreshing access token')
            await this.refreshAccessToken()
          }
        }

        throw error
      }
    })

    return response.data as MediaItem
  }

  private async refreshAccessToken() {
    const uri = 'https://oauth2.googleapis.com/token'
    const requestBody = {
      client_id: this.latestCredentials?.clientId,
      client_secret: this.latestCredentials?.clientSecret,
      refresh_token: this.latestCredentials?.refreshToken,
      grant_type: 'refresh_token'
    }
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    }

    logger.info(`Fetching new access token for account ${this.name}`)
    const response = await axios.post(uri, qs.stringify(requestBody), {
      headers
    })

    this.credentialsSubject.next({
      accessToken: response.data['access_token'],
      refreshToken: this.latestCredentials?.refreshToken || '',
      clientId: this.latestCredentials?.clientId || '',
      clientSecret: this.latestCredentials?.clientSecret || ''
    })
  }
}
