import AlumniList from "../../components/AlumniList";

export const metadata = {
  title: "Alumni Sharing | NCU × Aalto EMBA",
  description: "NCU × Aalto EMBA alumni sharing and testimonials. Learn about our students' learning experiences and career development stories.",
};

export default function AlumniPageEN() {
  return <AlumniList forceHideButton={true} />;
}
