import express from "express";
import { Types } from "mongoose";
import {
  isInfoSupplied,
  isInfoValidId,
  loadOwnedItem,
  requireAuth,
} from "./middleware";
import Item, { ItemType } from "./models/Item";
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

router.post("/", isInfoSupplied("body", "name", "type"), async (req, res) => {
  const { name, type, content, parentId } = req.body;
  if (type !== "folder" && type !== "text") {
    return res
      .status(BAD_REQUEST)
      .json({ error: "type must be 'folder' or 'text'" });
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
  });
  return res.status(CREATED).json({ data: item });
});

router.get("/", async (req, res) => {
  const { parentId } = req.query;
  let parentFilter: Types.ObjectId | null = null;
  if (parentId !== undefined) {
    if (typeof parentId !== "string" || !Types.ObjectId.isValid(parentId)) {
      return res
        .status(BAD_REQUEST)
        .json({ error: "parentId is not a valid Mongo ID" });
    }
    parentFilter = new Types.ObjectId(parentId);
  }
  const items = await Item.find({
    ownerId: req.session.userId,
    parentId: parentFilter,
  }).sort({ type: 1, name: 1 });
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
    const { name, content, parentId } = req.body;

    if (name !== undefined) item.name = name;
    if (content !== undefined && item.type === "text") item.content = content;
    if (parentId !== undefined) {
      const resolved = await resolveParentId(
        req.session.userId as string,
        parentId
      );
      if ("error" in resolved) {
        return res.status(BAD_REQUEST).json({ error: resolved.error });
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
