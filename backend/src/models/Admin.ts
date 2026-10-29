import { model, Schema } from "mongoose";

const adminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const Admin = model("Admin", adminSchema);
