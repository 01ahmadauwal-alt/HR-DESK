import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'super_admin' | 'hr_manager' | 'manager' | 'employee';

export interface IUser extends Document {
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  isFirstLogin: boolean;
  refreshToken?: string;
  active: boolean;
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'hr_manager', 'manager', 'employee'],
      default: 'employee',
    },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    isFirstLogin: { type: Boolean, default: true },
    refreshToken: { type: String },
    active: { type: Boolean, default: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

export default mongoose.model<IUser>('User', UserSchema);
