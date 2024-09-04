import { Router } from 'express'
import { wrap } from 'async-middleware'
import { verifyAuthentication } from '../middlewares/authentication'
import { verifyAuthorization } from '../middlewares/authorization'
import { ThumbnailUriRepository } from '../repositories/ThumbnailUriRepository'

export default async function (thumbnailUriRepository: ThumbnailUriRepository) {
  const router: Router = Router()

  router.get(
    '/api/v1/thumbnails/:id',
    await verifyAuthentication(),
    await verifyAuthorization(),
    wrap(async (req, res) => {
      if (!req.query.account) {
        return res.status(400).json({ error: 'Missing account query param' })
      }

      let uri = ''
      if (req.query.forceRefresh) {
        uri = await thumbnailUriRepository.refetchThumbnailUri(
          req.query.account as string,
          req.params.id
        )
      } else {
        uri = await thumbnailUriRepository.getThumbnailUri(
          req.query.account as string,
          req.params.id
        )
      }

      res.status(308).redirect(uri)
    })
  )

  return router
}
