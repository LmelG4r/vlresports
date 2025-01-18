const matchesService = require("../services/matchesService");
const catchError = require("../utils/catchError");

const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;  // Obtenemos el ID del partido desde los parámetros de la URL
    const matchDetails = await matchesService.getMatchDetails(matchId);  // Llamamos al servicio para obtener los detalles

    if (!matchDetails) {
      return res.status(404).json({
        status: "error",
        message: "Match not found",
      });
    }

    res.status(200).json({
      status: "OK",
      data: matchDetails,
    });
  } catch (error) {
    catchError(res, error);
  }
};

module.exports = {
  getMatches,
  getMatchDetails,  // Exportamos también la nueva función
};
