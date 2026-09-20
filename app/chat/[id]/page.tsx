import { Workspace } from "@/components/layout/workspace"
import { ChatThread } from "@/components/chat/chat-thread"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Workspace activeConversationId={id}>
      <ChatThread conversationId={id} />
    </Workspace>
  )
}
