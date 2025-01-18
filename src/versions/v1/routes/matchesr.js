const express = require("express");
const router = express.Router();
const matchesController = require("../../controllers/matchesController");

// Endpoint para obtener los detalles de un partido
router.get("/:id", matchesController.getMatchDetails); // '/api/v1/matches/:id'

module.exports = router;
