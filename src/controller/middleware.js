import { decode } from "he";

const heardMessages = new Set();
export function receive(_bot, message, next) {
  if (process.env.DEBUG) {
    console.log(message);
  }

  if (message.ts) {
    if (heardMessages.has(message.ts)) {
      console.log(`Skipping duplicate message with timestamp '${message.ts}'`);
      return;
    }

    heardMessages.add(message.ts);
  }

  next();
}

export function send(_bot, message, next) {
  // Decode outgoing messages to make sure there are no weird URI encoded characters.
  // Encoding happens automatically sometimes for unknown reasons.
  message.text = decode(message.text);

  next();
}
