import { DataSource } from 'typeorm';
import { Setting } from '../../shared/entities/setting.entity';

// We need to create Setting entity first, or use query
export async function seedSettings(dataSource: DataSource) {
  const settings = [
    { key: 'academy_name', value: 'Speak Up English Academy', group: 'general', description: 'Academy display name' },
    { key: 'default_language', value: 'ar', group: 'general', description: 'Default UI language' },
    { key: 'date_format', value: 'dd/mm/yyyy', group: 'general', description: 'Date display format' },
    { key: 'currency', value: 'EGP', group: 'finance', description: 'Default currency' },
    { key: 'chat_retention_months', value: '24', group: 'chat', description: 'Chat message retention period' },
    { key: 'max_file_upload_mb', value: '10', group: 'system', description: 'Maximum file upload size in MB' },
    { key: 'attendance_lock_hours', value: '48', group: 'attendance', description: 'Hours after session before attendance is locked' },
    { key: 'passing_score_default', value: '60', group: 'lms', description: 'Default passing score percentage' },
    { key: 'max_chat_file_mb', value: '5', group: 'chat', description: 'Maximum chat file attachment size' },
    { key: 'enable_email_notifications', value: 'true', group: 'notifications', description: 'Master switch for email notifications' },
    { key: 'easykash_sandbox_mode', value: 'true', group: 'integrations', description: 'EasyKash sandbox mode for testing' },
    { key: 'zoom_auto_create', value: 'true', group: 'integrations', description: 'Auto-create Zoom meetings for online sessions' },
    { key: 'onmeet_auto_create', value: 'true', group: 'integrations', description: 'Auto-create OnMeet meetings for online sessions' },
  ];

  for (const setting of settings) {
    await dataSource.query(
      `INSERT INTO settings (key, value, "group", description) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (key) DO NOTHING`,
      [setting.key, setting.value, setting.group, setting.description]
    );
  }
  console.log('Settings seeded.');
}
