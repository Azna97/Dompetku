const path = require("path");
const fs = require("fs");
const express = require("express");
const apiRouter = require("./routes/api");
const core = require("./services/coreService");
const { attachRequestContext } = require("./middleware/requestContext");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const appReady = core.initializeDatabase();

app.use(express.json());
app.use(async (req, res, next) => {
  try {
    await appReady;
    next();
  } catch (error) {
    console.error("Gagal inisialisasi database:", error);
    res.status(500).json({
      error: "Gagal inisialisasi database. Pastikan DATABASE_URL Supabase/Postgres di Vercel sudah benar.",
      details: error.message || String(error)
    });
  }
});
app.use(attachRequestContext);

const staticDir1 = process.cwd();
const staticDir2 = path.resolve(__dirname, "..");

app.use(express.static(staticDir1));
if (staticDir2 !== staticDir1) {
  app.use(express.static(staticDir2));
}

app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use("/api", apiRouter);

app.get(/^(?!\/api\/).*/, (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).send("File not found");
  }
  const indexPath1 = path.join(staticDir1, "index.html");
  if (fs.existsSync(indexPath1)) {
    return res.sendFile(indexPath1);
  }
  const indexPath2 = path.join(staticDir2, "index.html");
  if (fs.existsSync(indexPath2)) {
    return res.sendFile(indexPath2);
  }
  res.status(404).send("Not found");
});

app.use(errorHandler);

module.exports = app;
