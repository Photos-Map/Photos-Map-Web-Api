import { Router } from 'express'
import { wrap } from 'async-middleware'
import {
  verifyAuthentication,
  verifyAuthorization
} from '../../../auth/v1/middlewares'
import logger from '../../../logger'
import { PhotosRepository, Coordinate } from './PhotosRepository'

export default async function (queryService: PhotosRepository) {
  const router: Router = Router()

  router.get(
    '/api/v1/photos',
    await verifyAuthentication(),
    await verifyAuthorization(),
    wrap(async (req, res) => {
      if (!req.query.b) {
        res.send(400).json({ message: "Missing 'b' query" })
      }

      const lastId = req.query.lastId as string
      const limit = Number(req.query.limit || '50')

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

      const photos = await queryService.getPhotosFromBoundary({
        bottomLeftCoordinates: bottomLeftCoordinates,
        topRightCoordinates: topRightCoordinates,
        lastId: lastId,
        limit: limit
      })

      return res.status(200).json(photos)
    })
  )

  return router
}
