const express = require("express");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");

require("dotenv").config();
const PORT = process.env.PORT || 4000;
const baseURL = process.env.BASE_URL;

const app = express();
app.use(express.json());
app.use(cors()); // ✅ allow frontend to call backend


// ✅ Connect MongoDB
mongoose.connect("mongodb://localhost:27017/FiestaDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB error:", err));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "komal.rawatx@gmail.com",
    pass: "ziea krba wfqx fwlo", // ⚠️ 
  },
});

app.get("/", (req, res) => {
  res.send("Hello from backend");
});

// ✅ Register route
app.post("/register", async (req, res) => {
  try {
    const { rollno, email, name, course, phoneno,role,performance } = req.body;

    if (!rollno || !email || !name || !course || !phoneno || !role || !performance) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ rollno: rollno });
    if (existingUser) {
      return res.status(409).json({
        success: false,  // Changed from "false" string to boolean false
        message: "User already registered"
      });
    }
    
    const qrData = `${baseURL}/validate/${rollno}`;
    const qrImage = await QRCode.toDataURL(qrData, {
      color: {
        dark: "#000814",   // QR "pixels" color
        light: "#fffafaff"   // background color
      },
      margin: 2,           // space around QR
      scale: 8,            // size of each module
      width: 200,
      // final image size in px
    });

    // Extract base64 data (remove the data:image/png;base64, prefix)
    const base64Data = qrImage.split(';base64,').pop();
    // Save user

   
    const newUser = await User.create({
      rollno, name, course, email, phoneno,role,performance
    });

    // Send email
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
          content: Buffer.from(base64Data, 'base64'),
          cid: 'qrimage',
          contentType: 'image/png'
        }
      ]
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
    // Example qrData = "rollno:15734"

    if (!rollno) {
      return res.status(400).json({ valid: false, message: "QR data missing" });
    }
    // Search in DB
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



app.listen(PORT, () => console.log("🚀 Backend running at " + PORT));