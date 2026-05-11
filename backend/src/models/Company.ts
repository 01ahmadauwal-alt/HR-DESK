import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  logo?: string;
  address?: string;
  industry?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    address: { type: String },
    industry: { type: String },
    taxId: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICompany>('Company', CompanySchema);
