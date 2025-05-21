// Importamos la nueva función scrapeMatchDetails
const { scrapeMatchDetails } = require("../services/resultadosService");
function removeNullOrNaNValues(obj) {
  // Si el valor actual es NaN, trátalo como null para que se elimine.
  if (Number.isNaN(obj)) {
    return null;
  }
  // Si es null, o un primitivo (que no sea objeto), devuélvelo.
  // El null será filtrado por la lógica del llamador (array.filter o la condición en el bucle del objeto).
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Si es un array
  if (Array.isArray(obj)) {
    const newArray = obj
      .map(item => removeNullOrNaNValues(item)) // Limpia recursivamente cada elemento
      .filter(item => item !== null);         // Filtra los que se hayan convertido en null (originales o NaN)
    
    // Decide si quieres que los arrays que quedan vacíos se conviertan en null
    // return newArray.length > 0 ? newArray : null; // Opción: eliminar arrays vacíos
    return newArray; // Opción: mantener arrays vacíos como []
  }

  // Si es un objeto
  const newObj = {};
  let propertyAdded = false;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = removeNullOrNaNValues(obj[key]);
      if (value !== null) { // Si el valor (después de procesar nulls y NaNs) no es null
        newObj[key] = value;
        propertyAdded = true;
      }
    }
  }

  // Decide si quieres que los objetos que quedan vacíos se conviertan en null
  // (solo si originalmente tenían propiedades)
  // if (Object.keys(obj).length > 0 && !propertyAdded) {
  //   return null; // Opción: eliminar objetos que se vaciaron
  // }
  return newObj; // Opción: mantener objetos vacíos como {}
}
const getMatchDetailsController = async (req, res) => {
  const matchId = req.params.id; // ID del partido desde la URL
  console.log(`Buscando detalles para el match con ID: ${matchId}`);

  try {
    // Llamamos a la función para obtener los detalles del partido
    const matchDetails = await scrapeMatchDetails(matchId);

    if (!matchDetails) {
      return res.status(404).json({ message: `No se encontró el match con ID ${matchId}` });
    }
    console.log("Tiene performance.operator_duel_matrix:", !!(matchDetails.statsAllMaps && matchDetails.statsAllMaps.performance && matchDetails.statsAllMaps.performance.operator_duel_matrix));
    if (matchDetails.statsAllMaps && matchDetails.statsAllMaps.performance && matchDetails.statsAllMaps.performance.operator_duel_matrix) {
    console.log("RAW operator_duel_matrix[3]:", JSON.stringify(matchDetails.statsAllMaps.performance.operator_duel_matrix[3], null, 2));
  }
    
    const matchDetailsCleaned = removeNullOrNaNValues(matchDetails); // Limpiar el objeto
    console.log("Tiene performance.operator_duel_matrix (cleaned):", !!(matchDetailsCleaned && matchDetailsCleaned.statsAllMaps && matchDetailsCleaned.statsAllMaps.performance && matchDetailsCleaned.statsAllMaps.performance.operator_duel_matrix));
if (matchDetailsCleaned && matchDetailsCleaned.statsAllMaps && matchDetailsCleaned.statsAllMaps.performance && matchDetailsCleaned.statsAllMaps.performance.operator_duel_matrix) {
    console.log("CLEANED operator_duel_matrix[3]:", JSON.stringify(matchDetailsCleaned.statsAllMaps.performance.operator_duel_matrix[3], null, 2));
  }    // podrías querer manejarlo, aunque es poco probable para el objeto principal.
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
