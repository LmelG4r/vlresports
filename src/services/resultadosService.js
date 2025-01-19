const request = require("request-promise");
const cheerio = require("cheerio");

const vlrgg_url = "https://www.vlr.gg"; // Base URL correcta

async function getMatchDetails(matchId) {
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

async function scrapeMatchData(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  // Información principal
  const matchData = {
      matchId: "", // Ya lo tienes
      tournament: "",
      stage: "",
      date: "",
      teams: [],
      format: "",
      mapPicksBans: "",
      overview: {}, // Sección de estadísticas generales
      performance: {}, // Rendimiento
      economy: {}, // Economía
      maps: [] // Información de cada mapa jugado
  };

  // Obtener "Overview", "Performance", y "Economy"
  $(".vm-stats-tabnav-item").each((i, el) => {
      const tab = $(el).text().trim().toLowerCase();
      if (["overview", "performance", "economy"].includes(tab)) {
          const tabData = scrapeTabData($, $(el).attr("data-href")); // Función específica
          matchData[tab] = tabData;
      }
  });

  // Extraer mapas jugados y su información
  $(".vm-stats-gamesnav-item").each((i, el) => {
      const isPlayed = !$(el).hasClass("mod-disabled");
      if (isPlayed) {
          const mapName = $(el).find("div").text().trim();
          const pickText = $(el)
              .find(".pick")
              .text()
              .replace("Pick:", "")
              .trim();
          const mapInfo = {
              mapName,
              pickBy: pickText || null, // Quién hizo el pick, si está disponible
              winner: $(el).find(".team-tag").text().trim(),
              rounds: scrapeRounds($, $(el).attr("data-href")) // Detalles de rondas
          };

          matchData.maps.push(mapInfo);
      }
  });

  return matchData;
}

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
