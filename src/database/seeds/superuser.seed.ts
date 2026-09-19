import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../shared/entities/user.entity';

export async function seedSuperUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const existingSuperUser = await userRepository.findOne({
    where: {
      email: 'admin@speakup.com',
    },
  });

  if (existingSuperUser) {
    console.log('Superuser already exists, skipping...');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123456', 10);

  const superUser = userRepository.create({
    email: 'admin@speakup.com',
    password_hash: passwordHash,
    first_name: 'Super',
    last_name: 'Admin',
    language: 'en',
    status: 'active' as any,
    two_factor_enabled: false,
  });

  await userRepository.save(superUser);

  console.log('Superuser created: admin@speakup.com');
}