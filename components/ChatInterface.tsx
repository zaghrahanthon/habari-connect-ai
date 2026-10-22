"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PromptCards from "@/components/PromptCards";
import { PROMPT_CARDS } from "@/lib/prompts";
import { cn } from "@/lib/utils";
import { isSafeChatLink } from "@/lib/chat-resources";

export type ChatAttachment = {
  title: string;
  fileUrl: string;
  fileType?: string | null;
};

export type ChatSource = {
  title: string;
  category: string;
  kind?: string;
  sourceUrl?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  sources?: ChatSource[];
  followUps?: string[];
};

type ChatInterfaceProps = {
  /** Optional initial text in the input (e.g. from dashboard prompt cards) */
  initialPrompt?: string;
  /** Show prompt suggestion cards when chat is empty */
  showPromptCards?: boolean;
  className?: string;
};

function MessageContent({ content }: { content: string }) {
  return (
    <div className="chat-markdown space-y-3 text-[15px] leading-relaxed">
      <ReactMarkdown
        urlTransform={(url) => (isSafeChatLink(url) ? url : "")}
        disallowedElements={["img", "iframe", "script", "object", "embed", "form"]}
        unwrapDisallowed
        components={{
          p: ({ children }) => <p className="m-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
          ul: ({ children }) => (
            <ul className="m-0 list-disc space-y-1.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="m-0 list-decimal space-y-1.5 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          h1: ({ children }) => (
            <h3 className="m-0 text-base font-semibold text-foreground">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="m-0 text-base font-semibold text-foreground">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="m-0 text-sm font-semibold text-foreground">{children}</h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="m-0 border-l-2 border-accent/40 pl-3 text-muted">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const url = href ?? "";
            if (!isSafeChatLink(url)) {
              return <span>{children}</span>;
            }
            const isExternal = url.startsWith("http");
            return (
              <a
                href={url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
              >
                {children}
                {isExternal ? <ExternalLink className="inline h-3 w-3" /> : null}
              </a>
            );
          },
          code: ({ children }) => (
            <code className="rounded bg-background/80 px-1.5 py-0.5 text-[13px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-background/80 p-3 text-[13px]">
              {children}
            </pre>
          ),
          hr: () => <hr className="border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatInterface({
  initialPrompt = "",
  showPromptCards = true,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!initialPrompt) return;
    const id = window.setTimeout(() => {
      setInput(initialPrompt);
      textareaRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialPrompt]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        attachments?: ChatAttachment[];
        followUps?: string[];
        sources?: ChatSource[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "I couldn’t complete that just now. Please try again in a moment.",
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message ?? "I could not generate a response.",
          attachments: data.attachments,
          followUps: data.followUps,
          sources: data.sources,
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "I couldn’t reach Habari Connect AI. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar sm:px-6">
          {isEmpty ? (
            <div className="mx-auto flex max-w-3xl flex-col items-center pt-8 text-center sm:pt-12">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How can I help you today?
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Ask about HR, policies, people, calendar events, news, or
                website analytics.
              </p>
              {showPromptCards && (
                <PromptCards
                  prompts={PROMPT_CARDS}
                  onSelect={handlePromptSelect}
                  className="mt-8 w-full max-w-4xl"
                />
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] px-4 py-3 sm:max-w-[80%]",
                      message.role === "user"
                        ? "rounded-2xl rounded-br-md bg-accent text-sm leading-relaxed text-white"
                        : "rounded-2xl rounded-bl-md border border-border/80 bg-card text-foreground shadow-sm",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <MessageContent content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                          Download document
                        </p>
                        {message.attachments.map((attachment) => (
                          <a
                            key={attachment.fileUrl}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-accent/40"
                          >
                            <Download className="h-4 w-4 shrink-0 text-accent" />
                            <span className="font-medium">{attachment.title}</span>
                            {attachment.fileType && (
                              <span className="ml-auto text-xs uppercase text-muted">
                                {attachment.fileType}
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 border-t border-border/70 pt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                          Sources
                        </p>
                        <ul className="mt-1 space-y-1">
                          {message.sources.map((source) => (
                            <li
                              key={`${source.kind ?? "doc"}-${source.title}`}
                              className="text-xs text-muted"
                            >
                              {source.sourceUrl && isSafeChatLink(source.sourceUrl) ? (
                                <a
                                  href={source.sourceUrl}
                                  className="text-accent underline underline-offset-2 hover:text-accent-hover"
                                >
                                  {source.title}
                                </a>
                              ) : (
                                <span>{source.title}</span>
                              )}
                              {source.category ? (
                                <span className="text-muted/80"> · {source.category}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/80 bg-card px-4 py-3 text-sm text-muted shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Habari Connect is thinking…
                  </div>
                </div>
              )}

              {!isLoading &&
                messages[messages.length - 1]?.role === "assistant" &&
                (messages[messages.length - 1].followUps?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 pl-1">
                    {messages[messages.length - 1].followUps!.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border bg-background px-4 py-4 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Message Habari Connect AI…"
                rows={1}
                className="max-h-32 min-h-[48px] w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>

          {error && (
            <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted">
            Habari Connect AI can make mistakes. Verify important information
            with HR or your manager.
          </p>
        </div>
      </div>
    </div>
  );
}
