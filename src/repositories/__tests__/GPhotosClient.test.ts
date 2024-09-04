import nock from 'nock'
import { BehaviorSubject } from 'rxjs'
import { GPhotosClient, GPhotosCredentials } from '../GPhotosClient'

jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
  if (typeof callback === 'function') {
    callback()
  }
  return { hasRef: () => false } as NodeJS.Timeout
})

describe('getMediaItem', () => {
  const mockMediaItemInfoResponse = {
    id: '123456789',
    description: '',
    productUrl: 'http://google.com/photos/123456789',
    baseUrl: 'http://google.com/photos/123456789/thumbnail',
    mimeType: 'image/jpeg',
    filename: 'image.jpg',
    mediaMetadata: {
      width: '200',
      height: '200',
      creationTime: '2024-08-19 10:30:09',
      photo: {
        cameraMake: '',
        cameraModel: '',
        focalLength: 8,
        apertureFNumber: 2.8,
        isoEquivalent: 800,
        exposureTime: ''
      }
    },
    contributorInfo: {
      profilePictureBaseUrl: '',
      displayName: ''
    }
  }

  it('should fetch media item given credentials are correct', async () => {
    nock('https://photoslibrary.googleapis.com')
      .get('/v1/mediaItems/123456789')
      .reply(200, mockMediaItemInfoResponse)

    const credentials = new BehaviorSubject<GPhotosCredentials>({
      accessToken: 'access123',
      refreshToken: 'refresh123',
      clientId: 'clientId123',
      clientSecret: 'clientSecret123'
    })

    const gPhotosClient = new GPhotosClient('bob@gmail.com', credentials)
    const mediaItem = await gPhotosClient.getMediaItem('123456789')

    expect(mediaItem).toEqual(mockMediaItemInfoResponse)
  })

  it('should refetch auth tokens and refetch media item given credentials are expired', async () => {
    nock('https://photoslibrary.googleapis.com')
      .get('/v1/mediaItems/123456789')
      .matchHeader('Authorization', 'Bearer accessToken1')
      .reply(401)
    nock('https://oauth2.googleapis.com')
      .post('/token')
      .reply(200, { access_token: 'accessToken2' })
    nock('https://photoslibrary.googleapis.com')
      .get('/v1/mediaItems/123456789')
      .matchHeader('Authorization', 'Bearer accessToken2')
      .reply(200, mockMediaItemInfoResponse)

    const credentials = new BehaviorSubject<GPhotosCredentials>({
      accessToken: 'accessToken1',
      refreshToken: 'refreshToken1',
      clientId: 'clientId1',
      clientSecret: 'clientSecret1'
    })

    const gPhotosClient = new GPhotosClient('bob@gmail.com', credentials)
    const mediaItem = await gPhotosClient.getMediaItem('123456789')

    expect(mediaItem).toEqual(mockMediaItemInfoResponse)
    expect(credentials.value.accessToken).toEqual('accessToken2')
  })
})
