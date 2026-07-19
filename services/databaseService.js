const {
  saveMatch,
  getLastMatch
} = require("../database");

async function saveFinishedMatch(matchData) {
  await saveMatch(matchData);
}

async function loadLastMatch() {
  return await getLastMatch();
}

module.exports = {
  saveFinishedMatch,
  loadLastMatch
};