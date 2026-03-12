import express from "express";
import { createMidwife, getAllMidwives, getMidwifeById, updateMidwife, deleteMidwife } from "../controllers/midwifeController.js"; // adjust path if needed

const router = express.Router();

// Create Midwife Account
router.post("/create", createMidwife);
router.get('/get', getAllMidwives);
router.get('/midwife/:id', getMidwifeById);
router.put('/update/:id', updateMidwife);
router.delete('/delete/:id', deleteMidwife);

export default router;
