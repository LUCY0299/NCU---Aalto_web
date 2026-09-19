import EventList from "../components/EventList";

export const metadata = {
  title: "活動訊息 | NCU × Aalto EMBA",
  description: "NCU × Aalto EMBA 最新活動與訊息。參加我們的線上和線下活動，深入了解 EMBA 課程和校友網絡。",
};

export default function EventPage() {
  return (
    <EventList
      detailPagePath="/eventlist-2"
      showTitle={true}
      titleAlign="center"
      limit={0}
    />
  );
}
