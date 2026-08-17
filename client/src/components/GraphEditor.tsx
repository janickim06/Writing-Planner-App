import { Button, ClickOutside, Icon } from "@adamjanicki/ui";
import { plus } from "@adamjanicki/ui/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import EdgeEditor from "src/components/EdgeEditor";
import NodeEditor from "src/components/NodeEditor";
import useAlert from "src/hooks/useAlert";
import useItems from "src/hooks/useItems";
import type { GraphEdge, GraphNode, Item } from "src/types";

type Props = {
  item: Item;
  onDirtyChange: (dirty: boolean) => void;
};

const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1600;
const NODE_RADIUS = 44;
const LABEL_FONT_SIZE = 12;
const EDGE_LABEL_CHARS = 20;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function fitLabel(name: string, maxChars: number) {
  if (name.length <= maxChars) return name;
  return `${name.slice(0, Math.max(1, maxChars - 1))}…`;
}

const INSIDE_CHARS = Math.floor(
  (NODE_RADIUS * 1.55) / (LABEL_FONT_SIZE * 0.55)
);
const BELOW_CHARS = INSIDE_CHARS + 6;

type Menu = { kind: "node" | "edge"; id: string; x: number; y: number };
type PendingEdge = {
  id: string | null;
  from: string;
  to: string;
  label: string;
};

export default function GraphEditor({ item, onDirtyChange }: Props) {
  const [{ items }, { updateItem }] = useItems();
  const [, setAlert] = useAlert();
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const [name, setName] = useState(item.name);
  const [nodes, setNodes] = useState<GraphNode[]>(item.nodes ?? []);
  const [edges, setEdges] = useState<GraphEdge[]>(item.edges ?? []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null);
  const [saving, setSaving] = useState(false);

  const savedName = item.name;
  const savedNodes = item.nodes ?? [];
  const savedEdges = item.edges ?? [];
  const dirty =
    name !== savedName ||
    JSON.stringify(nodes) !== JSON.stringify(savedNodes) ||
    JSON.stringify(edges) !== JSON.stringify(savedEdges);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    document.title = `${savedName} — Orchard`;
  }, [savedName]);

  const save = useCallback(async () => {
    setSaving(true);
    const updated = await updateItem(item._id, { name, nodes, edges });
    setSaving(false);
    setAlert(
      updated
        ? { type: "success", message: "Saved." }
        : { type: "error", message: "Couldn't save." }
    );
  }, [updateItem, item._id, name, nodes, edges, setAlert]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setConnectingFrom(null);
      }
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

  const nodeById = (id: string) => nodes.find((n) => n.id === id);

  const areConnected = (a: string, b: string) =>
    edges.some(
      (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
    );

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
    setEdges((prev) =>
      prev.filter((e) => e.from !== nodeId && e.to !== nodeId)
    );
    setMenu(null);
  };

  const pickConnectTarget = (targetId: string) => {
    const from = connectingFrom;
    setConnectingFrom(null);
    if (!from || from === targetId) return;
    if (areConnected(from, targetId)) {
      setAlert({
        type: "info",
        message: "Those two are already connected.",
      });
      return;
    }
    setPendingEdge({ id: null, from, to: targetId, label: "" });
  };

  const commitEdge = (label: string) => {
    if (!pendingEdge) return;
    const { id, from, to } = pendingEdge;
    if (id) {
      setEdges((prev) =>
        prev.map((e) => (e.id === id ? { ...e, label: label || undefined } : e))
      );
    } else {
      setEdges((prev) => [
        ...prev,
        { id: crypto.randomUUID(), from, to, label: label || undefined },
      ]);
    }
    setPendingEdge(null);
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
        <Button
          size="small"
          variant="secondary"
          onClick={addNode}
          vfx={{ axis: "x", align: "center", gap: "xs" }}
        >
          <Icon size="xs" icon={plus} /> Node
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
          onPointerDown={() => {
            setConnectingFrom(null);
            setMenu(null);
          }}
        >
          <svg
            ref={svgRef}
            className={`graph-canvas${connectingFrom ? " connecting" : ""}`}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          >
            {edges.map((edge) => {
              const a = nodeById(edge.from);
              const b = nodeById(edge.to);
              if (!a || !b) return null;
              return (
                <g
                  key={edge.id}
                  className="graph-edge"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const p = toCanvasPoint(e);
                    setMenu({ kind: "edge", id: edge.id, x: p.x, y: p.y });
                  }}
                >
                  <line
                    className="edge-line"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                  <line
                    className="edge-hit"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                  {edge.label && (
                    <text
                      className="edge-label"
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={LABEL_FONT_SIZE}
                    >
                      {fitLabel(edge.label, EDGE_LABEL_CHARS)}
                    </text>
                  )}
                </g>
              );
            })}

            {nodes.map((node) => (
              <g
                key={node.id}
                className={`graph-node${draggingId === node.id ? " dragging" : ""}${
                  connectingFrom === node.id ? " connect-source" : ""
                }`}
                transform={`translate(${node.x}, ${node.y})`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const p = toCanvasPoint(e);
                  setMenu({ kind: "node", id: node.id, x: p.x, y: p.y });
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  setMenu(null);
                  if (connectingFrom) {
                    pickConnectTarget(node.id);
                    return;
                  }
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
                  if (draggingId !== node.id) return;
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
                // The canvas wrapper closes the menu on pointerdown, which
                // fires before click — without this the menu would unmount
                // before any item's onClick could run
                onPointerDown={(e) => e.stopPropagation()}
              >
                {menu.kind === "node" ? (
                  <>
                    <button
                      className="graph-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setEditingId(menu.id);
                        setMenu(null);
                      }}
                    >
                      Edit…
                    </button>
                    <button
                      className="graph-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setConnectingFrom(menu.id);
                        setMenu(null);
                      }}
                    >
                      Create connection
                    </button>
                    <button
                      className="graph-menu-item danger"
                      role="menuitem"
                      onClick={() => deleteNode(menu.id)}
                    >
                      Delete node
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="graph-menu-item"
                      role="menuitem"
                      onClick={() => {
                        const edge = edges.find((e) => e.id === menu.id);
                        if (edge) {
                          setPendingEdge({
                            id: edge.id,
                            from: edge.from,
                            to: edge.to,
                            label: edge.label ?? "",
                          });
                        }
                        setMenu(null);
                      }}
                    >
                      Edit connection…
                    </button>
                    <button
                      className="graph-menu-item danger"
                      role="menuitem"
                      onClick={() => {
                        setEdges((prev) =>
                          prev.filter((e) => e.id !== menu.id)
                        );
                        setMenu(null);
                      }}
                    >
                      Delete connection
                    </button>
                  </>
                )}
              </div>
            </ClickOutside>
          )}
        </div>
      </div>

      {connectingFrom ? (
        <div className="graph-banner">
          Select another node to connect to
          <span className="graph-banner-hint">Esc to cancel</span>
        </div>
      ) : (
        !nodes.length && (
          <div className="graph-empty">
            This graph is empty — use <strong>+ Node</strong> above to add one.
            Right-click a node to edit or connect it.
          </div>
        )
      )}

      {editingNode && (
        <NodeEditor
          node={editingNode}
          linkableItems={linkableItems}
          onCancel={() => setEditingId(null)}
          onDone={(next) => {
            setNodes((prev) => prev.map((n) => (n.id === next.id ? next : n)));
            setEditingId(null);
          }}
        />
      )}

      {pendingEdge && (
        <EdgeEditor
          fromName={nodeById(pendingEdge.from)?.name ?? "?"}
          toName={nodeById(pendingEdge.to)?.name ?? "?"}
          initialLabel={pendingEdge.label}
          onCancel={() => setPendingEdge(null)}
          onDone={commitEdge}
        />
      )}
    </>
  );
}
