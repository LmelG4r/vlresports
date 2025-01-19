async function getMatchDetails(matchId) {
    try {
      // Creamos la URL específica para el partido
      const matchUrl = `${vlrgg_url}/match/${matchId}`;
      
      // Hacemos la solicitud y parseamos el HTML
      const $ = await request({
        uri: matchUrl,
        transform: (body) => cheerio.load(body),
      });
  
      // Extraemos los detalles del partido
      const team1 = $(".team1 .team-name").text().trim();
      const team2 = $(".team2 .team-name").text().trim();
      const score1 = $(".team1 .score").text().trim();
      const score2 = $(".team2 .score").text().trim();
      const event = $(".event-name").text().trim();
      const tournament = $(".tournament-name").text().trim();
      const matchStatus = $(".match-status").text().trim();
      const matchDate = $(".match-date").text().trim();
      const matchTime = $(".match-time").text().trim();
  
      // Otros detalles que desees extraer
      // ...
  
      // Devolvemos los detalles como un objeto
      return {
        id: matchId,
        teams: [
          { name: team1, score: score1 },
          { name: team2, score: score2 },
        ],
        event,
        tournament,
        status: matchStatus,
        date: matchDate,
        time: matchTime,
        // Otros detalles aquí
      };
    } catch (error) {
      throw new Error("Error fetching match details: " + error.message);
    }
  }
  
  module.exports = {
    getMatchDetails,  // Exportamos la nueva función
  };
  