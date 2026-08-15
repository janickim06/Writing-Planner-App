import { Icon } from "@adamjanicki/ui";
import {
  chevronDown,
  chevronRight,
  file as fileIcon,
  folder as folderIcon,
} from "@adamjanicki/ui/icons";
import { useState } from "react";
import useAlert from "src/hooks/useAlert";
import useItems from "src/hooks/useItems";
import type { Item } from "src/types";

type Props = {
  activeItemId?: string;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onOpenFile: (id: string) => void;
  onItemDeleted: (id: string) => void;
};
const ROOT = "__root__";

export default function FileTree({
  activeItemId,
  selectedFolderId,
  onSelectFolder,
  onOpenFile,
  onItemDeleted,
}: Props) {
  const [{ items, loading }, { deleteItem, updateItem }] = useItems();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [, setAlert] = useAlert();

  const childrenOf = (parentId: string | null) =>
    items.filter((item) => (item.parentId ?? null) === parentId);

  const parentOf = (id: string) =>
    items.find((item) => item._id === id)?.parentId ?? null;

  const isDescendantOf = (candidateId: string, ancestorId: string) => {
    let cursor = parentOf(candidateId);
    while (cursor) {
      if (cursor === ancestorId) return true;
      cursor = parentOf(cursor);
    }
    return false;
  };

  const canDropInto = (targetId: string) => {
    if (!draggingId) return false;
    if (targetId === draggingId) return false;
    if ((parentOf(draggingId) ?? ROOT) === targetId) return false;
    if (targetId !== ROOT && isDescendantOf(targetId, draggingId)) return false;
    return true;
  };

  const handleDrop = async (targetId: string) => {
    const movingId = draggingId;
    setDraggingId(null);
    setDropTargetId(null);
    if (!movingId || !canDropInto(targetId)) return;

    const updated = await updateItem(movingId, {
      parentId: targetId === ROOT ? null : targetId,
    });
    if (!updated) {
      setAlert({ type: "error", message: "Couldn't move that." });
      return;
    }
    if (targetId !== ROOT) {
      setExpanded((prev) => ({ ...prev, [targetId]: true }));
    }
  };

  const dropProps = (targetId: string, accepts: boolean) => ({
    onDragOver: (e: React.DragEvent) => {
      if (targetId !== ROOT) e.stopPropagation();
      if (!accepts || !canDropInto(targetId)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTargetId(targetId);
    },
    onDragLeave: () =>
      setDropTargetId((prev) => (prev === targetId ? null : prev)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleDrop(targetId);
    },
  });

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    const ok = await deleteItem(item._id);
    if (!ok) {
      setAlert({
        type: "error",
        message:
          item.type === "folder"
            ? "Folder isn't empty."
            : "Couldn't delete that.",
      });
      return;
    }
    if (selectedFolderId === item._id) onSelectFolder(null);
    onItemDeleted(item._id);
  };

  const renderRow = (item: Item, depth: number) => {
    const isFolder = item.type === "folder";
    const isOpen = Boolean(expanded[item._id]);
    const classes = ["tree-row"];
    if (item._id === activeItemId) classes.push("active");
    if (isFolder && item._id === selectedFolderId) classes.push("selected");
    if (item._id === draggingId) classes.push("dragging");
    if (item._id === dropTargetId) classes.push("drop-target");

    return (
      <div key={item._id}>
        <div
          className={classes.join(" ")}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item._id);
            setDraggingId(item._id);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDropTargetId(null);
          }}
          {...dropProps(item._id, isFolder)}
        >
          <button
            className="tree-row-main"
            style={{ paddingLeft: 8 + depth * 14 }}
            onClick={() => {
              if (isFolder) {
                setExpanded((prev) => ({
                  ...prev,
                  [item._id]: !prev[item._id],
                }));
                onSelectFolder(item._id === selectedFolderId ? null : item._id);
              } else {
                onOpenFile(item._id);
              }
            }}
          >
            <Icon
              size="s"
              icon={isFolder ? (isOpen ? chevronDown : chevronRight) : fileIcon}
            />
            {isFolder && <Icon size="s" icon={folderIcon} />}
            <span className="tree-row-name">{item.name}</span>
          </button>
          <button
            className="tree-row-delete"
            aria-label={`Delete ${item.name}`}
            onClick={() => handleDelete(item)}
          >
            ×
          </button>
        </div>
        {isFolder &&
          isOpen &&
          childrenOf(item._id).map((child) => renderRow(child, depth + 1))}
      </div>
    );
  };

  if (loading) return <div className="tree-empty">Loading…</div>;

  const roots = childrenOf(null);
  const rootClasses = ["tree-root"];
  if (dropTargetId === ROOT) rootClasses.push("drop-target");

  return (
    <div className={rootClasses.join(" ")} {...dropProps(ROOT, true)}>
      {roots.length ? (
        roots.map((item) => renderRow(item, 0))
      ) : (
        <div className="tree-empty">No files yet. Create one above.</div>
      )}
    </div>
  );
}