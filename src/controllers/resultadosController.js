// Importamos la nueva función scrapeMatchDetails
const { scrapeMatchDetails } = require("../services/resultadosService");

// Controlador para obtener detalles de un partido
const getMatchDetailsController = async (req, res) => {
  const matchId = req.params.id; // ID del partido desde la URL
  console.log(`Buscando detalles para el match con ID: ${matchId}`);

  try {
    const matchDetailsRaw = await scrapeMatchDetails(matchId);

    if (!matchDetailsRaw) {
      return res.status(404).json({ message: `No se encontró el match con ID ${matchId}` });
    }

    const matchDetailsCleaned = removeNullValues(matchDetailsRaw); // Limpiar el objeto

    // Si matchDetailsCleaned se vuelve null (porque el objeto raíz solo contenía nulls o se vació)
    // podrías querer manejarlo, aunque es poco probable para el objeto principal.
    if (matchDetailsCleaned === null) {
        return res.status(200).json({}); // Enviar un objeto vacío o manejar como prefieras
    }

    res.status(200).json(matchDetailsCleaned);
  } catch (error) {
    console.error("Error obteniendo detalles del partido:", error.message);
    res.status(500).json({ message: "Error al obtener detalles del partido", error: error.message });
  }
};

module.exports = { getMatchDetailsController };
