import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export type FeedbackRating = -1 | 1

export const feedbackService = {
  async set(messageId: string, rating: FeedbackRating): Promise<void> {
    await apiClient.request(API_ENDPOINTS.messageFeedback(messageId), {
      method: 'PUT',
      body: { rating },
    })
  },
  async clear(messageId: string): Promise<void> {
    await apiClient.request(API_ENDPOINTS.messageFeedback(messageId), {
      method: 'DELETE',
    })
  },
}
