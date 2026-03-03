import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGlossaryEntry extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  term: string;
  definition: string;
  category?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GlossaryEntrySchema = new Schema<IGlossaryEntry>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    term: { type: String, required: true, trim: true, maxlength: 120 },
    definition: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, trim: true, maxlength: 80 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

GlossaryEntrySchema.index({ course: 1, term: 1 });
GlossaryEntrySchema.index({ course: 1, category: 1 });

const GlossaryEntry: Model<IGlossaryEntry> =
  mongoose.models.GlossaryEntry ||
  mongoose.model<IGlossaryEntry>("GlossaryEntry", GlossaryEntrySchema);

export default GlossaryEntry;
