import { ApiError, normalizeApiError } from './errors'
import type { ChatStreamEvent } from './types'

export interface SseEvent {
  event: string
  data: string
  id?: string
  retry?: number
}

export class SseParser {
  private buffer = ''
  private eventName = ''
  private dataLines: string[] = []
  private eventId: string | undefined
  private retry: number | undefined
  private firstChunk = true

  push(chunk: string): SseEvent[] {
    const normalized = this.firstChunk ? chunk.replace(/^\uFEFF/, '') : chunk
    this.firstChunk = false
    this.buffer += normalized
    const events: SseEvent[] = []

    while (true) {
      const lineBreak = this.findLineBreak()
      if (!lineBreak) break
      const line = this.buffer.slice(0, lineBreak.index)
      this.buffer = this.buffer.slice(lineBreak.index + lineBreak.length)
      const event = this.consumeLine(line)
      if (event) events.push(event)
    }

    return events
  }

  finish(): SseEvent[] {
    const events: SseEvent[] = []
    if (this.buffer) {
      const finalLine = this.buffer.endsWith('\r')
        ? this.buffer.slice(0, -1)
        : this.buffer
      const event = this.consumeLine(finalLine)
      if (event) events.push(event)
      this.buffer = ''
    }
    const final = this.dispatch()
    if (final) events.push(final)
    return events
  }

  private findLineBreak(): { index: number; length: number } | null {
    for (let index = 0; index < this.buffer.length; index += 1) {
      const character = this.buffer[index]
      if (character === '\n') return { index, length: 1 }
      if (character !== '\r') continue
      if (index === this.buffer.length - 1) return null
      return {
        index,
        length: this.buffer[index + 1] === '\n' ? 2 : 1,
      }
    }
    return null
  }

  private consumeLine(line: string): SseEvent | null {
    if (line === '') return this.dispatch()
    if (line.startsWith(':')) return null

    const separator = line.indexOf(':')
    const field = separator < 0 ? line : line.slice(0, separator)
    let value = separator < 0 ? '' : line.slice(separator + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    switch (field) {
      case 'event':
        this.eventName = value
        break
      case 'data':
        this.dataLines.push(value)
        break
      case 'id':
        if (!value.includes('\0')) this.eventId = value
        break
      case 'retry': {
        const retry = Number(value)
        if (Number.isInteger(retry) && retry >= 0) this.retry = retry
        break
      }
    }
    return null
  }

  private dispatch(): SseEvent | null {
    if (this.dataLines.length === 0) {
      this.eventName = ''
      this.retry = undefined
      return null
    }
    const event: SseEvent = {
      event: this.eventName || 'message',
      data: this.dataLines.join('\n'),
      id: this.eventId,
      retry: this.retry,
    }
    this.eventName = ''
    this.dataLines = []
    this.retry = undefined
    return event
  }
}

const EVENT_TYPES = new Set([
  'message_started',
  'token',
  'source',
  'tool_started',
  'tool_progress',
  'tool_completed',
  'message_completed',
  'error',
  'done',
])

export function parseChatStreamEvent(event: SseEvent): ChatStreamEvent | null {
  if (!EVENT_TYPES.has(event.event)) return null
  if (event.event === 'done') {
    return { type: 'done', data: {} }
  }
  let data: unknown
  try {
    data = JSON.parse(event.data)
  } catch {
    throw new ApiError({
      status: 0,
      code: 'malformed_stream_event',
      message: `The ${event.event} stream event contained invalid JSON.`,
      details: { event: event.event, data: event.data },
      retryable: false,
    })
  }
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      status: 0,
      code: 'malformed_stream_event',
      message: `The ${event.event} stream event did not contain an object.`,
      details: data,
      retryable: false,
    })
  }
  return {
    type: event.event,
    data,
  } as ChatStreamEvent
}

export interface ConsumeSseOptions {
  signal?: AbortSignal
  onEvent: (event: ChatStreamEvent) => void | Promise<void>
}

export async function consumeSseResponse(
  response: Response,
  options: ConsumeSseOptions,
): Promise<void> {
  if (!response.body) {
    throw new ApiError({
      status: response.status,
      code: 'missing_stream',
      message: 'The Vurenn service returned no response stream.',
      retryable: true,
    })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parser = new SseParser()
  const abortReader = () => {
    void reader.cancel()
  }
  options.signal?.addEventListener('abort', abortReader, { once: true })

  try {
    if (options.signal?.aborted) {
      await reader.cancel()
      throw new DOMException('The stream was stopped.', 'AbortError')
    }
    while (true) {
      if (options.signal?.aborted) {
        throw new DOMException('The stream was stopped.', 'AbortError')
      }
      const { done, value } = await reader.read()
      if (done) break
      const events = parser.push(decoder.decode(value, { stream: true }))
      for (const event of events) {
        const parsed = parseChatStreamEvent(event)
        if (parsed) await options.onEvent(parsed)
      }
    }

    const trailing = parser.push(decoder.decode())
    for (const event of [...trailing, ...parser.finish()]) {
      const parsed = parseChatStreamEvent(event)
      if (parsed) await options.onEvent(parsed)
    }
  } catch (error) {
    throw normalizeApiError(error)
  } finally {
    options.signal?.removeEventListener('abort', abortReader)
    reader.releaseLock()
  }
}
