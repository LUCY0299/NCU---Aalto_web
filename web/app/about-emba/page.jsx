import AboutAaltoEMBA from "@/app/components/AboutAaltoEMBA";

export const metadata = {
  title: "關於 Aalto EMBA | NCU × Aalto EMBA",
  description: "了解阿爾托大學與中央大學合作的高階管理教育計畫",
};

export default function AboutAaltoEMBAPage() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <AboutAaltoEMBA
        topPadding={0}
        bottomPadding={0}
      />
    </main>
  );
}
