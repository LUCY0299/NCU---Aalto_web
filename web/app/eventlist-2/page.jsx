"use client";

import EventDetailBody from "../components/EventDetailBody";
import { useSearchParams } from "next/navigation";

export default function EventDetailPage() {
  const searchParams = useSearchParams();
  const hasIndex = searchParams.has("index");

  if (!hasIndex) {
    return (
      <div
        style={{
          padding: "80px 20px",
          textAlign: "center",
          color: "#999",
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}
      >
        請從活動列表中選擇一個事件
      </div>
    );
  }

  return <EventDetailBody />;
}
