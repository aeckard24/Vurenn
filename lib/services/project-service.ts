import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  BackendAttachment,
  BackendConversation,
  BackendProject,
  ListProjectsResponse,
} from '@/lib/api/types'
import type { Conversation } from '@/lib/types'

export type ProjectColor =
  | 'blue'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'

export interface ProjectFile {
  id: string
  name: string
  type: string
  size: number
  createdAt: number
}

export interface ProjectSummary {
  id: string
  name: string
  description: string
  instructions: string
  color: ProjectColor
  conversationCount: number
  fileCount: number
  createdAt: number
  updatedAt: number
}

export interface ProjectDetail extends ProjectSummary {
  conversations: Conversation[]
  files: ProjectFile[]
}

export interface ProjectList {
  projects: ProjectSummary[]
  limit: number | null
}

export interface CreateProjectInput {
  name: string
  description?: string
  instructions?: string
  color?: ProjectColor
}

export interface ProjectService {
  list(): Promise<ProjectList>
  get(id: string): Promise<ProjectDetail>
  create(input: CreateProjectInput): Promise<ProjectSummary>
  update(id: string, input: Partial<CreateProjectInput>): Promise<ProjectSummary>
  delete(id: string): Promise<void>
}

function toConversation(value: BackendConversation): Conversation {
  return {
    id: value.id,
    title: value.title,
    modelId: value.model_id,
    projectId: value.project_id,
    createdAt: Date.parse(value.created_at),
    updatedAt: Date.parse(value.updated_at),
    isPinned: false,
    isArchived: false,
    unread: false,
    syncStatus: 'synced',
  }
}

function toFile(value: BackendAttachment): ProjectFile {
  return {
    id: value.id,
    name: value.name,
    type: value.mime_type,
    size: value.size,
    createdAt: value.created_at ? Date.parse(value.created_at) : Date.now(),
  }
}

function toProject(value: BackendProject): ProjectSummary {
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    instructions: value.instructions,
    color: value.color,
    conversationCount: value.conversation_count,
    fileCount: value.file_count,
    createdAt: Date.parse(value.created_at),
    updatedAt: Date.parse(value.updated_at),
  }
}

export function createHttpProjectService(): ProjectService {
  return {
    async list() {
      const result = await apiClient.request<ListProjectsResponse>(
        API_ENDPOINTS.projects,
      )
      return {
        projects: result.projects.map(toProject),
        limit: result.limit,
      }
    },
    async get(id) {
      const result = await apiClient.request<BackendProject>(
        API_ENDPOINTS.project(id),
      )
      return {
        ...toProject(result),
        conversations: (result.conversations ?? []).map(toConversation),
        files: (result.files ?? []).map(toFile),
      }
    },
    async create(input) {
      const result = await apiClient.request<BackendProject>(
        API_ENDPOINTS.projects,
        { method: 'POST', body: input },
      )
      return toProject(result)
    },
    async update(id, input) {
      const result = await apiClient.request<BackendProject>(
        API_ENDPOINTS.project(id),
        { method: 'PATCH', body: input },
      )
      return toProject(result)
    },
    async delete(id) {
      await apiClient.request<void>(API_ENDPOINTS.project(id), {
        method: 'DELETE',
      })
    },
  }
}

export function createEmptyProjectService(): ProjectService {
  const projects: ProjectSummary[] = []
  return {
    async list() {
      return { projects: [...projects], limit: 50 }
    },
    async get(id) {
      const project = projects.find((item) => item.id === id)
      if (!project) throw new Error('Project not found.')
      return { ...project, conversations: [], files: [] }
    },
    async create(input) {
      const now = Date.now()
      const project: ProjectSummary = {
        id: `project_${now}`,
        name: input.name,
        description: input.description ?? '',
        instructions: input.instructions ?? '',
        color: input.color ?? 'blue',
        conversationCount: 0,
        fileCount: 0,
        createdAt: now,
        updatedAt: now,
      }
      projects.unshift(project)
      return project
    },
    async update(id, input) {
      const project = projects.find((item) => item.id === id)
      if (!project) throw new Error('Project not found.')
      Object.assign(project, input, { updatedAt: Date.now() })
      return { ...project }
    },
    async delete(id) {
      const index = projects.findIndex((item) => item.id === id)
      if (index >= 0) projects.splice(index, 1)
    },
  }
}
