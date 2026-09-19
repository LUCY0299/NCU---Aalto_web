"use client";

import EventDetailBody from "../components/EventDetailBody";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 將原本依賴 useSearchParams 的邏輯抽離成一個獨立元件
function EventDetailContent() {
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

// 主頁面元件：使用 Suspense 將內容包裝起來
export default function EventDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventDetailContent />
    </Suspense>
  );
}