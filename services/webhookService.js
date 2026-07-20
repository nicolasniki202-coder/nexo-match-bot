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
  } catch {
    return createLiveMessage(
      channel,
      data,
      matchStore,
      buildLiveEmbed
    );
  }
}

async function finishLiveMessage(
  channel,
  data,
  matchStore,
  buildResultEmbed
) {
  const storedMessage = matchStore.getMessage();
  const messageId = storedMessage?.messageId;

  if (!messageId) {
    await channel.send({
      embeds: [buildResultEmbed(data)]
    });

    return;
  }

  try {
    const message = await channel.messages.fetch(messageId);

    await message.edit({
      embeds: [buildResultEmbed(data)]
    });

    console.log(
      `Wiadomość LIVE zmieniona w wynik końcowy.`
    );
  } catch {
    await channel.send({
      embeds: [buildResultEmbed(data)]
    });
  }
}

module.exports = {
  getMatchId,
  getTeamScore,
  createLiveMessage,
  updateLiveMessage,
  finishLiveMessage
};