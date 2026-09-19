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
      <div style={{ width: "100%", boxSizing: "border-box", padding: "20px clamp(16px, 4vw, 30px) 60px clamp(16px, 4vw, 30px)" }}>
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <EventList detailPagePath="/eventlist-2" showTitle={true} limit={1} sidePadding={0} variant="home" showMoreButton={true} moreButtonLink="/event" />
        </div>
      </div>
      <HomeVideoSection variant="home" />
      <div style={{ width: "100%", boxSizing: "border-box", padding: "20px clamp(16px, 4vw, 30px) 60px clamp(16px, 4vw, 30px)" }}>
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          <LatestArticles sidePadding={0} variant="home" />
        </div>
      </div>
    </>
  );
}
