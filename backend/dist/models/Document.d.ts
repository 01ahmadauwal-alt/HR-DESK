import mongoose, { Document as MongoDocument } from 'mongoose';
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
declare const _default: mongoose.Model<IDocument, {}, {}, {}, mongoose.Document<unknown, {}, IDocument, {}, {}> & IDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Document.d.ts.map