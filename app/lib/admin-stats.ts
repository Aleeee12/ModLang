import { db } from "./db/db";

type PresenceEntry = {
  tabId: string;
  lastSeen: number;
};

type StatsRow = {
  id: number;
  total_visits: number;
  total_translations: number;
  unique_users: number;
  online_users: number | null;
};

type InsertResult = {
  affectedRows: number;
};

const presence = new Map<string, PresenceEntry>();

const PRESENCE_TTL = 45_000;

function cleanupPresence() {
  const now = Date.now();

  for (const [key, entry] of presence.entries()) {
    if (now - entry.lastSeen > PRESENCE_TTL) {
      presence.delete(key);
    }
  }
}

export async function registerVisit() {
  await db.query(`
    UPDATE global_stats
    SET total_visits = total_visits + 1
    WHERE id = 1
  `);
}

export async function registerUniqueVisitor(visitorId: string) {
  if (!visitorId) return;

  const [result] = await db.query(
    `INSERT IGNORE INTO visitors (visitorId) VALUES (?)`,
    [visitorId]
  );

  const insertResult = result as InsertResult;

  if (insertResult.affectedRows > 0) {
    await db.query(`
      UPDATE global_stats
      SET unique_users = unique_users + 1
      WHERE id = 1
    `);
  }
}

export async function incrementTranslations(amount = 1) {
  await db.query(
    `
    UPDATE global_stats
    SET total_translations = total_translations + ?
    WHERE id = 1
    `,
    [amount]
  );
}

export function upsertPresence(tabId: string) {
  if (!tabId) return;

  presence.set(tabId, {
    tabId,
    lastSeen: Date.now(),
  });
}

export function removePresence(tabId: string) {
  if (!tabId) return;
  presence.delete(tabId);
}

export async function getAdminStats() {
  cleanupPresence();

  const [rows] = await db.query(
    `SELECT * FROM global_stats WHERE id = 1 LIMIT 1`
  );

  const row = (rows as StatsRow[])[0];

  return {
    totalVisits: Number(row?.total_visits ?? 0),
    totalTranslations: Number(row?.total_translations ?? 0),
    onlineUsers: presence.size,
    uniqueVisitors: Number(row?.unique_users ?? 0),
    lastUpdated: Date.now(),
  };
}
