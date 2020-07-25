// Required event subscriptions:
// - team_join

// Required permission scopes:
// - im:write
// - mpim:write

import * as newMemberMessage from "../auto-messages/new-slack-member.json";

export default function (controller) {
  controller.on("team_join", async (bot, message) => {
    await bot.startPrivateConversation(message.user.id);
    await bot.say(newMemberMessage.message);
  });
}
