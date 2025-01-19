const express = require("express");
const router = express.Router();
const { getMatchDetailsController } = require("../../../controllers/resultadosController");

// Ruta para obtener los detalles del partido (scraping)
router.get("/resultados/:id(\\d+)", getMatchDetailsController);

module.exports = router;
