import Appointment from "../models/appointmentModel.js";
import Doctor from "../models/doctorModel.js";
import redisClient from "../config/redis.js";
import mongoose from "mongoose";



export const calculateAppointmentETA = async (doctorId, queueNumber) => {
  const doctor = await Doctor.findById(doctorId);
  const minutes =
    queueNumber * doctor.avgConsultationTime + doctor.currentSpeedFactor * 5;
  return new Date(Date.now() + minutes * 60000);
};

export const bookAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      clinicId,
      appointmentDate,
      slotStartTime,
      slotEndTime,
      type,
    } = req.body;

    if (
      !patientId ||
      !doctorId ||
      !clinicId ||
      !appointmentDate ||
      !slotStartTime ||
      !slotEndTime ||
      !type
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const date = new Date(appointmentDate);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const existingAppointment = await Appointment.findOne({
      patientId,
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["waiting", "in_consultation"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        message:
          "You already have an active appointment with this doctor on the selected date",
      });
    }

    const queueKey = `queue:${doctorId}:${startOfDay.toISOString()}`;

    const queueNumber = await redisClient.rPush(
      queueKey,
      new mongoose.Types.ObjectId().toString()
    );

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      clinicId,
      appointmentDate: startOfDay,
      slotStartTime,
      slotEndTime,
      queueNumber,
      type,
      status: "waiting",
    });

    await redisClient.lSet(
      queueKey,
      queueNumber - 1,
      appointment._id.toString()
    );

    const eta = await calculateAppointmentETA(doctorId, queueNumber);

    appointment.estimatedStartTime = eta;
    await appointment.save();

    req.io.to(`doctor:${doctorId}`).emit("queue_updated", {
      doctorId,
      appointmentDate: startOfDay,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getDoctorCurrentConsultation = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointment = await Appointment.findOne({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      status: "in_consultation",
    })
      .populate("patientId", "name phone")
      .populate("clinicId", "name address");

    if (!appointment) {
      return res.status(200).json({
        message: "No active consultation",
        appointment: null,
      });
    }

    res.status(200).json({
      message: "Active consultation found",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getQueueLength = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const queueKey = `queue:${doctorId}`;
    const queueLength = await redisClient.lLen(queueKey);
    res.json({ queueLength });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "name specialization")
      .populate("clinicId", "name")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startAppointmentConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "in_consultation";
    req.io.to(`patient:${appointment.patientId}`).emit("start_video_call", {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
    });

    appointment.actualStartTime = new Date();
    await appointment.save();

    res.json({ message: "Consultation started", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const endAppointmentConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.actualEndTime = new Date();
    appointment.status = "completed";

    const duration =
      (appointment.actualEndTime - appointment.actualStartTime) / 60000;
    appointment.consultationDuration = Math.round(duration);

    await appointment.save();

    const queueKey = `queue:${appointment.doctorId}`;
    await redisClient.lPop(queueKey);

    req.io.to(`doctor:${appointment.doctorId}`).emit("queue_updated");

    res.json({ message: "Consultation completed", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelPatientAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    const queueKey = `queue:${appointment.doctorId}`;
    await redisClient.lRem(queueKey, 1, appointmentId);

    req.io.to(`doctor:${appointment.doctorId}`).emit("queue_updated");

    res.json({ message: "Appointment cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorLiveQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const queueKey = `queue:${doctorId}`;
    const appointmentIds = await redisClient.lRange(queueKey, 0, -1);

    const appointments = await Appointment.find({
      _id: { $in: appointmentIds },
    }).populate("patientId", "name phone");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendConsultationLink = async (req, res) => {
  try {
    const { appointmentId } = req.params
    const { link } = req.body

    if (!appointmentId || !link) {
      return res.status(400).json({
        message: "appointmentId and link are required",
      })
    }

    const appointment = await Appointment.findById(appointmentId)

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      })
    }

    appointment.link = link
    appointment.status = "in_consultation"
    appointment.actualStartTime = new Date()

    await appointment.save()

    res.status(200).json({
      message: "Consultation link sent to patient",
      appointmentId: appointment._id,
      link: appointment.link,
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
