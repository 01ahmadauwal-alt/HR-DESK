import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  authorId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface ITaskAssignee {
  employeeId: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'done';
}

export interface ICollaborator {
  employeeId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  respondedAt?: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: ITaskAssignee[];
  assignedBy: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  isOpenForCollaboration: boolean;
  collaborators: ICollaborator[];
  comments: IComment[];
  attachments: string[];
  completedAt?: Date;
  asanaTaskId?: string;
}

const CommentSchema = new Schema<IComment>(
  { authorId: { type: Schema.Types.ObjectId, ref: 'Employee' }, text: String, createdAt: { type: Date, default: Date.now } },
  { _id: true }
);

const TaskAssigneeSchema = new Schema<ITaskAssignee>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
  },
  { _id: false }
);

const CollaboratorSchema = new Schema<ICollaborator>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    respondedAt: { type: Date },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    assignedTo: [TaskAssigneeSchema],
    assignedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'done', 'cancelled'], default: 'open' },
    isOpenForCollaboration: { type: Boolean, default: false },
    collaborators: [CollaboratorSchema],
    comments: [CommentSchema],
    attachments: [{ type: String }],
    completedAt: { type: Date },
    asanaTaskId: { type: String },
  },
  { timestamps: true }
);

TaskSchema.index({ 'assignedTo.employeeId': 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ department: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
