import { Transform } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { GroupMode } from '../../../common/enums/group-mode.enum';

export class CreateSessionDto {
  // 1. السماح بـ groupId وتحويله إلى group_id
  @IsOptional()
  @IsUUID()
  @Transform(({ value, obj }) => value ?? obj.groupId)
  group_id: string;

  // 2. السماح بـ title وتحويله إلى topic
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj.title)
  topic?: string;

  // 3. السماح بـ session_type وتحويله إلى mode (مع تصحيح in-person إلى in_person)
  @IsOptional()
  @IsEnum(GroupMode)
  @Transform(({ value, obj }) => {
    const val = (value ?? obj.session_type)?.toString().toLowerCase();
    if (val === 'in-person') return 'in_person';
    return val;
  })
  mode?: GroupMode;

  // 4. السماح بـ meeting_link وتحويله إلى zoom_join_url
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj.meeting_link)
  zoom_join_url?: string;

  // 5. السماح بـ classroomId وتحويله إلى classroom_id
  @IsOptional()
  @IsUUID()
  @Transform(({ value, obj }) => value ?? obj.classroomId)
  classroom_id?: string;

  // 6. استخراج التاريخ من start_time إذا لم يتم إرساله بشكل منفصل
  @IsOptional()
  @IsDateString()
  @Transform(({ value, obj }) => {
    if (value) return value;
    if (obj.start_time && typeof obj.start_time === 'string' && obj.start_time.includes('T')) {
      return obj.start_time.split('T')[0]; // يستخرج YYYY-MM-DD
    }
    return value;
  })
  date?: string;

  // 7. استخراج الوقت من ISO String إذا لزم الأمر
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value;
    if (typeof value === 'string' && value.includes('T')) {
      return value.split('T')[1].substring(0, 5); // يستخرج HH:MM
    }
    return value;
  })
  start_time?: string;

  // 8. استخراج وقت الانتهاء من ISO String إذا لزم الأمر
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value;
    if (typeof value === 'string' && value.includes('T')) {
      return value.split('T')[1].substring(0, 5); // يستخرج HH:MM
    }
    return value;
  })
  end_time?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // ==========================================
  // حقول وهمية لمنع خطأ "should not exist" 
  // بسبب forbidNonWhitelisted: true في main.ts
  // ==========================================
  @IsOptional() groupId?: string;
  @IsOptional() title?: string;
  @IsOptional() session_type?: string;
  @IsOptional() meeting_link?: string;
  @IsOptional() classroomId?: string;
  @IsOptional() status?: string;
}