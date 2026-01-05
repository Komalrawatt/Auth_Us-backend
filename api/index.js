const express = require("express");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("../models/User");
require("dotenv").config();

const PORT = process.env.PORT || 4000;
const baseURL = process.env.BASE_URL;

const app = express();
app.use(express.json());
app.use(cors()); // ✅ allow frontend to call backend

let isConnected = false; // track the connection

async function connectToDatabase() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    isConnected = conn.connections[0].readyState;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

// ✅ Connect MongoDB
connectToDatabase();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Hello from backend");
});

// ✅ Register route
app.post("/register", async (req, res) => {
  try {
    const { rollno, email, name, course, phoneno, role, performance } = req.body;

    if (!rollno || !email || !name || !course || !phoneno || !role || !performance) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ rollno: rollno });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already registered",
      });
    }

    const qrData = `${baseURL}/validate/${rollno}`;
    const qrImage = await QRCode.toDataURL(qrData, {
      color: {
        dark: "#000814", // QR "pixels" color
        light: "#fffafaff", // background color
      },
      margin: 2,
      scale: 8,
      width: 200,
    });

    const base64Data = qrImage.split(";base64,").pop();

    // Save user
    const newUser = await User.create({
      rollno,
      name,
      course,
      email,
      phoneno,
      role,
      performance,
    });

    // Send email with QR code
    await transporter.sendMail({
      from: '"Event Team" <komal.rawatx@gmail.com>',
      to: email,
      subject: "Your Event QR Code Entry Pass",
      html: `
        <h2>Hi ${name}, your event pass is ready 🎉</h2>
        <p>Roll Number: <b>${rollno}</b></p>
        <p>Show this QR code at the entry gate:</p>
        <br/>
        <img src="cid:qrimage" alt="QR Code" />
      `,
      attachments: [
        {
          filename: `${rollno}_qrcode.png`,
          content: Buffer.from(base64Data, "base64"),
          cid: "qrimage",
          contentType: "image/png",
        },
      ],
    });

    res.json({ success: true, message: "Registered & QR sent ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📌 API to validate QR scan
app.get("/validate/:rollno", async (req, res) => {
  try {
    const rollno = req.params.rollno;

    if (!rollno) {
      return res.status(400).json({ valid: false, message: "QR data missing" });
    }

    const user = await User.findOne({ rollno });

    if (user) {
      return res.json({ user: user, valid: true, message: "Registered user" });
    } else {
      return res.json({ valid: false, message: "Not a registered user" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

// 🚀 Start server
app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));
