const getMatchDetails = (req, res) => {
  const matchId = req.params.id;  // La ID se pasa como parámetro en la URL
  console.log("Buscando detalles para el match con ID: ${matchId}");

  // Simula una búsqueda de detalles del partido (esto puede ser una llamada a una API o base de datos)
  // Asegúrate de que esta variable se defina correctamente
  const matchDetails = { matchId, result: "Este es un ejemplo de resultado para el match" };

  if (!matchDetails) {
    // Si no se encuentran detalles del partido, devuelve un error 404
    return res.status(404).json({ message: "No se encontró el match con ID ${matchId}" });
  }

  // Si todo va bien, devuelve los detalles del partido
  res.status(200).json({ matchId, details: matchDetails });
};

module.exports = { getMatchDetails };

