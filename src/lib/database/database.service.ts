import { supabase } from '../supabase';
import { dbConfig } from './config';

export class DatabaseService {
  private static instance: DatabaseService;
  private connection: any;

  private constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    switch (dbConfig.type) {
      case 'supabase':
        this.connection = supabase;
        break;
      case 'postgres':
        // Implementar conexão PostgreSQL
        break;
      case 'mysql':
        // Implementar conexão MySQL
        break;
      default:
        throw new Error(`Database type ${dbConfig.type} not supported`);
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getConnection() {
    return this.connection;
  }
}

export const db = DatabaseService.getInstance();