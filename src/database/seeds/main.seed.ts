import { DataSource } from 'typeorm'
import { dataSourceOptions } from '../data-source';
import { seedRoles } from './role.seed';
import { seedPermissions } from './permission.seed';
import { seedRolePermissions } from './role-permission.seed';
import { seedSettings } from './setting.seed';
import { seedBranch } from './branch.seed';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { seedSuperUser } from './superuser.seed'; // تأكد من المسار الصحيح لو الملف باسم تاني

async function runSeeds() {
  // عمل Casting صريح لنوع بوستجرس عشان الـ TypeScript يقرأ الخصائص صح
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
  await seedSuperUser(dataSource); // <-- أضفناها هنا
  console.log('All seeds completed successfully.');
  await dataSource.destroy();
}

runSeeds().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});