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
function parsePerformancePage(performancePageHtml, mapsArray) { // mapsArray puede no ser necesario aquí si solo nos enfocamos en la matriz de duelos generales
    console.log("Parseando página de Performance para la matriz de duelos generales...");
    
    const overallPerformanceStats = {
        duel_matrix: [] // Aquí almacenaremos los duelos
    };

    // 1. Localizar el contenedor de estadísticas generales del partido
    const overallStatsContainer = performancePageHtml('div.vm-stats-game[data-game-id="all"]');

    if (overallStatsContainer.length === 0) {
        console.log("Contenedor vm-stats-game[data-game-id='all'] no encontrado en la página de Performance.");
        return { overall: overallPerformanceStats }; // Devuelve lo que tenemos (vacío)
    }

    // 2. Localizar la tabla de la matriz de duelos dentro del contenedor general
    const duelTable = overallStatsContainer.find('table.wf-table-inset.mod-matrix');

    if (duelTable.length === 0) {
        console.log("Tabla de duelos (mod-matrix) no encontrada en game-id='all' de la página de Performance.");
        return { overall: overallPerformanceStats };
    }

    const columnPlayers = [];
    // 3. Extraer Jugadores de las Columnas (del encabezado de la tabla)
    // La primera fila <tr> contiene los encabezados de columna (jugadores)
    // Empezamos desde la segunda celda <td> (índice 1) porque la primera suele ser vacía/etiqueta
    duelTable.find('tr').first().find('td').slice(1).each((colIndex, tdElement) => {
        const playerCell = performancePageHtml(tdElement);
        const teamDiv = playerCell.find('div.team');
        // El nombre del jugador es el texto directo dentro del segundo div, antes del div.team-tag
        const playerName = teamDiv.children('div').eq(0).contents().filter(function() { // .children('div').eq(0) es el div que contiene nombre y tag
            return this.type === 'text';
        }).text().trim();
        const teamTag = teamDiv.find('div.team-tag').text().trim();
        
        if (playerName) { // Solo añadir si se extrajo un nombre
            columnPlayers.push({ name: playerName, team: teamTag });
        }
    });

    // 4. Iterar Filas de Datos (Jugadores de Fila y Estadísticas de Duelo)
    // Saltamos la primera fila (encabezados), por eso .slice(1)
    duelTable.find('tr').slice(1).each((rowIndex, trElement) => {
        const rowTds = performancePageHtml(trElement).find('td');
        
        // Jugador de la Fila (primera celda de esta fila)
        const rowPlayerCell = rowTds.first();
        const rowTeamDiv = rowPlayerCell.find('div.team');
        const rowPlayerName = rowTeamDiv.children('div').eq(0).contents().filter(function() {
            return this.type === 'text';
        }).text().trim();
        const rowPlayerTeamTag = rowTeamDiv.find('div.team-tag').text().trim();

        if (!rowPlayerName) { // Si no hay nombre de jugador en la fila, saltar (puede ser una fila vacía o mal formada)
            return; 
        }

        // Duelos (celdas restantes de esta fila, a partir de la segunda)
        // Corresponden a los duelos del rowPlayerName contra cada columnPlayer
        rowTds.slice(1).each((colIndex, duelCellElement) => {
            if (colIndex < columnPlayers.length) { // Asegurarse de que haya un columnPlayer correspondiente
                const currentColumnPlayer = columnPlayers[colIndex];
                const duelStatsDivs = performancePageHtml(duelCellElement).find('div.stats-sq');

                if (duelStatsDivs.length === 3) {
                    const killsByRowPlayer = parseInt(duelStatsDivs.eq(0).text().trim(), 10);
                    const deathsOfRowPlayer = parseInt(duelStatsDivs.eq(1).text().trim(), 10); // (Kills by ColumnPlayer)
                    const balanceText = duelStatsDivs.eq(2).text().trim();
                    const balance = parseInt(balanceText.replace('+', ''), 10); // Quita el '+' para convertir a número

                    overallPerformanceStats.duel_matrix.push({
                        player_row: { name: rowPlayerName, team: rowPlayerTeamTag },
                        player_col: { name: currentColumnPlayer.name, team: currentColumnPlayer.team },
                        row_player_kills_col_player: killsByRowPlayer,
                        col_player_kills_row_player: deathsOfRowPlayer,
                        balance: balance
                    });
                }
            }
        });
    });

    // La parte de estadísticas de performance POR MAPA (si es distinta a esta matriz)
    // la mantenemos como placeholder. Necesitarías ajustar los selectores de nombre de mapa
    // si son diferentes en la página de Performance comparada con la de Overview.
    performancePageHtml(".vm-stats-game[data-game-id!='all']").each((index, mapElement) => {
        const mapContext = performancePageHtml(mapElement);
        const mapNameRaw = mapContext.find(".map div[style*='font-weight: 700']").text().trim(); // ESTE SELECTOR PUEDE NECESITAR AJUSTE
        const mapName = mapNameRaw.replace(/\s+PICK$/, "").trim();

        const targetMap = mapsArray.find(m => m.mapName === mapName);
        if (targetMap) {
            targetMap.performance_stats_per_map = { data: `Stats de performance para ${mapName} pendientes.` }; // Renombrado para claridad
            if (mapName) {
                 console.log(`Placeholder de performance (por mapa) añadido para: ${mapName}`);
            } else {
                 console.log(`Placeholder de performance (por mapa) añadido, pero nombre de mapa no extraído en pág. Performance.`);
            }
        } else {
            // Solo loguear si se esperaba encontrar el mapa pero no se pudo extraer su nombre,
            // o si el nombre se extrajo pero no estaba en mapsArray (lo cual sería raro si la lógica es correcta)
            if (mapName) { // Si se extrajo un nombre pero no se encontró el mapa
                 console.log(`Mapa ${mapName} (de pág. Performance) no encontrado en mapsArray.`);
            } else if (mapContext.find('.map').length > 0) { // Si hay un elemento .map pero no se pudo sacar el nombre
                 console.log(`Bloque de mapa encontrado en pág. Performance, pero su nombre no pudo ser extraído.`);
            }
        }
    });

    return { overall: overallPerformanceStats }; // Devuelve el objeto con la matriz de duelos
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