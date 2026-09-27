import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ✅ استيراد Entities
import { LmsResource } from '../../../shared/entities/lms-resource.entity';
import { Enrollment } from '../../../shared/entities/enrollment.entity';
import { Group } from '../../../shared/entities/group.entity'; // ✅ إضافة هذا السطر

// ✅ استيراد Enum
import { EnrollmentStatus } from '../../../common/enums/enrollment-status.enum';

/**
 * EnrollmentGuard (LMS-BE-03)
 * Attach to any route that serves course content.
 * Usage: @UseGuards(EnrollmentGuard)
 */
@Injectable()
export class EnrollmentGuard implements CanActivate {
  constructor(
    @InjectRepository(Enrollment) 
    private enrollmentRepo: Repository<Enrollment>,
    
    @InjectRepository(Group) // ✅ تأكد من حقن Group Repository
    private groupRepo: Repository<Group>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const groupId = request.params.groupId || request.params.id; // ✅ دعم كلا الحالتين

    console.log('🛡️ EnrollmentGuard check:', { 
      userId: user?.id, 
      groupId, 
      roles: user?.roles,
      params: request.params // ✅ للتشخيص
    });

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!groupId) {
      console.log('⚠️ No groupId in route, allowing access');
      return true; // لا يوجد groupId في المسار
    }

    // ✅ Super Admin / Academic لديهم وصول كامل
    if (user.roles?.includes('super_admin') || user.roles?.includes('academic')) {
      console.log('✅ Admin access granted');
      return true;
    }

    // ✅ Teacher يمكنه الوصول لمجموعاته
    if (user.roles?.includes('teacher')) {
      const group = await this.groupRepo.findOne({
        where: { 
          id: groupId, 
          teacher_id: user.id 
        },
      });
      
      if (group) {
        console.log('✅ Teacher access granted');
        return true;
      } else {
        console.log('⚠️ Teacher does not own this group, checking enrollment...');
      }
    }

    // ✅ Student يجب أن يكون مسجلاً
    // ✅ استخدام Enum بدلاً من string
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        student_id: user.id,
        group_id: groupId,
        status: EnrollmentStatus.ACTIVE, // ✅ استخدام Enum
      },
    });

    if (!enrollment) {
      console.log('❌ No active enrollment found');
      throw new ForbiddenException('You are not enrolled in this group');
    }

    console.log('✅ Student enrollment verified');
    return true;
  }
}