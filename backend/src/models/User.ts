import { model, Schema } from "mongoose";

// A customer. Signs in with their mobile number; name, company and email complete the profile.
const userSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true }, // 10 digits
    name: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        return {
          id: String(ret._id),
          phone: ret.phone,
          name: ret.name,
          company: ret.company,
          email: ret.email,
          profileComplete: Boolean(ret.name && ret.company && ret.email),
          createdAt: ret.createdAt,
        };
      },
    },
  },
);

export const User = model("User", userSchema);
