import AlumniList from "../components/AlumniList";

export const metadata = {
  title: "校友分享 | NCU × Aalto EMBA",
  description: "NCU × Aalto EMBA 校友分享與見證。了解學員的學習體驗和職業發展故事。",
};

export default function AlumniPage() {
  return <AlumniList forceHideButton={true} />;
}
