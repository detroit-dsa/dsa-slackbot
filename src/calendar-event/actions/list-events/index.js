// import { BotkitConversation } from "botkit";

// const LIST_CALENDAR_EVENTS_DIALOG_ID = "list_events";

// export function attachListEventsDialog(controller) {
//   const convo = new BotkitConversation(
//     LIST_CALENDAR_EVENTS_DIALOG_ID,
//     controller
//   );
//   convo.addAction("list_events");

//   convo.before("list_events", async (convo) => {
//     let zoomMeetings = [];
//     // let googleEvents = [];

//     try {
//       zoomMeetings = await zoomClient.getScheduledMeetings();
//       // googleEvents = await googleCalendarClient.getEvents();
//     } catch (error) {
//       console.error("Failed while trying to retrieve meetings.", error);
//     }

//     if (!zoomMeetings) {
//       return;
//     }

//     const meetingsString = zoomMeetings.meetings
//       .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
//       .map(
//         (m) =>
//           `${new Date(m.start_time).toLocaleString()} **${m.topic.trim()}**`
//       )
//       .join("\n\n");

//     convo.setVar("list_meetings_content", meetingsString);
//   });

//   convo.addMessage("{{vars.list_meetings_content}}", "list_events");

//   controller.addDialog(convo);
//   return convo;
// }
