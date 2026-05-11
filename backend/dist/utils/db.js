"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri)
        throw new Error('MONGO_URI is not defined in environment variables');
    await mongoose_1.default.connect(uri);
    logger_1.default.info('MongoDB connected');
    mongoose_1.default.connection.on('error', (err) => logger_1.default.error('MongoDB error', err));
    mongoose_1.default.connection.on('disconnected', () => logger_1.default.warn('MongoDB disconnected'));
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map