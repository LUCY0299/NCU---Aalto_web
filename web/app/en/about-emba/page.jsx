import AboutAaltoEMBA from "@/app/components/AboutAaltoEMBA";

export const metadata = {
  title: "About Aalto EMBA | NCU × Aalto EMBA",
  description: "Learn about the Executive MBA program jointly offered by Aalto University and National Central University.",
};

export default function AboutAaltoEMBAPageEN() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <AboutAaltoEMBA
        topPadding={0}
        bottomPadding={0}
      />
    </main>
  );
}
