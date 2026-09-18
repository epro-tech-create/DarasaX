"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiConversations } from "@/data/mock";
import type { AIMessage } from "@/types";
import { cn } from "@/lib/utils";

const starter = aiConversations[0];

export default function AskPage() {
  const [messages, setMessages] = useState<AIMessage[]>(
    starter?.messages?.length
      ? starter.messages
      : [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi — I’m DarasaX. Ask me anything about your modules, notes, or exam prep.",
          },
        ],
  );
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(content: string) {
    const text = content.trim();
    if (!text) return;

    const userMessage: AIMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const assistantMessage: AIMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "Here’s a clear take based on typical course material.\n\n**Key points**\n1. Start from the core definition.\n2. Link it to a worked example from class.\n3. Test yourself with one short question before moving on.\n\nWant me to simplify this further or turn it into practice questions?",
      suggestedQuestions: [
        "Make this simpler",
        "Give me 5 practice questions",
        "Explain with an example",
      ],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] max-w-3xl flex-col sm:h-[calc(100dvh-6.5rem)]">
      <div className="mb-3 flex items-center gap-2.5 px-0.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h1 className="font-heading text-[15px] font-semibold tracking-tight sm:text-base">
            Ask DarasaX
          </h1>
          <p className="text-[11px] text-muted-foreground">Your study assistant</p>
        </div>
      </div>

      <div className="surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px]">
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 scrollbar-thin sm:px-5 sm:py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted/80 text-foreground",
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.role === "assistant" && message.suggestedQuestions?.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {message.suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-border/70 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Ask anything…"
              className="focus-ring max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-[13px] outline-none"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
