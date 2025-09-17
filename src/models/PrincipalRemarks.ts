import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrincipalRemarks extends Document {
  facultyId: mongoose.Types.ObjectId;
  facultyName: string;
  departmentId: mongoose.Types.ObjectId;
  departmentName: string;
  academicYear: string;
  selfAppraisalId: mongoose.Types.ObjectId;
  hodAppraisalId: mongoose.Types.ObjectId;
  
  // Principal's Observations and Remarks
  observations: string;
  recommendations: string;
  
  // Principal Signature
  principalSignature: {
    signed: boolean;
    principalName: string;
    signatureDate: Date;
  };
  
  // Status
  status: 'draft' | 'completed';
  completionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrincipalRemarksSchema = new Schema<IPrincipalRemarks>(
  {
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    facultyName: {
      type: String,
      required: true
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    departmentName: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      required: true
    },
    selfAppraisalId: {
      type: Schema.Types.ObjectId,
      ref: 'FacultySelfAppraisal',
      required: true
    },
    hodAppraisalId: {
      type: Schema.Types.ObjectId,
      ref: 'HodAppraisal',
      required: true
    },
    
    // Principal's Observations and Remarks
    observations: {
      type: String,
      default: ''
    },
    recommendations: {
      type: String,
      default: ''
    },
    
    // Principal Signature
    principalSignature: {
      signed: {
        type: Boolean,
        default: false
      },
      principalName: {
        type: String,
        default: ''
      },
      signatureDate: Date
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft'
    },
    completionDate: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create and export PrincipalRemarks model
const PrincipalRemarks: Model<IPrincipalRemarks> = mongoose.models.PrincipalRemarks || 
  mongoose.model<IPrincipalRemarks>('PrincipalRemarks', PrincipalRemarksSchema);

export default PrincipalRemarks;
