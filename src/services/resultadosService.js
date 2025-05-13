const rp = require("request-promise");
const cheerio = require("cheerio");
const vlrgg_url = "https://www.vlr.gg"; // Base URL correcta

// Función para extraer los datos de Overview
function scrapeOverview(html, map = "general") {
    const overviewData = [];
    html(".wf-table-inset.mod-overview tbody tr").each((_, el) => {
        const playerRow = html(el); // Convertir a jQuery

        // Extraer información del jugador y su equipo
        const playerName = playerRow.find(".mod-player .text-of").text().trim() || "Jugador no especificado";
        const teamName = playerRow.find(".mod-player .ge-text-light").text().trim() || "Equipo no especificado";

        // Extraer el agente (atributo "title" del <img>)
        const agent = playerRow.find(".mod-agents img").attr("title") || "Agente no especificado";

        // Extraer estadísticas
        const stats = {
            rating: {
                both: playerRow.find(".mod-stat").eq(0).find(".mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(0).find(".mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(0).find(".mod-side.mod-ct").text().trim() || "0",
            },
            acs: {
                both: playerRow.find(".mod-stat").eq(1).find(".mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(1).find(".mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(1).find(".mod-side.mod-ct").text().trim() || "0",
            },
            kills: {
                both: playerRow.find(".mod-vlr-kills .mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-vlr-kills .mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-vlr-kills .mod-side.mod-ct").text().trim() || "0",
            },
            deaths: {
                both: playerRow.find(".mod-vlr-deaths .mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-vlr-deaths .mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-vlr-deaths .mod-ct").text().trim() || "0",
            },
            assists: {
                both: playerRow.find(".mod-stat").eq(2).find(".mod-side.mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(2).find(".mod-side.mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(2).find(".mod-side.mod-ct").text().trim() || "0",
            },
            KillsDeaths: {
                both: playerRow.find(".mod-kd-diff .mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-kd-diff .mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-kd-diff .mod-ct").text().trim() || "0",
            },
            kast: {
                both: playerRow.find(".mod-stat").eq(4).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(4).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(4).find(".mod-ct").text().trim() || "0%",
            },
            adr: {
                both: playerRow.find(".mod-stat").eq(5).find(".mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(5).find(".mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(5).find(".mod-ct").text().trim() || "0",
            },
            hs: {
                both: playerRow.find(".mod-stat").eq(6).find(".mod-both").text().trim() || "0%",
                attack: playerRow.find(".mod-stat").eq(6).find(".mod-t").text().trim() || "0%",
                defend: playerRow.find(".mod-stat").eq(6).find(".mod-ct").text().trim() || "0%",
            },
            fk: {
                both: playerRow.find(".mod-stat").eq(7).find(".mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(7).find(".mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(7).find(".mod-ct").text().trim() || "0",
            },
            fd: {
                both: playerRow.find(".mod-stat").eq(8).find(".mod-both").text().trim() || "0",
                attack: playerRow.find(".mod-stat").eq(8).find(".mod-t").text().trim() || "0",
                defend: playerRow.find(".mod-stat").eq(8).find(".mod-ct").text().trim() || "0",
            },
        };

        // Agregar los datos del jugador al array de resultados
        overviewData.push({
            playerName,
            teamName,
            agent,
            stats,
        });
    });

    return overviewData;
}

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

                    singleMatrixData.push({
                        player_row: { name: rowPlayerName, team: rowPlayerTeamTag },
                        player_col: { name: currentColumnPlayer.name, team: currentColumnPlayer.team },
                        row_player_kills_col_player: killsText === '-' ? null : parseInt(killsText, 10),
                        col_player_kills_row_player: deathsText === '-' ? null : parseInt(deathsText, 10),
                        balance: balanceText === '-' ? null : parseInt(balanceText.replace('+', ''), 10)
                    });
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
        // Plants y Defuses (índices de celda 12 y 13)
        playerData.plants = getStat(12);
        playerData.defuses = getStat(13);
        
        if (playerData.playerName) {
            advancedPlayerStatsList.push(playerData);
        }
    });
    return advancedPlayerStatsList;
}
// --- FIN: Función auxiliar ---
function parsePerformancePage(performancePageHtml, mapsArray) { // mapsArray es matchData.maps
    console.log("Parseando página de Performance...");
    
    const overallPerformanceResult = { // Para las estadísticas generales del partido
        general_duel_matrix: [],
        first_kill_duel_matrix: [],
        operator_duel_matrix: [],
        advanced_player_stats: [] 
    };

    // 1. PROCESAR SECCIÓN DE ESTADÍSTICAS GENERALES (data-game-id="all")
    const overallStatsContainer = performancePageHtml('div.vm-stats-game[data-game-id="all"]');
    if (overallStatsContainer.length > 0) {
        console.log("Procesando estadísticas generales de Performance (game=all)...");
        const overallDuelMatrixTables = overallStatsContainer.find('table.wf-table-inset.mod-matrix');
        if (overallDuelMatrixTables.length >= 1) {
            overallPerformanceResult.general_duel_matrix = parseSingleDuelMatrixTable(overallDuelMatrixTables.eq(0), performancePageHtml);
        }
        if (overallDuelMatrixTables.length >= 2) {
            overallPerformanceResult.first_kill_duel_matrix = parseSingleDuelMatrixTable(overallDuelMatrixTables.eq(1), performancePageHtml);
        }
        if (overallDuelMatrixTables.length >= 3) {
            overallPerformanceResult.operator_duel_matrix = parseSingleDuelMatrixTable(overallDuelMatrixTables.eq(2), performancePageHtml);
        }

        const overallAdvStatsTable = overallStatsContainer.find('table.wf-table-inset.mod-adv-stats');
        if (overallAdvStatsTable.length > 0) {
            overallPerformanceResult.advanced_player_stats = parseSingleAdvStatsTable(overallAdvStatsTable, performancePageHtml);
        }
    } else {
        console.log("Contenedor de estadísticas generales (vm-stats-game[data-game-id='all']) no encontrado en la página de Performance.");
    }

    // 2. PROCESAR SECCIONES DE ESTADÍSTICAS POR MAPA (data-game-id != 'all')
    console.log("Buscando secciones de estadísticas por mapa en la página de Performance...");
    performancePageHtml("div.vm-stats-game[data-game-id][data-game-id!='all']").each((index, mapElement) => {
        const mapContainer = performancePageHtml(mapElement); // Contenedor del mapa actual
        const gameId = mapContainer.attr('data-game-id'); // Útil para depurar

        // --- LÓGICA DE CORRELACIÓN USANDO EL ORDEN/ÍNDICE ---
        if (index < mapsArray.length) {
            const targetMap = mapsArray[index]; // Obtenemos el mapa de nuestro array por su índice
            const mapName = targetMap.mapName;  // Usamos el nombre que YA TENEMOS de la pestaña Overview

            console.log(`Procesando estadísticas de Performance para el mapa: ${mapName} (game-id: ${gameId}, índice en array: ${index})`);

            // Preparamos el objeto para los datos de performance de este mapa
            targetMap.performance_data = {
                general_duel_matrix: [],
                first_kill_duel_matrix: [],
                operator_duel_matrix: [],
                advanced_player_stats: []
            };

            // Matrices de Duelos para ESTE MAPA (dentro de mapContainer)
            const mapDuelMatrixTables = mapContainer.find('table.wf-table-inset.mod-matrix');
            if (mapDuelMatrixTables.length >= 1) {
                targetMap.performance_data.general_duel_matrix = parseSingleDuelMatrixTable(mapDuelMatrixTables.eq(0), performancePageHtml);
            }
            if (mapDuelMatrixTables.length >= 2) {
                targetMap.performance_data.first_kill_duel_matrix = parseSingleDuelMatrixTable(mapDuelMatrixTables.eq(1), performancePageHtml);
            }
            if (mapDuelMatrixTables.length >= 3) {
                targetMap.performance_data.operator_duel_matrix = parseSingleDuelMatrixTable(mapDuelMatrixTables.eq(2), performancePageHtml);
            }

            // Tabla de Estadísticas Avanzadas para ESTE MAPA (dentro de mapContainer)
            const mapAdvStatsTable = mapContainer.find('table.wf-table-inset.mod-adv-stats');
            if (mapAdvStatsTable.length > 0) {
                targetMap.performance_data.advanced_player_stats = parseSingleAdvStatsTable(mapAdvStatsTable, performancePageHtml);
            }
            console.log(`Datos de Performance procesados y añadidos para el mapa: ${mapName}`);

        } else {
            // Esto ocurriría si hay más bloques de mapa en la página de Performance
            // que los que se identificaron en la página de Overview. Es poco común.
            console.log(`Se encontró un bloque de mapa (${gameId}) en pág. Performance (índice ${index}) sin correspondencia en mapsArray (tamaño ${mapsArray.length}).`);
        }
    });

    return { overall: overallPerformanceResult };
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
                    detail: match[2] ? parseInt(match[2], 10) : null // El valor entre paréntesis
                };
            }
            return { total: 0, detail: null };
        };
        
        // Columnas según tu descripción: Pistol, Eco, $, $$, $$$
        teamData.pistol_won = parseStatVal(cells.eq(1));      // Pistol Won
        teamData.eco_rounds_won = parseStatVal(cells.eq(2));  // Eco (won)
        teamData.light_buy_won = parseStatVal(cells.eq(3));   // $ (won)
        teamData.half_buy_won = parseStatVal(cells.eq(4));    // $$ (won)
        teamData.full_buy_won = parseStatVal(cells.eq(5));    // $$$ (won)
        
        summary.push(teamData);
    });
    return summary;
}

function parseEcoRoundDetailsTable(tableCheerio, pageCheerioInstance, mapRoundsArrayToUpdate) {
    // mapRoundsArrayToUpdate es el array targetMap.rounds que ya tiene info de ganador/lado
    const roundEcoDetails = []; // O actualizamos mapRoundsArrayToUpdate directamente

    // Primero, extraemos los nombres de los equipos del primer <td>
    const headerTd = tableCheerio.find('tr').first().find('td').first();
    const teamNames = [];
    headerTd.find('div.team').each((i, teamEl) => {
        teamNames.push(pageCheerioInstance(teamEl).text().trim());
    });
    // Asumimos teamNames[0] es el equipo de arriba, teamNames[1] el de abajo.

    if (teamNames.length < 2) {
        console.log("No se pudieron extraer los nombres de equipo de la tabla de detalles de economía por ronda.");
        return roundEcoDetails; // O un array vacío si no se actualiza directamente
    }

    // Iteramos sobre las columnas de rondas (todas las <td> excepto la primera)
    tableCheerio.find('tr').first().find('td').slice(1).each((index, roundCellElement) => {
        const roundCell = pageCheerioInstance(roundCellElement);
        const roundNumText = roundCell.find('.ge-text-light.round-num').text().trim();
        const roundNum = parseInt(roundNumText, 10);

        const banks = [];
        roundCell.find('div.bank').each((i, bankEl) => {
            banks.push(pageCheerioInstance(bankEl).text().trim());
        });

        const buySqElements = roundCell.find('div.rnd-sq');
        const team1BuyIcon = buySqElements.eq(0).text().trim(); // Compra del equipo de arriba
        const team2BuyIcon = buySqElements.eq(1).text().trim(); // Compra del equipo de abajo
        
        let winningSide = null;
        let winningBuyIcon = null;

        if (buySqElements.eq(0).hasClass('mod-win')) { // Equipo 1 (arriba) ganó
            winningBuyIcon = team1BuyIcon;
            if (buySqElements.eq(0).hasClass('mod-ct')) winningSide = 'ct';
            else if (buySqElements.eq(0).hasClass('mod-t')) winningSide = 't';
        } else if (buySqElements.eq(1).hasClass('mod-win')) { // Equipo 2 (abajo) ganó
            winningBuyIcon = team2BuyIcon;
            if (buySqElements.eq(1).hasClass('mod-ct')) winningSide = 'ct';
            else if (buySqElements.eq(1).hasClass('mod-t')) winningSide = 't';
        }
        
        const currentRoundEco = {
            roundNumber: roundNum,
            team1_name: teamNames[0], // Equipo de arriba
            team1_bank_start: banks.length > 0 ? banks[0] : "N/A",
            team1_buy_type: team1BuyIcon,
            team2_name: teamNames[1], // Equipo de abajo
            team2_bank_start: banks.length > 1 ? banks[1] : "N/A", // El segundo div.bank en la celda de ronda
            team2_buy_type: team2BuyIcon,
            round_winner_side_from_econ_tab: winningSide, // Lado ganador según esta tabla
            round_winner_buy_type: winningBuyIcon // Compra del lado ganador
        };

        // Actualizar el array de rondas del mapa existente
        if (mapRoundsArrayToUpdate && roundNum > 0 && roundNum <= mapRoundsArrayToUpdate.length) {
            const targetRound = mapRoundsArrayToUpdate[roundNum - 1]; // -1 porque los arrays son base 0
            if (targetRound && targetRound.roundNumber === roundNum) {
                targetRound.economy = currentRoundEco; // Añade el objeto de economía a la ronda
            } else {
                 // Esto podría pasar si los números de ronda no coinciden perfectamente
                console.log(`Discrepancia de ronda al añadir economía: ${roundNum} vs ${targetRound?.roundNumber}`);
                roundEcoDetails.push(currentRoundEco); // Guardar por separado si no se puede fusionar
            }
        } else {
            roundEcoDetails.push(currentRoundEco); // Guardar por separado si no hay array de rondas para actualizar
        }
    });
    // Si no actualizamos mapRoundsArrayToUpdate directamente, devolvemos roundEcoDetails
    // Si lo actualizamos, esta función podría no necesitar devolver nada o solo un status.
    // Por ahora, la función modifica mapRoundsArrayToUpdate y también devolvemos por si acaso.
    return roundEcoDetails; 
}

// --- FIN: Funciones Auxiliares ---
function parseEconomyPage(economyPageHtml, mapsArray) { // mapsArray es matchData.maps
    console.log("Parseando página de Economy...");
    
    const overallEconomyResult = { // Para las estadísticas generales del partido
        summary: [], // Para la primera tabla .mod-econ
        round_details: [] // Para la segunda tabla .mod-econ (detalles ronda a ronda)
    };

    // 1. PROCESAR SECCIÓN DE ESTADÍSTICAS GENERALES (data-game-id="all")
    const overallStatsContainer = economyPageHtml('div.vm-stats-game[data-game-id="all"]');
    if (overallStatsContainer.length > 0) {
        console.log("Procesando estadísticas generales de Economy (game=all)...");
        const econTables = overallStatsContainer.find('table.wf-table-inset.mod-econ');
        
        if (econTables.length >= 1) {
            console.log("Procesando tabla de resumen de economía general...");
            overallEconomyResult.summary = parseEcoSummaryTable(econTables.eq(0), economyPageHtml);
        }
        if (econTables.length >= 2) {
            console.log("Procesando tabla de detalles de economía por ronda general...");
            // Para la tabla general, no tenemos un mapRoundsArrayToUpdate preexistente, así que recogerá los datos.
            overallEconomyResult.round_details = parseEcoRoundDetailsTable(econTables.eq(1), economyPageHtml, null); 
        }
    } else {
        console.log("Contenedor de estadísticas generales (vm-stats-game[data-game-id='all']) no encontrado en la página de Economy.");
    }

    // 2. PROCESAR SECCIONES DE ESTADÍSTICAS POR MAPA (data-game-id != 'all')
    console.log("Buscando secciones de estadísticas de economía por mapa...");
    economyPageHtml("div.vm-stats-game[data-game-id][data-game-id!='all']").each((index, mapElement) => {
        const mapContainer = economyPageHtml(mapElement); 
        const gameId = mapContainer.attr('data-game-id');

        if (index < mapsArray.length) {
            const targetMap = mapsArray[index]; 
            const mapName = targetMap.mapName;  

            console.log(`Procesando estadísticas de Economy para el mapa: ${mapName} (game-id: ${gameId}, índice: ${index})`);

            targetMap.economy_data = {
                summary: [],
                // round_details se añadirán directamente al array targetMap.rounds existente
            };

            const mapEconTables = mapContainer.find('table.wf-table-inset.mod-econ');
            if (mapEconTables.length >= 1) {
                targetMap.economy_data.summary = parseEcoSummaryTable(mapEconTables.eq(0), economyPageHtml);
            }
            if (mapEconTables.length >= 2) {
                // Pasamos targetMap.rounds para que se actualice con los detalles económicos
                parseEcoRoundDetailsTable(mapEconTables.eq(1), economyPageHtml, targetMap.rounds);
            }
            console.log(`Datos de Economy procesados y añadidos para el mapa: ${mapName}`);
        } else {
            console.log(`Se encontró un bloque de mapa de economía (${gameId}) en pág. Economy (índice ${index}) sin correspondencia en mapsArray.`);
        }
    });

    return { overall: overallEconomyResult }; // Devuelve las estadísticas generales
                                            // mapsArray (matchData.maps) se actualiza por referencia
}
// Función principal para extraer los detalles del partido
const scrapeMatchDetails = async (matchId) =>{
    const matchUrl = `${vlrgg_url}/${matchId}`;
    let htmlContent;

    try {
        console.log(`[resultadosService] Iniciando scraping para el partido: ${matchUrl}`);
        htmlContent = await rp(matchUrl); // 1. Obtener HTML
        console.log(`[resultadosService] HTML obtenido para ${matchId}.`);

        const $ = cheerio.load(htmlContent); // 2. Cargar HTML en Cheerio y definir '$'
        console.log(`[resultadosService] Cheerio cargado para ${matchId}.`);

        // --- INICIO DE TU LÓGICA PARA EXTRAER NOMBRES Y MARCADORES DE EQUIPOS ---
        // Ahora '$' está definido y listo para usarse.
        let team1Name = '';
        let team2Name = '';
        let team1Score = '';
        let team2Score = '';
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

        // ======== INICIO DE NUEVAS PETICIONES HTTP PARA PERFORMANCE Y ECONOMY ========
        let performancePageHtml = null;
        if (performanceFullUrl) {
            try {
                console.log(`Accediendo a URL de Performance: ${performanceFullUrl}`);
                performancePageHtml = await request({
                    uri: performanceFullUrl,
                    transform: (body) => cheerio.load(body),
                });
                console.log("Página de Performance cargada.");
            } catch (tabError) {
                console.error(`Error al cargar la página de Performance ${performanceFullUrl}:`, tabError.message);
            }
        }

        let economyPageHtml = null;
        if (economyFullUrl) {
            try {
                console.log(`Accediendo a URL de Economy: ${economyFullUrl}`);
                economyPageHtml = await request({
                    uri: economyFullUrl,
                    transform: (body) => cheerio.load(body),
                });
                console.log("Página de Economy cargada.");
            } catch (tabError) {
                console.error(`Error al cargar la página de Economy ${economyFullUrl}:`, tabError.message);
            }
        }
        
        const tournament = $(".match-header-event div[style='font-weight: 700;']").text().trim();
        const stage = $(".match-header-event-series").text().trim();
        const date = $(".match-header-date .moment-tz-convert[data-moment-format='dddd, MMMM Do']").text().trim();



        // Obtener nombres de los equipos
        team1Name = $('.match-header-link.mod-1 .wf-title-med').first().text().trim();
        team2Name = $('.match-header-link.mod-2 .wf-title-med').first().text().trim();

        console.log(`[resultadosService] Equipo 1: ${team1Name}, Equipo 2: ${team2Name}`);

        // Usamos la lógica robusta para los marcadores que discutimos
        const scoreSpans = $('.match-header-vs-score .js-spoiler span')
                            .filter((i, el) => $(el).text().trim() !== ':' && !isNaN(parseInt($(el).text().trim())));

        if (scoreSpans.length === 2) {
            team1Score = $(scoreSpans[0]).text().trim();
            team2Score = $(scoreSpans[1]).text().trim();
            console.log(`[resultadosService] Marcadores: ${team1Name} ${team1Score} - ${team2Name} ${team2Score}`);
        } else {
            console.error(`[resultadosService] Error al extraer marcadores para ${matchId}: No se encontraron los dos spans de marcador esperados. Spans encontrados: ${scoreSpans.length}`);
            // Es útil loguear lo que sí se encontró para depurar:
            // $('.match-header-vs-score .js-spoiler span').each((idx, element) => {
            //     console.log(`[resultadosService] Debug Score Span ${idx}: "${$(element).text().trim()}"`);
            // });
            team1Score = 'N/A'; // Valor por defecto o manejo de error
            team2Score = 'N/A';
        }
        
        const format = $(".match-header-vs-note").eq(1).text().trim();
        const mapPicksBans = $(".match-header-note").text().trim();
        
        const matchData = {
            matchId,
            tournament: tournament || "Torneo no especificado",
            stage: stage || "Etapa no especificada",
            date: date || "Fecha no especificada",
            teams: [
                { name: team1Name || "Equipo 1 no especificado", score: team1Score || "0" },
                { name: team2Name || "Equipo 2 no especificado", score: team2Score || "0" },
            ],
            format: format || "Formato no especificado",
            mapPicksBans: mapPicksBans || "Estadisticas de todos los mapas",
            overview_general: scrapeOverview($), // Overview general
            maps: [],
        };

        // Extraer mapas jugados y su información
        $(".vm-stats-game").each((_, el) => {
            const mapContext = $(el);

            const mapNameRaw = mapContext.find(".map div[style*='font-weight: 700']").text().trim();
            const mapName = mapNameRaw.replace(/\s+PICK$/, "").trim();
            const duration = mapContext.find(".map-duration").text().trim();

            const teams = [
                {
                    name: mapContext.find(".team-name").eq(0).text().trim() || "Equipo 1 no especificado",
                    score: mapContext.find(".score").eq(0).text().trim() || "0",
                },
                {
                    name: mapContext.find(".team-name").eq(1).text().trim() || "Equipo 2 no especificado",
                    score: mapContext.find(".score").eq(1).text().trim() || "0",
                },
            ];const rounds = [];
            mapContext.find(".vlr-rounds .vlr-rounds-row-col").each((j, roundEl) => {
                const roundElement = $(roundEl); // Es buena práctica guardar el elemento jQuery/Cheerio
                const team1Sq = roundElement.find(".rnd-sq").eq(0);
                const team2Sq = roundElement.find(".rnd-sq").eq(1);
                
                const team1Win = team1Sq.hasClass("mod-win");
                const team2Win = team2Sq.hasClass("mod-win");

                const roundNumber = parseInt($(roundEl).find(".rnd-num").text().trim(), 10) || j + 1;
        
                let winningTeam = null;
                let result = null;
                let method = null;
        
                if (team1Win) {
                    winningTeam = teams[0].name; // Asumes que teams[0] es el de la izquierda
                    method = team1Sq.find("img").attr("src");

                    if (team1Sq.hasClass("mod-ct")) {
                        result = "ct-win";
                    } else if (team1Sq.hasClass("mod-t"))
                        result = "t-win";
                } else if (team2Win) {
                    winningTeam = teams[1].name; // Asumes que teams[1] es el de la derecha
                    method = team2Sq.find("img").attr("src");

                    if (team2Sq.hasClass("mod-ct")) {
                        result = "ct-win";
                    } else if (team2Sq.hasClass("mod-t")) {
                        result = "t-win";
                    }
                }
        
                rounds.push({
                    roundNumber,
                    winner: winningTeam,
                    result: result,
                    method: method || "no-time",
                });
            });
        
            // Agregar la información del mapa y las rondas al matchData
            matchData.maps.push({ mapName, duration, teams, rounds });
        });

        // ======== INICIO: LLAMADAS A LAS NUEVAS FUNCIONES DE PARSEO Y ACTUALIZACIÓN DE matchData ========
        if (performancePageHtml) {
            const performanceData = parsePerformancePage(performancePageHtml, matchData.maps);
            matchData.performance_general = performanceData.overall;
            // parsePerformancePage actualiza matchData.maps por referencia
        }

        if (economyPageHtml) {
            const econData = parseEconomyPage(economyPageHtml, matchData.maps); // Llama a la nueva función
            matchData.economy_general = econData.overall; // Guarda los datos generales de economía
            // matchData.maps ya habrá sido actualizado por referencia por parseEconomyPage
        }

        return matchData;
    } catch (error) {
        console.error("Error al extraer datos del partido:", error);
    }
}
module.exports = { scrapeMatchDetails /*, scrapeOverview si la exportas también */ };