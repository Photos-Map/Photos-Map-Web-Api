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

export type PhotoMediaMetadata = {
  width: string
  height: string
  creationTime: string
  photo: {
    cameraMake: string
    cameraModel: string
    focalLength: number
    apertureFNumber: number
    isoEquivalent: number
    exposureTime: string
  }
}

export type VideoMediaMetadata = {
  width: string
  height: string
  creationTime: string
  video: {
    cameraMake: string
    cameraModel: string
    fps: number
    status: string
  }
}

/**
 * A class that represents an account on Google Photos.
 * It should be able to do the same stuff as in {@link https://developers.google.com/photos/library/reference/rest}.
 */
export class GPhotosClient {
  private credentialsSubject: BehaviorSubject<GPhotosCredentials>
  private latestCredentials?: GPhotosCredentials
  private name: string

  /**
   * Constructs the {@code GPhotosClient} class.
   * @param name the name of the Google Photos account.
   * @param credentials the account credentials that is observable.
   */
  constructor(name: string, credentials: BehaviorSubject<GPhotosCredentials>) {
    this.name = name
    this.credentialsSubject = credentials
    this.credentialsSubject.subscribe((credentials) => {
      this.latestCredentials = credentials
    })
  }

  public getName(): string {
    return this.name
  }

  /**
   * Fetches information about a media item
   * It makes the same API call as in {@link https://developers.google.com/photos/library/reference/rest/v1/mediaItems/get}
   *
   * @param mediaItemId the media item ID
   * @returns details of the media item
   */
  async getMediaItem(mediaItemId: string): Promise<MediaItem> {
    const response = await backOff(async () => {
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
          logger.debug(`Error: ${error.response}`)

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
