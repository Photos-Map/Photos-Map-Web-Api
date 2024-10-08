import { Router, Request, Response } from 'express'
import passport from 'passport'
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20'
import { wrap } from 'async-middleware'
import { SignJWT, importPKCS8 } from 'jose'
import { getConfig } from '../common/config'

export default async function () {
  const config = getConfig()

  passport.use(
    new Strategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: config.googleCallbackUri
      },
      function (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) {
        return done(null, profile)
      }
    )
  )

  const secretKey = await importPKCS8(config.jwtPrivateKey, 'EdDSA')

  const expiryMillis = Number(process.env.JWT_EXPIRY_IN_MILLISECONDS) || 3600000

  const router: Router = Router()
  router.get(
    '/auth/v1/google',
    passport.authenticate('google', {
      scope: ['profile'],
      prompt: 'select_account'
    })
  )

  router.get('/auth/v1/google/failed', (_req: Request, res: Response) => {
    res.status(401).send('Login failed')
  })

  router.get(
    '/auth/v1/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/auth/v1/google/failed',
      session: false
    }),
    wrap(async (req: Request, res: Response) => {
      const profile = req.user as Profile

      const tokenExpiryTime = new Date(Date.now() + expiryMillis)
      const token = await new SignJWT()
        .setProtectedHeader({ alg: 'EdDSA' })
        .setIssuedAt()
        .setIssuer('Photos-Map-Web-Api')
        .setAudience('http://localhost:3000')
        .setSubject(profile.id)
        .setExpirationTime(tokenExpiryTime)
        .sign(secretKey)

      res.cookie('access_token', token, {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        expires: tokenExpiryTime
      })
      res.redirect('/photos')
    })
  )

  router.get(
    '/auth/v1/google/logout',
    wrap(async (_req: Request, res: Response) => {
      res.clearCookie('access_token')
      res.redirect('/')
    })
  )

  return router
}
