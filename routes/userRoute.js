import express from "express";
import {
  register,
  login,
  totalDoctors,
  totalUsers,
  totalAppointments,
} from "../controllers/userController.js";
import {
  createClinic,
  getAllClinics,
  getSingleClinic,
  deleteClinic,
} from "../controllers/clinicController.js";
import {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  getDataFromUserId,
  deleteDoctor,
  getDataUserId,
  updateDoctor
} from "../controllers/doctorController.js";
import {
  // bookAppointment,
  getAppointmentsByPatient,
  getDoctorLiveQueue,
  startAppointmentConsultation,
  endAppointmentConsultation,
  cancelPatientAppointment,
  getQueueLength,
  getDoctorCurrentConsultation,
  sendConsultationLink,
} from "../controllers/appointmentController.js";
import {
  createPrescription,
  getPrescriptionByAppointment,
  downloadPrescriptionPdf,
} from "../controllers/prescriptionController.js";
import { getPatientNotifications } from "../controllers/notificationController.js";
import { createPaymentOrder, verifyPaymentAndBookAppointment } from "../controllers/razorpayController.js";



const router = express.Router();

// register
router.post("/auth/register", register);

// login
router.post("/auth/login", login);

// clinic routes
router.post("/clinics", createClinic);
router.get("/clinics", getAllClinics);
router.get("/clinic/:id", getSingleClinic);
router.delete("/clinic/delete/:id", deleteClinic);

// doctor routes
router.post("/doctors", createDoctor);
router.get("/doctors", getAllDoctors);
router.get("/:id", getDoctorById);
router.get("/doctors/data/:id", getDataFromUserId);
router.delete("/doctor/delete/:id", deleteDoctor);
router.get("/doctors/multipledata/:id", getDataUserId);
router.patch("/doctors/update/:id", updateDoctor);


// patient routes
router.get("/patient/:patientId", getAppointmentsByPatient);

// appointment routes
// router.post("/book", bookAppointment);
router.get("/doctor/:doctorId/queue/live", getDoctorLiveQueue);
router.patch("/:appointmentId/start", startAppointmentConsultation);
router.patch("/:appointmentId/end", endAppointmentConsultation);
router.patch("/:appointmentId/cancel", cancelPatientAppointment);
router.get("/:appointmentId/prescription", getPrescriptionByAppointment);
router.get("/doctor/:doctorId/current-consultation",getDoctorCurrentConsultation);
router.post("/appointment/:appointmentId/send-consultation-link",sendConsultationLink);

router.get("/doctor/:doctorId/queue-length", getQueueLength);

// razorpay payment routes
router.post("/payment/create-order", createPaymentOrder);
router.post("/payment/verify", verifyPaymentAndBookAppointment);


// dashboard routes
router.get("/doctors/count", totalDoctors);
router.get("/users/count", totalUsers);
router.get("/appointments/count", totalAppointments);

// prescription routes
router.post("/prescription/:appointmentId", createPrescription);
router.get("/:appointmentId/prescription/pdf", downloadPrescriptionPdf);

// notification routes
router.get("/patient/:patientId/notifications", getPatientNotifications);

export default router;
