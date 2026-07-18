class MatchStore {
  constructor() {
    this.currentMatch = null;
    this.liveMessageId = null;
    this.liveChannelId = null;
  }

  start(matchData) {
    this.currentMatch = matchData;
  }

  update(matchData) {
    this.currentMatch = matchData;
  }

  finish() {
    this.currentMatch = null;
    this.liveMessageId = null;
    this.liveChannelId = null;
  }

  hasLiveMatch() {
    return this.currentMatch !== null;
  }

  setMessage(channelId, messageId) {
    this.liveChannelId = channelId;
    this.liveMessageId = messageId;
  }

  getMessage() {
    return {
      channelId: this.liveChannelId,
      messageId: this.liveMessageId
    };
  }

  getMatch() {
    return this.currentMatch;
  }
}

module.exports = new MatchStore();