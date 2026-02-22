import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "ADMIN" | "FACILITATOR" | "STUDENT";
  status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
  provider?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    image: { type: String },
    role: {
      type: String,
      enum: ["ADMIN", "FACILITATOR", "STUDENT"],
      default: "STUDENT",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_APPROVAL", "REJECTED"],
      default: "ACTIVE",
    },
    provider: { type: String, default: "credentials" },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, status: 1, createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
