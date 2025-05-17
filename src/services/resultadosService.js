const rp = require("request-promise");
const cheerio = require("cheerio");
const vlrgg_url = "https://www.vlr.gg"; // Base URL correcta

function scrapeOverview($, tableCheerioObject, statType) { // statType es opcional, más para logging
    const overviewData = [];
    console.log(`[scrapeOverview - ${statType}] Iniciando. Tipo de tableCheerioObject: ${typeof tableCheerioObject}`);
    if (!tableCheerioObject || typeof tableCheerioObject.find !== 'function') {
        console.error(`[scrapeOverview - ${statType}] tableCheerioObject NO es un objeto Cheerio válido o no tiene .find().`);
        // console.log(tableCheerioObject); // Loguea qué es exactamente si no es Cheerio
        return overviewData; // Salir temprano si no es lo que esperamos
    }
    console.log(`[scrapeOverview - ${statType}] tableCheerioObject.length: ${tableCheerioObject.length}`);

    //console.log(`[scrapeOverview] HTML de la tabla a parsear para ${statType}: ${tableCheerioObject.html().substring(0, 300)}...`);


    tableCheerioObject.find('tbody tr').each((i, rowElement) => {
        const playerRow = $(rowElement); 

        const playerName = playerRow.find(".mod-player .text-of").text().trim() || "Jugador no especificado";
        const teamName = playerRow.find(".mod-player .ge-text-light").text().trim() || "Equipo no especificado";
        
        let agent = "Agente no especificado";
        const agentImgs = playerRow.find(".mod-agents img");
        if (agentImgs.length > 0) {
            agent = agentImgs.map((idx, imgEl) => $(imgEl).attr("title")).get().join(', ') || "Agente no especificado";
        }

        const stats = {
            Rating: {
                both: playerRow.find(".mod-stat").eq(0).find(".mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(0).find(".mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(0).find(".mod-side.mod-ct").text().trim() || "0",
            },
            Acs: {
                both: playerRow.find(".mod-stat").eq(1).find(".mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(1).find(".mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(1).find(".mod-side.mod-ct").text().trim() || "0",
            },
            Kills: { // Kills (K)
                both: playerRow.find(".mod-vlr-kills .mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-vlr-kills .mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-vlr-kills .mod-side.mod-ct").text().trim() || "0",
            },
            Deaths: { // Deaths (D)
                both: playerRow.find(".mod-vlr-deaths .mod-both").text().trim() || "0", // El selector es .mod-vlr-deaths, no .mod-stat
                attack: playerRow.find(".mod-vlr-deaths .mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-vlr-deaths .mod-ct").text().trim() || "0",
            },
            Assists: { // Assists (A)
                
                both: playerRow.find(".mod-stat").eq(4).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(4).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(4).find(".mod-ct").text().trim() || "0%",
            },
            KillsDeathsDiff: { // K/D Diff (+/-)
                both: playerRow.find(".mod-kd-diff .mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-kd-diff .mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-kd-diff .mod-ct").text().trim() || "0",
            },
            Kast: { // KAST
                both: playerRow.find(".mod-stat").eq(6).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(6).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(6).find(".mod-ct").text().trim() || "0%",
            },
            Adr: { // ADR
                both: playerRow.find(".mod-stat").eq(7).find(".mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(7).find(".mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(7).find(".mod-side.mod-ct").text().trim() || "0",
            },
            HsPercent: { // HS%
                both: playerRow.find(".mod-stat").eq(8).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(8).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(8).find(".mod-ct").text().trim() || "0%",
            },
            FirstKills: { // FK
                both: playerRow.find(".mod-stat").eq(9).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(9).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(9).find(".mod-ct").text().trim() || "0%",
            },
            FirstDeaths: { // FD
                both: playerRow.find(".mod-stat").eq(10).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(10).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(10).find(".mod-ct").text().trim() || "0%",
            },
        };

        overviewData.push({
            playerName,
            teamName,
            agent,
            stats,
        });
    });

    console.log(`[scrapeOverview] Datos de overview extraídos para ${statType}: ${overviewData.length} jugadores`);
    return overviewData;
}
const scrapeMatchDetails = async (matchId) => {
    const matchUrl = `${vlrgg_url}/${matchId}`;
    let htmlContent;

    try {
        console.log(`[resultadosService] Iniciando scraping para el partido: ${matchUrl}`);
        htmlContent = await rp(matchUrl);
        console.log(`[resultadosService] HTML obtenido para ${matchId}.`);

        const $ = cheerio.load(htmlContent); // '$' es el Cheerio para la página principal (Overview)
        console.log(`[resultadosService] Cheerio cargado para ${matchId}.`);
        
        let matchData = {
            matchId: matchId,
            generalInfo: {
                team1: { name: null, score: null },
                team2: { name: null, score: null },
                tournament: null,
                dateUtc: null, // <--- NUEVO CAMPO para la fecha UTC
                matchFormat: null, // <--- NUEVO CAMPO para el formato (BoX)
                picksAndBans: [] // <--- NUEVO CAMPO para picks y bans
            },
            statsAllMaps: {
                overview: [],
                performance: {},
                economy: {}
            },
            maps: []
        };

       // CÓDIGO PARA EXTRAER LINKS DE PERFORMANCE Y ECONOMY 
        const performanceTabSelector = 'div.vm-stats[data-game-id="all"] .vm-stats-tabnav a.vm-stats-tabnav-item[data-tab="performance"]';
        const performanceHref = $(performanceTabSelector).attr('href');
        let performanceFullUrl = null;

        if (performanceHref) {
            // Asegurarse de que no se duplique la base si el href ya fuera absoluto (poco probable en vlr.gg)
            performanceFullUrl = performanceHref.startsWith('http') ? performanceHref : vlrgg_url + performanceHref;
            console.log(`Link de Performance (game=all) encontrado: ${performanceFullUrl}`);
        } else {
            console.log("Link de Performance (game=all) NO encontrado.");
        }

        const economyTabSelector = 'div.vm-stats[data-game-id="all"] .vm-stats-tabnav a.vm-stats-tabnav-item[data-tab="economy"]';
        const economyHref = $(economyTabSelector).attr('href');
        let economyFullUrl = null;

        if (economyHref) {
            economyFullUrl = economyHref.startsWith('http') ? economyHref : vlrgg_url + economyHref;
            console.log(`Link de Economy (game=all) encontrado: ${economyFullUrl}`);
        } else {
            console.log("Link de Economy (game=all) NO encontrado.");
        }


        // ---- EXTRACCIÓN DE INFO GENERAL ----
        matchData.generalInfo.tournament = $(".match-header-event > div > div").eq(0).text().trim() || "Torneo no especificado";
        const dateElement = $(".moment-tz-convert[data-utc-ts]").first(); // Tomar el primer elemento con data-utc-ts
        if (dateElement.length > 0) {
            const utcTimestampString = dateElement.attr('data-utc-ts'); // Ej: "2025-05-10 11:00:00"
            if (utcTimestampString) {
                // Convertir a formato ISO 8601 para consistencia y facilidad de uso
                // La cadena ya está bastante cerca, solo necesitamos añadir 'Z' si asumimos que es UTC directo
                // o parsearla y reformatearla si es necesario.
                // VLR.gg usa 'data-utc-ts', lo que sugiere fuertemente que la hora ya está en UTC.
                try {
                    const dateObject = new Date(utcTimestampString.replace(" ", "T") + "Z"); // Asegurar formato ISO para el constructor de Date
                    if (!isNaN(dateObject)) {
                         matchData.generalInfo.dateUtc = dateObject.toISOString();
                         console.log(`[resultadosService] Fecha UTC extraída: ${matchData.generalInfo.dateUtc}`);
                    } else {
                        console.warn(`[resultadosService] No se pudo parsear la fecha desde data-utc-ts: ${utcTimestampString}`);
                        matchData.generalInfo.dateUtc = "Fecha no parseable";
                    }
                } catch (e) {
                     console.error(`[resultadosService] Error parseando la fecha: ${utcTimestampString}`, e);
                     matchData.generalInfo.dateUtc = "Error al parsear fecha";
                }
            } else {
                console.warn("[resultadosService] Atributo data-utc-ts encontrado pero vacío.");
                matchData.generalInfo.dateUtc = "Fecha no disponible (atributo vacío)";
            }
        } else {
            // Fallback si el elemento .moment-tz-convert[data-utc-ts] no se encuentra
            // (Tu código anterior usaba .moment-tz-convert y data-unix, que también es una opción si data-utc-ts no siempre está)
            const eventDateUnix = $('.moment-tz-convert').eq(0).data('unix'); // Intenta con data-unix como fallback
            if (eventDateUnix) {
                matchData.generalInfo.dateUtc = new Date(eventDateUnix * 1000).toISOString();
                console.log(`[resultadosService] Fecha UTC extraída (fallback data-unix): ${matchData.generalInfo.dateUtc}`);
            } else {
                console.warn("[resultadosService] No se pudo extraer la fecha del partido (ni data-utc-ts ni data-unix).");
                matchData.generalInfo.dateUtc = "Fecha no disponible";
            }
        }
        
        const picksBansText = $(".match-header-note").text().trim();
        if (picksBansText) {
            console.log(`[resultadosService] Texto de Picks/Bans: "${picksBansText}"`);
            const actions = picksBansText.split(';').map(action => action.trim()).filter(action => action !== "");
            
            actions.forEach(actionString => {
                const parts = actionString.split(/\s+/); // Dividir por espacios
                let pickBanEntry = { team: null, action: null, map: null, fullString: actionString };

                if (parts.length >= 2) { // Necesita al menos 'ACCIÓN MAPA' o 'EQUIPO ACCIÓN MAPA'
                    if (parts[parts.length - 1].toLowerCase() === 'remains' && parts.length >= 2) {
                        // Formato: "MAPA remains"
                        pickBanEntry.map = parts.slice(0, -1).join(" "); // Todo antes de "remains" es el mapa
                        pickBanEntry.action = "remains";
                    } else if (parts[1].toLowerCase() === 'ban' || parts[1].toLowerCase() === 'pick') {
                        // Formato: "EQUIPO ACCIÓN MAPA"
                        pickBanEntry.team = parts[0];
                        pickBanEntry.action = parts[1].toLowerCase();
                        pickBanEntry.map = parts.slice(2).join(" "); // El resto es el nombre del mapa
                    } else if (parts[0].toLowerCase() === 'ban' || parts[0].toLowerCase() === 'pick') {
                        // Podría haber un caso raro sin equipo explícito (aunque no en tu ejemplo)
                        // Formato: "ACCIÓN MAPA" - menos probable para picks/bans asignados
                        pickBanEntry.action = parts[0].toLowerCase();
                        pickBanEntry.map = parts.slice(1).join(" ");
                         console.warn(`[resultadosService] Pick/Ban sin equipo explícito: "${actionString}"`);
                    } else {
                        console.warn(`[resultadosService] No se pudo parsear la acción de pick/ban: "${actionString}"`);
                        // Guardar la cadena original si no se puede parsear
                        pickBanEntry.action = "unknown";
                        pickBanEntry.map = actionString; // Guardar toda la cadena como mapa en este caso de error
                    }
                } else {
                     console.warn(`[resultadosService] Parte de pick/ban demasiado corta para parsear: "${actionString}"`);
                     pickBanEntry.action = "unknown_short";
                     pickBanEntry.map = actionString;
                }
                matchData.generalInfo.picksAndBans.push(pickBanEntry);
            });
             console.log(`[resultadosService] Picks/Bans procesados:`, JSON.stringify(matchData.generalInfo.picksAndBans, null, 2));
        } else {
            console.warn("[resultadosService] No se encontró el texto de picks y bans.");
        }
        
        matchData.generalInfo.matchFormat = $(".match-header-vs-note").first().text().trim() || "Formato no especificado";
        console.log(`[resultadosService] Formato de partido extraído: ${matchData.generalInfo.matchFormat}`);

        
        matchData.generalInfo.team1.name = $('.match-header-link.mod-1 .wf-title-med').first().text().trim() || "Equipo 1 no encontrado";
        matchData.generalInfo.team2.name = $('.match-header-link.mod-2 .wf-title-med').first().text().trim() || "Equipo 2 no encontrado";
        console.log(`[resultadosService] Equipo 1: ${matchData.generalInfo.team1.name}, Equipo 2: ${matchData.generalInfo.team2.name}`);

        const scoreSpans = $('.match-header-vs-score .js-spoiler span')
                            .filter((i, el) => $(el).text().trim() !== ':' && !isNaN(parseInt($(el).text().trim())));
        if (scoreSpans.length === 2) {
            matchData.generalInfo.team1.score = parseInt($(scoreSpans[0]).text().trim(), 10);
            matchData.generalInfo.team2.score = parseInt($(scoreSpans[1]).text().trim(), 10);
            console.log(`[resultadosService] Marcadores: ${matchData.generalInfo.team1.name} ${matchData.generalInfo.team1.score} - ${matchData.generalInfo.team2.name} ${matchData.generalInfo.team2.score}`);
        } else {
            console.warn(`[resultadosService] No se pudieron extraer los marcadores generales.`);
            matchData.generalInfo.team1.score = 0; // O algún valor por defecto
            matchData.generalInfo.team2.score = 0;
        }

        // ---- EXTRACCIÓN DE STATS OVERVIEW PARA "ALL MAPS" (de la página Overview principal) ----
        // VLR.gg usualmente tiene una tabla de overview para "All Maps" si hay más de un mapa.
        // Esta tabla está dentro de un <div class="vm-stats-game" data-game-id="all">
        const allMapsOverviewTableContainer = $('div.vm-stats-game[data-game-id="all"]');
        if (allMapsOverviewTableContainer.length > 0) {
            const allMapsActualTable = allMapsOverviewTableContainer.find('table.wf-table-inset.mod-overview');
            if (allMapsActualTable.length > 0) {
                matchData.statsAllMaps.overview = scrapeOverview($, allMapsActualTable, "overview_all_maps"); // Pasa '$' y la tabla
            } else {
                console.warn("[scrapeMatchDetails] No se encontró la tabla 'mod-overview' dentro del contenedor 'data-game-id=all' de Overview.");
            }
        } else {
            // Si no hay un div "data-game-id='all'", quizás la primera tabla es la general.
            // Esto es menos común para overview si hay varios mapas.
            const firstOverviewTable = $('table.wf-table-inset.mod-overview').first();
        if (firstOverviewTable.length > 0) {
                 matchData.statsAllMaps.overview = scrapeOverview(firstOverviewTable, "overview_all_maps_fallback");
        } else {
        console.warn("[scrapeMatchDetails] No se encontró el contenedor 'data-game-id=all' ni una tabla de overview general clara para 'All Maps' en la página Overview.");
        }
        }
        
        // ---- PROCESAMIENTO DE MAPAS INDIVIDUALES (de la página Overview principal) ----
        $(".vm-stats-game").each((mapIndexInDOM, mapElement) => { // Cambié mapIndex a mapIndexInDOM para claridad
    const mapContext = $(mapElement);
    const gameId = mapContext.attr('data-game-id');

    if (!gameId || gameId === 'all') {
        console.log(`[scrapeMatchDetails] Saltando contenedor general (game-id: '${gameId || 'undefined'}') en el bucle de mapas individuales.`);
        return; // Saltar el contenedor 'all' o cualquier otro sin gameId
    }

    const mapNameRaw = mapContext.find(".vm-stats-game-header .map div[style*='font-weight: 700']").text().trim();
    let currentMapName = mapNameRaw.replace(/\s+PICK$/, "").trim();

    const scoreTeam1Text = mapContext.find(".score").eq(0).text().trim();
    const scoreTeam2Text = mapContext.find(".score").eq(1).text().trim();
    const roundsPlayedCount = mapContext.find(".vlr-rounds .vlr-rounds-row-col").length;
    let isPlayed = true;

    if (!currentMapName) {
        isPlayed = false;
        currentMapName = `Mapa No Identificado (Índice DOM: ${mapIndexInDOM}, gameId: ${gameId})`;
    } else if (scoreTeam1Text === '0' && scoreTeam2Text === '0' && roundsPlayedCount === 0 && !mapContext.find(".vlr-rounds").length) {
        isPlayed = false;
    }
    
    const duration = mapContext.find(".map-duration").text().trim();
    // Es mejor obtener los nombres de los equipos del mapa directamente si están disponibles,
    // o usar los generales como fallback.
    const mapTeam1Name = mapContext.find(".team-name").eq(0).text().trim() || matchData.generalInfo.team1.name;
    const mapTeam2Name = mapContext.find(".team-name").eq(1).text().trim() || matchData.generalInfo.team2.name;

    const rounds = [];
    if (isPlayed) {
        mapContext.find(".vlr-rounds .vlr-rounds-row-col").each((j, roundEl) => {
            const roundElement = $(roundEl);
            const team1Sq = roundElement.find(".rnd-sq").eq(0);
            const team2Sq = roundElement.find(".rnd-sq").eq(1);
            const team1Win = team1Sq.hasClass("mod-win");
            const team2Win = team2Sq.hasClass("mod-win");
            const roundNumberText = roundElement.find(".rnd-num").text().trim();
            const roundNumber = parseInt(roundNumberText, 10);

            // Solo procesar si el número de ronda es válido
            if (isNaN(roundNumber) || roundNumber <= 0 || (!team1Win && !team2Win)) {
                // console.warn(`[scrapeMatchDetails] Ronda con número inválido '${roundNumberText}' saltada para mapa ${currentMapName}`);
                return; // Saltar esta iteración si no hay número de ronda válido
            }

            let winningTeamName = null;
            let outcomeDetail = null;
            let winMethodIcon = null;
            if (team1Win) {
                winningTeamName = mapTeam1Name; // Usar mapTeam1Name
                winMethodIcon = team1Sq.find("img").attr("src");
                if (team1Sq.hasClass("mod-ct")) outcomeDetail = "ct-win";
                else if (team1Sq.hasClass("mod-t")) outcomeDetail = "t-win";
            } else if (team2Win) {
                winningTeamName = mapTeam2Name; // Usar mapTeam2Name
                winMethodIcon = team2Sq.find("img").attr("src");
                if (team2Sq.hasClass("mod-ct")) outcomeDetail = "ct-win";
                else if (team2Sq.hasClass("mod-t")) outcomeDetail = "t-win";
            }
            rounds.push({
                roundNumber,
                winningTeamName: winningTeamName, // Puede ser null si la ronda no tiene ganador claro (raro para rondas jugadas)
                outcomeDetail: outcomeDetail,
                winMethodIcon: winMethodIcon || "no-icon-found", // Un valor por defecto más claro
            });
        });
        // Ordenar rondas después de extraerlas todas para este mapa
        rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    }

    let overviewStatsForThisMap = [];
    if (isPlayed) {
        const overviewTablesForThisMap = mapContext.find('table.wf-table-inset.mod-overview'); // Encuentra AMBAS tablas
        
        if (overviewTablesForThisMap.length > 0) {
            console.log(`[scrapeMatchDetails] Encontradas ${overviewTablesForThisMap.length} tablas de overview para el mapa ${currentMapName} (gameId: ${gameId})`);
            overviewTablesForThisMap.each((idx, tableEl) => {
                const singleTableCheerio = $(tableEl);
                const playersFromSingleTable = scrapeOverview($, singleTableCheerio, `overview_map_${gameId}_table_${idx + 1}`);
                overviewStatsForThisMap = overviewStatsForThisMap.concat(playersFromSingleTable);
            });
            console.log(`[scrapeMatchDetails] Total de jugadores de overview para mapa ${currentMapName} (gameId: ${gameId}): ${overviewStatsForThisMap.length}`);
        } else {
            console.log(`[scrapeMatchDetails] No se encontró(aron) tabla(s) de overview para el mapa ${currentMapName} (gameId: ${gameId})`);
        }
    }
    
    // Crear el objeto del mapa
    const mapObject = {
        mapName: currentMapName,
        gameId: gameId,
        duration: duration,
        teams: [
            { name: mapTeam1Name, score: parseInt(scoreTeam1Text, 10) || 0 },
            { name: mapTeam2Name, score: parseInt(scoreTeam2Text, 10) || 0 }
        ],
        played: isPlayed,
        statsPerMap: {
            overview: overviewStatsForThisMap,
            performance: {}, // Se llenará después
            economy: {}    // Se llenará después
        },
        rounds: rounds
    };
    matchData.maps.push(mapObject);
});
        //console.log("[scrapeMatchDetails] Contenido de matchData.maps después de procesar Overview.html:", JSON.stringify(matchData.maps, null, 2)); // Log detallado
        
        const mapNavOrderInfo = [];
        $('div.vm-stats-gamesnav-item.js-map-switch').not('.mod-all').not('.mod-disabled').each((idx, navEl) => {
            const navItem = $(navEl);
            const gameId = navItem.attr('data-game-id');
            const mapNumberText = navItem.find('div[style*="margin-bottom: 2px"] > span[style*="font-weight: 400"]').first().text().trim();
            if (gameId && mapNumberText) {
                mapNavOrderInfo.push({
                    gameId: gameId,
                    order: parseInt(mapNumberText, 10)
                });
            }
        });

        if (mapNavOrderInfo.length > 0) {
        matchData.maps.sort((a, b) => {
            const orderA = mapNavOrderInfo.find(info => info.gameId === a.gameId)?.order || 99;
            const orderB = mapNavOrderInfo.find(info => info.gameId === b.gameId)?.order || 99;
            return orderA - orderB;
        });
        console.log("[scrapeMatchDetails] Mapas ordenados según la navegación.");
    }
        // ======== LLAMADAS A PARSEO DE PERFORMANCE Y ECONOMY (A implementar/revisar después) ========
      let $performancePage = null; // Instancia de Cheerio para la página de performance
if (performanceFullUrl) {
    try {
        console.log(`[scrapeMatchDetails] Obteniendo HTML de Performance desde: ${performanceFullUrl}`);
        const perfHtmlContent = await rp(performanceFullUrl);
        $performancePage = cheerio.load(perfHtmlContent);
        console.log(`[scrapeMatchDetails] HTML de Performance obtenido y cargado.`);
    } catch (err) {
        console.error(`[scrapeMatchDetails] Error al obtener la página de Performance: ${err.message}`);
    }
}

let $economyPage = null; // Instancia de Cheerio para la página de economy
if (economyFullUrl) {
    try {
        console.log(`[scrapeMatchDetails] Obteniendo HTML de Economy desde: ${economyFullUrl}`);
        const econHtmlContent = await rp(economyFullUrl);
        $economyPage = cheerio.load(econHtmlContent);
        console.log(`[scrapeMatchDetails] HTML de Economy obtenido y cargado.`);
    } catch (err) {
        console.error(`[scrapeMatchDetails] Error al obtener la página de Economy: ${err.message}`);
    }
}

    // Ahora usa $performancePage y $economyPage
    if ($performancePage && typeof parsePerformancePage === 'function') {
        console.log("[scrapeMatchDetails] Procesando datos de Performance...");
        const performanceOverallData = parsePerformancePage($performancePage, matchData.maps, matchData.generalInfo.team1.name, matchData.generalInfo.team2.name); // Asegúrate que parsePerformancePage puede usar los nombres de equipo si los necesita para el contexto global
        if (performanceOverallData && performanceOverallData.overall) {
            matchData.statsAllMaps.performance = performanceOverallData.overall;
        }
        // parsePerformancePage debería modificar matchData.maps[i].statsPerMap.performance directamente
    } else {
        console.log("[scrapeMatchDetails] No hay datos de la página de Performance para procesar ($performancePage es null o la función no existe).");
        matchData.statsAllMaps.performance = { message: "Performance data not loaded or parser not available." }; // Placeholder
    }

    if ($economyPage && typeof parseEconomyPage === 'function') {
        console.log("[scrapeMatchDetails] Procesando datos de Economy...");
        const economyOverallData = parseEconomyPage($economyPage, matchData.maps, matchData.generalInfo.team1.name, matchData.generalInfo.team2.name);
        if (economyOverallData && economyOverallData.overall) {
            matchData.statsAllMaps.economy = economyOverallData.overall;
        }
        // parseEconomyPage debería modificar matchData.maps[i].statsPerMap.economy o matchData.maps[i].rounds
    } else {
        console.log("[scrapeMatchDetails] No hay datos de la página de Economy para procesar ($economyPage es null o la función no existe).");
        matchData.statsAllMaps.economy = { message: "Economy data not loaded or parser not available." }; // Placeholder
    }

    return matchData;

    } catch(error) {
        console.error("Error al extraer datos del partido:", error.message); 
    }
} // Fin de scrapeMatchDetails
// --- INICIO: Función auxiliar para parsear UNA SOLA tabla de matriz de duelos ---
function parseSingleDuelMatrixTable(tableCheerioElement, pageCheerioInstance) {
    const singleMatrixData = [];
    const columnPlayers = [];

    // Extraer Jugadores de las Columnas
    tableCheerioElement.find('tr').first().find('td').slice(1).each((colIndex, tdElement) => {
        const playerCell = pageCheerioInstance(tdElement);
        const teamDiv = playerCell.find('div.team');
        const playerName = teamDiv.children('div').eq(0).contents().filter(function() {
            return this.type === 'text';
        }).text().trim();
        const teamTag = teamDiv.find('div.team-tag').text().trim();
        if (playerName) {
            columnPlayers.push({ name: playerName, team: teamTag });
        }
    });

    // Iterar Filas de Datos
    tableCheerioElement.find('tr').slice(1).each((rowIndex, trElement) => {
        const rowTds = pageCheerioInstance(trElement).find('td');
        const rowPlayerCell = rowTds.first();
        const rowTeamDiv = rowPlayerCell.find('div.team');
        const rowPlayerName = rowTeamDiv.children('div').eq(0).contents().filter(function() {
            return this.type === 'text';
        }).text().trim();
        const rowPlayerTeamTag = rowTeamDiv.find('div.team-tag').text().trim();

        if (!rowPlayerName) return;

        rowTds.slice(1).each((colIndex, duelCellElement) => {
            if (colIndex < columnPlayers.length) {
                const currentColumnPlayer = columnPlayers[colIndex];
                const duelStatsDivs = pageCheerioInstance(duelCellElement).find('div.stats-sq');

                if (duelStatsDivs.length === 3) {
                    const killsText = duelStatsDivs.eq(0).text().trim();
                    const deathsText = duelStatsDivs.eq(1).text().trim();
                    const balanceText = duelStatsDivs.eq(2).text().trim();

                if (killsText !== '-' || deathsText !== '-' || balanceText !== '-'){
                    singleMatrixData.push({
                        player_row: { name: rowPlayerName, team: rowPlayerTeamTag },
                        player_col: { name: currentColumnPlayer.name, team: currentColumnPlayer.team },
                        row_player_kills_col_player: killsText === '-' ? null : parseInt(killsText, 10),
                        col_player_kills_row_player: deathsText === '-' ? null : parseInt(deathsText, 10),
                        balance: balanceText === '-' ? null : parseInt(balanceText.replace('+', ''), 10)
                    });
                }
                }
            }
        });
    });
    return singleMatrixData;
}
// --- FIN: Función auxiliar ---

// --- INICIO: Función auxiliar para parsear UNA SOLA tabla de stats avanzadas ---
function parseSingleAdvStatsTable(advStatsTableCheerio, pageCheerioInstance) {
    const advancedPlayerStatsList = [];
    // Saltamos la primera fila de encabezados (tr con th)
    advStatsTableCheerio.find('tr').slice(1).each((rowIndex, trElement) => {
        const playerCells = pageCheerioInstance(trElement).find('td');
        const playerData = {};

        // Celda 0: Información del Jugador
        const playerInfoDiv = pageCheerioInstance(playerCells.eq(0)).find('div.team');
        playerData.playerName = playerInfoDiv.children('div').eq(0).contents().filter(function() {
            return this.type === 'text';
        }).text().trim();
        playerData.teamTag = playerInfoDiv.find('div.team-tag').text().trim();

        // Función auxiliar interna para obtener valor numérico
        const getStat = (cellIndex) => {
            const text = pageCheerioInstance(playerCells.eq(cellIndex)).find('div.stats-sq').text().trim();
            return text === '' || text === '-' ? 0 : parseInt(text, 10); // Considera '-' como 0 también
        };

        // Multikills (índices de celda 2 al 5)
        playerData.multikills = {
            "2K": getStat(2), "3K": getStat(3), "4K": getStat(4), "5K": getStat(5)
        };
        // Clutches (índices de celda 6 al 10)
        playerData.clutches = {
            "1v1": getStat(6), "1v2": getStat(7), "1v3": getStat(8), "1v4": getStat(9), "1v5": getStat(10)
        };
        
        if (playerData.playerName) {
            advancedPlayerStatsList.push(playerData);
        }
    });
    return advancedPlayerStatsList;
}
// --- FIN: Función auxiliar ---
function parsePerformancePage($performancePageInstance, mapsArray, team1NameGlobal, team2NameGlobal) { // mapsArray es matchData.maps
    console.log("Parseando página de Performance...");
    
    const overallPerformanceResult = {
        general_duel_matrix: [],
        first_kill_duel_matrix: [],
        operator_duel_matrix: [],
        advanced_player_stats: [] 
    };

    // 1. PROCESAR SECCIÓN DE ESTADÍSTICAS GENERALES (data-game-id="all")
    const overallStatsContainer = $performancePageInstance('div.vm-stats-game[data-game-id="all"]');
    if (overallStatsContainer.length > 0) {
        console.log("Procesando estadísticas generales de Performance (game=all)...");
        const overallDuelMatrixTables = overallStatsContainer.find('table.wf-table-inset.mod-matrix');
        if (overallDuelMatrixTables.length >= 1) {
            overallPerformanceResult.general_duel_matrix = parseSingleDuelMatrixTable(overallDuelMatrixTables.eq(0), $performancePageInstance);
        }
        if (overallDuelMatrixTables.length >= 2) {
            overallPerformanceResult.first_kill_duel_matrix = parseSingleDuelMatrixTable(overallDuelMatrixTables.eq(1), $performancePageInstance);
        }
        if (overallDuelMatrixTables.length >= 3) {
            overallPerformanceResult.operator_duel_matrix = parseSingleDuelMatrixTable(overallDuelMatrixTables.eq(2), $performancePageInstance);
        }

        const overallAdvStatsTable = overallStatsContainer.find('table.wf-table-inset.mod-adv-stats');
        if (overallAdvStatsTable.length > 0) {
            overallPerformanceResult.advanced_player_stats = parseSingleAdvStatsTable(overallAdvStatsTable, $performancePageInstance);
        }
    } else {
        console.log("Contenedor de estadísticas generales (vm-stats-game[data-game-id='all']) no encontrado en la página de Performance.");
    }

    // 2. PROCESAR SECCIONES DE ESTADÍSTICAS POR MAPA (data-game-id != 'all')
    console.log("Buscando secciones de estadísticas por mapa en la página de Performance...");
    console.log(`[parsePerformancePage] Longitud de mapsArray (matchData.maps): ${mapsArray.length}`);

    $performancePageInstance("div.vm-stats-game[data-game-id][data-game-id!='all']").each((indexInPerformanceDOM, mapElement) => {
        const mapContainerPerformance = $performancePageInstance(mapElement); // Contexto para este mapa en la página de Performance
        const gameId = mapContainerPerformance.attr('data-game-id');
        
        // Encontrar el mapa correspondiente en mapsArray (que es matchData.maps, ya ordenado)
        const targetMap = mapsArray.find(map => map.gameId === gameId);
        
        console.log(`[parsePerformancePage] Procesando gameId ${gameId} de la página de Performance (índice en DOM de Performance: ${indexInPerformanceDOM}).`);

        if (targetMap) {
            if (!targetMap.played) { // Usar targetMap.played que se determinó en scrapeMatchDetails
                console.log(`[parsePerformancePage] Saltando mapa no jugado (según Overview): ${targetMap.mapName} (gameId: ${gameId})`);
                return; // Saltar al siguiente mapa en la página de Performance
            }

            const currentMapName = targetMap.mapName; // Nombre del mapa de matchData.maps
            const mapIndexInMatchData = mapsArray.indexOf(targetMap); // Índice correcto en tu array principal de mapas

            console.log(`Procesando estadísticas de Performance para el mapa: ${currentMapName} (game-id: ${gameId}, índice en mapsArray: ${mapIndexInMatchData})`);
    
            // Asegúrate que targetMap.statsPerMap.performance exista si vas a asignar propiedades
            if (!targetMap.statsPerMap) { targetMap.statsPerMap = {}; } // Inicializar si es necesario
            if (!targetMap.statsPerMap.performance) { targetMap.statsPerMap.performance = {}; } // Inicializar para performance

            // Modificar directamente targetMap.statsPerMap.performance (que es una referencia al objeto en matchData.maps)
            targetMap.statsPerMap.performance.general_duel_matrix = [];
            targetMap.statsPerMap.performance.first_kill_duel_matrix = [];
            targetMap.statsPerMap.performance.operator_duel_matrix = [];
            targetMap.statsPerMap.performance.advanced_player_stats = [];

            // Matrices de Duelos para ESTE MAPA (dentro de mapContainerPerformance)
            const mapDuelMatrixTables = mapContainerPerformance.find('table.wf-table-inset.mod-matrix');
            if (mapDuelMatrixTables.length >= 1) {
                targetMap.statsPerMap.performance.general_duel_matrix = parseSingleDuelMatrixTable(mapDuelMatrixTables.eq(0), $performancePageInstance);
            }
            if (mapDuelMatrixTables.length >= 2) {
                targetMap.statsPerMap.performance.first_kill_duel_matrix = parseSingleDuelMatrixTable(mapDuelMatrixTables.eq(1), $performancePageInstance);
            }
            if (mapDuelMatrixTables.length >= 3) {
                targetMap.statsPerMap.performance.operator_duel_matrix = parseSingleDuelMatrixTable(mapDuelMatrixTables.eq(2), $performancePageInstance);
            }

            // Tabla de Estadísticas Avanzadas para ESTE MAPA (dentro de mapContainerPerformance)
            const mapAdvStatsTable = mapContainerPerformance.find('table.wf-table-inset.mod-adv-stats');
            if (mapAdvStatsTable.length > 0) {
                targetMap.statsPerMap.performance.advanced_player_stats = parseSingleAdvStatsTable(mapAdvStatsTable, $performancePageInstance);
            }
            console.log(`Datos de Performance procesados y añadidos para el mapa: ${currentMapName}`);

        } else {
            console.warn(`[parsePerformancePage] No se encontró mapa correspondiente en mapsArray (matchData.maps) para gameId: ${gameId} (nombre del mapa en perf. page si disponible: ${mapContainerPerformance.find('.vm-stats-game-header .map div').first().text().trim()}).`);
        }
    });

    return { overall: overallPerformanceResult }; // Devuelve solo los datos generales de "all maps"
}

function fuzzyMatchTeamName(canonicalNameLower, tagFromTableLower) {
    if (!canonicalNameLower || !tagFromTableLower) return false;

    // 1. Coincidencia exacta (por si acaso el tag es el nombre completo o viceversa)
    if (canonicalNameLower === tagFromTableLower) return true;

    // 2. El nombre canónico CONTIENE el tag de la tabla
    //    Ej: canonical="team heretics", tag="heretics" -> true
    //    Ej: canonical="bbl esports", tag="bbl" -> true
    if (canonicalNameLower.includes(tagFromTableLower)) return true;

    // 3. El nombre canónico EMPIEZA con el tag de la tabla (útil para tags cortos como "th")
    //    Ej: canonical="team heretics", tag="t" -> true (si es solo una letra, puede ser ambiguo)
    //    Ej: canonical="team heretics", tag="th" -> true
    //    Asegurarse que el tag no sea demasiado largo para ser un prefijo simple.
    if (tagFromTableLower.length <= 4 && canonicalNameLower.startsWith(tagFromTableLower)) return true;
    
    // 4. Comparar las primeras N palabras o caracteres si el tag es una abreviatura.
    //    Ej: canonical="Team Liquid", tag="tl"
    const canonicalWords = canonicalNameLower.split(/\s+/);
    const tagChars = tagFromTableLower.split('');

    if (tagChars.length === canonicalWords.length && tagChars.length > 1) { // ej: "tl" y "Team Liquid" (2 chars, 2 words)
        let initialsMatch = true;
        for (let i = 0; i < tagChars.length; i++) {
            if (!canonicalWords[i].startsWith(tagChars[i])) {
                initialsMatch = false;
                break;
            }
        }
        if (initialsMatch) return true;
    }
    
    // 5. (Opcional) Casos muy específicos o un pequeño diccionario de mapeo si es necesario
    // if (tagFromTableLower === "th" && canonicalNameLower.includes("heretics")) return true;
    // if (tagFromTableLower === "fpx" && canonicalNameLower.includes("funplus phoenix")) return true;
    // Esto podría crecer y volverse difícil de mantener.

    return false;
    }
// --- INICIO: Funciones Auxiliares para Parseo de Economía ---

function parseEcoSummaryTable(tableCheerio, pageCheerioInstance) {
    const summary = [];
    // Saltamos la fila de encabezado (asumiendo que la primera <tr> son <th>)
    tableCheerio.find('tr').slice(1).each((index, rowElement) => {
        const cells = pageCheerioInstance(rowElement).find('td');
        const teamData = {};

        // Celda 0: Nombre del Equipo
        teamData.teamName = pageCheerioInstance(cells.eq(0)).find('div.team').text().trim();
        if (!teamData.teamName) return; // Si no hay nombre de equipo, saltar

        // Función para parsear "N (M)" o solo "N"
        const parseStatVal = (cell) => {
            const text = pageCheerioInstance(cell).find('div.stats-sq').text().trim();
            const match = text.match(/(\d+)(?:\s*\((\d+)\))?/); // Busca "N" o "N (M)"
            if (match) {
                return {
                    total: parseInt(match[1], 10),
                    won: match[2] ? parseInt(match[2], 10) : null // El valor entre paréntesis
                };
            }
            return { total: 0, detail: null };
        };
        
        // Columnas según tu descripción: Pistol, Eco, $, $$, $$$
        teamData.pistol_won = parseStatVal(cells.eq(1));      // Pistol Won
        teamData.eco_rounds_played = parseStatVal(cells.eq(2));  // Eco (won)
        teamData.light_buy_played = parseStatVal(cells.eq(3));   // $ (won)
        teamData.half_buy_played = parseStatVal(cells.eq(4));    // $$ (won)
        teamData.full_buy_played = parseStatVal(cells.eq(5));    // $$$ (won)
        
        summary.push(teamData);
    });
    return summary;
}

function parseEcoRoundDetailsTable(tableCheerio, pageCheerioInstance, mapRoundsArrayToUpdate, equipo1NombreCanonico, equipo2NombreCanonico, nombreDelMapaActual) {
    console.log(`[parseEcoRoundDetailsTable] Iniciando para mapa: ${nombreDelMapaActual}, Equipo1 Canónico: ${equipo1NombreCanonico}, Equipo2 Canónico: ${equipo2NombreCanonico}`);

    // Obtener los nombres de los equipos TAL COMO APARECEN EN LAS FILAS DE LA TABLA DE ECONOMÍA
    // Asumimos que la estructura con múltiples div.team en la primera celda es consistente
    // para las filas que agrupan los datos de las rondas.
    let teamNameInTable1 = null;
    let teamNameInTable2 = null;

    // Buscar la primera celda (td) de una fila (tr) que contenga los identificadores de equipo
    const firstTeamLabelCell = tableCheerio.find('tr td:first-child:has(div.team)').first();

    if (firstTeamLabelCell.length) {
        const teamDivs = firstTeamLabelCell.find('div.team');
        if (teamDivs.length >= 2) {
            teamNameInTable1 = pageCheerioInstance(teamDivs.eq(0)).text().replace(/\s+/g, ' ').trim().toLowerCase(); // Nombre del equipo que aparece ARRIBA en las celdas de ronda
            teamNameInTable2 = pageCheerioInstance(teamDivs.eq(1)).text().replace(/\s+/g, ' ').trim().toLowerCase(); // Nombre del equipo que aparece ABAJO
            console.log(`[parseEcoRoundDetailsTable] Nombres de equipo en tabla eco: '${teamNameInTable1}' (arriba) y '${teamNameInTable2}' (abajo)`);
        }
    }

    if (!teamNameInTable1 || !teamNameInTable2) {
        console.error(`[parseEcoRoundDetailsTable] Mapa ${nombreDelMapaActual}: No se pudieron extraer los nombres de los equipos de las filas de la tabla de economía. No se pueden procesar los bancos.`);
        return;
    }
    
    function mapBuySymbolToType(symbol) {
        const s = symbol.trim();
        if (s === '$$$') return "Full Buy";
        if (s === '$$') return "Semi Buy"; // Corregido de "Semi-buy" a "Semi Buy" para consistencia
        if (s === '$') return "Semi Eco"; // Corregido de "Semi-eco" a "Semi Eco"
        if (s === '' || s === '_') return "Eco Buy"; // Considerar string vacío o '_' como Eco
        // Para rondas de pistola, usualmente se identifican por el número de ronda (1 y 13)
        // VLR puede no poner un símbolo específico de 'pistol' aquí, sino que podría ser 'Eco' o vacío.
        // Dejaremos que la lógica de número de ronda maneje la etiqueta "Pistol Round" si es necesario más adelante.
        return "Unknown Buy"; // Fallback
    }

    // Iterar sobre todas las filas <tr> de la tabla
    tableCheerio.find('tr').each((rowIndex, rowElement) => {
        const row = pageCheerioInstance(rowElement);
        // Iterar sobre las celdas <td> de datos de ronda en esta fila
        // Excluimos la primera celda si es la que tiene los nombres de los equipos
        row.find('td').slice(1).each((cellIndex, cellElement) => {
            const roundCell = pageCheerioInstance(cellElement);
            const roundNumText = roundCell.find('.round-num').first().text().trim();
            const roundNum = parseInt(roundNumText, 10);

            if (isNaN(roundNum) || roundNum <= 0) {
                // No es una celda de ronda válida
                return; // Saltar esta celda
            }

            // Extraer los tipos de compra
            const buySquares = roundCell.find('.rnd-sq');
            let buyTypeSymbolTeam1 = ""; // Para el equipo de ARRIBA en la celda
            let buyTypeSymbolTeam2 = ""; // Para el equipo de ABAJO en la celda

            if (buySquares.length >= 1) {
                buyTypeSymbolTeam1 = pageCheerioInstance(buySquares.eq(0)).text().trim();
            }
            if (buySquares.length >= 2) {
                buyTypeSymbolTeam2 = pageCheerioInstance(buySquares.eq(1)).text().trim();
            }

            // Mapear símbolos a tipos de compra legibles
            let buyTypeTeam1 = mapBuySymbolToType(buyTypeSymbolTeam1);
            let buyTypeTeam2 = mapBuySymbolToType(buyTypeSymbolTeam2);

            // Lógica especial para rondas de pistola
            if (roundNum === 1 || roundNum === 13) { // Asumiendo 12 rondas por mitad
                buyTypeTeam1 = "Pistol Round";
                buyTypeTeam2 = "Pistol Round";
            }
            
            console.log(`[parseEcoRoundDetailsTable] Mapa ${nombreDelMapaActual}, Ronda ${roundNum}: Símbolos Buy T1='${buyTypeSymbolTeam1}', T2='${buyTypeSymbolTeam2}' -> Tipos T1='${buyTypeTeam1}', T2='${buyTypeTeam2}'`);

            const targetRound = mapRoundsArrayToUpdate.find(r => r.roundNumber === roundNum);
            if (targetRound) {
                // Ya no necesitamos 'bank', así que no se definen claves para ello.
                // En su lugar, añadimos los tipos de compra.
                const keyTeam1BuyType = `${equipo1NombreCanonico.replace(/\s+/g, '')}BuyType`;
                const keyTeam2BuyType = `${equipo2NombreCanonico.replace(/\s+/g, '')}BuyType`;

                const cName1Lower = equipo1NombreCanonico.toLowerCase();
                const cName2Lower = equipo2NombreCanonico.toLowerCase();
                
                // Usar los nombres de equipo extraídos de las ETIQUETAS de la tabla de economía para el matching de orden
                // Si no se pudieron extraer, teamNameInTable1/2 serán null y el matching podría fallar o ser menos preciso.
                const tagArribaLower = teamNameInTable1; 
                const tagAbajoLower = teamNameInTable2;

                let assigned = false;

                if (tagArribaLower && tagAbajoLower) { // Solo intentar el matching si tenemos los tags de la tabla
                    console.log(`[parseEcoRoundDetailsTable] Ronda ${roundNum} - Intentando Coincidencia para tipo de compra:`);
                    console.log(`  Nombres Canónicos: E1='${cName1Lower}', E2='${cName2Lower}'`);
                    console.log(`  Tags de Tabla Eco: Arriba='${tagArribaLower}', Abajo='${tagAbajoLower}'`);

                    if (fuzzyMatchTeamName(cName1Lower, tagArribaLower) && fuzzyMatchTeamName(cName2Lower, tagAbajoLower)) {
                        targetRound[keyTeam1BuyType] = buyTypeTeam1;
                        targetRound[keyTeam2BuyType] = buyTypeTeam2;
                        assigned = true;
                        console.log(`[parseEcoRoundDetailsTable] Mapa ${nombreDelMapaActual}, R${roundNum}: Tipos de Compra asignados (A). ${equipo1NombreCanonico}(${tagArribaLower})=${buyTypeTeam1}, ${equipo2NombreCanonico}(${tagAbajoLower})=${buyTypeTeam2}`);
                    } else if (fuzzyMatchTeamName(cName2Lower, tagArribaLower) && fuzzyMatchTeamName(cName1Lower, tagAbajoLower)) {
                        targetRound[keyTeam2BuyType] = buyTypeTeam1; // El tipo de compra del equipo de ARRIBA va al equipo 2 canónico
                        targetRound[keyTeam1BuyType] = buyTypeTeam2; // El tipo de compra del equipo de ABAJO va al equipo 1 canónico
                        assigned = true;
                        console.log(`[parseEcoRoundDetailsTable] Mapa ${nombreDelMapaActual}, R${roundNum}: Tipos de Compra asignados (B - Invertido). ${equipo2NombreCanonico}(${tagArribaLower})=${buyTypeTeam1}, ${equipo1NombreCanonico}(${tagAbajoLower})=${buyTypeTeam2}`);
                    }
                }


                if (!assigned) {
                    console.warn(`[parseEcoRoundDetailsTable] Mapa ${nombreDelMapaActual}, Ronda ${roundNum}: ADVERTENCIA - No se pudo hacer coincidir par de tags de tabla eco ('${tagArribaLower}', '${tagAbajoLower}') con par de nombres canónicos ('${cName1Lower}', '${cName2Lower}') para tipo de compra. Asignando con nombres genéricos si los tags existen.`);
                    // Como fallback, si los tags de la tabla existen pero no coinciden, guardarlos con esos tags
                    if (tagArribaLower) {
                        targetRound[`${tagArribaLower.replace(/\s+/g, '')}BuyType_FromEcoTable`] = buyTypeTeam1;
                    } else {
                         targetRound[`UnknownTeamUpBuyType_FromEcoTable`] = buyTypeTeam1; // Si ni el tag se pudo leer
                    }
                    if (tagAbajoLower) {
                        targetRound[`${tagAbajoLower.replace(/\s+/g, '')}BuyType_FromEcoTable`] = buyTypeTeam2;
                    } else {
                        targetRound[`UnknownTeamDownBuyType_FromEcoTable`] = buyTypeTeam2;
                    }
                    // Si incluso los tags de la tabla (teamNameInTable1/2) no se pudieron obtener,
                    // esta asignación de fallback será con "nullBuyType_FromEcoTable", lo cual no es ideal.
                    // Se podría considerar no añadir nada si el matching falla completamente.
                }
            } else {
                console.warn(`[parseEcoRoundDetailsTable] Mapa ${nombreDelMapaActual}: No se encontró la ronda ${roundNum} en mapRoundsArrayToUpdate (proveniente de Overview). Datos económicos (tipo de compra) para esta ronda no se integrarán.`);
            }
        });
    });
    console.log(`[parseEcoRoundDetailsTable] Finalizado para mapa: ${nombreDelMapaActual}`);
}
// --- FIN: Funciones Auxiliares ---
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
// Función principal para extraer los detalles del partido

module.exports = { scrapeMatchDetails /*, scrapeOverview si la exportas también */ };