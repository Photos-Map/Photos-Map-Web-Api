import { LRUCache } from 'lru-cache'
import { GPhotosAccountRepository } from './GPhotosAccountRepository'

export class ThumbnailUriRepository {
  private gphotosAccountRepository: GPhotosAccountRepository
  private thumbnailUriCache: LRUCache<string, string, unknown>

  constructor(gphotosAccountRepository: GPhotosAccountRepository) {
    this.gphotosAccountRepository = gphotosAccountRepository
    this.thumbnailUriCache = new LRUCache({ max: 100000 })
  }

  async getThumbnailUri(
    gPhotosAccountName: string,
    thumbnailId: string
  ): Promise<string> {
    const cachedResult = this.thumbnailUriCache.get(thumbnailId)
    if (cachedResult) {
      return Promise.resolve(cachedResult)
    }

    const client =
      await this.gphotosAccountRepository.getGPhotosClient(gPhotosAccountName)

    const mediaItem = await client.getMediaItem(thumbnailId)
    const thumbnailUri = mediaItem.baseUrl

    this.thumbnailUriCache.set(thumbnailId, thumbnailUri)
    return Promise.resolve(thumbnailUri)
  }

  async refetchThumbnailUri(
    gPhotosAccountName: string,
    thumbnailId: string
  ): Promise<string> {
    const client =
      await this.gphotosAccountRepository.getGPhotosClient(gPhotosAccountName)
    const mediaItem = await client.getMediaItem(thumbnailId)
    const thumbnailUri = mediaItem.baseUrl

    this.thumbnailUriCache.set(thumbnailId, thumbnailUri)
    return Promise.resolve(thumbnailUri)
  }
}
