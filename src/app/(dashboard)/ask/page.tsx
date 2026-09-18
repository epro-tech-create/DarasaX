"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Copy,
  GraduationCap,
  Layers3,
  MessageSquareQuote,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiConversations, modules, topics } from "@/data/mock";
import type { AIMessage } from "@/types";
import { cn } from "@/lib/utils";

const quickActions = [
  { id: "explain", label: "Explain a Topic", icon: MessageSquareQuote },
  { id: "summarize", label: "Summarize Notes", icon: BookOpen },
  { id: "quiz", label: "Generate Quiz", icon: Wand2 },
  { id: "flashcards", label: "Create Flashcards", icon: Layers3 },
  { id: "cat", label: "Prepare Me for CAT", icon: GraduationCap },
  { id: "module", label: "Ask From Module", icon: Sparkles },
];

export default function AskPage() {
  const [activeId, setActiveId] = useState(aiConversations[0]?.id);
  const [moduleId, setModuleId] = useState(modules[0]?.id || "");
  const [topicId, setTopicId] = useState("");
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState(aiConversations);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];
  const moduleTopics = useMemo(
    () => topics.filter((t) => t.moduleId === moduleId),
    [moduleId],
  );

  function sendMessage(content: string) {
    if (!content.trim() || !active) return;

    const userMessage: AIMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: content.trim(),
    };

    const assistantMessage: AIMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content:
        "Here’s a structured answer based on your selected course materials.\n\n**Key points**\n1. Start from the definition in your lecture notes.\n2. Connect it to the worked examples in class resources.\n3. Practice with a short self-check before your next session.\n\nIf you want, I can turn this into a quiz or flashcards next.",
      citations: ["Selected module notes", "Related lecture slides"],
      suggestedQuestions: [
        "Make this simpler",
        "Generate 5 quiz questions",
        "Create flashcards",
      ],
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, userMessage, assistantMessage],
            }
          : c,
      ),
    );
    setInput("");
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <aside className="surface hidden w-72 shrink-0 flex-col rounded-[20px] p-4 lg:flex">
        <p className="mb-3 text-sm font-semibold">Conversations</p>
        <div className="space-y-2 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full rounded-2xl px-3 py-3 text-left text-sm transition",
                active?.id === c.id
                  ? "btn-gradient"
                  : "bg-muted/60 hover:bg-muted",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <PageHeader
          title="Ask DarasaX ✨"
          description="Study smarter using your actual course materials."
        />

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <select
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              setTopicId("");
            }}
            className="focus-ring h-11 rounded-[12px] border border-border bg-card px-3 text-sm"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="focus-ring h-11 rounded-[12px] border border-border bg-card px-3 text-sm sm:col-span-2"
          >
            <option value="">Select topic / resource context</option>
            {moduleTopics.map((t) => (
              <option key={t.id} value={t.id}>
                Topic {t.number}: {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => sendMessage(`${action.label}: help me with this.`)}
                className="surface flex flex-col items-start gap-2 rounded-[18px] p-3 text-left transition hover:border-primary/30"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium leading-snug">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="surface flex min-h-[420px] flex-col rounded-[24px]">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {active?.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[90%] rounded-[18px] px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.citations?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.citations.map((c) => (
                      <Badge key={c} tone="primary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {message.suggestedQuestions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.role === "assistant" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" type="button">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" type="button">
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => sendMessage("Create a quiz from this")}
                    >
                      Create quiz
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => sendMessage("Create flashcards from this")}
                    >
                      Create flashcards
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <form
            className="border-t border-border p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything from your modules..."
                className="focus-ring h-12 flex-1 rounded-[14px] border border-border bg-background px-4 text-sm"
              />
              <Button type="submit" className="h-12 px-5">
                Ask
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
