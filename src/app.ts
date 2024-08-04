import { Application } from 'express'
import compression from 'compression'
import ExpressConfig from './express.config'

export class App {
  private app: Application
  private port: number

  constructor(config: AppConfig) {
    this.app = ExpressConfig()
    this.port = config.port
  }

  run() {
    this.app.use(compression())

    this.app.get('/api/v1/health', (_, res) => {
      res.sendStatus(200)
    })

    this.app.listen(this.port, () =>
      console.log(`Server Running on Port ${this.port}`)
    )
  }
}

export type AppConfig = {
  port: number
}
