"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import Header from "@/app/components/modlang/Header";
import UploadCard from "@/app/components/modlang/UploadCard";
import QueueSection from "@/app/components/modlang/QueueSection";
import Footer from "@/app/components/modlang/Footer";
import SiteAnnouncement from "@/app/components/modlang/SiteAnnouncement";
import CommunityUploadModal from "@/app/community/components/CommunityUploadModal";

import {
  APP_AUTHOR,
  APP_NAME,
  APP_SUBTITLE,
} from "@/app/lib/modlang/constants";
import { useModlangQueue } from "@/app/hooks/modlang/useModlangQueue";

type AnnouncementResponse = {
  ok?: boolean;
  message?: string;
  enabled?: boolean;
  updatedAt?: string | null;
  error?: string;
};

type VisitResponse = {
  ok?: boolean;
  totalVisits?: number;
  uniqueVisitors?: number;
};

type StatsResponse = {
  totalVisits?: number;
  totalTranslations?: number;
  uniqueVisitors?: number;
  onlineUsers?: number;
  lastUpdated?: number;
};

function getOrCreateVisitorId() {
  const storageKey = "modlang_visitor_id";
  const existing = window.localStorage.getItem(storageKey);

  if (existing) return existing;

  const newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(storageKey, newId);
  return newId;
}

function getOrCreateTabId() {
  const storageKey = "modlang_tab_id";
  const existing = window.sessionStorage.getItem(storageKey);

  if (existing) return existing;

  const newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tab_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(storageKey, newId);
  return newId;
}

export default function Home() {
  const visitSentRef = useRef(false);

  const [uiLang, setUiLang] = useState<"es" | "en">("es");
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [announcement, setAnnouncement] = useState<{
    message: string;
    enabled: boolean;
  } | null>(null);

  const modlang = useModlangQueue(uiLang);

  useEffect(() => {
    const saved = window.localStorage.getItem("modlang_ui_lang");
    if (saved === "es" || saved === "en") {
      setUiLang(saved);
    }
  }, []);

  function handleChangeUiLang(lang: "es" | "en") {
    setUiLang(lang);
    window.localStorage.setItem("modlang_ui_lang", lang);
    window.dispatchEvent(new Event("modlang-ui-lang-changed"));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        const res = await fetch("/api/announcement/public", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Announcement request failed: ${res.status}`);
        }

        const data = (await res.json()) as AnnouncementResponse;

        if (cancelled) return;

        if (data?.enabled && data?.message?.trim()) {
          setAnnouncement({
            message: data.message,
            enabled: true,
          });
        } else {
          setAnnouncement(null);
        }
      } catch (error) {
        console.error("Load public announcement error:", error);

        if (!cancelled) {
          setAnnouncement(null);
        }
      }
    }

    void loadAnnouncement();

    const interval = setInterval(() => {
      void loadAnnouncement();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const tabId = getOrCreateTabId();
    let cancelled = false;

    async function sendPresence(action: "upsert" | "remove" = "upsert") {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            tabId,
            action,
          }),
          cache: "no-store",
        });
      } catch (error) {
        console.error("Presence error:", error);
      }
    }

    async function loadStats() {
      try {
        const res = await fetch("/api/stats/public", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Stats request failed: ${res.status}`);
        }

        const data = (await res.json()) as StatsResponse;

        if (!cancelled) {
          const parsed = Number(data?.uniqueVisitors ?? 0);
          setUniqueVisitors(Number.isFinite(parsed) ? parsed : 0);
        }
      } catch (error) {
        console.error("Load stats error:", error);
      }
    }

    async function sendVisit() {
      if (visitSentRef.current) return;
      visitSentRef.current = true;

      try {
        const res = await fetch("/api/stats/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
          }),
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Visit request failed: ${res.status}`);
        }

        const data = (await res.json()) as VisitResponse;

        if (!cancelled) {
          setUniqueVisitors(Number(data?.uniqueVisitors ?? 0));
        }

        await loadStats();
      } catch (error) {
        console.error("Visit error:", error);
      }
    }

    function sendPresenceBeacon(action: "upsert" | "remove") {
      try {
        navigator.sendBeacon(
          "/api/presence",
          new Blob(
            [
              JSON.stringify({
                visitorId,
                tabId,
                action,
              }),
            ],
            { type: "application/json" }
          )
        );
      } catch (error) {
        console.error("Presence beacon error:", error);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendPresenceBeacon("remove");
      } else {
        void sendPresence("upsert");
        void loadStats();
      }
    }

    function handlePageHide() {
      sendPresenceBeacon("remove");
    }

    void sendVisit();
    void sendPresence("upsert");
    void loadStats();

    const presenceInterval = setInterval(() => {
      void sendPresence("upsert");
    }, 30000);

    const statsInterval = setInterval(() => {
      void loadStats();
    }, 5000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cancelled = true;
      clearInterval(presenceInterval);
      clearInterval(statsInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      sendPresenceBeacon("remove");
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-white p-6 md:p-8">
      <div className="relative max-w-6xl mx-auto w-full space-y-6 flex-1">
        <Link
          href="/ftbquests"
          className="
            absolute
            -right-70
            top-6
            z-20
            w-60
            rounded-2xl
            border border-zinc-700
            bg-zinc-900/90
            p-4
            backdrop-blur
            shadow-xl
            transition-all
            hover:border-zinc-500
            hover:bg-zinc-900
            hover:scale-[1.02]
          "
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-white">
                {uiLang === "es" ? "Archivos SNBT" : "SNBT Files"}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {uiLang === "es"
                  ? "Abrir traductor de quests"
                  : "Open quests translator"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-1 text-sm text-zinc-300">
              →
            </div>
          </div>
        </Link>

        <Link
  href="/community"
  className="
    absolute
    -right-70
    top-32
    z-20
    w-60
    rounded-2xl
    border border-zinc-700
    bg-zinc-900/90
    p-4
    backdrop-blur
    shadow-xl
    transition-all
    hover:border-zinc-500
    hover:bg-zinc-900
    hover:scale-[1.02]
  "
>
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-base font-semibold text-white">
        {uiLang === "es" ? "Comunidad" : "Community"}
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        {uiLang === "es"
          ? "Ver traducciones subidas"
          : "View uploaded translations"}
      </p>
    </div>

    <div className="rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-1 text-sm text-zinc-300">
      →
    </div>
  </div>
</Link>

        <Header
          appName={APP_NAME}
          appSubtitle={APP_SUBTITLE[uiLang]}
          appAuthor={APP_AUTHOR}
          uiLang={uiLang}
          onChangeUiLang={handleChangeUiLang}
        />

        {announcement?.enabled ? (
          <SiteAnnouncement message={announcement.message} />
        ) : null}

        <UploadCard
          dragActive={modlang.dragActive}
          queueItemsLength={modlang.queueItems.length}
          isProcessingQueue={modlang.isProcessingQueue}
          status={modlang.status}
          currentFileName={modlang.currentFileName}
          lastDownloadName={modlang.lastDownloadName}
          error={modlang.error}
          etaText={modlang.etaText}
          translationProgress={modlang.translationProgress}
          uniqueVisitors={uniqueVisitors}
          uiLang={uiLang}
          inputRef={modlang.inputRef}
          onDragOver={modlang.handleDragOver}
          onDragLeave={modlang.handleDragLeave}
          onDrop={modlang.handleDrop}
          onInputChange={modlang.handleInputChange}
          onProcessQueue={(sourceLang, targetLang, outputFormat) =>
            void modlang.processQueue(sourceLang, targetLang, outputFormat)
          }
          onResetAll={modlang.resetAll}
        />

        <QueueSection
          queueItems={modlang.queueItems}
          completedCount={modlang.completedCount}
          errorCount={modlang.errorCount}
          skippedCount={modlang.skippedCount}
          pendingCount={modlang.pendingCount}
          isProcessingQueue={modlang.isProcessingQueue}
          onRemoveQueueItem={modlang.removeQueueItem}
          uiLang={uiLang}
        />
      </div>

      <Footer />

      <CommunityUploadModal
        open={!!modlang.communityUploadDraft}
        uiLang={uiLang}
        zipBlob={modlang.communityUploadDraft?.zipBlob ?? null}
        defaultModName={modlang.communityUploadDraft?.modName ?? ""}
        defaultModVersion={modlang.communityUploadDraft?.modVersion ?? "unknown"}
        defaultTargetLang={modlang.communityUploadDraft?.targetLang ?? ""}
        outputType={modlang.communityUploadDraft?.outputType ?? "jar"}
        onClose={modlang.clearCommunityUploadDraft}
        onUploaded={modlang.clearCommunityUploadDraft}
      />
    </main>
  );
}