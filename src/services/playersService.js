const request = require("request-promise");
const cheerio = require("cheerio");
const { vlrgg_url } = require("../constants");

/**
 * Retrieves player information from the VLR website based on pagination and filters.
 * @param {Object} pagination - Pagination settings.
 * @param {string} pagination.limit - The number of items per page or "all".
 * @param {number} pagination.page - The current page number.
 * @param {Object} filters - Filters to apply to the request.
 * @returns {Object} - Player information and pagination details.
 */
async function getPlayers(pagination, filters) {
  const startIndex =
    pagination.limit !== "all" ? (pagination.page - 1) * pagination.limit : 0;
  const endIndex =
    pagination.limit !== "all" ? pagination.page * pagination.limit : undefined;

  // Make a request to the specified URL and load the response body using Cheerio
  const $ = await request({
    uri: `https://www.vlr.gg/stats/?event_group_id=${filters.event_series}&event_id=${filters.event}&region=${filters.region}&country=${filters.country}&min_rounds=${filters.minrounds}&min_rating=${filters.minrating}&agent=${filters.agent}&map_id=${filters.map}&timespan=${filters.timespan}`,
    transform: (body) => cheerio.load(body),
  });

  const players = [];

  // Find the table element and iterate over its rows using the find() and map() methods
  $("table")
    .find("tbody")
    .find("tr")
    .slice(startIndex, endIndex !== undefined ? endIndex : undefined)
    .map((i, el) => {
      // Extract the player's name, team tag, ID, URL, and country from the row elements
      const name = $(el).find("td").find("a").find(".text-of").text().trim();
      const teamTag = $(el)
        .find("td")
        .find("a")
        .find("div")
        .find("div")
        .last()
        .text()
        .trim();
      const id = $(el).find("td").find("a").attr("href").split("/")[2];
      const url = vlrgg_url + $(el).find("td").find("a").attr("href");
      const country = $(el)
        .find("td")
        .find(".flag")
        .attr("class")
        .split(" ")[1]
        .split("-")[1];

      // Create a player object with the extracted information and push it to the players array
      const player = {
        id,
        url,
        name,
        teamTag,
        country,
      };
      players.push(player);
    });

  // Get the total number of pages
  const totalElements = $("table").find("tbody").find("tr").length;
  const totalPages = Math.ceil(totalElements / pagination.limit);

  // Check if there is a next page
  const hasNextPage = pagination.page < totalPages;

  return {
    players,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalElements,
      totalPages,
      hasNextPage,
    },
  };
}

/**
 * Fetches player information by player ID using web scraping.
 * @param {string} id - The player's unique ID.
 * @returns {object} An object containing player info, team info, and socials.
 */
async function getPlayerById(id) {
  // Send a request to get the HTML content of the player's profile page
  const $ = await request({
    uri: `${vlrgg_url}/player/${id}`,
    transform: (body) => cheerio.load(body),
  });

  // Extract player information
  const tempImg = $(".player-header")
    .find(".wf-avatar")
    .find("img")
    .attr("src");
  const img = tempImg.includes("owcdn")
    ? "https:" + tempImg
    : vlrgg_url + tempImg;
  const user = $(".player-header").find(".wf-title").text().trim();
  const name = $(".player-header").find(".player-real-name").text().trim();
  const twitter = $(".player-header").last().find("a").eq(0).text().trim();
  const twitter_url = $(".player-header").last().find("a").eq(0).attr("href");
  const twitch = $(".player-header").last().find("a").eq(1).text().trim();
  const twitch_url = $(".player-header").last().find("a").eq(1).attr("href");
  const country = $(".player-header")
    .find("div")
    .last()
    .text()
    .trim()
    .toLowerCase();
  const flag = $(".player-header")
    .find(".flag")
    .attr("class")
    .split(" ")[1]
    .split("-")[1];

  // Create the player object
  const player = {
    id,
    url: `${vlrgg_url}/player/${id}`,
    img,
    user,
    name,
    country,
    flag,
  };

  // Extract social media information
  const socials = {
    twitter,
    twitter_url,
    twitch,
    twitch_url,
  };

  // Extract team information
  const teamId = $(".wf-module-item").attr("href")?.split("/")[2];
  const teamUrl = vlrgg_url + $(".wf-module-item").attr("href");
  const tempTeamLogo = $(".wf-module-item").first().find("img").attr("src");
  const teamLogo = tempTeamLogo?.includes("owcdn")
    ? "https:" + tempTeamLogo
    : vlrgg_url + tempTeamLogo;
  const teamName = $(".wf-module-item")
    .first()
    .find("div")
    .next()
    .find("div")
    .first()
    .text()
    .trim();
  const teamDate = $(".wf-module-item")
    .first()
    .find("div")
    .next()
    .find("div")
    .last()
    .text()
    .trim();

  // Create the team object
  const team = {
    id: teamId,
    url: teamUrl,
    name: teamName,
    logo: teamLogo,
    joined: teamDate,
  };

  // Combine player, team, and social information into a single object
  const data = {
    info: player,
    team,
    socials,
  };

  return data;
}

module.exports = {
  getPlayers,
  getPlayerById,
};
