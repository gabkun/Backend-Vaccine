import express from "express";
import multer from "multer";
import {
  createInfant,
  getAllInfants,
  getInfantById,
  deleteInfant,
  getInfantProfileById,
  updateInfant,
  getInfantsByPurok
} from "../controllers/infantController.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/add", createInfant);
router.get("/get", getAllInfants);
router.get("/by-purok/:purokId", getInfantsByPurok);
router.get("/get/:id", getInfantById);
router.get("/infant/profile/:infant_id", getInfantProfileById);
router.delete("/delete/:id", deleteInfant);
router.put(
  "/update/:id",
  upload.fields([
    { name: "birth_document", maxCount: 1 },
    { name: "profile_pic", maxCount: 1 }
  ]),
  updateInfant
);

export default router;
