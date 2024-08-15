import express, { Application } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import healthRouter from './api/v1/health/router'
import photosRouter from './api/v1/photos/router'
import authRouter from './auth/v1/router'
import logger from './logger'

export class App {
  private app: Application
  private port: number

  constructor(config: AppConfig) {
    this.app = express()
    this.port = config.port
  }

  async run() {
    this.app.use(compression())
    this.app.use(helmet())
    this.app.use(cookieParser())

    this.app.use(healthRouter())
    this.app.use(await authRouter())
    this.app.use(await photosRouter())

    this.app.listen(this.port, () =>
      logger.info(`Server Running on Port ${this.port}`)
    )
  }
}

export type AppConfig = {
  port: number
}
