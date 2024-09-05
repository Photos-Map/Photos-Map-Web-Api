import { Request, Response, NextFunction } from 'express'
import { jwtVerify, importSPKI } from 'jose'
import logger from '../common/logger'
import { getConfig } from '../common/config'

export type DecodedAccessToken = {
  id: string
}

/**
 * Middleware that checks if the access token is valid
 * @returns an Express middleware
 */
export async function verifyAuthentication() {
  const publicKey = await importSPKI(getConfig().jwtPublicKey, 'EdDSA')

  return async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies['access_token']
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing access token' })
    }

    try {
      const decodedToken = await jwtVerify(accessToken, publicKey)
      req.decodedAccessToken = { id: decodedToken.payload.sub ?? '' }
      next()
    } catch (e) {
      logger.debug(`Error verifying token: ${e}`)

      return res.status(401).json({ error: 'Invalid access token' })
    }
  }
}
