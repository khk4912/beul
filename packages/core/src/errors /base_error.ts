// Beul base error class
export class BeulError extends Error {
  code: string
  cause?: unknown
  constructor (code: string, message: string, cause?: unknown) {
    super(message)
    this.name = 'BeulError'
    this.code = code
    this.cause = cause
  }
}
