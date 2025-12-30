import Doctor from "../models/doctorModel.js";

export const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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


