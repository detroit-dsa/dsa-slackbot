// Required event subscriptions:
// - member_joined_channel

// Required permission scopes:
// - chat:write
// - channels:read

import * as channelJoinMessages from "../../welcome-messages/channel-welcome.json";
import { getChannelName } from "../shared/slack-api";

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
