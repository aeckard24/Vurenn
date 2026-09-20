import type { PlanId } from '@/lib/types'

export type IsoDateString = string

export interface HealthResponse {
  status: 'ok'
  service: 'vurenn-api'
}

export type BackendModelStatus =
  | 'available'
  | 'unavailable'
  | 'coming_soon'
  | 'maintenance'

export interface BackendModel {
  id: string
  name: string
  description: string
  status: BackendModelStatus
  required_plan: PlanId
  capabilities: string[]
}

export interface ModelsResponse {
  models: BackendModel[]
}

export interface CreateConversationRequest {
  temporary_id: string
  title: string
  model_id: string
  project_id: string | null
}

export interface BackendConversation {
  id: string
  title: string
  model_id: string
  project_id: string | null
  created_at: IsoDateString
  updated_at: IsoDateString
}

export type CreateConversationResponse = BackendConversation

export interface ListConversationsResponse {
  conversations: BackendConversation[]
}

export type BackendMessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool'
  | 'status'

export type BackendMessageStatus =
  | 'pending'
  | 'streaming'
  | 'completed'
  | 'stopped'
  | 'failed'

export interface BackendAttachment {
  id: string
  name: string
  mime_type: string
  size: number
  project_id?: string | null
  created_at?: IsoDateString
}

export interface BackendProject {
  id: string
  name: string
  description: string
  instructions: string
  color: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
  conversation_count: number
  file_count: number
  created_at: IsoDateString
  updated_at: IsoDateString
  conversations?: BackendConversation[]
  files?: BackendAttachment[]
}

export interface ListProjectsResponse {
  projects: BackendProject[]
  limit: number | null
}

export interface DeveloperRuntime {
  language: string
  version: string
  aliases: string[]
}

export interface DeveloperRuntimesResponse {
  configured: boolean
  runtimes: DeveloperRuntime[]
}

export interface DeveloperExecutionResponse {
  language: string
  version: string
  compile?: { stdout: string; stderr: string; output: string; code: number | null; signal: string | null }
  run: { stdout: string; stderr: string; output: string; code: number | null; signal: string | null }
}

export interface BackendMessage {
  id: string
  conversation_id: string
  role: BackendMessageRole
  content: string
  status: BackendMessageStatus
  attachments: BackendAttachment[]
  created_at: IsoDateString
}

export interface ConversationMessagesResponse {
  messages: BackendMessage[]
}

export interface ChatStreamRequest {
  conversation_id: string
  message: string
  model: string
  attachments: BackendAttachment[]
  voice_mode?: boolean
  tools?: string[]
}

export interface StreamMessageStartedData {
  message_id: string
}

export interface StreamTokenData {
  text: string
}

export interface StreamSourceData {
  id: string
  title: string
  url: string | null
}

export interface StreamToolStartedData {
  tool_call_id: string
  tool_name: string
  subject?: string
  estimated_seconds?: number
  estimated_finish_at?: string
}

export interface StreamToolCompletedData extends StreamToolStartedData {
  summary: string
}

export interface StreamToolProgressData extends StreamToolStartedData {
  stage_index: number
  detail?: string
  estimated_seconds?: number
}

export interface StreamMessageCompletedData {
  message_id: string
  conversation_id: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
  credit_charge?: number
  credits_remaining?: number | null
  silent?: boolean
}

export interface StreamErrorData {
  code: string
  message: string
  retryable: boolean
}

export type ChatStreamEvent =
  | { type: 'message_started'; data: StreamMessageStartedData }
  | { type: 'token'; data: StreamTokenData }
  | { type: 'source'; data: StreamSourceData }
  | { type: 'tool_started'; data: StreamToolStartedData }
  | { type: 'tool_progress'; data: StreamToolProgressData }
  | { type: 'tool_completed'; data: StreamToolCompletedData }
  | { type: 'message_completed'; data: StreamMessageCompletedData }
  | { type: 'error'; data: StreamErrorData }
  | { type: 'done'; data: Record<string, never> }

export interface CreateConversationInput {
  temporaryId: string
  title: string
  modelId: string
  projectId?: string | null
}
