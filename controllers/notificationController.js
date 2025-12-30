import Appointment from "../models/appointmentModel.js";


export const getPatientNotifications = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ message: "patientId is required" });
    }

    const appointments = await Appointment.find({ patientId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const notifications = appointments.map((appt) => {
      let title = "Appointment Update";
      let type = "APPOINTMENT_UPDATED";
      let message = "Appointment status updated.";

      switch (appt.status) {
        case "waiting":
          message = `You are in queue (Position ${appt.queueNumber}).`;
          type = "APPOINTMENT_WAITING";
          break;

        case "in_consultation":
          message = "Doctor has started your consultation.";
          type = "APPOINTMENT_STARTED";
          break;

        case "completed":
          message = "Your consultation has been completed.";
          type = "APPOINTMENT_COMPLETED";
          break;

        case "cancelled":
          message = "Your appointment was cancelled.";
          type = "APPOINTMENT_CANCELLED";
          break;
      }

      return {
        userId: patientId,
        appointmentId: appt._id,
        title,
        message,
        type,
        isRead: false,
        createdAt: appt.updatedAt || appt.createdAt,
        updatedAt: appt.updatedAt || appt.createdAt,
      };
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("getPatientNotifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

