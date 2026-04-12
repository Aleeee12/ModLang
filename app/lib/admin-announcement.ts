type AdminAnnouncement = {
  message: string;
  enabled: boolean;
  updatedAt: string | null;
};

let announcementStore: AdminAnnouncement = {
  message: "",
  enabled: false,
  updatedAt: null,
};

export async function getAdminAnnouncement(): Promise<AdminAnnouncement> {
  return announcementStore;
}

export async function saveAdminAnnouncement(input: {
  message: string;
  enabled: boolean;
}): Promise<AdminAnnouncement> {
  announcementStore = {
    message: input.message.trim(),
    enabled: Boolean(input.enabled),
    updatedAt: new Date().toISOString(),
  };

  return announcementStore;
}

export async function getPublicAnnouncement() {
  if (!announcementStore.enabled || !announcementStore.message.trim()) {
    return null;
  }

  return {
    message: announcementStore.message,
    enabled: true,
    updatedAt: announcementStore.updatedAt,
  };
}