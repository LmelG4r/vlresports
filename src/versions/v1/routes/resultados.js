const express = require("express");
const router = express.Router();
const { getMatchDetailsController } = require("../../../controllers/resultadosController");

// Ruta para obtener los detalles del partido (scraping)
router.get("/:id(\\d+)", getMatchDetailsController); // Asegúrate de que esta ruta esté bien definida

module.exports = router;
