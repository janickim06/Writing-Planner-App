import { model, Schema, Types } from "mongoose";

export type ItemType = "folder" | "text" | "graph";

export type GraphNode = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type ItemDocument = {
  ownerId: Types.ObjectId;
  type: ItemType;
  name: string;
  parentId: Types.ObjectId | null;
  content?: string;
  nodes?: GraphNode[];
  createdAt: Date;
  updatedAt: Date;
};

const graphNodeSchema = new Schema<GraphNode>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const itemSchema = new Schema<ItemDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["folder", "text", "graph"], required: true },
    name: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Item", default: null },
    content: { type: String },
    nodes: { type: [graphNodeSchema], default: undefined },
  },
  { timestamps: true }
);

export default model<ItemDocument>("Item", itemSchema);
