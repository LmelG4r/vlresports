const request = require("request-promise");
const cheerio = require("cheerio");
const cheerioLoad = cheerio.load; // Configuración correcta del método 'load'

const vlrgg_url = "https://www.vlr.gg"; // Base URL correcta

async function getMatchDetails(matchId) {
function scrapeOverview(html) {
    const overviewData = [];

    cheerioLoad(".wf-table-inset.mod-overview tbody tr", mapElement).each((_, el) => {
        const playerRow = cheerioLoad(el);
  
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
                both: playerRow.find(".mod-kd-diff .mod-both").text().trim() || "0",  // Buscar el valor para "both"
                attack: playerRow.find(".mod-kd-diff .mod-t").text().trim() || "0",     // Buscar el valor para "attack"
                defend: playerRow.find(".mod-kd-diff .mod-ct").text().trim() || "0",    // Buscar el valor para "defend"
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

    try {
    const matchUrl = `${vlrgg_url}/${matchId}`;
    console.log(`Scrapeando datos de: ${matchUrl}`);

    const html = await request({
      uri: matchUrl,
      transform: (body) => cheerioLoad(body),
    });

    const matchData = {
        matchId,
        tournament: html(".match-header-event div[style='font-weight: 700;']").text().trim() || "Torneo no especificado",
        stage: html(".match-header-event-series").text().trim() || "Etapa no especificada",
        date: html(".match-header-date .moment-tz-convert[data-moment-format='dddd, MMMM Do']").text().trim() || "Fecha no especificada",
        teams: [
          { name: html(".match-header-link.mod-1 .wf-title-med").text().trim() || "Equipo 1 no especificado" },
          { name: html(".match-header-link.mod-2 .wf-title-med").text().trim() || "Equipo 2 no especificado" },
        ],
        format: html(".match-header-vs-note").eq(1).text().trim() || "Formato no especificado",
        mapPicksBans: html(".match-header-note").text().trim() || "Mapas no especificados",
        maps: [], // Información específica por mapa
      };
  
      // Procesar los datos de cada mapa
      html(".vm-stats-game").each((i, el) => {
        const mapElement = cheerio(el);
        const mapNameRaw = mapElement.find(".vm-stats-game-header .map div[style*='font-weight: 700']").text().trim();
        const mapName = mapNameRaw.replace(/\s+PICK$/, "").trim();
  
        const duration = mapElement.find(".vm-stats-game-header .map-duration").text().trim();
        const team1Name = mapElement.find(".vm-stats-game-header .team .team-name").eq(0).text().trim();
        const team2Name = mapElement.find(".vm-stats-game-header .team .team-name").eq(1).text().trim();
        const team1Score = mapElement.find(".vm-stats-game-header .team .score").eq(0).text().trim();
        const team2Score = mapElement.find(".vm-stats-game-header .team .score").eq(1).text().trim();
  
        // Scrapeamos el overview específico del mapa
        const overview = scrapeOverview(html, mapElement);

        
    // Devuelve los detalles como un objeto
    matchData.maps.push({
        mapName: mapName || "Mapa no especificado",
        duration: duration || "Duración no especificada",
        teams: [
          { name: team1Name || "Equipo 1 no especificado", score: team1Score || "0" },
          { name: team2Name || "Equipo 2 no especificado", score: team2Score || "0" },
        ],
        overview, // Información del overview específica del mapa
        rounds: [], // Puedes completar esto como en tu código actual
      });
    });
  

  
  // Extraer mapas jugados y su información
  html(".vm-stats-game").each((i, el) => {
    const mapNameRaw = html(el).find(".vm-stats-game-header .map div[style*='font-weight: 700']").text().trim();
    const mapName = mapNameRaw.replace(/\s+PICK$/, "").trim();

    const duration = html(el).find(".vm-stats-game-header .map-duration").text().trim();

    const team1Name = html(el).find(".vm-stats-game-header .team .team-name").eq(0).text().trim();
    const team2Name = html(el).find(".vm-stats-game-header .team .team-name").eq(1).text().trim();

    const team1Score = html(el).find(".vm-stats-game-header .team .score").eq(0).text().trim();
    const team2Score = html(el).find(".vm-stats-game-header .team .score").eq(1).text().trim();

    const rounds = [];
    html(el).find(".vlr-rounds .vlr-rounds-row-col").each((j, roundEl) => {
        const roundNumber = parseInt(html(roundEl).find(".rnd-num").text().trim(), 10) || j + 1;

        let winningTeam = null;
        let result = null;
        let method = null;

        const team1Win = html(roundEl).find(".rnd-sq").eq(0).hasClass("mod-win");
        const team2Win = html(roundEl).find(".rnd-sq").eq(1).hasClass("mod-win");

        if (team1Win) {
            winningTeam = team1Name;
            result = "ct-win";
            method = html(roundEl).find(".rnd-sq").eq(0).find("img").attr("src");
        } else if (team2Win) {
            winningTeam = team2Name;
            result = "t-win";
            method = html(roundEl).find(".rnd-sq").eq(1).find("img").attr("src");
        }

        // Manejo de URL relativas
        if (method) {
            if (method.startsWith("/")) {
                method = "https://www.vlr.gg" + method;  // Añadimos la base de la URL
            }
            
            if (method.includes("elim.webp")) {
                method = "elim";
            } else if (method.includes("defuse.webp")) {
                method = "defuse";
            } else if (method.includes("boom.webp")) {
                method = "boom";
            } else {
                method = "unknown";
            }
        } else {
            method = "unknown";
        }

        // Solo agregar si hay un resultado
        if (result) {
            rounds.push({
                roundNumber,
                result: `${result} (${winningTeam})`,
                method,
            });
        }
    });

    const mapInfo = {
        mapName: mapName || "Mapa no especificado",
        duration: duration || "Duración no especificada",
        teams: [
            {
                name: team1Name || "Equipo 1 no especificado",
                score: team1Score || "0",
            },
            {
                name: team2Name || "Equipo 2 no especificado",
                score: team2Score || "0",
            },
        ],
        rounds, // Rondas escaladas correctamente
    };

    matchData.maps.push(mapInfo);
});


  
  return matchData;
  
  } catch (error) {
    throw new Error("Error obteniendo detalles del partido: " + error.message);
  }
}

module.exports = {
  getMatchDetails,
};