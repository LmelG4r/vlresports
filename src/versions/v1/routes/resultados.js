// src/versions/v1/routes/matchesr.js

const express = require('express');
const router = express.Router();
const resultadosController = require('../../controllers/resultadosController');  // Verifica el nombre correcto

// Ruta para obtener los detalles de un partido
router.get('/:id', resultadosController.getMatchDetails);

module.exports = router;