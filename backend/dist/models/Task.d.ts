import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ITask, {}, {}, {}, mongoose.Document<unknown, {}, ITask, {}, {}> & ITask & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Task.d.ts.map