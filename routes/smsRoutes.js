import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/send-sms", async (req, res) => {
  try {
    const { number, message, sendername } = req.body;

    // validation
    if (!number || !message) {
      return res.status(400).json({
        message: "Number and message are required."
      });
    }

    // prevent ignored TEST messages
    if (message.trim().toUpperCase().startsWith("TEST")) {
      return res.status(400).json({
        message: 'Message must not start with the word "TEST".'
      });
    }

    const payload = new URLSearchParams();
    payload.append("apikey", process.env.api_key);
    payload.append("number", number);
    payload.append("message", message);

    if (sendername) {
      payload.append("sendername", sendername);
    }

    const response = await axios.post(
      "https://api.semaphore.co/api/v4/messages",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    return res.status(200).json({
      message: "SMS sent successfully.",
      data: response.data
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send SMS.",
      error: error.response?.data || error.message
    });
  }
});

export default router;