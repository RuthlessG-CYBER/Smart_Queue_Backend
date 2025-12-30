import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    schedule: [
      {
        day: {
          type: String,
          required: true,
        },
        startTime: String,
        endTime: String,
        slotDuration: {
          type: Number,
          default: 10,
        },
      },
    ],
    avgConsultationTime: {
      type: Number,
      default: 10,
    },
    currentSpeedFactor: {
      type: Number,
      default: 0,
    },
    isQueueActive: {
      type: Boolean,
      default: true,
    },
    currentPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    supportsTeleconsultation: {
      type: Boolean,
      default: false,
    },
    maxPatientsPerDay: {
      type: Number,
      default: 50,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
