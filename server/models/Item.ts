import { model, Schema, Types } from "mongoose";

export type ItemType = "folder" | "text" | "graph";

export type GraphNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string;
  refs?: string[];
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type ItemDocument = {
  ownerId: Types.ObjectId;
  type: ItemType;
  name: string;
  parentId: Types.ObjectId | null;
  content?: string;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  createdAt: Date;
  updatedAt: Date;
};

const graphNodeSchema = new Schema<GraphNode>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    imageUrl: { type: String },
    refs: { type: [String], default: undefined },
  },
  { _id: false }
);

const graphEdgeSchema = new Schema<GraphEdge>(
  {
    id: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    label: { type: String },
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
    edges: { type: [graphEdgeSchema], default: undefined },
  },
  { timestamps: true }
);

export default model<ItemDocument>("Item", itemSchema);
