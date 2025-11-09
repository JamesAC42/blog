"use client";

import React from "react";

import styles from "./markdowntoolbar.module.scss";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  disabled?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export default function MarkdownToolbar({ value, onChange, onUploadImage, disabled, textareaRef }: Props) {
  const getSelection = () => {
    const el = textareaRef?.current;
    if (!el) return { start: value.length, end: value.length };
    return { start: el.selectionStart ?? value.length, end: el.selectionEnd ?? el.selectionStart ?? value.length };
  };

  const applyEdit = (next: string, cursorOffset?: number) => {
    onChange(next);
    const el = textareaRef?.current;
    if (el && typeof cursorOffset === "number") {
      requestAnimationFrame(() => {
        const pos = Math.max(0, Math.min(next.length, cursorOffset));
        el.selectionStart = el.selectionEnd = pos;
        el.focus();
      });
    } else if (el) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const surround = (before: string, after: string = before) => {
    if (disabled) return;
    const { start, end } = getSelection();
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    const caret = start + before.length + selected.length + after.length;
    applyEdit(next, caret);
  };

  const insert = (snippet: string) => {
    if (disabled) return;
    const { start, end } = getSelection();
    const next = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
    const caret = start + snippet.length;
    applyEdit(next, caret);
  };

  const [uploading, setUploading] = React.useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage || disabled) return;
    setUploading(true);
    try {
      const { start, end } = getSelection();
      const placeholder = "![uploading](...)";
      const next = `${value.slice(0, start)}${placeholder}${value.slice(end)}`;
      applyEdit(next, start + placeholder.length);
      const url = await onUploadImage(file);
      if (url) {
        // Replace the first placeholder occurrence around the previous start position
        const before = next.slice(0, start);
        const after = next.slice(start);
        const replaced = before + after.replace(placeholder, `![image](${url})`);
        // place cursor after inserted url
        const caret = (before + `![image](${url})`).length;
        applyEdit(replaced, caret);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={styles.toolbar} aria-disabled={disabled || uploading}>
      <button type="button" onClick={() => surround("**")} disabled={!!disabled || uploading}>Bold</button>
      <button type="button" onClick={() => surround("*")} disabled={!!disabled || uploading}>Italic</button>
      <button type="button" onClick={() => insert("\n- ")} disabled={!!disabled || uploading}>List</button>
      <button type="button" onClick={() => insert("\n1. ")} disabled={!!disabled || uploading}>Numbered</button>
      <button type="button" onClick={() => surround("`")} disabled={!!disabled || uploading}>Code</button>
      <button type="button" onClick={() => insert("\n> ")} disabled={!!disabled || uploading}>Quote</button>
      <label className={styles.uploadBtn} aria-disabled={disabled || uploading}>
        {uploading ? "Uploading..." : "Upload image"}
        <input type="file" accept="image/*" onChange={onUpload} disabled={!!disabled || uploading} />
      </label>
    </div>
  );
}


