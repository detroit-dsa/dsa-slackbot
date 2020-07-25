// Required event subscriptions:
// - member_joined_channel

// Required permission scopes:
// - chat:write
// - channels:read

import * as channelJoinMessages from "../auto-messages/channel-join.json";

export default function (controller) {
  controller.on("member_joined_channel", async (bot, message) => {
    const channelName = await getChannelName(bot, message);

    const welcomeMessageExists = Object.prototype.hasOwnProperty.call(
      channelJoinMessages,
      channelName
    );

    if (welcomeMessageExists) {
      await bot.replyEphemeral(message, channelJoinMessages[channelName]);
    }
  });
}

async function getChannelName(bot, message) {
  const channelInfo = await bot.api.conversations.info({
    channel: message.channel,
  });

  return channelInfo.channel.name;
}
