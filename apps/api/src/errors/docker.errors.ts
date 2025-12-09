export class DockerError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message)
    this.name = 'DockerError'
  }
}

export class DockerConnectionError extends DockerError {
  constructor(originalError?: unknown) {
    super('Failed to connect to Docker daemon', originalError)
    this.name = 'DockerConnectionError'
  }
}

export class ContainerNotFoundError extends DockerError {
  constructor(containerId: string) {
    super(`Container not found: ${containerId}`)
    this.name = 'ContainerNotFoundError'
  }
}

export class ContainerOperationError extends DockerError {
  constructor(operation: string, containerId: string, originalError?: unknown) {
    super(`Failed to ${operation} container ${containerId}`, originalError)
    this.name = 'ContainerOperationError'
  }
}

export class ImageOperationError extends DockerError {
  constructor(operation: string, imageIdentifier: string, originalError?: unknown) {
    super(`Failed to ${operation} image ${imageIdentifier}`, originalError)
    this.name = 'ImageOperationError'
  }
}
