function getMatchId(data) {
  return String(data?.matchid ?? "unknown");
}

function getTeamScore(team) {
  return Number(team?.score || 0);
}

async function createLiveMessage(channel, data, matchStore, buildLiveEmbed) {
  const message = await channel.send({
    embeds: [buildLiveEmbed(data)]
  });

  matchStore.setMessage(channel.id, message.id);

  console.log(
    `Utworzono wiadomość LIVE. ID: ${message.id}`
  );

  return message;
}

async function updateLiveMessage(
  channel,
  data,
  matchStore,
  buildLiveEmbed
) {
  const storedMessage = matchStore.getMessage();
  const messageId = storedMessage?.messageId;

  if (!messageId) {
    console.log(
      "Brak zapisanej wiadomości LIVE. Tworzę nową."
    );

    return createLiveMessage(
      channel,
      data,
      matchStore,
      buildLiveEmbed
    );
  }

  try {
    const message = await channel.messages.fetch(messageId);

    await message.edit({
      embeds: [buildLiveEmbed(data)]
    });

    console.log(
      `Zaktualizowano wiadomość LIVE. ID: ${messageId}`
    );

    return message;
  } catch (error) {
    console.error(
      "Nie udało się edytować wiadomości LIVE. Tworzę nową:",
      error.message
    );

    return createLiveMessage(
      channel,
      data,
      matchStore,
      buildLiveEmbed
    );
  }
}

module.exports = {
  getMatchId,
  getTeamScore,
  createLiveMessage,
  updateLiveMessage
};