import { Router } from 'express'
import { wrap } from 'async-middleware'
import { verifyAuthentication } from '../middlewares/authentication'
import { verifyAuthorization } from '../middlewares/authorization'
import logger from '../common/logger'
import { PhotosRepository, Coordinate } from '../repositories/PhotosRepository'
import checkNotNull from '../common/checkNotNull'

export default async function (queryService: PhotosRepository) {
  const router: Router = Router()

  router.get(
    '/api/v1/photos',
    await verifyAuthentication(),
    await verifyAuthorization(),
    wrap(async (req, res) => {
      if (!req.query.b) {
        return res.status(400).json({ error: "Missing 'b' query" })
      }

      const lastId = req.query.lastId as string
      const limit = Number(req.query.limit || '50')

      const bottomLeftCoordinates: Coordinate = { latitude: 0, longitude: 0 }
      const topRightCoordinates: Coordinate = { latitude: 0, longitude: 0 }

      try {
        const boundaries = (req.query.b as string).split('x')

        bottomLeftCoordinates.latitude = Number(checkNotNull(boundaries[0]))
        bottomLeftCoordinates.longitude = Number(checkNotNull(boundaries[1]))
        topRightCoordinates.latitude = Number(checkNotNull(boundaries[2]))
        topRightCoordinates.longitude = Number(checkNotNull(boundaries[3]))
      } catch (error) {
        logger.debug(`Error: ${JSON.stringify(error)}`)
        return res.status(400).json({ error: (error as Error).message })
      }

      logger.info(
        `Boundaries: ${JSON.stringify(bottomLeftCoordinates)} and ${JSON.stringify(topRightCoordinates)}`
      )

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
