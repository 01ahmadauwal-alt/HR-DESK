import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email: string;
  department?: mongoose.Types.ObjectId;
  position: string;
  hireDate: Date;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: { name: string; amount: number }[];
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  pension: {
    pfaName: string;
    rsaPin: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  avatar?: string;
  gender?: 'male' | 'female';
  dateOfBirth?: Date;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  nin?: string;
  isActive: boolean;
  company?: mongoose.Types.ObjectId;
  thumbprintId?: string;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    position: { type: String, required: true, trim: true },
    hireDate: { type: Date, required: true },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time',
    },
    basicSalary: { type: Number, required: true, min: 0 },
    housingAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    otherAllowances: [{ name: String, amount: Number }],
    bankAccount: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      accountName: { type: String, default: '' },
    },
    pension: {
      pfaName: { type: String, default: '' },
      rsaPin: { type: String, default: '' },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'Nigeria' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    avatar: { type: String },
    gender: { type: String, enum: ['male', 'female'] },
    dateOfBirth: { type: Date },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nin: { type: String },
    isActive: { type: Boolean, default: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    thumbprintId: { type: String },
  },
  { timestamps: true }
);

EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ isActive: 1 });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
