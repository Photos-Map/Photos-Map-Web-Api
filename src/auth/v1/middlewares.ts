import { Request, Response, NextFunction } from 'express'
import { jwtVerify, importSPKI } from 'jose'
import logger from './../../logger'

export async function verifyAccessToken() {
  const publicKey = await importSPKI(process.env.JWT_PUBLIC_KEY || '', 'EdDSA')

  return async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies['access_token']
    if (!accessToken) {
      return res.status(401).json({ error: 'Access denied' })
    }

    try {
      const decodedToken = await jwtVerify(accessToken, publicKey)
      logger.debug(`Decoded token ${decodedToken}`)
      next()
    } catch (e) {
      logger.debug(`Error verifying token: ${e}`)
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}
