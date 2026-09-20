import type {
  FileService,
  FileUploadOptions,
} from '@/lib/services/file-service'
import {
  unavailableFileOperation,
  validateSelectedFile,
} from '@/lib/services/file-service'
import type { Attachment } from '@/lib/types'

export class MockFileService implements FileService {
  validateFile = validateSelectedFile

  async uploadFile(
    _file: File,
    _options?: FileUploadOptions,
  ): Promise<Attachment> {
    throw unavailableFileOperation('File upload')
  }

  cancelUpload(): void {}

  async deleteFile(): Promise<void> {
    throw unavailableFileOperation('File deletion')
  }

  async getFileMetadata(): Promise<Attachment> {
    throw unavailableFileOperation('File metadata lookup')
  }
}

export const mockFileService = new MockFileService()
