import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  DeveloperExecutionResponse,
  DeveloperRuntimesResponse,
} from '@/lib/api/types'
import type { WorkspaceFile } from '@/lib/developer/file-types'

export interface ExecuteWorkspaceInput {
  language: string
  entrypoint: string
  files: WorkspaceFile[]
  projectId?: string | null
  stdin?: string
}

export interface DeveloperService {
  runtimes(): Promise<DeveloperRuntimesResponse>
  execute(input: ExecuteWorkspaceInput): Promise<DeveloperExecutionResponse>
}

export function createHttpDeveloperService(): DeveloperService {
  return {
    runtimes() {
      return apiClient.request<DeveloperRuntimesResponse>(API_ENDPOINTS.developerRuntimes)
    },
    execute(input) {
      return apiClient.request<DeveloperExecutionResponse>(API_ENDPOINTS.developerExecute, {
        method: 'POST',
        timeoutMs: 30_000,
        body: {
          language: input.language,
          entrypoint: input.entrypoint,
          project_id: input.projectId ?? null,
          stdin: input.stdin ?? '',
          files: input.files.map((file) => ({ name: file.name, content: file.content })),
        },
      })
    },
  }
}

export function createUnavailableDeveloperService(): DeveloperService {
  return {
    async runtimes() {
      return { configured: false, runtimes: [] }
    },
    async execute() {
      throw new Error('The isolated code runner is not connected in this environment.')
    },
  }
}
