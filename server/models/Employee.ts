import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    _id: { type: String }, // Support UUID strings from seed data
    tenantId: { type: String, index: true }, // Made optional as seed data lacks it
    employeeName: { type: String, required: true },
    designation: { type: String },
    phoneNumber: { type: String },
    mobileNumber: { type: String },
    address: { type: String },
    salary: { type: Number },
    joiningDate: { type: String }, // YYYY-MM-DD
    status: { type: String, default: 'Active' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, _id: false }); // _id: false because we define it manually in schema to allow String type

export const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
