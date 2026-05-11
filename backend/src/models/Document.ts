import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export type DocumentType = 'birth_cert' | 'edu_cert' | 'id_card' | 'passport' | 'offer_letter' | 'other';

export interface IDocument extends MongoDocument {
  employeeId: mongoose.Types.ObjectId;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['birth_cert', 'edu_cert', 'id_card', 'passport', 'offer_letter', 'other'],
      required: true,
    },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IDocument>('Document', DocumentSchema);
