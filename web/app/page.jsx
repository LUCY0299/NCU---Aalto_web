import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import AlumniList from "./components/AlumniList";
import EventList from "./components/EventList";
import HomeVideoSection from "./components/HomeVideoSection";
import LatestArticles from "./components/LatestArticles";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <AlumniList variant="home" limit={3} />
      <div className="page-padding-x" style={{ width: "100%", paddingTop: "var(--page-padding-y)", paddingBottom: "var(--page-padding-y)" }}>
        <div className="page-content">
          <EventList detailPagePath="/eventlist-2" showTitle={true} limit={1} sidePadding={0} variant="home" showMoreButton={true} moreButtonLink="/event" />
        </div>
      </div>
      <HomeVideoSection variant="home" />
      <div className="page-padding-x" style={{ width: "100%", paddingTop: "var(--page-padding-y)", paddingBottom: "var(--page-padding-y)" }}>
        <div className="page-content">
          <LatestArticles sidePadding={0} variant="home" />
        </div>
      </div>
    </>
  );
}
