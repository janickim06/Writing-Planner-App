import { model, Schema } from "mongoose";

export type UserDocument = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
};

const userSchema = new Schema<UserDocument>({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model<UserDocument>("User", userSchema);
