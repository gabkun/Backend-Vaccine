import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  createInfant,
  getAllInfants,
  getInfantById,
  deleteInfant,
  getInfantProfileById,
  updateInfant,
  getInfantsByPurok
} from "../controllers/infantController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    if (file.fieldname === "birth_document") {
      uploadPath = "uploads/documents/";
    } else if (file.fieldname === "profile_pic") {
      uploadPath = "uploads/photos/";
    }

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
filename: (req, file, cb) => {
  // ✅ clean filename (remove spaces)
  const cleanName = file.originalname
    .replace(/\s+/g, "_")           // replace spaces
    .replace(/[^\w.-]/g, "");       // remove special chars

  cb(null, cleanName);
}
});

const upload = multer({ storage });

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