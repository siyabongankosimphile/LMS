import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  fileUrl: string;
  fileKey?: string;
  issuedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    fileUrl: { type: String, required: true },
    fileKey: { type: String },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CertificateSchema.index({ student: 1, issuedAt: -1 });
CertificateSchema.index({ course: 1 });

const Certificate: Model<ICertificate> =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>("Certificate", CertificateSchema);

export default Certificate;
