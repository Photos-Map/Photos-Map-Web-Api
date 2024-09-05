/**
 * A set of config variables
 */
export type Config = {
  googleClientId: string
  googleClientSecret: string
  googleCallbackUri: string
  jwtPublicKey: string
  jwtPrivateKey: string
  allowedSubject: string
}

/**
 * Returns a set of config variables from environment variables
 * @returns a list of config variables
 */
export function getConfig(): Config {
  return {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleCallbackUri: process.env.GOOGLE_CALLBACK_URI || '',
    jwtPublicKey: process.env.JWT_PUBLIC_KEY || '',
    jwtPrivateKey: process.env.JWT_PRIVATE_KEY || '',
    allowedSubject: process.env.ALLOWED_SUBJECT || ''
  }
}
