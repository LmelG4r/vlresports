const resultadosService = require("../services/resultadosService");

const getMatchDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const match = await resultadosService.getMatchById(id);  // Asegúrate de que el servicio esté configurado
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    return res.json(match);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMatchDetails
};
