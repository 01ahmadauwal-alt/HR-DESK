"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CommentSchema = new mongoose_1.Schema({ authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee' }, text: String, createdAt: { type: Date, default: Date.now } }, { _id: true });
const TaskAssigneeSchema = new mongoose_1.Schema({
    employeeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
}, { _id: false });
const CollaboratorSchema = new mongoose_1.Schema({
    employeeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee' },
    invitedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    respondedAt: { type: Date },
}, { _id: false });
const TaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    assignedTo: [TaskAssigneeSchema],
    assignedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Employee', required: true },
    department: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'done', 'cancelled'], default: 'open' },
    isOpenForCollaboration: { type: Boolean, default: false },
    collaborators: [CollaboratorSchema],
    comments: [CommentSchema],
    attachments: [{ type: String }],
    completedAt: { type: Date },
    asanaTaskId: { type: String },
}, { timestamps: true });
TaskSchema.index({ 'assignedTo.employeeId': 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ department: 1 });
exports.default = mongoose_1.default.model('Task', TaskSchema);
//# sourceMappingURL=Task.js.map