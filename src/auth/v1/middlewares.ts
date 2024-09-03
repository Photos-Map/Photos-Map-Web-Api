import { Request, Response, NextFunction } from 'express'
import { jwtVerify, importSPKI, errors } from 'jose'
import logger from './../../logger'

export type DecodedAccessToken = {
  id: string
}

/**
 * Middleware that verifies access tokens from cookies
 * @returns an Express middleware
 */
export async function verifyAuthentication() {
  const publicKey = await importSPKI(process.env.JWT_PUBLIC_KEY || '', 'EdDSA')

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

      if (e instanceof errors.JOSEError) {
        return res.status(401).json({ error: e.code })
      }
      return res.status(401).json({ error: e })
    }
  }
}

export async function verifyAuthorization() {
  const validSubject = process.env.ALLOWED_SUBJECT ?? ''
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.decodedAccessToken.id === validSubject) {
      next()
    } else {
      logger.debug(`User ${req.decodedAccessToken.id} is forbidden`)
      res.status(403).json({ error: 'Not authorized to view this request' })
    }
  }
}
