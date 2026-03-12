import express from "express";
import {
createVaccine,
getVaccines,
getVaccineById,
updateVaccine, 
deleteVaccine
} from "../controllers/vaccineController.js";

const router = express.Router();

router.post("/add", createVaccine);
router.get("/get", getVaccines);
router.get("/get/:id", getVaccineById);
router.put("/update/:id", updateVaccine);
router.delete("/delete/:id", deleteVaccine);

export default router;
