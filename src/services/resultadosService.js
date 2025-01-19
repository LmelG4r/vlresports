const request = require("request-promise"); // Asegúrate de instalar esta librería
const cheerio = require("cheerio");

const vlrgg_url = "https://www.vlr.gg"; // URL base del sitio

async function getMatchDetails(matchId) {
  try {
    // Construimos la URL del partido
    const matchUrl = `${vlrgg_url}/match/${matchId}`;
    console.log(`Scrapeando datos de: ${matchUrl}`);

    // Solicitamos la página y cargamos el HTML
    const html = await request({
      uri: matchUrl,
      transform: (body) => cheerio.load(body),
    });

    // Extraemos los datos del partido
    const event = html(".match-header-event div[style*='font-weight: 700;']").text().trim();
    const stage = html(".match-header-event-series").text().trim();
    const date = html(".match-header-date div[data-moment-format='dddd, MMMM Do']").text().trim();

    const teams = html(".match-header-link");
    const team1Name = teams.eq(0).find(".wf-title-med").text().trim();
    const team2Name = teams.eq(1).find(".wf-title-med").text().trim();

    const scores = html(".js-spoiler");
    const team1Score = scores.find(".match-header-vs-score-loser").text().trim();
    const team2Score = scores.find(".match-header-vs-score-winner").text().trim();

    const format = html(".match-header-vs-note").text().trim();
    const mapPicksBans = html(".match-header-note").text().trim();

    // Devuelve los datos formateados
    return {
      matchId,
      tournament: event,
      stage: stage,
      date: date,
      teams: [
        { name: team1Name, score: team1Score },
        { name: team2Name, score: team2Score },
      ],
      format: format,
      mapPicksBans: mapPicksBans,
    };
  } catch (error) {
    throw new Error("Error obteniendo detalles del partido: " + error.message);
  }
}

module.exports = {
  getMatchDetails,
};
