import { Router } from 'express'
import { wrap } from 'async-middleware'
import {
  verifyAuthentication,
  verifyAuthorization
} from '../../../auth/v1/middlewares'
import { ThumbnailUriRepository } from './ThumbnailUriRepository'

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

      const uri = await thumbnailUriRepository.getThumbnailUri(
        req.query.account as string,
        req.params.id
      )

      res.status(200).json({ thumbnailUri: uri })
    })
  )

  return router
}
