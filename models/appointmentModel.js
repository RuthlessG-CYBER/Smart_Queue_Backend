import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    slotStartTime: {
      type: String,
      required: true,
    },
    slotEndTime: {
      type: String,
      required: true,
    },
    queueNumber: {
      type: Number,
      required: true,
    },
    estimatedStartTime: {
      type: Date,
    },
    type: {
      type: String,
      enum: ["in_person", "teleconsultation"],
      default: "in_person",
    },
    status: {
      type: String,
      enum: [
        "booked",
        "waiting",
        "in_consultation",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "booked",
    },
    link: {
      type: String,
      default: "",
    },
    isWalkIn: {
      type: Boolean,
      default: false,
    },
    actualStartTime: Date,
    actualEndTime: Date,
    consultationDuration: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
    },
    notifiedAt: {
      type: Date,
    },
    createdBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
