import { BeulError } from './base_error.js'

export class ConfigNotFound extends BeulError {
  constructor (message: string, cause?: unknown) {
    super('CONFIG_NOT_FOUND', message, cause)
    this.name = 'ConfigNotFound'
  }
}

export class InvalidConfig extends BeulError {
  constructor (message: string, cause?: unknown) {
    super('INVALID_CONFIG', message, cause)
    this.name = 'InvalidConfig'
  }
}
