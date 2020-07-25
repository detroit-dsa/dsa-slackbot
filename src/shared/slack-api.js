export async function getChannelName(bot, message) {
  const channelInfo = await bot.api.conversations.info({
    channel: message.channel,
  });

  return channelInfo.channel.name;
}
