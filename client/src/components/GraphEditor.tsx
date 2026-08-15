import { Button, Icon } from "@adamjanicki/ui";
import { plus } from "@adamjanicki/ui/icons";
import { useCallback, useEffect, useRef, useState } from "react";
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

function fitLabel(name: string) {
  const maxChars = Math.floor((NODE_RADIUS * 1.55) / (LABEL_FONT_SIZE * 0.55));
  if (name.length <= maxChars) return name;
  return `${name.slice(0, Math.max(1, maxChars - 1))}…`;
}

export default function GraphEditor({ item, onDirtyChange }: Props) {
  const [, { updateItem }] = useItems();
  const [, setAlert] = useAlert();
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const [name, setName] = useState(item.name);
  const [nodes, setNodes] = useState<GraphNode[]>(item.nodes ?? []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dirty, saving, save]);

  const toCanvasPoint = (e: React.PointerEvent) => {
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
              onPointerDown={(e) => {

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
              <circle r={NODE_RADIUS} />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={LABEL_FONT_SIZE}
              >
                {fitLabel(node.name)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {!nodes.length && (
        <div className="graph-empty">
          This graph is empty — use <strong>+ Node</strong> above to add one.
        </div>
      )}
    </>
  );
}