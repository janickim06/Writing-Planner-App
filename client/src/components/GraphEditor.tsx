import { Button, ClickOutside, Icon } from "@adamjanicki/ui";
import { plus } from "@adamjanicki/ui/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import NodeEditor from "src/components/NodeEditor";
import useAlert from "src/hooks/useAlert";
import useItems from "src/hooks/useItems";
import type { GraphNode, Item } from "src/types";

type Props = {
  item: Item;
  onDirtyChange: (dirty: boolean) => void;
};

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1600;
const NODE_RADIUS = 44;
const LABEL_FONT_SIZE = 12;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function fitLabel(name: string, maxChars: number) {
  if (name.length <= maxChars) return name;
  return `${name.slice(0, Math.max(1, maxChars - 1))}…`;
}

const INSIDE_CHARS = Math.floor((NODE_RADIUS * 1.55) / (LABEL_FONT_SIZE * 0.55));
const BELOW_CHARS = INSIDE_CHARS + 6;

type Menu = { nodeId: string; x: number; y: number };

export default function GraphEditor({ item, onDirtyChange }: Props) {
  const [{ items }, { updateItem }] = useItems();
  const [, setAlert] = useAlert();
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const [name, setName] = useState(item.name);
  const [nodes, setNodes] = useState<GraphNode[]>(item.nodes ?? []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const savedName = item.name;
  const savedNodes = item.nodes ?? [];
  const dirty =
    name !== savedName || JSON.stringify(nodes) !== JSON.stringify(savedNodes);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    document.title = `${savedName} — Orchard`;
  }, [savedName]);

  const save = useCallback(async () => {
    setSaving(true);
    const updated = await updateItem(item._id, { name, nodes });
    setSaving(false);
    setAlert(
      updated
        ? { type: "success", message: "Saved." }
        : { type: "error", message: "Couldn't save." }
    );
  }, [updateItem, item._id, name, nodes, setAlert]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dirty, saving, save]);

  const toCanvasPoint = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const addNode = () => {
    const label = window.prompt("Node name", "New node");
    if (!label) return;

    const el = scrollRef.current;
    const x = el ? el.scrollLeft + el.clientWidth / 2 : CANVAS_WIDTH / 2;
    const y = el ? el.scrollTop + el.clientHeight / 2 : CANVAS_HEIGHT / 2;
    setNodes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: label.trim(),
        x: clamp(x, NODE_RADIUS, CANVAS_WIDTH - NODE_RADIUS),
        y: clamp(y, NODE_RADIUS, CANVAS_HEIGHT - NODE_RADIUS),
      },
    ]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setMenu(null);
  };

  const editingNode = nodes.find((n) => n.id === editingId);
  const linkableItems = items.filter(
    (other) => other.type !== "folder" && other._id !== item._id
  );

  return (
    <>
      <div className="editor-header">
        <input
          className="editor-title-input"
          value={name}
          aria-label="Graph name"
          onChange={(e) => setName(e.target.value)}
        />
        <Button size="small" variant="secondary" onClick={addNode}>
          <Icon size="s" icon={plus} /> Node
        </Button>
        <Button
          size="small"
          onClick={save}
          disabled={!dirty || saving}
          aria-keyshortcuts="Meta+S"
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </Button>
      </div>

      <div className="graph-scroll" ref={scrollRef}>
        <div
          className="graph-canvas-wrap"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <svg
            ref={svgRef}
            className="graph-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          >
            {nodes.map((node) => (
              <g
                key={node.id}
                className={`graph-node${draggingId === node.id ? " dragging" : ""}`}
                transform={`translate(${node.x}, ${node.y})`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const p = toCanvasPoint(e);
                  setMenu({ nodeId: node.id, x: p.x, y: p.y });
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  setMenu(null);
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const p = toCanvasPoint(e);
                  dragOffset.current = { dx: p.x - node.x, dy: p.y - node.y };
                  setDraggingId(node.id);
                }}
                onPointerMove={(e) => {
                  if (draggingId !== node.id) return;
                  const p = toCanvasPoint(e);
                  const nextX = clamp(
                    p.x - dragOffset.current.dx,
                    NODE_RADIUS,
                    CANVAS_WIDTH - NODE_RADIUS
                  );
                  const nextY = clamp(
                    p.y - dragOffset.current.dy,
                    NODE_RADIUS,
                    CANVAS_HEIGHT - NODE_RADIUS
                  );
                  setNodes((prev) =>
                    prev.map((n) =>
                      n.id === node.id ? { ...n, x: nextX, y: nextY } : n
                    )
                  );
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  setDraggingId(null);
                }}
              >
                {node.imageUrl ? (
                  <>
                    <clipPath id={`node-clip-${node.id}`}>
                      <circle r={NODE_RADIUS} />
                    </clipPath>
                    <image
                      href={node.imageUrl}
                      x={-NODE_RADIUS}
                      y={-NODE_RADIUS}
                      width={NODE_RADIUS * 2}
                      height={NODE_RADIUS * 2}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#node-clip-${node.id})`}
                    />
                    <circle className="node-ring" r={NODE_RADIUS} />
                    <text
                      textAnchor="middle"
                      y={NODE_RADIUS + 16}
                      fontSize={LABEL_FONT_SIZE}
                    >
                      {fitLabel(node.name, BELOW_CHARS)}
                    </text>
                  </>
                ) : (
                  <>
                    <circle r={NODE_RADIUS} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={LABEL_FONT_SIZE}
                    >
                      {fitLabel(node.name, INSIDE_CHARS)}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>

          {menu && (
            <ClickOutside onClickOutside={() => setMenu(null)}>
              <div
                className="graph-menu"
                style={{ left: menu.x, top: menu.y }}
                role="menu"
              >
                <button
                  className="graph-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setEditingId(menu.nodeId);
                    setMenu(null);
                  }}
                >
                  Edit…
                </button>
                <button
                  className="graph-menu-item danger"
                  role="menuitem"
                  onClick={() => deleteNode(menu.nodeId)}
                >
                  Delete node
                </button>
              </div>
            </ClickOutside>
          )}
        </div>
      </div>

      {!nodes.length && (
        <div className="graph-empty">
          This graph is empty — use <strong>+ Node</strong> above to add one.
          Right-click a node to edit it.
        </div>
      )}

      {editingNode && (
        <NodeEditor
          node={editingNode}
          linkableItems={linkableItems}
          onCancel={() => setEditingId(null)}
          onDone={(next) => {
            setNodes((prev) =>
              prev.map((n) => (n.id === next.id ? next : n))
            );
            setEditingId(null);
          }}
        />
      )}
    </>
  );
}
