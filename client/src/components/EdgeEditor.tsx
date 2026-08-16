import { Button, Layer } from "@adamjanicki/ui";
import { useState } from "react";

type Props = {
  fromName: string;
  toName: string;
  initialLabel?: string;
  onCancel: () => void;
  onDone: (label: string) => void;
};

export default function EdgeEditor({
  fromName,
  toName,
  initialLabel = "",
  onCancel,
  onDone,
}: Props) {
  const [label, setLabel] = useState(initialLabel);

  return (
    <Layer onClose={onCancel}>
      <div
        className="node-editor"
        role="dialog"
        aria-label="Connection details"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter") onDone(label.trim());
        }}
      >
        <h2 className="node-editor-title">Connection</h2>
        <p className="node-editor-hint">
          <strong>{fromName}</strong> → <strong>{toName}</strong>
        </p>

        <label className="node-editor-field">
          <span className="node-editor-label">Nature of the connection</span>
          <input
            className="node-editor-input"
            value={label}
            autoFocus
            placeholder="e.g. father, mentored by"
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <div className="node-editor-actions">
          <Button size="small" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="small" onClick={() => onDone(label.trim())}>
            Done
          </Button>
        </div>
      </div>
    </Layer>
  );
}
