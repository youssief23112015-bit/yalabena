import { DataSource } from 'typeorm';

export async function seedBranch(dataSource: DataSource) {
  // Branch table no longer exists in DB schema - neutralized seed
  console.log('Branch seeding skipped (branches table removed)');
}