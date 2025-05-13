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
    console.log(`[parsePerformancePage] Longitud de mapsArray: ${mapsArray.length}`);

    performancePageHtml("div.vm-stats-game[data-game-id][data-game-id!='all']").each((index, mapElement) => {
        console.log(`[parsePerformancePage] Índice actual del mapa: ${index}`);
        const mapContainer = performancePageHtml(mapElement); // Contenedor del mapa actual
        const gameId = mapContainer.attr('data-game-id'); // Útil para depurar

        // --- LÓGICA DE CORRELACIÓN USANDO EL ORDEN/ÍNDICE ---
        if (index < mapsArray.length) {
            const targetMap = mapsArray[index]; // Obtenemos el mapa de nuestro array por su índice
            if (!targetMap.played && targetMap.MapName.includes("No Jugado")) { // O simplemente if(!targetMap.name) si el nombre es la clave
                console.log(`[parsePerformancePage] Valor de targetMap en índice ${index}:`, targetMap);
                console.log(`[parseEconomyPage/parsePerformancePage] Saltando mapa no jugado: ${targetMap.currentMapName}`);
                return; // Saltar al siguiente mapa
            }
            const currentMapName = targetMap.currentMapName;  // Usamos el nombre que YA TENEMOS de la pestaña Overview

            console.log(`Procesando estadísticas de Performance para el mapa: ${currentMapName} (game-id: ${gameId}, índice en array: ${index})`);

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
            console.log(`Datos de Performance procesados y añadidos para el mapa: ${currentMapName}`);

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

function parseEcoRoundDetailsTable(tableCheerio, pageCheerioInstance, mapRoundsArrayToUpdate, equipo1NombreCanonico, equipo2NombreCanonico) {
    if (typeof equipo1NombreCanonico !== 'string' || typeof equipo2NombreCanonico !== 'string') {
        console.error("[parseEcoRoundDetailsTable] Error: Nombres de equipo canónicos no son strings o no proporcionados.");
        console.error(`equipo1NombreCanonico: ${equipo1NombreCanonico} (tipo: ${typeof equipo1NombreCanonico}), equipo2NombreCanonico: ${equipo2NombreCanonico} (tipo: ${typeof equipo2NombreCanonico})`);
        return;
    }

    const currentMapTeam1Name = equipo1NombreCanonico;
    const currentMapTeam2Name = equipo2NombreCanonico;

    const cleanTeam1Key = currentMapTeam1Name.replace(/\s+/g, '').toLowerCase();
    const cleanTeam2Key = currentMapTeam2Name.replace(/\s+/g, '').toLowerCase();

    const dataRows = tableCheerio.find('tr').filter((i, rowEl) => {
        return pageCheerioInstance(rowEl).find('td:first-child div.team').length > 0;
    });

    if (dataRows.length < 2) {
        console.error(`[parseEcoRoundDetailsTable] No se encontraron suficientes filas de datos de equipo (esperaba 2, encontré ${dataRows.length}).`);
        // console.log("HTML de la tabla de economía que se está parseando:", tableCheerio.html()); // Descomenta para depurar
        return;
    }

    const team1Row = pageCheerioInstance(dataRows.eq(0));
    const team2Row = pageCheerioInstance(dataRows.eq(1));

    const roundNumberHeaders = [];
    tableCheerio.find('tr').first().find('th, td').slice(1).each((idx, cellEl) => {
        const roundNumText = pageCheerioInstance(cellEl).text().trim();
        const roundNum = parseInt(roundNumText, 10);
        if (!isNaN(roundNum)) {
            roundNumberHeaders.push(roundNum);
        }
    });

    if (roundNumberHeaders.length === 0) {
        console.error("[parseEcoRoundDetailsTable] No se pudieron extraer los números de ronda de la cabecera de la tabla de economía.");
        return;
    }

    const parseBankValue = (bankText) => {
        if (!bankText) return 0;
        const text = bankText.toLowerCase().trim(); // Añadido trim() aquí también
        let value;
        if (text.includes('k')) {
            value = parseFloat(text.replace('k', '')) * 1000;
        } else {
            // Quitar cualquier cosa que no sea dígito o punto decimal para el caso de "2,000" o "2.000"
            // Pero vlr.gg usa "2k" o "2000", no comas.
            const cleanedText = text.replace(/[^0-9.]/g, '');
            value = parseFloat(cleanedText);
        }
        return isNaN(value) ? 0 : Math.round(value); // Redondear por si acaso (ej. 8.2k -> 8200)
    };

    roundNumberHeaders.forEach((roundNum, roundIndexInHeader) => {
        const dataCellIndex = roundIndexInHeader + 1;

        const team1RoundCellElement = team1Row.find('td').eq(dataCellIndex);
        const team2RoundCellElement = team2Row.find('td').eq(dataCellIndex);

        if (!team1RoundCellElement.length || !team2RoundCellElement.length) {
            console.warn(`[parseEcoRoundDetailsTable] No se encontró celda de datos para la ronda ${roundNum} (índice de cabecera ${roundIndexInHeader}, dataCellIndex ${dataCellIndex})`);
            return; 
        }

        const team1RoundCell = pageCheerioInstance(team1RoundCellElement);
        const team2RoundCell = pageCheerioInstance(team2RoundCellElement);

        const team1BankText = team1RoundCell.find('div.bank').text(); // .trim() se hace en parseBankValue
        const team2BankText = team2RoundCell.find('div.bank').text(); // .trim() se hace en parseBankValue
        
        console.log(`Ronda ${roundNum} del mapa ${currentMapName}:`); // Añade currentMapName aquí para diferenciar los logs por mapa
        console.log(`  Team1 (arriba en tabla eco): Texto Banco="${team1BankText.trim()}", Parsed=${parseBankValue(team1BankText)}`);
        console.log(`  Team2 (abajo en tabla eco): Texto Banco="${team2BankText.trim()}", Parsed=${parseBankValue(team2BankText)}`);

        const team1Bank = parseBankValue(team1BankText);
        const team2Bank = parseBankValue(team2BankText);
        
        // --- DEBUG LOG ---
        console.log(`Ronda ${roundNum}: Team1 Bank Text: "${team1BankText}", Parsed: ${team1Bank} | Team2 Bank Text: "${team2BankText}", Parsed: ${team2Bank}`);
        // --- FIN DEBUG LOG ---

        const team1BuySq = team1RoundCell.find('div.rnd-sq');
        const team2BuySq = team2RoundCell.find('div.rnd-sq');

        let winningTeamNameCanonical = null;
        let resultForJSON = null;
        let methodIcon = team1BuySq.find('img').attr('src') || team2BuySq.find('img').attr('src') || '';


        if (team1BuySq.hasClass('mod-win')) {
            winningTeamNameCanonical = currentMapTeam1Name;
            methodIcon = team1BuySq.find('img').attr('src') || methodIcon;
            if (team1BuySq.hasClass('mod-ct')) resultForJSON = 'ct-win';
            else if (team1BuySq.hasClass('mod-t')) resultForJSON = 't-win';
        } else if (team2BuySq.hasClass('mod-win')) {
            winningTeamNameCanonical = currentMapTeam2Name;
            methodIcon = team2BuySq.find('img').attr('src') || methodIcon;
            if (team2BuySq.hasClass('mod-ct')) resultForJSON = 'ct-win';
            else if (team2BuySq.hasClass('mod-t')) resultForJSON = 't-win';
        }

        if (methodIcon && methodIcon.includes('/')) {
            methodIcon = methodIcon.substring(methodIcon.lastIndexOf('/') + 1);
        }

        const targetRound = mapRoundsArrayToUpdate.find(r => r.roundNumber === roundNum);

        if (targetRound) {
            // ... (asignación de winner, result, method como antes) ...
        
            const nameFromTeam1RowHTML = team1Row.find('td:first-child div.team').text().replace(/\s+/g, ' ').trim().toLowerCase();
            const nameFromTeam2RowHTML = team2Row.find('td:first-child div.team').text().replace(/\s+/g, ' ').trim().toLowerCase();
        
            const canonTeam1Lower = equipo1NombreCanonico.toLowerCase();
            const canonTeam2Lower = equipo2NombreCanonico.toLowerCase();
        
            // Generar claves limpias para los nombres canónicos
            const keyForCanonTeam1 = canonTeam1Lower.replace(/\s+/g, '') + 'Bank';
            const keyForCanonTeam2 = canonTeam2Lower.replace(/\s+/g, '') + 'Bank';
        
            // Comprobar a quién pertenece team1Bank (extraído de team1Row)
            if (nameFromTeam1RowHTML.includes(canonTeam1Lower.substring(0, Math.min(3, canonTeam1Lower.length))) || canonTeam1Lower.includes(nameFromTeam1RowHTML.substring(0, Math.min(3, nameFromTeam1RowHTML.length)))) {
                targetRound[keyForCanonTeam1] = team1Bank;
                targetRound[keyForCanonTeam2] = team2Bank; // Asumimos que team2Row es el otro equipo
            } else if (nameFromTeam1RowHTML.includes(canonTeam2Lower.substring(0, Math.min(3, canonTeam2Lower.length))) || canonTeam2Lower.includes(nameFromTeam1RowHTML.substring(0, Math.min(3, nameFromTeam1RowHTML.length)))) {
                targetRound[keyForCanonTeam2] = team1Bank; // team1Row era en realidad equipo2NombreCanonico
                targetRound[keyForCanonTeam1] = team2Bank; // team2Row era en realidad equipo1NombreCanonico
            } else {
                console.warn(`[parseEcoRoundDetailsTable] Mapa ${currentMapName}, Ronda ${roundNum}: No se pudo hacer coincidir nombre de tabla eco "${nameFromTeam1RowHTML}" con nombres canónicos. Usando asignación por defecto.`);
                // Asignación por defecto (podría ser incorrecta si el orden de la tabla no coincide con tu team1/team2 global)
                targetRound[keyForCanonTeam1] = team1Bank;
                targetRound[keyForCanonTeam2] = team2Bank;
            }
            // --- DEBUG LOG para la asignación ---
            // console.log(`Ronda ${roundNum} Mapa ${currentMapName} - Asignación de bancos: ${keyForCanonTeam1}=${targetRound[keyForCanonTeam1]}, ${keyForCanonTeam2}=${targetRound[keyForCanonTeam2]}`);
        
        } else {
            console.warn(`[parseEcoRoundDetailsTable] Mapa ${currentMapName}: No se encontró la ronda ${roundNum} en mapRoundsArrayToUpdate. Datos económicos para esta ronda no se guardarán.`);
        }
    });
}
// --- FIN: Funciones Auxiliares ---
function parseEconomyPage(economyPageHtml, mapsArray,team1Name, team2Name){
    console.log("Parseando página de Economy...");
    console.log(`[parseEconomyPage] Recibido team1NameGlobal: "${team1Name}", Tipo: ${typeof team1Name}`);
    console.log(`[parseEconomyPage] Recibido team2NameGlobal: "${team2Name}", Tipo: ${typeof team2Name}`);
    
    
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
        // En la sección de data-game-id="all"
        if (econTables.length >= 2) {
            console.log("Procesando tabla de detalles de economía por ronda general...");
            overallEconomyResult.round_details = parseEcoRoundDetailsTable(
                econTables.eq(1),
                economyPageHtml,
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
    economyPageHtml("div.vm-stats-game[data-game-id][data-game-id!='all']").each((index, mapElement) => {
        const mapContainer = economyPageHtml(mapElement);
        const gameId = mapContainer.attr('data-game-id');
        const targetMap = mapsArray[index]; // Asumiendo que index < mapsArray.length
        if (!targetMap.played && targetMap.currentMapName.includes("No Jugado")) { // O simplemente if(!targetMap.name) si el nombre es la clave
            console.log(`[parseEconomyPage/parsePerformancePage] Saltando mapa no jugado: ${targetMap.currentMapName}`);
            return; // Saltar al siguiente mapa
        }
        const currentMapName = targetMap ? targetMap.currentMapName : "NombreDesconocido";
    
        console.log(`[parseEconomyPage] Procesando sección de mapa: ${currentMapName} (gameId: ${gameId})`); // Log ANTES de definir mapEconTables
    
        const mapEconTables = mapContainer.find('table.wf-table-inset.mod-econ'); // mapEconTables DEFINIDO AQUÍ
        
        if (!targetMap) {
            console.warn(`[parseEconomyPage] No se encontró targetMap para el índice ${index}`);
            return; // Saltar esta iteración
        }
        // Dentro del .each de los mapas en parseEconomyPage
        console.log(`[parseEconomyPage] Pasando a parseEcoRoundDetailsTable para mapa ${currentMapName}. team1Name: "${team1Name}", team2Name: "${team2Name}"`);
        if (index < mapsArray.length) {
            const targetMap = mapsArray[index]; 
            if (!targetMap.played && targetMap.currentMapName.includes("No Jugado")) { // O simplemente if(!targetMap.name) si el nombre es la clave
                console.log(`[parseEconomyPage/parsePerformancePage] Saltando mapa no jugado: ${targetMap.currentMapName}`);
                return; // Saltar al siguiente mapa
            }
            const currentMapName = targetMap.currentMapName;  

            console.log(`Procesando estadísticas de Economy para el mapa: ${currentMapName} (game-id: ${gameId}, índice: ${index})`);

            targetMap.economy_data = {
                summary: [],
                // round_details se añadirán directamente al array targetMap.rounds existente
            };

            const mapEconTables = mapContainer.find('table.wf-table-inset.mod-econ');
            if (mapEconTables.length >= 1) {
                targetMap.economy_data.summary = parseEcoSummaryTable(mapEconTables.eq(0), economyPageHtml);
            }
            if (mapEconTables.length >= 2) {
                console.log(`[parseEconomyPage] Pasando a parseEcoRoundDetailsTable para mapa <span class="math-inline">\{currentMapName\}\. team1NameGlobal\: "</span>{team1NameGlobal}", team2NameGlobal: "${team2Name}"`);
                parseEcoRoundDetailsTable(mapEconTables.eq(1), economyPageHtml, targetMap.rounds, team1Name, team2Name);
            } else {
                console.log(`[parseEconomyPage] No se encontró la segunda tabla de economía para el mapa ${currentMapName}`);
            }}
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
                performancePageHtml = await rp({
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
                economyPageHtml = await rp({
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
       // Dentro de scrapeMatchDetails
// ...
        $(".vm-stats-game").each((mapIndex, mapElement) => {
            const mapContext = $(mapElement);
            const gameId = mapContext.attr('data-game-id'); // Útil para logs

            // Extraer nombre del mapa
            const mapNameRaw = mapContext.find(".map div[style*='font-weight: 700']").text().trim();
            let currentMapName = mapNameRaw.replace(/\s+PICK$/, "").trim(); // 'current' para evitar conflicto si tienes otra var 'mapName'

            // Extraer marcadores para determinar si se jugó
            const scoreTeam1Text = mapContext.find(".score").eq(0).text().trim();
            const scoreTeam2Text = mapContext.find(".score").eq(1).text().trim();
            const roundsPlayedCount = mapContext.find(".vlr-rounds .vlr-rounds-row-col").length;

            let isPlayed = true; // Asumir que se jugó por defecto

            if (!currentMapName || currentMapName.trim() === '') {
                isPlayed = false;
                currentMapName = `Mapa No Identificado ${mapIndex + 1}`; // Nombre placeholder
                console.log(`[scrapeMatchDetails] Mapa en índice ${mapIndex} (game-id: ${gameId}) no tiene nombre, marcado como no jugado.`);
            } else if (scoreTeam1Text === '0' && scoreTeam2Text === '0' && roundsPlayedCount === 0) {
                // Si el marcador es 0-0 Y no hay rondas listadas, probablemente no se jugó.
                // vlr.gg a veces muestra mapas "elegidos pero no jugados" así.
                // O si la sección del mapa está presente pero vacía de detalles de rondas.
                console.log(`[scrapeMatchDetails] Mapa "${currentMapName}" (game-id: ${gameId}) parece no jugado (0-0 y sin rondas).`);
                isPlayed = false; // Puedes decidir si quieres marcarlo como no jugado o no,
                                // ya que tu lógica de parseo de economía ya maneja bien la ausencia de datos.
                                // Si lo marcas como 'false', puedes usarlo para saltar el parseo de performance/economy.
            }

            

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
            if (isPlayed) {
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
            }
            // Agregar la información del mapa y las rondas al matchData
            matchData.maps.push({
                mapName:currentMapName,// mapName ya podría tener "Mapa No Jugado X"
                duration: duration,
                teams: teams,
                rounds: rounds, // Estará vacío si isPlayed es false y no extraes rondas
                played: isPlayed // Propiedad 'played'
            });
  
        });

        // ======== INICIO: LLAMADAS A LAS NUEVAS FUNCIONES DE PARSEO Y ACTUALIZACIÓN DE matchData ========
        if (performancePageHtml) {
            const performanceData = parsePerformancePage(performancePageHtml, matchData.maps);
            matchData.performance_general = performanceData.overall;
            // parsePerformancePage actualiza matchData.maps por referencia
        }

        if (economyPageHtml) {
            console.log(`[scrapeMatchDetails] Antes de llamar a parseEconomyPage:`);
            console.log(`  matchData.maps (tipo): ${typeof matchData.maps}, ¿es array?: ${Array.isArray(matchData.maps)}`);
            console.log(`  team1Name (valor): "${team1Name}", (tipo): ${typeof team1Name}`);
            console.log(`  team2Name (valor): "${team2Name}", (tipo): ${typeof team2Name}`);
        
            const econData = parseEconomyPage(economyPageHtml, matchData.maps, team1Name, team2Name);
            matchData.economy_general = econData.overall;
        }

        return matchData;
    } catch(error) {
        console.error("Error al extraer datos del partido:", error);
    }
}
module.exports = { scrapeMatchDetails /*, scrapeOverview si la exportas también */ };