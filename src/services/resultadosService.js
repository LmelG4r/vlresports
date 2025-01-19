const request = require("request-promise");
const cheerio = require("cheerio");

const vlrgg_url = "https://www.vlr.gg";

async function getMatchDetails(matchId) {
  try {
    const matchUrl = `${vlrgg_url}/match/${matchId}`;
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
    return {
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
    };
  } catch (error) {
    throw new Error("Error obteniendo detalles del partido: " + error.message);
  }
}

module.exports = {
  getMatchDetails,
};
