import { DataSource } from 'typeorm'
import { dataSourceOptions } from '../data-source';
import { seedRoles } from './role.seed';
import { seedPermissions } from './permission.seed';
import { seedRolePermissions } from './role-permission.seed';
import { seedSettings } from './setting.seed';
import { seedBranch } from './branch.seed';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { seedSuperUser } from './superuser.seed'; // ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„ØµØ­ÙŠØ­ Ù„Ùˆ Ø§Ù„Ù…Ù„Ù Ø¨Ø§Ø³Ù… ØªØ§Ù†ÙŠ

async function runSeeds() {
  // Ø¹Ù…Ù„ Casting ØµØ±ÙŠØ­ Ù„Ù†ÙˆØ¹ Ø¨ÙˆØ³ØªØ¬Ø±Ø³ Ø¹Ø´Ø§Ù† Ø§Ù„Ù€ TypeScript ÙŠÙ‚Ø±Ø£ Ø§Ù„Ø®ØµØ§Ø¦Øµ ØµØ­
  const pgOptions = dataSourceOptions as PostgresConnectionOptions;

  console.log('--- DB Connection Check ---');
  console.log('Host:', pgOptions.host);
  console.log('Port:', pgOptions.port);
  console.log('Database:', pgOptions.database);
  console.log('User:', pgOptions.username);
  console.log('---------------------------');

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('Database connected. Running seeds...');

  await seedPermissions(dataSource);
  await seedRoles(dataSource);
  await seedRolePermissions(dataSource);
  await seedSettings(dataSource);
  await seedBranch(dataSource);
  await seedSuperUser(dataSource); // <-- Ø£Ø¶ÙÙ†Ø§Ù‡Ø§ Ù‡Ù†Ø§
  console.log('All seeds completed successfully.');
  await dataSource.destroy();
}

runSeeds().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

