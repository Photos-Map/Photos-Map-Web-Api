import { Router } from 'express'
import { wrap } from 'async-middleware'
import { verifyAccessToken } from '../../../auth/v1/middlewares'
import logger from '../../../logger'
import { PhotosRepository, Coordinate } from './PhotosRepository'
import { ThumbnailUriRepository } from './ThumbnailUriRepository'

export default async function (
  queryService: PhotosRepository,
  thumbnailUriRepository: ThumbnailUriRepository
) {
  const router: Router = Router()

  router.get(
    '/api/v1/photos',
    await verifyAccessToken(),
    wrap(async (req, res) => {
      if (!req.query.b) {
        res.send(400).json({ message: "Missing 'b' query" })
      }

      const boundaries = (req.query.b as string).split('x')
      logger.info(`Boundaries: ${boundaries}`)

      const bottomLeftCoordinates: Coordinate = { latitude: 0, longitude: 0 }
      const topRightCoordinates: Coordinate = { latitude: 0, longitude: 0 }

      try {
        bottomLeftCoordinates.latitude = Number(boundaries[0])
        bottomLeftCoordinates.longitude = Number(boundaries[1])
        topRightCoordinates.latitude = Number(boundaries[2])
        topRightCoordinates.longitude = Number(boundaries[3])
      } catch (error) {
        res.send(400).json({ message: (error as Error).name })
      }

      const photos = await queryService.getPhotosFromBoundary(
        bottomLeftCoordinates,
        topRightCoordinates
      )

      return res.status(200).json(photos)
    })
  )

  router.get(
    '/api/v1/thumbnails/:id',
    await verifyAccessToken(),
    wrap(async (req, res) => {
      if (!req.query.account) {
        return res.status(400).json({ error: 'Missing account query param' })
      }

      console.log(req.query.account, req.params.id)

      const uri = await thumbnailUriRepository.getThumbnailUri(
        req.query.account as string,
        req.params.id
      )

      console.log(req.query.account, req.params.id)

      res.status(200).json({ thumbnailUri: uri })
    })
  )

  return router
}
