const { getMatchDetails } = require("../services/resultadosService");

// Controlador para obtener detalles de un partido
const getMatchDetailsController = async (req, res) => {
  const matchId = req.params.id; // ID del partido desde la URL
  console.log(`Buscando detalles para el match con ID: ${matchId}`);

  try {
    // Llama al servicio para obtener los detalles del partido
    const matchDetails = await getMatchDetails(matchId);

    if (!matchDetails) {
      return res.status(404).json({ message: `No se encontró el match con ID ${matchId}` });
    }

    res.status(200).json(matchDetails); // Devuelve los detalles del partido en formato JSON
  } catch (error) {
    console.error("Error obteniendo detalles del partido:", error.message);
    res.status(500).json({ message: "Error al obtener detalles del partido", error: error.message });
  }
};

module.exports = { getMatchDetailsController };

