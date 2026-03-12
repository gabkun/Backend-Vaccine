import express from "express";
import {
createPurok, getAllPuroks, getPurokById, updatePurok, deletePurok
} from "../controllers/purokController.js";

const router = express.Router();

router.post("/add", createPurok);
router.get('/purok', getAllPuroks);
router.get('/purok/:id', getPurokById);
router.put('/purok/:id', updatePurok);
router.delete('/purok/:id', deletePurok);

export default router;
