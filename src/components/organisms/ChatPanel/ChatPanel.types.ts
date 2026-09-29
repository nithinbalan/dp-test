export type ChatRole = 'user' | 'assistant';

/** One turn in a {@link ChatPanelProps} transcript. */
export type ChatMessage = {
  /** Stable key for the turn. */
  id: string;
  /** Who said it. */
  role: ChatRole;
  /** The turn's text. */
  text: string;
};

/** Copy `ChatPanel` renders. English default; pass a translation. */
export type ChatPanelMessages = {
  inputLabel: string;
  inputPlaceholder: string;
  sendLabel: string;
  respondingLabel: string;
};

/**
 * A chat transcript with an input row — the shape a knowledge-base assistant,
 * a support widget, or an AI copilot all share. Owns no answer logic: the
 * caller supplies the transcript and is called back with what the visitor
 * typed, the way `SearchInput` reports a query without filtering anything
 * itself.
 *
 * @tier organisms
 * @tag chat
 * @tag feedback
 */
export type ChatPanelProps = {
  /** The conversation so far, oldest first. */
  history: readonly ChatMessage[];
  /** Called with the trimmed text when the visitor submits a turn. */
  onSend: (text: string) => void;
  /** Shows a "thinking" indicator instead of the input's send affordance. @default false */
  isResponding?: boolean | undefined;
  /** Quick-start prompts shown above the input while the transcript is empty. */
  suggestions?: readonly string[] | undefined;
  /** Name shown on an assistant turn. @default 'Assistant' */
  assistantName?: string | undefined;
  /** Copy for the input row and status text. */
  messages: ChatPanelMessages;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
