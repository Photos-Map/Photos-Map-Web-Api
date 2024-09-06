import { Request, Response, NextFunction } from 'express'
import logger from '../common/logger'
import { getConfig } from '../common/config'

/**
 * Middleware that checks if the user has the authorization to view the resource.
 * @returns an Express middleware
 */
export async function verifyAuthorization() {
  const validSubject = getConfig().allowedSubject

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.decodedAccessToken.id === validSubject) {
      next()
    } else {
      logger.debug(`User ${req.decodedAccessToken.id} is forbidden`)
      res.status(403).json({ error: 'Not authorized to view this request' })
    }
  }
}
