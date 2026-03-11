import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotificationReadState extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  readIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationReadStateSchema = new Schema<INotificationReadState>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    readIds: [{ type: String }],
  },
  { timestamps: true }
);

NotificationReadStateSchema.index({ student: 1 }, { unique: true });

const NotificationReadState: Model<INotificationReadState> =
  mongoose.models.NotificationReadState ||
  mongoose.model<INotificationReadState>("NotificationReadState", NotificationReadStateSchema);

export default NotificationReadState;
