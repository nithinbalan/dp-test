'use client';

/** Sticky rich-text formatting toolbar + move/delete controls for the focused section. */
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
  Trash2,
  Underline,
} from 'lucide-react';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

type ToolbarButtonProps = {
  title: string;
  onActivate: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
};

function ToolbarButton({ title, onActivate, disabled, danger, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onActivate();
      }}
      className={
        danger
          ? 'text-fg-muted hover:border-danger-solid hover:bg-danger-subtle hover:text-danger-fg grid size-7 place-items-center rounded-md border border-transparent disabled:opacity-30'
          : 'text-fg-muted hover:border-border-default hover:bg-bg-subtle hover:text-fg-default grid size-7 place-items-center rounded-md border border-transparent disabled:opacity-30'
      }
    >
      {children}
    </button>
  );
}

function FormatButton({
  title,
  cmd,
  onFormat,
  children,
}: {
  title: string;
  cmd: string;
  onFormat: (cmd: string) => void;
  children: ReactNode;
}) {
  return (
    <ToolbarButton
      title={title}
      onActivate={() => {
        onFormat(cmd);
      }}
    >
      {children}
    </ToolbarButton>
  );
}

export function NoticeEditorToolbar({
  t,
  focusedHeading,
  focusIndex,
  sectionCount,
  onFormat,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  t: NoticeEditorMessages;
  focusedHeading: string | null;
  focusIndex: number | null;
  sectionCount: number;
  onFormat: (cmd: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-border-default bg-bg-surface/95 sticky top-2 z-20 -mx-6 -mt-6 mb-6 flex flex-wrap items-center gap-1.5 rounded-t-2xl border-b px-4 py-2 backdrop-blur-xs sm:-mx-8 sm:-mt-8">
      <span className="text-2xs text-fg-muted max-w-44 truncate font-mono tracking-wider uppercase">
        {focusedHeading ?? t.toolbarTargetDefault}
      </span>
      <span className="bg-border-default mx-1 h-4 w-px" />

      <FormatButton title={t.toolbarBold} cmd="bold" onFormat={onFormat}>
        <Bold className="size-3.5" />
      </FormatButton>
      <FormatButton title={t.toolbarItalic} cmd="italic" onFormat={onFormat}>
        <Italic className="size-3.5" />
      </FormatButton>
      <FormatButton title={t.toolbarUnderline} cmd="underline" onFormat={onFormat}>
        <Underline className="size-3.5" />
      </FormatButton>

      <span className="bg-border-default mx-1 h-4 w-px" />

      <FormatButton title={t.toolbarUnorderedList} cmd="insertUnorderedList" onFormat={onFormat}>
        <List className="size-3.5" />
      </FormatButton>
      <FormatButton title={t.toolbarOrderedList} cmd="insertOrderedList" onFormat={onFormat}>
        <ListOrdered className="size-3.5" />
      </FormatButton>

      <span className="bg-border-default mx-1 h-4 w-px" />

      <FormatButton title={t.toolbarLink} cmd="createLink" onFormat={onFormat}>
        <LinkIcon className="size-3.5" />
      </FormatButton>
      <FormatButton title={t.toolbarClear} cmd="clear" onFormat={onFormat}>
        <RemoveFormatting className="size-3.5" />
      </FormatButton>

      <span className="ms-auto" />

      <ToolbarButton
        title={t.toolbarMoveUp}
        disabled={focusIndex === null || focusIndex === 0}
        onActivate={onMoveUp}
      >
        <ArrowUp className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title={t.toolbarMoveDown}
        disabled={focusIndex === null || focusIndex === sectionCount - 1}
        onActivate={onMoveDown}
      >
        <ArrowDown className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        title={t.toolbarDelete}
        disabled={focusIndex === null || sectionCount < 2}
        danger
        onActivate={onDelete}
      >
        <Trash2 className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}
