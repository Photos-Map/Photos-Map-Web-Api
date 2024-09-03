import { DecodedAccessToken } from '../../auth/v1/middlewares'

// to make the file a module and avoid the TypeScript error
export {}

declare global {
  namespace Express {
    export interface Request {
      decodedAccessToken: DecodedAccessToken
    }
  }
}
