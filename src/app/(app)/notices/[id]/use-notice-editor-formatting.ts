'use client';

/**
 * Rich-text formatting commands for the section body `contentEditable`s.
 * `document.execCommand` is deprecated, but it remains the only way to drive
 * a plain `contentEditable` toolbar (bold/italic/lists/link) without pulling
 * in a full rich-text editor dependency — the prototype uses the same API.
 */
import { useToast } from '@shared/hooks';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

export function useNoticeEditorFormatting(focusIndex: number | null, t: NoticeEditorMessages) {
  const toast = useToast();

  function execFormat(cmd: string) {
    if (focusIndex === null) {
      toast.show({ label: t.toastSelectTextFirst, tone: 'warning' });
      return;
    }
    if (cmd === 'createLink') {
      const url = window.prompt(t.toastEnterLink, 'https://');
      if (url) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- no non-deprecated API drives a plain contentEditable toolbar
        document.execCommand('createLink', false, url);
      }
    } else if (cmd === 'clear') {
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- see above
      document.execCommand('removeFormat');
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- see above
      document.execCommand('unlink');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- see above
      document.execCommand(cmd, false, undefined);
    }
  }

  return { execFormat };
}
