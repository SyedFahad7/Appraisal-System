import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHodAppraisal extends Document {
  facultyId: mongoose.Types.ObjectId;
  facultyName: string;
  departmentId: mongoose.Types.ObjectId;
  departmentName: string;
  academicYear: string;
  selfAppraisalId: mongoose.Types.ObjectId;
  
  // HOD's Assessment (Maximum of 25 Points)
  assessment: {
    initiativeAndDrive: number; // 0-25 points
    availingOfLeavePermissions: number; // 0-25 points
    domainKnowledge: number; // 0-25 points
    efficacyOfStudentMentoring: number; // 0-25 points
    administrativeEfficiency: number; // 0-25 points
    complianceOfInstitutionalPolicies: number; // 0-25 points
    collegialityAndTeamwork: number; // 0-25 points
    classControlAndInnovation: number; // 0-25 points
    timelyCompletionOfTasks: number; // 0-25 points
    attireAppearanceAndPunctuality: number; // 0-25 points
    showCauseNotices: string; // List of show cause notices if any
  };
  
  // Weightage and Overall Assessment
  weightage: {
    teachingWeight: number; // Different weights based on faculty position
    researchWeight: number;
    professionalDevelopmentWeight: number;
    administrationWeight: number;
  };
  
  // Performance Score
  performanceScore: {
    weightedScore: number; // Out of 100
    category: 'Below Average' | 'Average' | 'Good' | 'Very Good' | 'Excellent' | '';
  };
  
  // HOD Remarks
  hodRemarks: string;
  suggestionsForImprovement: string;
  
  // HOD Signature
  hodSignature: {
    signed: boolean;
    hodName: string;
    signatureDate: Date;
  };
  
  // Status
  status: 'draft' | 'submitted_to_principal' | 'completed';
  submissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HodAppraisalSchema = new Schema<IHodAppraisal>(
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
    
    // HOD's Assessment (Maximum of 25 Points)
    assessment: {
      initiativeAndDrive: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      availingOfLeavePermissions: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      domainKnowledge: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      efficacyOfStudentMentoring: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      administrativeEfficiency: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      complianceOfInstitutionalPolicies: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      collegialityAndTeamwork: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      classControlAndInnovation: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      timelyCompletionOfTasks: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      attireAppearanceAndPunctuality: {
        type: Number,
        min: 0,
        max: 25,
        required: true
      },
      showCauseNotices: {
        type: String,
        default: ''
      }
    },
    
    // Weightage and Overall Assessment
    weightage: {
      teachingWeight: {
        type: Number,
        required: true
      },
      researchWeight: {
        type: Number,
        required: true
      },
      professionalDevelopmentWeight: {
        type: Number,
        required: true
      },
      administrationWeight: {
        type: Number,
        required: true
      }
    },
    
    // Performance Score
    performanceScore: {
      weightedScore: {
        type: Number,
        min: 0,
        max: 100
      },
      category: {
        type: String,
        enum: ['Below Average', 'Average', 'Good', 'Very Good', 'Excellent', ''],
        default: ''
      }
    },
    
    // HOD Remarks
    hodRemarks: {
      type: String,
      default: ''
    },
    suggestionsForImprovement: {
      type: String,
      default: ''
    },
    
    // HOD Signature
    hodSignature: {
      signed: {
        type: Boolean,
        default: false
      },
      hodName: {
        type: String,
        default: ''
      },
      signatureDate: Date
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted_to_principal', 'completed'],
      default: 'draft'
    },
    submissionDate: Date,
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

// Create and export HodAppraisal model
const HodAppraisal: Model<IHodAppraisal> = mongoose.models.HodAppraisal || 
  mongoose.model<IHodAppraisal>('HodAppraisal', HodAppraisalSchema);

export default HodAppraisal;
