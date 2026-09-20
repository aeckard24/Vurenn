import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export interface ImageEditResult {
  url: string
  credits_used: number
}

export const imageService = {
  edit(messageId: string, imageUrl: string, mask: string, prompt: string) {
    return apiClient.request<ImageEditResult>(API_ENDPOINTS.imageEdit, {
      method: 'POST',
      body: { message_id: messageId, image_url: imageUrl, mask, prompt },
      timeoutMs: 210_000,
      headers: { 'x-idempotency-key': crypto.randomUUID() },
    })
  },
}
