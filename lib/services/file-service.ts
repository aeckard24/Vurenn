import { ApiError } from '@/lib/api/errors'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { BackendAttachment } from '@/lib/api/types'
import type { Attachment } from '@/lib/types'

export const FILE_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'text/xml',
    'text/yaml',
    'application/xml',
    'application/rtf',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroenabled.12',
    'application/vnd.ms-excel',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
} as const

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface FileUploadOptions {
  signal?: AbortSignal
  onProgress?: (progress: number) => void
  projectId?: string
}

export interface FileService {
  validateFile(file: File): FileValidationResult
  uploadFile(file: File, options?: FileUploadOptions): Promise<Attachment>
  cancelUpload(uploadId: string): void
  deleteFile(fileId: string): Promise<void>
  getFileMetadata(fileId: string): Promise<Attachment>
}

export function validateSelectedFile(file: File): FileValidationResult {
  if (file.size <= 0) return { valid: false, error: 'The selected file is empty.' }
  if (file.size > FILE_LIMITS.maxBytes) {
    return { valid: false, error: 'Files must be 25 MB or smaller.' }
  }
  if (
    file.type &&
    !FILE_LIMITS.allowedMimeTypes.includes(
      file.type as (typeof FILE_LIMITS.allowedMimeTypes)[number],
    )
  ) {
    return {
      valid: false,
      error: `The file type ${file.type} is not supported yet.`,
    }
  }
  return { valid: true }
}

export function unavailableFileOperation(operation: string): ApiError {
  return new ApiError({
    status: 0,
    code: 'file_backend_not_configured',
    message: `${operation} is unavailable until the approved file backend is connected.`,
    retryable: false,
  })
}

export function createUnconfiguredFileService(): FileService {
  return {
    validateFile: validateSelectedFile,
    async uploadFile() {
      throw unavailableFileOperation('File upload')
    },
    cancelUpload() {},
    async deleteFile() {
      throw unavailableFileOperation('File deletion')
    },
    async getFileMetadata() {
      throw unavailableFileOperation('File metadata lookup')
    },
  }
}

function backendFileToAttachment(file: BackendAttachment): Attachment {
  return {
    id: file.id,
    name: file.name,
    type: file.mime_type,
    size: file.size,
    status: 'ready',
    progress: 100,
  }
}

export function createHttpFileService(): FileService {
  const controllers = new Map<string, AbortController>()
  return {
    validateFile: validateSelectedFile,
    async uploadFile(file, options) {
      const form = new FormData()
      form.append('file', file, file.name)
      if (options?.projectId) form.append('project_id', options.projectId)
      options?.onProgress?.(5)
      const uploaded = await apiClient.request<BackendAttachment>(
        API_ENDPOINTS.files,
        {
          method: 'POST',
          body: form,
          signal: options?.signal,
          timeoutMs: 120_000,
        },
      )
      options?.onProgress?.(100)
      return backendFileToAttachment(uploaded)
    },
    cancelUpload(uploadId) {
      controllers.get(uploadId)?.abort()
      controllers.delete(uploadId)
    },
    async deleteFile(fileId) {
      await apiClient.request<void>(API_ENDPOINTS.file(fileId), {
        method: 'DELETE',
      })
    },
    async getFileMetadata(fileId) {
      const file = await apiClient.request<BackendAttachment>(
        API_ENDPOINTS.file(fileId),
      )
      return backendFileToAttachment(file)
    },
  }
}
