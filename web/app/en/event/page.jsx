import EventList from "../../components/EventList";

export const metadata = {
  title: "Events | NCU × Aalto EMBA",
  description: "Latest events and news from NCU × Aalto EMBA. Join our online and offline events to learn more about the EMBA program and alumni network.",
};

export default function EventPageEN() {
  return (
    <div className="page-padding-x" style={{ width: "100%", paddingTop: "var(--page-padding-y)", paddingBottom: "var(--page-padding-y)" }}>
      <div className="page-content">
        <EventList
          detailPagePath="/eventlist-2"
          showTitle={true}
          titleAlign="center"
          limit={0}
          sidePadding={0}
        />
      </div>
    </div>
  );
}
