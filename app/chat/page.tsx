"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import DashboardShell from "@/components/DashboardShell";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";

  return (
    <ChatInterface
      initialPrompt={initialPrompt}
      showPromptCards
      className="h-[calc(100vh-57px)] lg:h-screen"
    />
  );
}

export default function ChatPage() {
  return (
    <DashboardShell className="overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-muted">
            Loading chat…
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </DashboardShell>
  );
}
