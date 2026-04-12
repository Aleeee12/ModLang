export type CommunityTranslation = {
  id: number;
  mod_name: string;
  mod_version: string;
  target_lang: string;
  file_name: string;
  file_path: string;
  file_size: number;
  translated_mods_json: string | null;
  created_at: string;
};

export type CommunityListResponse = {
  ok: boolean;
  items: CommunityTranslation[];
  error?: string;
};

export type CommunityUploadResponse = {
  ok: boolean;
  item?: CommunityTranslation;
  error?: string;
};