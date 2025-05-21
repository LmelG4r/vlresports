// Importamos la nueva función scrapeMatchDetails
const { scrapeMatchDetails } = require("../services/resultadosService");

// Controlador para obtener detalles de un partido
const getMatchDetailsController = async (req, res) => {
  const matchId = req.params.id; // ID del partido desde la URL
  console.log(`Buscando detalles para el match con ID: ${matchId}`);

  function parseEconomyPage($pageInstance, mapsArray,team1Name, team2Name){
    console.log("Parseando página de Economy...");
    console.log(`[parseEconomyPage] Recibido team1NameGlobal: "${team1Name}", Tipo: ${typeof team1Name}`);
    console.log(`[parseEconomyPage] Recibido team2NameGlobal: "${team2Name}", Tipo: ${typeof team2Name}`);
    
    
    const overallEconomyResult = { // Para las estadísticas generales del partido
        summary: [], // Para la primera tabla .mod-econ
        round_details: [] // Para la segunda tabla .mod-econ (detalles ronda a ronda)
    };

    // 1. PROCESAR SECCIÓN DE ESTADÍSTICAS GENERALES (data-game-id="all")
    const overallStatsContainer = $pageInstance('div.vm-stats-game[data-game-id="all"]');
    if (overallStatsContainer.length > 0) {
        console.log("Procesando estadísticas generales de Economy (game=all)...");
        const econTables = overallStatsContainer.find('table.wf-table-inset.mod-econ');
        
        if (econTables.length >= 1) {
            console.log("Procesando tabla de resumen de economía general...");
            overallEconomyResult.summary = parseEcoSummaryTable(econTables.eq(0), $pageInstance);
        }
        // En la sección de data-game-id="all"
        if (econTables.length >= 2) {
            console.log("Procesando tabla de detalles de economía por ronda general...");
            overallEconomyResult.round_details = parseEcoRoundDetailsTable(
                econTables.eq(1),
                $pageInstance,
                null, // mapRoundsArrayToUpdate
                team1Name, // El parámetro equipo1NombreGlobal de parseEconomyPage
                team2Name  // El parámetro equipo2NombreGlobal de parseEconomyPage
            );
        }
    } else {
        console.log("Contenedor de estadísticas generales (vm-stats-game[data-game-id='all']) no encontrado en la página de Economy.");
    }

    // 2. PROCESAR SECCIONES DE ESTADÍSTICAS POR MAPA (data-game-id != 'all')
    console.log("Buscando secciones de estadísticas de economía por mapa...");
    $pageInstance("div.vm-stats-game[data-game-id][data-game-id!='all']").each((indexInEconomyDOM, mapElement) => {
    const mapContainerEconomy = $pageInstance(mapElement);
    const gameId = mapContainerEconomy.attr('data-game-id');
    console.log(`[parseEconomyPage] Procesando gameId '${gameId}' desde DOM de página de Economía.`);

    const targetMap = mapsArray.find(map => map.gameId === gameId); // Encuentra el mapa por gameId

    //console.log(`[parseEconomyPage] Procesando gameId ${gameId} de la página de Economy (índice en DOM de Economy: ${indexInEconomyDOM}).`);

    if (!targetMap) {
        console.warn(`[parseEconomyPage] No se encontró mapa correspondiente en mapsArray para gameId: ${gameId}. Saltando.`);
        return; // Saltar esta iteración
    }

    console.log(`[parseEconomyPage] INFO: targetMap encontrado para gameId '${gameId}': ${targetMap.mapName}. Verificando si se jugó...`);

    // Usa targetMap.mapName para el nombre y targetMap.played para la condición
    const currentMapName = targetMap.mapName; // Nombre correcto del mapa
    console.log(`[parseEconomyPage] INFO: Procesando economía para mapa jugado: ${currentMapName} (gameId '${gameId}')`);

    if (!targetMap.played) { // Comprobar si el mapa se jugó (según datos de Overview)
        console.log(`[parseEconomyPage] INFO: Mapa ${targetMap.mapName} (gameId '${gameId}') no se jugó (según Overview). Saltando procesamiento de economía.`);
        return; // Saltar al siguiente mapa
    }

    //console.log(`Procesando estadísticas de Economy para el mapa: ${currentMapName} (game-id: ${gameId}, índice en mapsArray: ${mapIndexInMatchData})`);
    
    // Asegúrate de que targetMap.statsPerMap.economy exista
    if (!targetMap.statsPerMap) { targetMap.statsPerMap = {}; }
    if (!targetMap.statsPerMap.economy) { targetMap.statsPerMap.economy = {}; }

    targetMap.statsPerMap.economy.summary = [];
    // Los detalles de las rondas (banco) se añaden directamente a targetMap.rounds

    const mapEconTables = mapContainerEconomy.find('table.wf-table-inset.mod-econ');
    if (mapEconTables.length >= 1) {
        targetMap.statsPerMap.economy.summary = parseEcoSummaryTable(mapEconTables.eq(0), $pageInstance);
    }

    if (mapEconTables.length >= 2) {
        //console.log(`[parseEconomyPage] Pasando a parseEcoRoundDetailsTable para mapa <span class="math-inline">\{currentMapName\}\. team1Name\: "</span>{targetMap.teams[0].name}", team2Name: "${targetMap.teams[1].name}"`);
        // Pasar los nombres de equipo específicos del targetMap si es más preciso para el contexto del mapa
        parseEcoRoundDetailsTable(mapEconTables.eq(1), $pageInstance, targetMap.rounds, targetMap.teams[0].name, targetMap.teams[1].name, currentMapName);
    } else {
        console.log(`[parseEconomyPage] No se encontró la segunda tabla de economía (detalles de ronda) para el mapa ${currentMapName}`);
    }
    });

    return { overall: overallEconomyResult }; // Devuelve las estadísticas generales

}
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
    // Si después de eliminar nulls el objeto queda vacío, podrías devolver null
    // para que la clave del objeto también se elimine si así lo deseas.
    return Object.keys(newObj).length > 0 ? newObj : null; // Opcional: eliminar objetos vacíos
  }
  return obj;
}

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
