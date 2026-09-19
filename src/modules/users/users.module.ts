import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../shared/entities/user.entity';
import { Role } from '../../shared/entities/role.entity'; // ✅ تمت الإضافة
import { UserRole } from '../../shared/entities/user-role.entity'; // ✅ تمت الإضافة
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Role,        // ✅ مطلوب لـ UsersService
      UserRole     // ✅ مطلوب لـ UsersService
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}