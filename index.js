import express from "express";
import bodyParser from "body-parser";
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes.js";
import midwifeRoutes from "./routes/midwifeRoutes.js"
import infantRoutes from "./routes/infantRoutes.js"
import vaccineRoutes from "./routes/vaccineRoutes.js"
import purokRoutes from "./routes/purokRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import sumamaryRoutes from "./routes/summaryRoutes.js"
import smsRoutes from "./routes/smsRoutes.js"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();






const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["https://canlandog-vaccination.infinityfreeapp.com", "http://localhost:8000"], // list of allowed origins
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));



// Routes
app.use("/auth", authRoutes);
app.use("/midwife", midwifeRoutes);
app.use("/infant", infantRoutes);
app.use("/vaccine", vaccineRoutes);
app.use("/summary", sumamaryRoutes);
app.use("/purok", purokRoutes);
app.use("/schedule", scheduleRoutes)
app.use("/sms", smsRoutes)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.listen(PORT, '0.0.0.0', () => {
    console.log('Gaganas');
    console.log(`Server running on port http://localhost:${PORT}`);
  });
