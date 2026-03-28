import express from "express";
import {
createVaccination, getVaccinationByInfantId, getScheduledInfantsThisMonth, getScheduledInfantsAllMonths, completeVaccination, cancelVaccination, editVaccination
} from "../controllers/scheduleController.js";

const router = express.Router();


router.post("/add", createVaccination);
router.get("/vaccination/infant/:infant_id", getVaccinationByInfantId);
router.get("/vaccination/scheduled/month", getScheduledInfantsThisMonth);
router.get("/vaccination/scheduled/all", getScheduledInfantsAllMonths);
router.put("/schedule/complete/:schedule_id", completeVaccination);
router.put("/schedule/cancel/:schedule_id", cancelVaccination);
router.put("/schedule/edit/:schedule_id", editVaccination);

export default router;