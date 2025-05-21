const { getMatchDetails } = require("../services/resultadosService");
// Importamos la nueva función scrapeMatchDetails
const { scrapeMatchDetails } = require("../services/resultadosService");
function removeNullValues(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(value => value !== null);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = removeNullValues(obj[key]);
        if (value !== null) { // Evitar arrays vacíos que no eran originalmente vacíos y objetos vacíos
          // Adicionalmente, podrías decidir si quieres mantener arrays u objetos vacíos
          // Por ejemplo, si un array se vacía después de quitar nulls, ¿debería quitarse el array?
          // La condición `!(Array.isArray(value) && value.length === 0 && !Object.keys(obj[key]).length)` intenta ser un poco más inteligente
          // para no eliminar un array o un objeto que originalmente tenía elementos pero todos eran null.
          // Podrías simplificarla a `if (value !== null)` si siempre quieres quitar la clave si el valor final es null.
          newObj[key] = value;
        }
      }
    }
    if (Object.keys(newObj).length === 0 && Object.keys(obj).length > 0) {
      return null;
    }
    return newObj;
  }
  return obj;
}
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
