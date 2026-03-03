import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPrivateFile extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  name: string;
  url: string;
  key: string;
  contentType?: string;
  size?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateFileSchema = new Schema<IPrivateFile>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    contentType: { type: String, trim: true },
    size: { type: Number },
  },
  { timestamps: true }
);

PrivateFileSchema.index({ owner: 1, createdAt: -1 });

const PrivateFile: Model<IPrivateFile> =
  mongoose.models.PrivateFile ||
  mongoose.model<IPrivateFile>("PrivateFile", PrivateFileSchema);

export default PrivateFile;
