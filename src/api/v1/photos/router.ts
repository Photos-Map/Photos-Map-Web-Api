import { Router } from 'express'
import { verifyAccessToken } from '../../../auth/v1/middlewares'
import logger from '../../../logger'

export default async function () {
  const router: Router = Router()

  router.get('/api/v1/photos', await verifyAccessToken(), (req, res) => {
    if (req.query.b) {
      const boundaries = (req.query.b as string).split('x')

      logger.info(`Boundaries: ${boundaries}`)
    }
    res.send('Getting photos...')
  })

  return router
}
