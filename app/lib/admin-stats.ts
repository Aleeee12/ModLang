import { db } from "./db/db";

type PresenceEntry = {
  tabId: string;
  lastSeen: number;
};

type CountRow = {
  total_visits?: number;
  unique_users?: number;
};

type StatsRow = {
  id: number;
  total_visits: number;
  total_translations: number;
  unique_users: number;
  online_users: number | null;
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

  const [rows] = await db.query(
    `SELECT total_visits FROM global_stats WHERE id = 1 LIMIT 1`
  );

  const row = (rows as CountRow[])[0];

  return Number(row?.total_visits ?? 0);
}


export async function registerUniqueVisitor(visitorId: string) {
  if (!visitorId) {
    const [rows] = await db.query(
      `SELECT unique_users FROM global_stats WHERE id = 1 LIMIT 1`
    );

    const row = (rows as CountRow[])[0];
    return Number(row?.unique_users ?? 0);
  }

  const [existsRows] = await db.query(
    `SELECT 1 FROM visitors WHERE visitorId = ? LIMIT 1`,
    [visitorId]
  );

  const exists = Array.isArray(existsRows) && existsRows.length > 0;

  if (!exists) {
    await db.query(`INSERT INTO visitors (visitorId) VALUES (?)`, [visitorId]);

    await db.query(`
      UPDATE global_stats
      SET unique_users = unique_users + 1
      WHERE id = 1
    `);
  }

  const [rows] = await db.query(
    `SELECT unique_users FROM global_stats WHERE id = 1 LIMIT 1`
  );

  const row = (rows as CountRow[])[0];

  return Number(row?.unique_users ?? 0);
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