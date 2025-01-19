const request = require("request-promise");
const cheerio = require("cheerio");

const vlrgg_url = "https://www.vlr.gg"; // Base URL correcta

async function getMatchDetails(matchId) {
  // Función para extraer los datos específicos de cada pestaña (Overview, Performance, Economy)
function scrapeTabData($, url) {
  // Lógica para obtener la información desde cada URL específica.
  return {}; // Retorna los datos relevantes
}

// Función para extraer rondas jugadas en cada mapa
function scrapeRounds($, url) {
  // Lógica para obtener las rondas desde cada URL específica del mapa.
  return []; // Retorna las rondas con sus datos
}

  try {
    const matchUrl = `${vlrgg_url}/${matchId}`; // Construye la URL correcta
    console.log(`Scrapeando datos de: ${matchUrl}`);

    // Solicita la página y carga el HTML
    const html = await request({
      uri: matchUrl,
      transform: (body) => cheerio.load(body),
    });

    // Ajusta los selectores basándote en la estructura actual
    const tournament = html(".match-header-event div[style='font-weight: 700;']").text().trim();
    const stage = html(".match-header-event-series").text().trim();
    const date = html(".match-header-date .moment-tz-convert[data-moment-format='dddd, MMMM Do']").text().trim();

    const team1Name = html(".match-header-link.mod-1 .wf-title-med").text().trim();
    const team2Name = html(".match-header-link.mod-2 .wf-title-med").text().trim();
    const team1Score = html(".match-header-vs-score .match-header-vs-score-loser").text().trim();
    const team2Score = html(".match-header-vs-score .match-header-vs-score-winner").text().trim();

    const format = html(".match-header-vs-note").eq(1).text().trim(); // Segundo elemento con la clase
    const mapPicksBans = html(".match-header-note").text().trim();

    // Devuelve los detalles como un objeto
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
      mapPicksBans: mapPicksBans || "Mapas no especificados",
      overview: {},
      performance: {},
      economy: {},
      maps: [],
  };
  
  // Obtener "Overview", "Performance", y "Economy"
  html(".vm-stats-tabnav-item").each((i, el) => {
      const tab = html(el).text().trim().toLowerCase();
      if (["overview", "performance", "economy"].includes(tab)) {
          const tabData = scrapeTabData(html, html(el).attr("data-href"));
          matchData[tab] = tabData;
      }
  });
  
  // Extraer mapas jugados y su información
  html(".vm-stats-game").each((i, el) => {
    const mapName = html(el).find(".vm-stats-game-header .map div[style*='font-weight: 700']").text().trim();
    const duration = html(el).find(".vm-stats-game-header .map-duration").text().trim();

    const team1Name = html(el).find(".vm-stats-game-header .team .team-name").eq(0).text().trim();
    const team2Name = html(el).find(".vm-stats-game-header .team .team-name").eq(1).text().trim();

    const team1Score = html(el).find(".vm-stats-game-header .team .score").eq(0).text().trim();
    const team2Score = html(el).find(".vm-stats-game-header .team .score").eq(1).text().trim();

    const team1Rounds = {
        ct: html(el).find(".vm-stats-game-header .team .mod-ct").eq(0).text().trim() || "0",
        t: html(el).find(".vm-stats-game-header .team .mod-t").eq(0).text().trim() || "0",
        ot: html(el).find(".vm-stats-game-header .team .mod-ot").eq(0).text().trim() || "0",
    };

    const team2Rounds = {
        ct: html(el).find(".vm-stats-game-header .team .mod-ct").eq(1).text().trim() || "0",
        t: html(el).find(".vm-stats-game-header .team .mod-t").eq(1).text().trim() || "0",
        ot: html(el).find(".vm-stats-game-header .team .mod-ot").eq(1).text().trim() || "0",
    };

    const mapInfo = {
        mapName: mapName || "Mapa no especificado",
        duration: duration || "Duración no especificada",
        teams: [
            {
                name: team1Name || "Equipo 1 no especificado",
                score: team1Score || "0",
                rounds: team1Rounds,
            },
            {
                name: team2Name || "Equipo 2 no especificado",
                score: team2Score || "0",
                rounds: team2Rounds,
            },
        ],
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