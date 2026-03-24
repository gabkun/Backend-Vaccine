import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/send-sms", async (req, res) => {
  try {
    const { recipient, content, sender_id, metadata } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({
        message: "recipient and content are required",
      });
    }

    const response = await axios.post(
      "https://unismsapi.com/api/sms",
      {
        recipient,
        content,
        ...(sender_id ? { sender_id } : {}),
        ...(metadata ? { metadata } : {}),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        auth: {
          username: process.env.UNISMS_API_KEY,
          password: "", // important
        },
      }
    );

    return res.status(201).json({
      message: "SMS sent successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("SEND SMS ERROR:");
    console.error("status:", error.response?.status);
    console.error("data:", error.response?.data);
    console.error("env key:", process.env.UNISMS_API_KEY ? "loaded" : "missing");

    return res.status(error.response?.status || 500).json({
      message: "Failed to send SMS",
      error: error.response?.data || error.message,
    });
  }
});

export default router;