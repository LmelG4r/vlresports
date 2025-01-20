const express = require("express");
const morgan = require("morgan");
let cors = require("cors");
const resultadosRouter = require("./versions/v1/routes/resultados"); // Importamos la nueva ruta de resultados
const app = express();

// Settings
app.set("port", process.env.PORT || 5000);

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
// - Usamos la ruta de la versión 1 de la API
app.use("/api/v1", require("./versions/v1/routes/index"));

// Rutas específicas de la API
app.use("/api/v1/teams", require("./versions/v1/routes/teams"));
app.use("/api/v1/players", require("./versions/v1/routes/players"));
app.use("/api/v1/events", require("./versions/v1/routes/events"));
app.use("/api/v1/matches", require("./versions/v1/routes/matches"));
// Aquí estamos usando la ruta correcta para resultados
app.use("/api/v1/results", require("./versions/v1/routes/results"));// Cambiar la ruta a /api/v1/resultados
app.use("/api/v1/resultados", resultadosRouter);

// Starting server
app.listen(app.get("port"), () => {
  console.log(`Server running on port ${app.get("port")}`);
});
