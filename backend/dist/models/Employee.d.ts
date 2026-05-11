import mongoose, { Document } from 'mongoose';
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
    otherAllowances: {
        name: string;
        amount: number;
    }[];
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
declare const _default: mongoose.Model<IEmployee, {}, {}, {}, mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Employee.d.ts.map