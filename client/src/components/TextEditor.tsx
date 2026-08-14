import { Button } from "@adamjanicki/ui";
import { useCallback, useEffect, useState } from "react";
import useAlert from "src/hooks/useAlert";
import useItems from "src/hooks/useItems";
import type { Item } from "src/types";

type Props = {
  item: Item;
  onDirtyChange: (dirty: boolean) => void;
};

export default function TextEditor({ item, onDirtyChange }: Props) {
  const [, { updateItem }] = useItems();
  const [, setAlert] = useAlert();
  const [name, setName] = useState(item.name);
  const [content, setContent] = useState(item.content ?? "");
  const [saving, setSaving] = useState(false);

  const savedName = item.name;
  const savedContent = item.content ?? "";
  const dirty = name !== savedName || content !== savedContent;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const save = useCallback(async () => {
    setSaving(true);
    const updated = await updateItem(item._id, { name, content });
    setSaving(false);
    setAlert(
      updated
        ? { type: "success", message: "Saved." }
        : { type: "error", message: "Couldn't save." }
    );
  }, [updateItem, item._id, name, content, setAlert]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dirty, saving, save]);

  useEffect(() => {
    document.title = `${savedName} — Writing Planner`;
  }, [savedName]);

  return (
    <>
      <div className="editor-header">
        <input
          className="editor-title-input"
          value={name}
          aria-label="File name"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          size="small"
          onClick={save}
          disabled={!dirty || saving}
          aria-keyshortcuts="Meta+S"
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </Button>
      </div>
      <textarea
        className="editor-textarea"
        value={content}
        aria-label="File content"
        placeholder="Start writing…"
        onChange={(e) => setContent(e.target.value)}
      />
    </>
  );
}