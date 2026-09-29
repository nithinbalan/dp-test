'use client';

/**
 * @tier organisms
 *
 * Composes Card, Text, Chip, Input, Button and Spinner atoms. Owns only the
 * draft-text input state — the transcript and the "is it thinking" flag are
 * both controlled by the caller, the same split `Tabs` uses for its panel.
 */
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Chip } from '@atoms/Chip';
import { Input } from '@atoms/Input';
import { Spinner } from '@atoms/Spinner';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { ChatMessage, ChatPanelProps } from './ChatPanel.types';

function MessageBubble({
  message,
  assistantName,
}: {
  message: ChatMessage;
  assistantName: string;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      {!isUser && (
        <div className="flex items-center gap-1.5">
          <Sparkles aria-hidden className="text-accent-fg size-3.5" />
          <Text as="span" size="2xs" tone="muted" className="uppercase">
            {assistantName}
          </Text>
        </div>
      )}
      <Card
        variant={isUser ? 'soft' : 'outline'}
        size="sm"
        className="max-w-md whitespace-pre-wrap"
      >
        <Text size="sm">{message.text}</Text>
      </Card>
    </div>
  );
}

function RespondingIndicator({ assistantName, label }: { assistantName: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size="sm" label={label} />
      <Text size="xs" tone="muted">
        {assistantName}
      </Text>
    </div>
  );
}

function SuggestionRow({
  suggestions,
  onSelect,
}: {
  suggestions: readonly string[];
  onSelect: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <Chip
          key={suggestion}
          size="sm"
          onClick={() => {
            onSelect(suggestion);
          }}
        >
          {suggestion}
        </Chip>
      ))}
    </div>
  );
}

export function ChatPanel({
  history,
  onSend,
  isResponding = false,
  suggestions,
  assistantName = 'Assistant',
  messages,
  className,
  testId,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');

  function submit(text: string) {
    const trimmed = text.trim();
    if (trimmed === '' || isResponding) return;
    onSend(trimmed);
    setDraft('');
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-4', className)} data-testid={testId}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {history.map((message) => (
          <MessageBubble key={message.id} message={message} assistantName={assistantName} />
        ))}
        {isResponding && (
          <RespondingIndicator assistantName={assistantName} label={messages.respondingLabel} />
        )}
      </div>

      {suggestions !== undefined && suggestions.length > 0 && (
        <SuggestionRow suggestions={suggestions} onSelect={submit} />
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          placeholder={messages.inputPlaceholder}
          aria-label={messages.inputLabel}
          fullWidth
          isDisabled={isResponding}
        />
        <Button type="submit" tone="brand" isDisabled={draft.trim() === '' || isResponding}>
          {messages.sendLabel}
        </Button>
      </form>
    </div>
  );
}
