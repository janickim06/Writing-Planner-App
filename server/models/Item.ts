import { model, Schema, Types } from "mongoose";

export type ItemType = "folder" | "text";

export type ItemDocument = {
  ownerId: Types.ObjectId;
  type: ItemType;
  name: string;
  parentId: Types.ObjectId | null;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
};

const itemSchema = new Schema<ItemDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["folder", "text"], required: true },
    name: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Item", default: null },
    content: { type: String },
  },
  { timestamps: true }
);

export default model<ItemDocument>("Item", itemSchema);
