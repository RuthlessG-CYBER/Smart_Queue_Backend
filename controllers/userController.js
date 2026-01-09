import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/userModel.js";
import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId =
      "USER-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = new User({
      name,
      email,
      userName: userId,
      password: hashedPassword,
      role,
    });
    await user.save();
    return res.status(201).json({
      message: "User created successfully",
      name,
      email,
      role,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        id: user._id
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      email,
      userName: user.userName,
      name: user.name,
      id: user._id,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};



export const totalDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.countDocuments();
    res.json({
      message: "Doctors fetched successfully",
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const totalAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.countDocuments();
    res.json({
      message: "Appointments fetched successfully",
      appointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const totalUsers = async (req, res) => {
  try {
    const users = await User.countDocuments();
    res.json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};