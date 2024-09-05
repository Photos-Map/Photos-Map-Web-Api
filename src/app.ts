import express, { Application } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { MongoClient } from 'mongodb'
import expressLogger from 'pino-http'
import healthRouter from './routes/health'
import photosRouter from './routes/photos'
import thumbnailsRouter from './routes/thumbnails'
import { PhotosRepository } from './repositories/PhotosRepository'
import authRouter from './routes/authentication'
import logger from './common/logger'
import { ThumbnailUriRepository } from './repositories/ThumbnailUriRepository'
import { GPhotosAccountRepository } from './repositories/GPhotosAccountRepository'

export class App {
  private app: Application
  private port: number

  private mongoDbClient: MongoClient
  private photosRepository: PhotosRepository
  private gPhotosAccountRepository: GPhotosAccountRepository
  private thumbnailUriRepository: ThumbnailUriRepository

  constructor(config: AppConfig) {
    this.app = express()
    this.port = config.port

    const mongoDbUri = process.env.MONGODB_URI || ''
    this.mongoDbClient = new MongoClient(mongoDbUri)

    this.photosRepository = new PhotosRepository(this.mongoDbClient)
    this.gPhotosAccountRepository = new GPhotosAccountRepository(
      this.mongoDbClient
    )
    this.thumbnailUriRepository = new ThumbnailUriRepository(
      this.gPhotosAccountRepository
    )
  }

  async run() {
    this.mongoDbClient.connect()
    await this.mongoDbClient.db('admin').command({ ping: 1 })

    this.app.use(compression())
    this.app.use(helmet())
    this.app.use(cookieParser())
    this.app.use(expressLogger())

    this.app.use(healthRouter())
    this.app.use(await authRouter())
    this.app.use(await photosRouter(this.photosRepository))
    this.app.use(await thumbnailsRouter(this.thumbnailUriRepository))

    this.app.listen(this.port, () =>
      logger.info(`Server Running on Port ${this.port}`)
    )
  }

  async shutdown() {
    this.gPhotosAccountRepository.close()

    logger.info('MongoDB client closing')
    this.mongoDbClient.close()
    logger.info('MongoDB client closed')
  }
}

export type AppConfig = {
  port: number
}
