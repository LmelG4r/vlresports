// src/versions/v1/routes/matchesr.js

const express = require("express");
const router = express.Router();
const resultadosController = require("../../../controllers/resultadosController");  // Verifica el nombre correcto

// Ruta correcta para resultados, usando el ID
router.get('/resultados/:id(\\d+)', resultadosController.getMatchDetails);


module.exports = router;