import { Button, Layer } from "@adamjanicki/ui";
import { useState } from "react";
import type { GraphNode, Item } from "src/types";

type Props = {
  node: GraphNode;
  linkableItems: Item[];
  onCancel: () => void;
  onDone: (next: GraphNode) => void;
};

export default function NodeEditor({
  node,
  linkableItems,
  onCancel,
  onDone,
}: Props) {
  const [name, setName] = useState(node.name);
  const [imageUrl, setImageUrl] = useState(node.imageUrl ?? "");
  const [refs, setRefs] = useState<string[]>(node.refs ?? []);
  const [imageBroken, setImageBroken] = useState(false);

  const toggleRef = (id: string) =>
    setRefs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

  const done = () => {
    const trimmedUrl = imageUrl.trim();
    onDone({
      ...node,
      name: name.trim() || node.name,
      imageUrl: trimmedUrl || undefined,
      refs: refs.length ? refs : undefined,
    });
  };

  return (
    <Layer onClose={onCancel}>
      <div
        className="node-editor"
        role="dialog"
        aria-label={`Edit ${node.name}`}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      >
        <h2 className="node-editor-title">Edit node</h2>

        <label className="node-editor-field">
          <span className="node-editor-label">Name</span>
          <input
            className="node-editor-input"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="node-editor-field">
          <span className="node-editor-label">Image URL</span>
          <input
            className="node-editor-input"
            value={imageUrl}
            placeholder="https://…"
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImageBroken(false);
            }}
          />
        </label>

        {imageUrl.trim() && (
          <div className="node-editor-preview">
            {imageBroken ? (
              <span className="node-editor-hint">
                That image couldn&apos;t be loaded.
              </span>
            ) : (
              <img
                src={imageUrl.trim()}
                alt=""
                onError={() => setImageBroken(true)}
              />
            )}
          </div>
        )}

        <div className="node-editor-field">
          <span className="node-editor-label">
            References {refs.length ? `(${refs.length})` : ""}
          </span>
          {linkableItems.length ? (
            <div className="node-editor-refs">
              {linkableItems.map((item) => (
                <label key={item._id} className="node-editor-ref">
                  <input
                    type="checkbox"
                    checked={refs.includes(item._id)}
                    onChange={() => toggleRef(item._id)}
                  />
                  <span className="node-editor-ref-name">{item.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <span className="node-editor-hint">
              No other files to link to yet.
            </span>
          )}
        </div>

        <div className="node-editor-actions">
          <Button size="small" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="small" onClick={done}>
            Done
          </Button>
        </div>
      </div>
    </Layer>
  );
}
