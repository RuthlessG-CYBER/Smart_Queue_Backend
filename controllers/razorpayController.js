import crypto from "crypto";
import Appointment from "../models/appointmentModel.js";
import Doctor from "../models/doctorModel.js";
import redisClient from "../config/redis.js";
import razorpay from "../config/razorpay.js";
import { calculateAppointmentETA } from "./appointmentController.js";
import dotenv from "dotenv";
dotenv.config();

export const createPaymentOrder = async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;

    if (!doctorId || !patientId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: "Doctor not available" });
    }

    const existingAppointment = await Appointment.findOne({
      patientId,
      doctorId,
      status: { $in: ["waiting", "in_consultation", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "You already have an active appointment with this doctor",
        appointmentId: existingAppointment._id,
      });
    }

    const amount = Number(doctor.consultationFee);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid consultation fee" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `doc_${Date.now()}`,
    });

    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({
      message:
        error?.error?.description ||
        error.message ||
        "Unable to create payment order",
    });
  }
};

export const verifyPaymentAndBookAppointment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      patientId,
      doctorId,
      clinicId,
      appointmentDate,
      slotStartTime,
      slotEndTime,
      type,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !patientId ||
      !doctorId ||
      !clinicId ||
      !appointmentDate
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedDate = new Date(appointmentDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const existingPayment = await Appointment.findOne({
      paymentId: razorpay_payment_id,
    });

    if (existingPayment) {
      return res.status(200).json({
        message: "Appointment already booked",
        appointment: existingPayment,
      });
    }

    const existingAppointment = await Appointment.findOne({
      patientId,
      doctorId,
      status: { $in: ["waiting", "in_consultation", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "You already have an active appointment with this doctor",
        appointmentId: existingAppointment._id,
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: "Doctor not available" });
    }

    let queueLength = 0;
    try {
      queueLength = await redisClient.lLen(`queue:${doctorId}`);
    } catch {}

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      clinicId,
      appointmentDate: parsedDate,
      slotStartTime,
      slotEndTime,
      type,
      consultationFee: doctor.consultationFee,
      queueNumber: queueLength + 1,
      status: "waiting",
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

    try {
      await redisClient.rPush(
        `queue:${doctorId}`,
        appointment._id.toString()
      );
    } catch {}

    const eta = await calculateAppointmentETA(
      doctorId,
      appointment.queueNumber
    );

    appointment.estimatedStartTime = eta;
    await appointment.save();

    if (req.io) {
      req.io.to(`doctor:${doctorId}`).emit("queue_updated");
    }

    res.status(201).json({
      message: "Payment successful. Appointment booked.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to book appointment" });
  }
};
