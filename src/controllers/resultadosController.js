const resultadosService = require("../services/resultadosService");

const getMatchDetails = (req, res) => {
  const matchId = req.params.id;  // La ID es solo numérica (ej. 427993)
  console.log("Buscando detalles para el match con ID: ${matchId}");

  // Aquí puedes hacer la llamada a la API para obtener los detalles del match usando la ID
  // Ejemplo: const matchDetails = apiVlr.getMatchById(matchId);

  // Suponiendo que recuperas los detalles del match (esto depende de cómo accedas a la API)
  // Si no puedes encontrar el match, puedes responder con un 404
  if (!matchDetails) {
    return res.status(404).json({ message: "No se encontró el match con ID ${matchId}" });
  }

  // Si encuentras los detalles del match, devuelves la respuesta
  res.status(200).json({ matchId: matchId, details: matchDetails });
};



module.exports = { getMatchDetails };
