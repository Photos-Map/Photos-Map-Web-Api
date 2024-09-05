import { LRUCache } from 'lru-cache'
import { GPhotosAccountRepository } from './GPhotosAccountRepository'
import logger from '../common/logger'

/**
 * A class that fetches the thumbnail uri and caches it
 */
export class ThumbnailUriRepository {
  private gphotosAccountRepository: GPhotosAccountRepository
  private thumbnailUriCache: LRUCache<string, string, unknown>

  /**
   * Constructs the {@code ThumbnailUriRepository}
   * @param gphotosAccountRepository the repository of Google Photo accounts
   */
  constructor(gphotosAccountRepository: GPhotosAccountRepository) {
    this.gphotosAccountRepository = gphotosAccountRepository
    this.thumbnailUriCache = new LRUCache({ max: 100000 })
  }

  /**
   * Gets the thumbnail uri given the thumbnail ID and the account name
   * @param gPhotosAccountName the Google Photos account name
   * @param thumbnailId the thumbnail ID
   * @param forceRefresh whether to forcefully look up the thumbnail without cache
   * @returns the thumbnail uri
   */
  async getThumbnailUri(
    gPhotosAccountName: string,
    thumbnailId: string,
    forceRefresh: boolean = false
  ): Promise<string> {
    const cachedResult = this.thumbnailUriCache.get(thumbnailId)
    if (!forceRefresh && cachedResult) {
      logger.debug('Found thumbnail uri in cache')
      return Promise.resolve(cachedResult)
    }

    const client =
      await this.gphotosAccountRepository.getGPhotosClient(gPhotosAccountName)

    const mediaItem = await client.getMediaItem(thumbnailId)
    const thumbnailUri = mediaItem.baseUrl

    this.thumbnailUriCache.set(thumbnailId, thumbnailUri)
    return Promise.resolve(thumbnailUri)
  }
}
