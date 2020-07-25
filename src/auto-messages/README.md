# Auto messages
These messages will be sent automatically to users when they join Slack for the first time or join a channel. Use the [formatting syntax](https://api.slack.com/reference/surfaces/formatting) described in Slack's documentation to format your message, add links, and so on.

Note that linking to other channels requires you to look up a [special identifier](https://api.slack.com/reference/surfaces/formatting#linking-channels) to build the link.

## [channel-join.json](channel-join.json)
Channel join messages are sent to the channel as an [ephemeral message](https://api.slack.com/messaging/managing#ephemeral) that only the newly joined user can see.

```json
{
  "channel-one": "message to show to people who join the channel",
  "channel-two": "another message\nwith two lines",
  "channel-three": "*a* _formatted_ <https://www.metrodetroitdsa.com|message>",
  "channel-four": "check out this other channel: <#C010RHVR6HL>"
}
```

## [new-slack-member.json](channel-join.json)
The new member message is sent as a direct message from the bot to every member who joins the Slack workspace.

```json
{
  "message": "Welcome!!!!!!!"
}
```
