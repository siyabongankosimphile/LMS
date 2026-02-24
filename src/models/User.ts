import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  surname?: string;
  email: string;
  cityTown?: string;
  country?: string;
  gender?: string;
  race?: string;
  employmentStatus?: string;
  highestQualification?: string;
  province?: string;
  age?: number;
  phone?: string;
  saId?: string;
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
    surname: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    cityTown: { type: String },
    country: { type: String },
    gender: { type: String },
    race: { type: String },
    employmentStatus: { type: String },
    highestQualification: { type: String },
    province: { type: String },
    age: { type: Number },
    phone: { type: String },
    saId: { type: String, trim: true },
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
UserSchema.index(
  { saId: 1 },
  {
    unique: true,
    partialFilterExpression: { saId: { $type: "string", $ne: "" } },
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
