import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}
}
