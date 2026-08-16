import express from "express";
import { Types } from "mongoose";
import {
  isInfoSupplied,
  isInfoValidId,
  loadOwnedItem,
  requireAuth,
} from "./middleware";
import Item, { GraphEdge, GraphNode, ItemType } from "./models/Item";
import { BAD_REQUEST, CREATED, OK } from "./util";

const router = express.Router();

router.use(requireAuth);

async function resolveParentId(ownerId: string, parentId: unknown) {
  if (parentId === undefined || parentId === null) {
    return { parentId: null };
  }
  if (typeof parentId !== "string" || !Types.ObjectId.isValid(parentId)) {
    return { error: "parentId is not a valid Mongo ID" };
  }
  const parent = await Item.findById(parentId);
  if (
    !parent ||
    parent.ownerId.toString() !== ownerId ||
    parent.type !== "folder"
  ) {
    return { error: "parentId does not reference a folder you own" };
  }
  return { parentId: parent._id };
}

async function createsCycle(itemId: string, newParentId: Types.ObjectId | null) {
  let cursor = newParentId;
  while (cursor) {
    if (cursor.toString() === itemId) return true;
    const parent = await Item.findById(cursor).select("parentId");
    cursor = parent?.parentId ?? null;
  }
  return false;
}

function parseNodes(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const nodes: GraphNode[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return undefined;
    const { id, name, x, y, imageUrl, refs } = raw as Record<string, unknown>;
    if (typeof id !== "string" || !id) return undefined;
    if (typeof name !== "string") return undefined;
    if (typeof x !== "number" || !Number.isFinite(x)) return undefined;
    if (typeof y !== "number" || !Number.isFinite(y)) return undefined;

    const node: GraphNode = { id, name, x, y };

    if (imageUrl !== undefined && imageUrl !== "") {
      if (typeof imageUrl !== "string") return undefined;
      if (!/^https?:\/\//i.test(imageUrl)) return undefined;
      node.imageUrl = imageUrl;
    }

    if (refs !== undefined) {
      if (!Array.isArray(refs)) return undefined;
      if (refs.some((r) => typeof r !== "string" || !Types.ObjectId.isValid(r)))
        return undefined;
      if (refs.length) node.refs = refs as string[];
    }

    nodes.push(node);
  }
  return nodes;
}

function parseEdges(value: unknown, nodeIds: Set<string>) {
  if (!Array.isArray(value)) return undefined;
  const edges: GraphEdge[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return undefined;
    const { id, from, to, label } = raw as Record<string, unknown>;
    if (typeof id !== "string" || !id) return undefined;
    if (typeof from !== "string" || !nodeIds.has(from)) return undefined;
    if (typeof to !== "string" || !nodeIds.has(to)) return undefined;
    if (from === to) return undefined;

    const edge: GraphEdge = { id, from, to };
    if (label !== undefined) {
      if (typeof label !== "string") return undefined;
      if (label) edge.label = label;
    }
    edges.push(edge);
  }
  return edges;
}

router.post("/", isInfoSupplied("body", "name", "type"), async (req, res) => {
  const { name, type, content, parentId } = req.body;
  if (type !== "folder" && type !== "text" && type !== "graph") {
    return res
      .status(BAD_REQUEST)
      .json({ error: "type must be 'folder', 'text' or 'graph'" });
  }

  const resolved = await resolveParentId(req.session.userId as string, parentId);
  if ("error" in resolved) {
    return res.status(BAD_REQUEST).json({ error: resolved.error });
  }

  const item = await Item.create({
    ownerId: req.session.userId,
    type: type as ItemType,
    name,
    parentId: resolved.parentId,
    content: type === "text" ? content : undefined,
    nodes: type === "graph" ? [] : undefined,
    edges: type === "graph" ? [] : undefined,
  });
  return res.status(CREATED).json({ data: item });
});

router.get("/", async (req, res) => {
  const items = await Item.find({ ownerId: req.session.userId }).sort({
    type: 1,
    name: 1,
  });
  return res.status(OK).json({ data: items });
});

router.get("/:id", isInfoValidId("params", "id"), loadOwnedItem, (_, res) => {
  return res.status(OK).json({ data: res.locals.item });
});

router.patch(
  "/:id",
  isInfoValidId("params", "id"),
  loadOwnedItem,
  async (req, res) => {
    const item = res.locals.item;
    const { name, content, parentId, nodes, edges } = req.body;

    if (name !== undefined) item.name = name;
    if (content !== undefined && item.type === "text") item.content = content;
    if (nodes !== undefined && item.type === "graph") {
      const parsed = parseNodes(nodes);
      if (!parsed) {
        return res.status(BAD_REQUEST).json({ error: "Malformed nodes" });
      }
      const refIds = [...new Set(parsed.flatMap((node) => node.refs ?? []))];
      if (refIds.length) {
        const owned = await Item.countDocuments({
          _id: { $in: refIds },
          ownerId: req.session.userId,
        });
        if (owned !== refIds.length) {
          return res
            .status(BAD_REQUEST)
            .json({ error: "References must point to your own files" });
        }
      }
      item.nodes = parsed;
    }
    if (edges !== undefined && item.type === "graph") {
      const currentNodes: GraphNode[] = item.nodes ?? [];
      const nodeIds = new Set(currentNodes.map((node) => node.id));
      const parsed = parseEdges(edges, nodeIds);
      if (!parsed) {
        return res.status(BAD_REQUEST).json({ error: "Malformed connections" });
      }
      item.edges = parsed;
    }
    if (parentId !== undefined) {
      const resolved = await resolveParentId(
        req.session.userId as string,
        parentId
      );
      if ("error" in resolved) {
        return res.status(BAD_REQUEST).json({ error: resolved.error });
      }
      if (await createsCycle(item._id.toString(), resolved.parentId)) {
        return res
          .status(BAD_REQUEST)
          .json({ error: "Can't move a folder inside itself" });
      }
      item.parentId = resolved.parentId;
    }

    await item.save();
    return res.status(OK).json({ data: item });
  }
);

router.delete(
  "/:id",
  isInfoValidId("params", "id"),
  loadOwnedItem,
  async (_, res) => {
    const item = res.locals.item;
    if (item.type === "folder") {
      const hasChildren = await Item.exists({ parentId: item._id });
      if (hasChildren) {
        return res.status(BAD_REQUEST).json({ error: "Folder is not empty" });
      }
    }
    await item.deleteOne();
    return res.status(OK).json({ data: { message: "Deleted" } });
  }
);

export default router;
