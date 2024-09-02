import Cluster from 'cluster'
import Process from 'process'
import dotenv from 'dotenv'
import OS from 'os'
import { App } from './app'
import logger from './logger'

let numRetries = 10

dotenv.config()

if (Cluster.isPrimary) {
  const numForks = Number(process.env.NUM_FORKS) || OS.cpus().length

  for (let i = 0; i < numForks; i++) {
    Cluster.fork()
  }

  // Fork the server again if it dies
  Cluster.on('exit', (_worker) => {
    logger.info('A worker has died!')
    numRetries--

    if (numRetries > 0) {
      logger.info('Relaunching worker again')
      Cluster.fork()
    } else {
      logger.info('Not launching worker again')
    }
  })
} else {
  logger.info(`Child process #${Process.pid} spawned`)

  const app = new App({
    port: parseInt(process.env.PORT || '3000')
  })
  app.run()

  process.on('SIGINT', async () => {
    await app.shutdown()
  })

  process.on('exit', async () => {
    await app.shutdown()
  })
}
