import express from "express";
import axios from "axios";

const router = express.Router();

const BASE_URL = "https://unismsapi.com/api";

// helper for auth header
const getAuthHeader = () => {
  const apiKey = process.env.UNISMS_API_KEY;

  if (!apiKey) {
    throw new Error("UNISMS_API_KEY is missing in .env");
  }

  // Basic Auth requires base64 encoded api key
  const encoded = Buffer.from(apiKey).toString("base64");

  return `Basic ${encoded}`;
};

/* =========================================================
   POST /sms/send
   Send SMS
========================================================= */
router.post("/send", async (req, res) => {
  try {
    const { recipient, content, sender_id, metadata } = req.body;

    // validation based on docs
    if (!recipient || !content) {
      return res.status(400).json({
        message: "recipient and content are required",
      });
    }

    // docs say max 160 chars
    if (content.length > 160) {
      return res.status(400).json({
        message: "content must not exceed 160 characters",
      });
    }

    // basic E.164 check like +639123456789
    const e164Regex = /^\+\d{10,15}$/;
    if (!e164Regex.test(recipient)) {
      return res.status(400).json({
        message: "recipient must be in E.164 format, e.g. +639123456789",
      });
    }

    const payload = {
      recipient,
      content,
    };

    // optional fields
    if (sender_id) payload.sender_id = sender_id;
    if (metadata && typeof metadata === "object") payload.metadata = metadata;

    const response = await axios.post(`${BASE_URL}/sms`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
    });

    return res.status(201).json({
      message: "SMS sent successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Send SMS error:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      message: "Failed to send SMS",
      error: error.response?.data || error.message,
    });
  }
});

/* =========================================================
   GET /sms/status/:reference_id
   Get SMS Status
========================================================= */
router.get("/status/:reference_id", async (req, res) => {
  try {
    const { reference_id } = req.params;

    if (!reference_id) {
      return res.status(400).json({
        message: "reference_id is required",
      });
    }

    const response = await axios.get(`${BASE_URL}/sms/${reference_id}`, {
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    return res.status(200).json({
      message: "SMS status fetched successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Get SMS status error:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      message: "Failed to fetch SMS status",
      error: error.response?.data || error.message,
    });
  }
});

/* =========================================================
   POST /sms/webhook
   Optional webhook receiver
========================================================= */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;

    console.log("UniSMS Webhook Received:", payload);

    // Example:
    // payload.event = "message.sent" | "message.failed" | "message.retrying"
    // payload.id = reference_id
    // payload.message = full message object

    // You can save to DB here if needed

    return res.status(200).json({
      message: "Webhook received successfully",
    });
  } catch (error) {
    console.error("Webhook error:", error.message);

    return res.status(500).json({
      message: "Failed to process webhook",
      error: error.message,
    });
  }
});

export default router;