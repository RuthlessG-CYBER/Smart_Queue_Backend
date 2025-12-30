import PDFDocument from "pdfkit";
import Prescription from "../models/prescriptionModel.js";
import Appointment from "../models/appointmentModel.js";

export const createPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { diagnosis, medicines, notes, followUpDate } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (appointment.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Consultation not completed yet" });
    }

    const prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      diagnosis,
      medicines,
      notes,
      followUpDate,
    });
    req.io
      .to(`patient:${appointment.patientId}`)
      .emit("prescription_ready", {
        appointmentId,
        prescriptionId: prescription._id,
      });

    res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({ appointmentId })
      .populate("doctorId", "name specialization")
      .populate("patientId", "name");

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    res.status(200).json(prescription);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const downloadPrescriptionPdf = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({ appointmentId })
      .populate("doctorId", "name specialization")
      .populate("patientId", "name");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription-${appointmentId}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc
      .fontSize(20)
      .text("Medical Prescription", { align: "center" })
      .moveDown(2);

    doc.fontSize(12).text(`Doctor: ${prescription.doctorId.name}`);
    doc.text(`Specialization: ${prescription.doctorId.specialization}`);
    doc.moveDown();

    doc.text(`Patient: ${prescription.patientId.name}`);
    doc.text(
      `Date: ${new Date(prescription.createdAt).toDateString()}`
    );
    doc.moveDown();

    doc.fontSize(14).text("Diagnosis", { underline: true });
    doc.fontSize(12).text(prescription.diagnosis || "-");
    doc.moveDown();

    doc.fontSize(14).text("Medicines", { underline: true });
    doc.moveDown(0.5);

    prescription.medicines.forEach((med, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${med.name} — ${med.dosage}, ${med.frequency}, ${med.duration}`
        );
    });

    if (prescription.notes) {
      doc.moveDown();
      doc.fontSize(14).text("Doctor Notes", { underline: true });
      doc.fontSize(12).text(prescription.notes);
    }

    doc.moveDown(3);
    doc.text("Signature:", { align: "right" });
    doc.text(prescription.doctorId.name, { align: "right" });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};