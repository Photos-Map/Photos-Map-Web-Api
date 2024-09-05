import { mock } from 'jest-mock-extended'
import { GPhotosAccountRepository } from '../GPhotosAccountRepository'
import { GPhotosClient } from '../GPhotosClient'
import { ThumbnailUriRepository } from '../ThumbnailUriRepository'

describe('getThumbnailUri()', () => {
  const mockMediaItemInfo = {
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

  it('should fetch uri from Google Photos given no entry in the cache', async () => {
    const mockGPhotosAccountRepository = mock<GPhotosAccountRepository>()
    const mockGPhotosClient = mock<GPhotosClient>()
    mockGPhotosAccountRepository.getGPhotosClient.mockReturnValue(
      Promise.resolve(mockGPhotosClient)
    )
    mockGPhotosClient.getMediaItem.mockReturnValue(
      Promise.resolve(mockMediaItemInfo)
    )
    const thumbnailUriRepository = new ThumbnailUriRepository(
      mockGPhotosAccountRepository
    )

    const thumbnailUri = await thumbnailUriRepository.getThumbnailUri(
      'bob@gmail.com',
      '123456789'
    )

    expect(thumbnailUri).toEqual(mockMediaItemInfo.baseUrl)
  })

  it('should fetch correct uri from cache given it was fetched from Google Photos already', async () => {
    const mockGPhotosAccountRepository = mock<GPhotosAccountRepository>()
    const mockGPhotosClient = mock<GPhotosClient>()
    mockGPhotosAccountRepository.getGPhotosClient.mockReturnValue(
      Promise.resolve(mockGPhotosClient)
    )
    mockGPhotosClient.getMediaItem.mockReturnValue(
      Promise.resolve(mockMediaItemInfo)
    )
    const thumbnailUriRepository = new ThumbnailUriRepository(
      mockGPhotosAccountRepository
    )

    const uri1 = await thumbnailUriRepository.getThumbnailUri(
      'bob@gmail.com',
      '123456789'
    )
    const uri2 = await thumbnailUriRepository.getThumbnailUri(
      'bob@gmail.com',
      '123456789'
    )
    const uri3 = await thumbnailUriRepository.getThumbnailUri(
      'bob@gmail.com',
      '123456789'
    )

    expect(mockGPhotosClient.getMediaItem).toHaveBeenCalledTimes(1)
    expect(uri1).toEqual(mockMediaItemInfo.baseUrl)
    expect(uri2).toEqual(mockMediaItemInfo.baseUrl)
    expect(uri3).toEqual(mockMediaItemInfo.baseUrl)
  })

  it('should refetch correct uri from Google Photos with forceRefresh=true given it was already fetched from Google Photos', async () => {
    const mockGPhotosAccountRepository = mock<GPhotosAccountRepository>()
    const mockGPhotosClient = mock<GPhotosClient>()
    mockGPhotosAccountRepository.getGPhotosClient.mockReturnValue(
      Promise.resolve(mockGPhotosClient)
    )
    mockGPhotosClient.getMediaItem.mockReturnValue(
      Promise.resolve(mockMediaItemInfo)
    )
    const thumbnailUriRepository = new ThumbnailUriRepository(
      mockGPhotosAccountRepository
    )

    await thumbnailUriRepository.getThumbnailUri('bob@gmail.com', '123456789')
    const refreshedUri = await thumbnailUriRepository.getThumbnailUri(
      'bob@gmail.com',
      '123456789',
      true
    )

    expect(refreshedUri).toEqual(mockMediaItemInfo.baseUrl)
    expect(mockGPhotosClient.getMediaItem).toHaveBeenCalledTimes(2)
  })
})
