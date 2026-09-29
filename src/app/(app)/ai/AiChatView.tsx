'use client';

/** Owns the transcript and "responding" state for the Jethur AI chat page. */
import { useState } from 'react';
import { Text } from '@atoms/Text';
import { PageHeader } from '@molecules/PageHeader';
import { ChatPanel, type ChatMessage } from '@organisms/ChatPanel';
import { findAnswer } from '@shared/mock/ai-knowledge';
import type { AiMessages } from './AiMessages';

const RESPONSE_DELAY_MS = 500;

function buildInitialHistory(welcomeMessage: string): ChatMessage[] {
  return [{ id: 'welcome', role: 'assistant', text: welcomeMessage }];
}

export function AiChatView({
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
}: {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: AiMessages;
}) {
  const [history, setHistory] = useState<ChatMessage[]>(() =>
    buildInitialHistory(t.welcomeMessage),
  );
  const [isResponding, setIsResponding] = useState(false);

  function handleSend(text: string) {
    const userMessage: ChatMessage = { id: `u-${String(Date.now())}`, role: 'user', text };
    setHistory((current) => [...current, userMessage]);
    setIsResponding(true);
    window.setTimeout(() => {
      const answer = findAnswer(text);
      setHistory((current) => [
        ...current,
        { id: `a-${String(Date.now())}`, role: 'assistant', text: answer },
      ]);
      setIsResponding(false);
    }, RESPONSE_DELAY_MS);
  }

  const suggestions =
    history.length <= 1 ? [t.suggestion1, t.suggestion2, t.suggestion3, t.suggestion4] : undefined;

  return (
    <div className="flex h-full flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <ChatPanel
          history={history}
          onSend={handleSend}
          isResponding={isResponding}
          suggestions={suggestions}
          assistantName={t.assistantName}
          messages={{
            inputLabel: t.inputLabel,
            inputPlaceholder: t.inputPlaceholder,
            sendLabel: t.sendLabel,
            respondingLabel: t.respondingLabel,
          }}
          className="min-h-96 flex-1"
        />
        <Text size="2xs" tone="muted">
          {t.disclaimer}
        </Text>
      </div>
    </div>
  );
}
