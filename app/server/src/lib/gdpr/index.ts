/**
 * GDPR Module
 *
 * Exports data portability and right to erasure functionality.
 */

export {
  generateDataExport,
  generateHtmlExport,
  type UserDataExport,
  type ExportMetadata,
} from './dataExport'

export {
  deleteUserData,
  canDeleteUser,
  scheduleDeletion,
  type DeletionResult,
  type ScheduledDeletion,
} from './dataDeletion'
