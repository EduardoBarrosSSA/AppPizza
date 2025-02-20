import { db } from './lib/database/database.service';

async function example() {
  const connection = db.getConnection();
  // Use a conexão aqui
}