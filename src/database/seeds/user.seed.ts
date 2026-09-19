import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../shared/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const existingUser = await userRepository.findOne({
    where: {
      email: 'user@speakup.com',
    },
  });

  if (existingUser) {
    console.log('User already exists, skipping...');
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = userRepository.create({
    email: 'user@speakup.com',
    password_hash: passwordHash,
    first_name: 'Test',
    last_name: 'User',
    language: 'en',
    status: 'active' as any,
    two_factor_enabled: false,
  });

  await userRepository.save(user);

  console.log('Test user created: user@speakup.com');
}