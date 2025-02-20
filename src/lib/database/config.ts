export interface DatabaseConfig {
  type: 'supabase' | 'postgres' | 'mysql';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

export const dbConfig: DatabaseConfig = {
  type: import.meta.env.VITE_DB_TYPE as DatabaseConfig['type'],
  host: import.meta.env.VITE_DB_HOST,
  port: Number(import.meta.env.VITE_DB_PORT),
  username: import.meta.env.VITE_DB_USER,
  password: import.meta.env.VITE_DB_PASSWORD,
  database: import.meta.env.VITE_DB_NAME,
};