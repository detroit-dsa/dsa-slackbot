import { BotkitConversation } from "botkit";
import * as thread from "./thread";

const CREATE_CALENDAR_EVENT_DIALOG_ID = "create_event";

export async function beginDialog(bot, userId) {
  console.log(`Starting meeting creation dialog with ${userId}`);

  try {
    await bot.startPrivateConversation(userId);
  } catch (error) {
    console.error(error);
  }

  await bot.beginDialog(CREATE_CALENDAR_EVENT_DIALOG_ID);
}

export function attachDialog(controller) {
  const convo = buildDialog(controller);
  controller.addDialog(convo);

  return convo;
}

function buildDialog(controller) {
  const convo = new BotkitConversation(
    CREATE_CALENDAR_EVENT_DIALOG_ID,
    controller
  );

  thread.attachMainThread(convo);
  thread.attachCancelThread(convo);
  thread.attachFinishThread(convo);

  return convo;
}
