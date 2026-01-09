import Clinic from "../models/clinicModel.js";


export const createClinic = async (req, res) => {
    try {
        const clinic = await Clinic.create(req.body);
        res.status(201).json({
            message: "Clinic created successfully",
            clinic
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllClinics = async (req, res) => {
    try {
        const clinics = await Clinic.find({ isActive: true });
        res.json({
            message: "Clinics fetched successfully",
            clinics
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSingleClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });
        res.json({
            message: "Clinic fetched successfully",
            clinic
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findByIdAndDelete(req.params.id);
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });
        res.json({
            message: "Clinic deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
