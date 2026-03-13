import express from "express";
import { getTotalInfants } from "../controllers/infantController.js";
import { getTotalMidwives } from "../controllers/midwifeController.js";
import { getTotalVaccines } from "../controllers/vaccineController.js";
import { getTotalSuccessfulVaccinations } from "../controllers/scheduleController.js";

const router = express.Router();

router.get("/infants/total", getTotalInfants);
router.get("/midwives/total", getTotalMidwives);
router.get("/vaccines/total", getTotalVaccines);
router.get("/vaccination/successful/total", getTotalSuccessfulVaccinations);


export default router;