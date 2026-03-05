export interface UserProfile {
  userId: string;
  name: string;
  career: string;
  skills: string[];
  preferences: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ContextEntry {
  entryId: string;
  userId: string;
  source: 'claude' | 'chatgpt' | 'gemini' | 'other';
  content: string;
  summary: string;
  tags: string[];
  createdAt: string;
}

export interface SearchQuery {
  userId: string;
  query: string;
  limit?: number;
  tags?: string[];
}

export interface MemoryMeshConfig {
  region: string;
  tableName: string;
  profileTableName: string;
}