import Doctor from "../models/doctorModel.js";

export const createDoctor = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      phone,
      specialization,
      qualifications,
      experienceYears,
      clinicId,
      schedule,
      avgConsultationTime,
      currentSpeedFactor,
      isQueueActive,
      currentPatientId,
      supportsTeleconsultation,
      maxPatientsPerDay,
      consultationFee,
      rating,
      totalConsultations,
      isActive,
    } = req.body;

    const existingDoctor = await Doctor.findOne({
      userId,
      clinicId,
    });

    if (existingDoctor) {
      return res.status(409).json({
        message: "Doctor already exists in this clinic",
      });
    }

    const doctor = await Doctor.create({
      userId,
      name,
      email,
      phone,
      specialization,
      qualifications,
      experienceYears,
      clinicId,
      schedule,
      avgConsultationTime,
      currentSpeedFactor,
      isQueueActive,
      currentPatientId,
      supportsTeleconsultation,
      maxPatientsPerDay,
      consultationFee,
      rating,
      totalConsultations,
      isActive,
    });

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to create doctor",
    });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true });
    res.json({
      message: "Doctors fetched successfully",
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("clinicId");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({
      message: "Doctor fetched successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDataFromUserId = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.params.id });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({
      message: "Doctor fetched successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDataUserId = async (req, res) => {
  try {
    const doctor = await Doctor.find({ userId: req.params.id });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({
      message: "Doctor fetched successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({
      message: "Doctor deleted successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
