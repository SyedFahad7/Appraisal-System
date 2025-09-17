import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFacultySelfAppraisal extends Document {
  facultyId: mongoose.Types.ObjectId;
  facultyName: string;
  departmentId: mongoose.Types.ObjectId;
  departmentName: string;
  academicYear: string;
  // Part A: Teaching
  teaching: {
    coursesHandled: Array<{
      courseCode: string;
      courseName: string;
      semester: string;
      section: string;
      studentsCount: number;
      hoursPerWeek: number;
    }>;
    teachingInnovations: string;
    studentFeedbackScore: number;
    additionalTeachingContributions: string;
  };
  // Part B: Research, IPR & Consultancy
  research: {
    publications: Array<{
      title: string;
      authors: string;
      journalConference: string;
      volume: string;
      pages: string;
      year: string;
      indexing: string;
      impactFactor: string;
      citations: number;
    }>;
    researchProjects: Array<{
      title: string;
      fundingAgency: string;
      amount: number;
      status: string;
      duration: string;
    }>;
    patents: Array<{
      title: string;
      applicationNumber: string;
      status: string;
      year: string;
    }>;
    consultancy: Array<{
      clientName: string;
      projectTitle: string;
      amount: number;
      duration: string;
      status: string;
    }>;
  };
  // Part C: Professional Development
  professionalDevelopment: {
    conferencesAttended: Array<{
      name: string;
      organizer: string;
      date: Date;
      contribution: string;
    }>;
    fdpsAttended: Array<{
      name: string;
      organizer: string;
      duration: string;
      date: Date;
    }>;
    certificationCourses: Array<{
      name: string;
      provider: string;
      duration: string;
      completionDate: Date;
      score: string;
    }>;
    membershipInProfessionalBodies: string;
  };
  // Part D: Administration + HoD Assessment
  administration: {
    administrativeRoles: Array<{
      role: string;
      responsibilities: string;
      duration: string;
    }>;
    committeeParticipation: Array<{
      committeeName: string;
      role: string;
      contributions: string;
    }>;
    institutionalDevelopmentContributions: string;
  };
  // Self Assessment
  selfAssessment: {
    score: number; // Out of 375
    strengths: string;
    areasForImprovement: string;
    goalsForNextYear: string;
  };
  // Attachments
  attachments: Array<{
    fileName: string;
    fileType: string;
    filePath: string;
    uploadDate: Date;
    section: string;
  }>;
  // Digital Signature
  digitalSignature: {
    signed: boolean;
    signatureDate: Date;
  };
  // Status
  status: 'draft' | 'submitted' | 'reviewed_by_hod' | 'completed';
  submissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FacultySelfAppraisalSchema = new Schema<IFacultySelfAppraisal>(
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
    // Part A: Teaching
    teaching: {
      coursesHandled: [{
        courseCode: String,
        courseName: String,
        semester: String,
        section: String,
        studentsCount: Number,
        hoursPerWeek: Number
      }],
      teachingInnovations: String,
      studentFeedbackScore: Number,
      additionalTeachingContributions: String
    },
    // Part B: Research, IPR & Consultancy
    research: {
      publications: [{
        title: String,
        authors: String,
        journalConference: String,
        volume: String,
        pages: String,
        year: String,
        indexing: String,
        impactFactor: String,
        citations: Number
      }],
      researchProjects: [{
        title: String,
        fundingAgency: String,
        amount: Number,
        status: String,
        duration: String
      }],
      patents: [{
        title: String,
        applicationNumber: String,
        status: String,
        year: String
      }],
      consultancy: [{
        clientName: String,
        projectTitle: String,
        amount: Number,
        duration: String,
        status: String
      }]
    },
    // Part C: Professional Development
    professionalDevelopment: {
      conferencesAttended: [{
        name: String,
        organizer: String,
        date: Date,
        contribution: String
      }],
      fdpsAttended: [{
        name: String,
        organizer: String,
        duration: String,
        date: Date
      }],
      certificationCourses: [{
        name: String,
        provider: String,
        duration: String,
        completionDate: Date,
        score: String
      }],
      membershipInProfessionalBodies: String
    },
    // Part D: Administration + HoD Assessment
    administration: {
      administrativeRoles: [{
        role: String,
        responsibilities: String,
        duration: String
      }],
      committeeParticipation: [{
        committeeName: String,
        role: String,
        contributions: String
      }],
      institutionalDevelopmentContributions: String
    },
    // Self Assessment
    selfAssessment: {
      score: Number,
      strengths: String,
      areasForImprovement: String,
      goalsForNextYear: String
    },
    // Attachments
    attachments: [{
      fileName: String,
      fileType: String,
      filePath: String,
      uploadDate: {
        type: Date,
        default: Date.now
      },
      section: String
    }],
    // Digital Signature
    digitalSignature: {
      signed: {
        type: Boolean,
        default: false
      },
      signatureDate: Date
    },
    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed_by_hod', 'completed'],
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

// Create and export FacultySelfAppraisal model
const FacultySelfAppraisal: Model<IFacultySelfAppraisal> = mongoose.models.FacultySelfAppraisal || 
  mongoose.model<IFacultySelfAppraisal>('FacultySelfAppraisal', FacultySelfAppraisalSchema);

export default FacultySelfAppraisal;
