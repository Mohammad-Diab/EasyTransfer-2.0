/**
 * User roles - must match backend enum values exactly
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * Transfer status values - must match backend enum values exactly
 */
export enum TransferStatus {
  PENDING = 'PENDING',
  DELAYED = 'DELAYED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
