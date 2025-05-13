const request = require("request-promise");
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


function parsePerformancePage(performancePageHtml, mapsArray) {
    console.log("Parseando página de Performance...");
    
    // El objeto que esta función devuelve. Ya tiene las matrices de duelos.
    const overallPerformanceData = {
        general_duel_matrix: [],
        first_kill_duel_matrix: [],
        operator_duel_matrix: [],
        advanced_player_stats: [] // NUEVO: Array para las estadísticas avanzadas por jugador
    };

    const overallStatsContainer = performancePageHtml('div.vm-stats-game[data-game-id="all"]');

    if (overallStatsContainer.length > 0) {
        // --- LÓGICA EXISTENTE PARA MATRICES DE DUELOS ---
        const allDuelMatrixTables = overallStatsContainer.find('table.wf-table-inset.mod-matrix');
        console.log(`Se encontraron ${allDuelMatrixTables.length} tabla(s) de duelos en Performance (game=all).`);
        if (allDuelMatrixTables.length >= 1) {
            console.log("Procesando Matriz de Duelos Generales...");
            overallPerformanceData.general_duel_matrix = parseSingleDuelMatrixTable(performancePageHtml(allDuelMatrixTables.eq(0)), performancePageHtml);
        }
        if (allDuelMatrixTables.length >= 2) {
            console.log("Procesando Matriz de Duelos de First Kills...");
            overallPerformanceData.first_kill_duel_matrix = parseSingleDuelMatrixTable(performancePageHtml(allDuelMatrixTables.eq(1)), performancePageHtml);
        }
        if (allDuelMatrixTables.length >= 3) {
            console.log("Procesando Matriz de Duelos de Operator Kills...");
            overallPerformanceData.operator_duel_matrix = parseSingleDuelMatrixTable(performancePageHtml(allDuelMatrixTables.eq(2)), performancePageHtml);
        }
        // --- FIN DE LÓGICA EXISTENTE PARA MATRICES DE DUELOS ---


        // ========== INICIO: NUEVA LÓGICA PARA LA TABLA "mod-adv-stats" (Multikills, Clutches, etc.) ==========
        const advStatsTable = overallStatsContainer.find('table.wf-table-inset.mod-adv-stats');

        if (advStatsTable.length > 0) {
            console.log("Procesando tabla de estadísticas avanzadas (multikills, clutches)...");
            
            // Iteramos sobre cada fila de datos (<tr>), saltando la primera fila de encabezados (<th>)
            advStatsTable.find('tr').slice(1).each((rowIndex, trElement) => {
                const playerCells = performancePageHtml(trElement).find('td');
                const playerData = {};

                // Celda 0: Información del Jugador (nombre, equipo)
                const playerInfoDiv = performancePageHtml(playerCells.eq(0)).find('div.team');
                playerData.playerName = playerInfoDiv.children('div').eq(0).contents().filter(function() {
                    return this.type === 'text';
                }).text().trim();
                playerData.teamTag = playerInfoDiv.find('div.team-tag').text().trim();

                // Celda 1: Agente (lo extraemos por si acaso, pero no lo incluiremos en el JSON final según tu indicación)
                // const agentImgSrc = performancePageHtml(playerCells.eq(1)).find('div.stats-sq img').attr('src');
                // if (agentImgSrc) { /* ... lógica para parsear nombre del agente ... */ }

                // Función auxiliar para obtener el valor numérico de una celda de estadística
                const getStat = (cellIndex) => {
                    const text = performancePageHtml(playerCells.eq(cellIndex)).find('div.stats-sq').text().trim();
                    return text === '' ? 0 : parseInt(text, 10); // Si está vacío, es 0
                };

                // Extracción de estadísticas según el orden de las columnas:
                // 2K, 3K, 4K, 5K (índices de celda 2, 3, 4, 5)
                playerData.multikills = {
                    "2K": getStat(2),
                    "3K": getStat(3),
                    "4K": getStat(4),
                    "5K": getStat(5)
                };

                // 1v1, 1v2, 1v3, 1v4, 1v5 (índices de celda 6, 7, 8, 9, 10)
                playerData.clutches = {
                    "1v1": getStat(6),
                    "1v2": getStat(7),
                    "1v3": getStat(8),
                    "1v4": getStat(9),
                    "1v5": getStat(10)
                };
                
                // ECON (índice de celda 11) - Ignorado según tu indicación
                // const econRating = getStat(11);

                // PL (Plants) (índice de celda 12)
                playerData.plants = getStat(12);
                // DE (Defuses) (índice de celda 13)
                playerData.defuses = getStat(13);

                // Solo añadir si tenemos un nombre de jugador (para evitar filas vacías o malformadas)
                if (playerData.playerName) {
                    overallPerformanceData.advanced_player_stats.push(playerData);
                }
            });
        } else {
            console.log("Tabla 'mod-adv-stats' (multikills, clutches) no encontrada en game-id='all'.");
        }
        // ========== FIN: NUEVA LÓGICA PARA LA TABLA "mod-adv-stats" ==========

    } else {
        console.log("Contenedor vm-stats-game[data-game-id='all'] no encontrado en la página de Performance.");
    }

    // La parte de estadísticas de performance POR MAPA (si es distinta a estas matrices)
    // sigue siendo un placeholder.
    performancePageHtml(".vm-stats-game[data-game-id!='all']").each((index, mapElement) => {
        // ... (lógica placeholder existente para stats de performance por mapa) ...
    });

    return { overall: overallPerformanceData };
}


function parseEconomyPage(economyPageHtml, mapsArray) {
    console.log("Parseando página de Economy...");
    let overallEconomy = { message: "Datos generales de economía pendientes." };
    // Lógica para extraer overallEconomy de economyPageHtml (sección game=all)
    // Ejemplo: const generalEconomyTable = economyPageHtml('div.vm-stats[data-game-id="all"] .MODULO_DE_ECONOMIA'); // Ajusta el selector!
    // if (generalEconomyTable.length) { overallEconomy = parseEconomyStatsFromTable(generalEconomyTable); }

    // Itera sobre los bloques de mapa en la PÁGINA DE ECONOMY
   economyPageHtml(".vm-stats-game").each((index, mapElement) => {
        // ========= CORRECCIÓN AQUÍ =========
        const mapContext = economyPageHtml(mapElement);
        
        const mapNameRaw = mapContext.find(".map div[style*='font-weight: 700']").text().trim();
        const mapName = mapNameRaw.replace(/\s+PICK$/, "").trim();
        
        const targetMap = mapsArray.find(m => m.mapName === mapName);
        if (targetMap) {
            // Lógica para extraer las stats de economía para este mapa específico desde mapContext
            // Ejemplo: targetMap.economy_details = parseMapEconomyStats(mapContext);
            targetMap.economy_stats = { data: `Stats de economía para ${mapName} pendientes.` }; // Placeholder
            console.log(`Parseando economía para el mapa: ${mapName}`); // Debería ser `Placeholder de economía...`
        } else {
            console.log(`Mapa ${mapName} (encontrado en pág. Economy) no hallado en mapsArray original.`);
        }
    });
    return { overall: overallEconomy };
}

// Función principal para extraer los detalles del partido
async function scrapeMatchDetails(matchId) {
    try {
        const matchUrl = `${vlrgg_url}/${matchId}`;
        console.log(`Scrapeando datos de: ${matchUrl}`);

        const html = await request({
            uri: matchUrl,
            transform: (body) => cheerio.load(body),
        });
        // CÓDIGO PARA EXTRAER LINKS DE PERFORMANCE Y ECONOMY 

        const performanceTabSelector = 'div.vm-stats[data-game-id="all"] .vm-stats-tabnav a.vm-stats-tabnav-item[data-tab="performance"]';
        const performanceHref = html(performanceTabSelector).attr('href');
        let performanceFullUrl = null;

        if (performanceHref) {
            // Asegurarse de que no se duplique la base si el href ya fuera absoluto (poco probable en vlr.gg)
            performanceFullUrl = performanceHref.startsWith('http') ? performanceHref : vlrgg_url + performanceHref;
            console.log(`Link de Performance (game=all) encontrado: ${performanceFullUrl}`);
        } else {
            console.log("Link de Performance (game=all) NO encontrado.");
        }

        const economyTabSelector = 'div.vm-stats[data-game-id="all"] .vm-stats-tabnav a.vm-stats-tabnav-item[data-tab="economy"]';
        const economyHref = html(economyTabSelector).attr('href');
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

        const tournament = html(".match-header-event div[style='font-weight: 700;']").text().trim();
        const stage = html(".match-header-event-series").text().trim();
        const date = html(".match-header-date .moment-tz-convert[data-moment-format='dddd, MMMM Do']").text().trim();

        const team2Name = html(".match-header-link.mod-1 .wf-title-med").text().trim();
        const team1Name = html(".match-header-link.mod-2 .wf-title-med").text().trim();
        const team1Score = html(".match-header-vs-score .match-header-vs-score-loser").text().trim();
        const team2Score = html(".match-header-vs-score .match-header-vs-score-winner").text().trim();

        const format = html(".match-header-vs-note").eq(1).text().trim();
        const mapPicksBans = html(".match-header-note").text().trim();
        
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
            overview_general: scrapeOverview(html), // Overview general
            maps: [],
        };

        // Extraer mapas jugados y su información
        html(".vm-stats-game").each((_, el) => {
            const mapContext = html(el);

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
                const roundElement = html(roundEl); // Es buena práctica guardar el elemento jQuery/Cheerio
                const team1Sq = roundElement.find(".rnd-sq").eq(0);
                const team2Sq = roundElement.find(".rnd-sq").eq(1);
                
                const team1Win = team1Sq.hasClass("mod-win");
                const team2Win = team2Sq.hasClass("mod-win");

                const roundNumber = parseInt(html(roundEl).find(".rnd-num").text().trim(), 10) || j + 1;
        
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
            const economyData = parseEconomyPage(economyPageHtml, matchData.maps);
            matchData.economy_general = economyData.overall;
            // parseEconomyPage actualiza matchData.maps por referencia
        }
        return matchData;
    } catch (error) {
        console.error("Error al extraer datos del partido:", error);
    }
}
module.exports = { scrapeMatchDetails /*, scrapeOverview si la exportas también */ };