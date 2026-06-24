import { Sidebar } from "@/components/Sidebar";
import { ChatThread } from "@/components/ChatThread";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ action_id: string }>;
}) {
  const { action_id } = await params;
  return (
    <div className="flex h-screen relative">
      <Sidebar activeActionId={action_id} />
      <ChatThread actionId={action_id} />
    </div>
  );
}
