-- SPEAK UP TMS - COMPLETE TEST SEED
-- Generated from speakup_tms_full_schema.sql
-- Includes every schema table, multiple RBAC accounts, branches, courses, groups,
-- LMS, finance, HR, inventory, activities, chat, website and system records.
BEGIN;
SET TIME ZONE 'Africa/Cairo';
CREATE EXTENSION IF NOT EXISTS pgcrypto;


INSERT INTO branches (id,name,address,phone,email,classroom_count,status) VALUES
('66fc3021-8661-503f-b5c8-cea9e67629e6','Seed Main Branch','12 Nile Street, Downtown Cairo','+201100100001','seed.main@speakup.test',3,'active'),
('41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','Seed Nasr City Branch','45 Abbas El Akkad, Cairo','+201100100002','seed.nasr@speakup.test',3,'active'),
('5a783991-fdfa-516a-802b-ef204ee4b57f','Seed Heliopolis Branch','8 El Hegaz Street, Cairo','+201100100003','seed.heliopolis@speakup.test',2,'active')
ON CONFLICT DO NOTHING;


INSERT INTO roles (id,name,slug,description,is_custom,is_system) VALUES
('49bf8e5b-c4fc-5968-aa0f-fda20e237080','Super Admin','super_admin','Seed/test role: super_admin',FALSE,TRUE),
('cdf7010f-0cda-55ea-be52-d4dbc7fd132a','Branch Manager','branch_manager','Seed/test role: branch_manager',FALSE,TRUE),
('2271ffd8-faec-57eb-8e2c-8712126ba001','Sales','sales','Seed/test role: sales',FALSE,TRUE),
('973738fd-5c3a-5950-86e7-43867e9116e9','Finance','finance','Seed/test role: finance',FALSE,TRUE),
('0cd659c8-8935-5ff5-9800-352c3f26661d','Academic','academic','Seed/test role: academic',FALSE,TRUE),
('c9d350aa-8a28-5c0f-a725-63a105308a3b','Teacher','teacher','Seed/test role: teacher',FALSE,TRUE),
('d8220b88-b3c2-58e7-b0af-441ea8aae461','Student','student','Seed/test role: student',FALSE,TRUE),
('17c21c5a-5e73-5e3b-b9eb-11f9a682004b','Moderator','moderator','Seed/test role: moderator',FALSE,TRUE),
('cf633176-8c74-5f96-93af-890b370cf58b','Hr','hr','Seed/test role: hr',FALSE,TRUE),
('370e9be0-9f86-5c3b-8df6-039004056fda','Auditor','auditor','Seed/test role: auditor',FALSE,TRUE)
ON CONFLICT DO NOTHING;


INSERT INTO permissions (id,module,action,description) VALUES
('46bac741-1a81-5c1e-a8e9-0a06cae3a5f3','users','view','Seed permission users:view'),
('e795a6cf-a754-537c-be6f-9ae74139ba29','users','read','Seed permission users:read'),
('2a27cc01-d19d-578a-a362-eeaa58e06bbc','users','create','Seed permission users:create'),
('92e60fc4-b242-575c-ac34-784745704068','users','edit','Seed permission users:edit'),
('aa972c14-de35-58c0-848f-a718f67b8976','users','delete','Seed permission users:delete'),
('dc6d4683-c3c3-5268-8c93-137592ee2bb5','users','assign_role','Seed permission users:assign_role'),
('d6ecc48a-0ac6-5d77-bd29-ef37e75027a0','crm','view','Seed permission crm:view'),
('d10b683c-52b4-5a26-962c-4447b6c091ed','crm','create','Seed permission crm:create'),
('18004357-668f-565f-b8fb-ec4aba991927','crm','edit','Seed permission crm:edit'),
('580056fb-0913-5739-a475-af383ec7aae0','crm','delete','Seed permission crm:delete'),
('db0fd10c-c992-565c-8942-6bb4f1bd4fb4','crm','assign','Seed permission crm:assign'),
('7eaa14ee-c9ee-5a01-ac13-c2294f4639ce','sales','view','Seed permission sales:view'),
('16096b72-9558-52d8-a0cd-34a34b8cbdbb','sales','create','Seed permission sales:create'),
('3fd410dc-e5af-5dd5-ab2f-e645f28d29ea','sales','edit','Seed permission sales:edit'),
('66d90e1a-fea7-53a0-a651-c3779735a87d','sales','approve','Seed permission sales:approve'),
('65379450-9fb4-54d7-b372-5229d4386c15','placement','view','Seed permission placement:view'),
('60b14043-3aae-5e3a-8a76-65e1a3c406d7','placement','create','Seed permission placement:create'),
('6f51d169-8f13-5196-90f2-9b7229e8ebd3','placement','edit','Seed permission placement:edit'),
('0fa74cb2-f7e9-57de-a202-e01643579a3e','placement','delete','Seed permission placement:delete'),
('6ebf0367-7adf-5049-906e-54a792586466','groups','view','Seed permission groups:view'),
('d7c3a0cf-3241-5694-9e06-93c0803d490a','groups','create','Seed permission groups:create'),
('21ce304a-45ec-56a0-918a-d0cf6ae37ecc','groups','edit','Seed permission groups:edit'),
('552e4636-9399-5cdd-9575-e09178cc98ac','groups','delete','Seed permission groups:delete'),
('efac745f-7f57-5b00-bc28-99a93ef7d427','attendance','view','Seed permission attendance:view'),
('0939307f-4912-53c6-8e64-ef5fb9f6b312','attendance','create','Seed permission attendance:create'),
('f5c86fbc-99d2-532e-86c8-6641e2db8e99','attendance','edit','Seed permission attendance:edit'),
('c452451a-d9eb-5fb2-9a24-79aeb78f94a0','attendance','lock','Seed permission attendance:lock'),
('0b5a9afa-dc0c-54a8-ba64-f599c400e5d5','lms','view','Seed permission lms:view'),
('08352159-fce9-5eb6-ae91-e78c34ca9237','lms','create','Seed permission lms:create'),
('c50cf522-24d1-5744-96ed-43d635286ab5','lms','edit','Seed permission lms:edit'),
('6d738ea8-77e7-5564-a5ca-da8a397f2a95','lms','delete','Seed permission lms:delete'),
('c5a9a38a-e1e4-537f-9071-84450a35b91d','lms','grade','Seed permission lms:grade'),
('3d5d9f8b-78ed-56df-9e9d-401c60473f40','chat','view','Seed permission chat:view'),
('58742413-c353-5b11-a2a6-6be8bd8ecd14','chat','send','Seed permission chat:send'),
('70f23bf5-fe0a-5579-86b4-94c24b955d08','chat','moderate','Seed permission chat:moderate'),
('68fb8b1d-1727-5b30-ade6-9bae5e3c638e','chat','ban','Seed permission chat:ban'),
('4cbb1cab-ad47-5147-b82f-33a5b45c8066','finance','view','Seed permission finance:view'),
('7eb4c0ff-aa39-5393-a34e-a8ac763de48b','finance','create','Seed permission finance:create'),
('5c20ce3b-0865-5a7b-8cee-f62432c0ab23','finance','edit','Seed permission finance:edit'),
('7b087eac-4a41-5c45-9346-2df9f349a001','finance','approve','Seed permission finance:approve'),
('ade7f16c-5a83-5738-8ea9-8793446d0e0e','finance','export','Seed permission finance:export'),
('2225d790-2b01-5af3-a2f3-f31a6d8dc516','certificates','view','Seed permission certificates:view'),
('325b05c9-32fd-5a38-88e1-dcaa3c15ada7','certificates','create','Seed permission certificates:create'),
('25dfe472-b34b-5f4d-b66f-79587b0b655e','certificates','edit','Seed permission certificates:edit'),
('77c33228-2a86-5b74-9df0-1ebcb8ee230d','certificates','revoke','Seed permission certificates:revoke'),
('51a083cb-ef91-5f9a-89be-64a58544825a','hr','view','Seed permission hr:view'),
('2cd58b08-1607-5800-91fa-983c0b2ed7fb','hr','create','Seed permission hr:create'),
('355d699e-0c44-5199-9806-a17b40f628f1','hr','edit','Seed permission hr:edit'),
('f37e38a7-fbaf-5623-a6b9-792b3d742501','hr','approve','Seed permission hr:approve'),
('61d24be9-0377-514c-8da6-1232472b327b','hr','process_payroll','Seed permission hr:process_payroll'),
('1912b28b-259c-5c6d-9023-b0407e081b05','activities','view','Seed permission activities:view'),
('3446040b-b4f4-5047-8e5f-a5ef5b933d28','activities','create','Seed permission activities:create'),
('97cb135c-1edf-5376-9f3b-d2661cba1d44','activities','edit','Seed permission activities:edit'),
('1f20aa7e-735f-5b62-8806-4e8ec4071b7e','activities','delete','Seed permission activities:delete'),
('7871f775-84d1-539b-8bec-4e8e5fba1d71','inventory','view','Seed permission inventory:view'),
('52c91cd8-be4a-5b0d-9b34-e77ba44e4363','inventory','create','Seed permission inventory:create'),
('957b5960-3836-5b21-bf6b-eb0ee3f6e744','inventory','edit','Seed permission inventory:edit'),
('5f831c8b-06c0-5433-9426-797ee3773f08','inventory','issue','Seed permission inventory:issue'),
('548f1407-755e-5338-aab3-64c091d45c62','kb','view','Seed permission kb:view'),
('490f6e60-ea5c-5d02-bcc6-efed8ad54f3b','kb','create','Seed permission kb:create'),
('3949bd22-113d-5822-b4e7-386cb99b07ef','kb','edit','Seed permission kb:edit'),
('9a83ae48-94df-51b6-8339-ff66fa467d99','kb','delete','Seed permission kb:delete'),
('fba2d39f-70ea-5f42-81d8-e2810b86ab99','reports','view','Seed permission reports:view'),
('71ef3ff5-db25-58d6-b4de-2f2beb05fa07','reports','export','Seed permission reports:export'),
('95af5209-576d-5db5-b49a-4ba4bb1d52b0','branches','view','Seed permission branches:view'),
('aceca1a9-183d-5d8e-8054-ffce5fdf407e','branches','create','Seed permission branches:create'),
('0b83db4a-b620-501c-b2a3-6eb87ffb4aa2','branches','edit','Seed permission branches:edit'),
('575f8752-4b8b-5c5e-8583-3462054fb43f','branches','delete','Seed permission branches:delete'),
('59488f95-8580-5299-8b58-6166f7d56fcd','system','view','Seed permission system:view'),
('ffdd09a6-87ef-5f62-a321-aeaf84b4fcee','system','edit','Seed permission system:edit'),
('9d3621d5-7661-586b-98ed-96d868fc6ce5','system','manage_roles','Seed permission system:manage_roles'),
('39c58437-c7b1-5619-b06d-7fad3f56bb04','system','audit','Seed permission system:audit')
ON CONFLICT (module,action) DO NOTHING;


INSERT INTO users (id,email,phone,password_hash,first_name,last_name,language,branch_id,status,email_verified_at,phone_verified_at,chat_policy_accepted_at) VALUES
('f54bc944-43f9-5b09-8a79-979d2186bc31','test.admin@speakup.test','+201111000001',crypt('Admin@1234', gen_salt('bf', 10)),'Test','Admin','en','66fc3021-8661-503f-b5c8-cea9e67629e6','active',NOW(),NOW(),NOW()),
('31d5ee25-71b5-5dbb-93cb-818ee85e084b','test.manager@speakup.test','+201111000002',crypt('Test@1234', gen_salt('bf', 10)),'Test','Manager','en','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','active',NOW(),NOW(),NOW()),
('78cfa859-27ec-5273-8937-3446b7575ce2','test.sales@speakup.test','+201111000003',crypt('Test@1234', gen_salt('bf', 10)),'Test','Sales','en','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','active',NOW(),NOW(),NOW()),
('5ab51db0-5fba-52ca-b0a4-5528705e2e5f','test.finance@speakup.test','+201111000004',crypt('Test@1234', gen_salt('bf', 10)),'Test','Finance','en','66fc3021-8661-503f-b5c8-cea9e67629e6','active',NOW(),NOW(),NOW()),
('9b3dc22e-70c1-5ab5-85c3-25adcbc05b77','test.academic@speakup.test','+201111000005',crypt('Test@1234', gen_salt('bf', 10)),'Test','Academic','en','66fc3021-8661-503f-b5c8-cea9e67629e6','active',NOW(),NOW(),NOW()),
('d3995993-c92b-5696-b5eb-f7f09a1031e4','test.teacher1@speakup.test','+201111000006',crypt('Test@1234', gen_salt('bf', 10)),'Test','Teacher One','en','66fc3021-8661-503f-b5c8-cea9e67629e6','active',NOW(),NOW(),NOW()),
('76405d67-fa63-58d9-bfd7-601661734136','test.teacher2@speakup.test','+201111000007',crypt('Test@1234', gen_salt('bf', 10)),'Test','Teacher Two','en','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','active',NOW(),NOW(),NOW()),
('abe6a78b-d48f-534c-976b-5deb78a34c18','test.moderator@speakup.test','+201111000008',crypt('Test@1234', gen_salt('bf', 10)),'Test','Moderator','en','66fc3021-8661-503f-b5c8-cea9e67629e6','active',NOW(),NOW(),NOW()),
('cc7abac3-7af3-5fd3-8560-e2eaea1a057c','test.hr@speakup.test','+201111000009',crypt('Test@1234', gen_salt('bf', 10)),'Test','HR','en','5a783991-fdfa-516a-802b-ef204ee4b57f','active',NOW(),NOW(),NOW()),
('cbae18b1-1339-5eaf-a3e1-212469403e72','test.auditor@speakup.test','+201111000010',crypt('Test@1234', gen_salt('bf', 10)),'Test','Auditor','en','5a783991-fdfa-516a-802b-ef204ee4b57f','active',NOW(),NOW(),NOW()),
('46020932-b634-5ac4-be12-2969f1f15c93','student.one@speakup.test','+201111000011',crypt('Test@1234', gen_salt('bf', 10)),'Student','One','en','66fc3021-8661-503f-b5c8-cea9e67629e6','active',NOW(),NOW(),NOW()),
('006db1c6-18d5-587c-8640-6996aa62605d','student.two@speakup.test','+201111000012',crypt('Test@1234', gen_salt('bf', 10)),'Student','Two','en','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','active',NOW(),NOW(),NOW())
ON CONFLICT DO NOTHING;


-- Role -> permission matrix
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.slug='super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 (p.module='users' AND p.action IN ('view','read','create','edit')) OR
 p.module IN ('groups','attendance','inventory','kb','chat') OR
 (p.module='crm' AND p.action IN ('view','create','edit','assign')) OR
 (p.module='sales' AND p.action IN ('view','edit')) OR
 (p.module='placement' AND p.action='view') OR
 (p.module='lms' AND p.action='view') OR
 (p.module='finance' AND p.action IN ('view','create')) OR
 (p.module='certificates' AND p.action IN ('view','create')) OR
 (p.module='activities' AND p.action IN ('view','create','edit')) OR
 (p.module='reports' AND p.action IN ('view','export')) OR
 (p.module='branches' AND p.action='view') OR
 (p.module='system' AND p.action='view')
) WHERE r.slug='branch_manager' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 (p.module='crm' AND p.action IN ('view','create','edit','assign')) OR
 (p.module='sales' AND p.action IN ('view','create','edit')) OR
 (p.module='placement' AND p.action='view') OR
 (p.module='groups' AND p.action='view') OR
 (p.module='attendance' AND p.action='view') OR
 (p.module='activities' AND p.action='view') OR
 (p.module='inventory' AND p.action IN ('view','issue')) OR
 (p.module='chat' AND p.action IN ('view','send')) OR
 (p.module='kb' AND p.action='view')
) WHERE r.slug='sales' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 p.module IN ('finance','reports') OR
 (p.module='crm' AND p.action='view') OR
 (p.module='certificates' AND p.action='view') OR
 (p.module='inventory' AND p.action='view') OR
 (p.module='kb' AND p.action='view')
) WHERE r.slug='finance' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 p.module IN ('placement','groups','attendance','lms','certificates') OR
 (p.module='reports' AND p.action IN ('view','export')) OR
 (p.module='chat' AND p.action IN ('view','send')) OR
 (p.module='kb' AND p.action='view')
) WHERE r.slug='academic' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 (p.module='attendance' AND p.action IN ('view','create','edit')) OR
 (p.module='lms' AND p.action IN ('view','create','edit','grade')) OR
 (p.module='groups' AND p.action='view') OR
 (p.module='chat' AND p.action IN ('view','send')) OR
 (p.module='kb' AND p.action='view') OR
 (p.module='reports' AND p.action='view')
) WHERE r.slug='teacher' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 (p.module='lms' AND p.action='view') OR
 (p.module='chat' AND p.action IN ('view','send')) OR
 (p.module='activities' AND p.action='view') OR
 (p.module='kb' AND p.action='view')
) WHERE r.slug='student' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 (p.module='chat' AND p.action IN ('view','moderate','ban')) OR
 (p.module='system' AND p.action='audit')
) WHERE r.slug='moderator' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 p.module='hr' OR (p.module='kb' AND p.action IN ('view','create','edit')) OR
 (p.module='reports' AND p.action='view') OR (p.module='chat' AND p.action='view')
) WHERE r.slug='hr' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON (
 p.action='view' OR (p.module='reports' AND p.action='export') OR
 (p.module='system' AND p.action='audit')
) WHERE r.slug='auditor' ON CONFLICT DO NOTHING;

-- User -> role assignments
INSERT INTO user_roles(user_id,role_id,assigned_by)
SELECT u.id,r.id,(SELECT id FROM users WHERE email='test.admin@speakup.test')
FROM (VALUES
 ('test.admin@speakup.test','super_admin'),
 ('test.manager@speakup.test','branch_manager'),
 ('test.sales@speakup.test','sales'),
 ('test.finance@speakup.test','finance'),
 ('test.academic@speakup.test','academic'),
 ('test.teacher1@speakup.test','teacher'),
 ('test.teacher2@speakup.test','teacher'),
 ('test.moderator@speakup.test','moderator'),
 ('test.hr@speakup.test','hr'),
 ('test.auditor@speakup.test','auditor'),
 ('student.one@speakup.test','student'),
 ('student.two@speakup.test','student')
) v(email,slug)
JOIN users u ON u.email=v.email
JOIN roles r ON r.slug=v.slug
ON CONFLICT DO NOTHING;

UPDATE branches SET manager_id=(SELECT id FROM users WHERE email='test.admin@speakup.test')
WHERE id='66fc3021-8661-503f-b5c8-cea9e67629e6';
UPDATE branches SET manager_id=(SELECT id FROM users WHERE email='test.manager@speakup.test')
WHERE id='41a77ad8-a44e-5f27-9b30-f1ad0e62e98a';


INSERT INTO classrooms (id,branch_id,name,capacity,type,status) VALUES
('20ce1287-84e6-57aa-9854-2d55a7398b69','66fc3021-8661-503f-b5c8-cea9e67629e6','Seed Room 101',20,'standard','active'),
('b89065d2-3297-5761-b917-3b82a073c8fb','66fc3021-8661-503f-b5c8-cea9e67629e6','Seed Lab A',16,'lab','active'),
('d7a829bf-085f-5999-a7a0-81a29f4fa6c3','66fc3021-8661-503f-b5c8-cea9e67629e6','Seed Conference',12,'conference','active'),
('4e6e86d8-e553-5cac-9735-287a4ba476ac','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','Seed Room 201',18,'standard','active'),
('375b6e9e-a777-5d8e-b8cc-0de48f1a8869','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','Seed Room 202',20,'standard','active'),
('a5f8672d-3766-52d7-92f0-a17207eeaca0','5a783991-fdfa-516a-802b-ef204ee4b57f','Seed Room 301',20,'standard','active')
ON CONFLICT DO NOTHING;


INSERT INTO leads (id,first_name,last_name,phone,email,national_id,source,status,level_interest,notes,assigned_to,branch_id) VALUES
('a933cad8-3039-5942-abdd-0ecc8fa5a37b','Ahmed','Hassan','+201300000001','seed.ahmed.lead@speakup.test','SEED-NID-001','website','new','A1','Seed CRM lead for testing','78cfa859-27ec-5273-8937-3446b7575ce2','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a'),
('ef3f17c4-deee-5015-a3fb-7192a7dc5c6f','Mona','Ali','+201300000002','seed.mona.lead@speakup.test','SEED-NID-002','referral','test_scheduled','B1','Seed CRM lead for testing','78cfa859-27ec-5273-8937-3446b7575ce2','66fc3021-8661-503f-b5c8-cea9e67629e6'),
('01d3e754-72b9-5c8c-9c34-20b67cbce1d3','Omar','Samir','+201300000003','seed.omar.lead@speakup.test','SEED-NID-003','walk_in','interested','A2','Seed CRM lead for testing','78cfa859-27ec-5273-8937-3446b7575ce2','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a'),
('dc397060-ffb5-5c5a-b05e-bff9147c5012','Sara','Nabil','+201300000004','seed.sara.lead@speakup.test','SEED-NID-004','website','enrolled','C1','Seed CRM lead for testing','78cfa859-27ec-5273-8937-3446b7575ce2','66fc3021-8661-503f-b5c8-cea9e67629e6')
ON CONFLICT DO NOTHING;


INSERT INTO students (id,user_id,student_number,current_level,status,enrollment_date,branch_id) VALUES
('b8430eec-4181-577f-a38b-933397704e7a','46020932-b634-5ac4-be12-2969f1f15c93','SEED-STU-001','A1','active',CURRENT_DATE-INTERVAL '45 days','66fc3021-8661-503f-b5c8-cea9e67629e6'),
('72233c04-278a-5fb3-bf78-af38772e9a13','006db1c6-18d5-587c-8640-6996aa62605d','SEED-STU-002','B1','active',CURRENT_DATE-INTERVAL '30 days','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a')
ON CONFLICT DO NOTHING;


INSERT INTO courses (id,name,code,level,duration_hours,syllabus,description,default_price,min_age,max_age,status) VALUES
('958e6b86-4e2e-5096-8e80-eb398a91350e','English A1 Foundation','SEED-A1-2026','A1',60,'Seed syllabus','Seed A1 course for testing',2500,14,70,'active'),
('70d3df4e-04ce-56de-901a-f3bd6a5a0f79','English A2 Elementary','SEED-A2-2026','A2',60,'Seed syllabus','Seed A2 course for testing',2800,14,70,'active'),
('455c70b3-8433-5dbb-a3a0-105111f88bb5','English B1 Intermediate','SEED-B1-2026','B1',60,'Seed syllabus','Seed B1 course for testing',3200,14,70,'active'),
('9e91e52e-6f7d-596d-bf63-f601cd60566a','English B2 Upper Intermediate','SEED-B2-2026','B2',72,'Seed syllabus','Seed B2 course for testing',3600,14,70,'active'),
('587707ba-b5dd-580e-b9cf-64850ee9c831','English C1 Advanced','SEED-C1-2026','C1',72,'Seed syllabus','Seed C1 course for testing',4200,14,70,'active'),
('ff88bcad-a1c8-57e4-96e6-45600846552a','English C2 Proficiency','SEED-C2-2026','C2',72,'Seed syllabus','Seed C2 course for testing',4800,14,70,'active')
ON CONFLICT DO NOTHING;


INSERT INTO inventory_items (id,sku,name,description,category,unit_cost,sale_price,unit_of_measure,reorder_level,status) VALUES
('743ef857-e671-5a04-9f16-fbab3463d152','SEED-BOOK-A1','A1 Student Book','Seed book','book',180,250,'piece',10,'active'),
('46880901-cff0-5c43-a855-91d0d0b457d5','SEED-WB-A1','A1 Workbook','Seed workbook','workbook',120,180,'piece',15,'active'),
('484c9a93-e459-51f7-b679-e5e9c6f7ff14','SEED-MUG','SpeakUp Mug','Seed merchandise','merchandise',80,150,'piece',5,'active')
ON CONFLICT DO NOTHING;


-- lead_activities
INSERT INTO lead_activities (id,lead_id,type,note) VALUES
('5c982c1b-dd1a-5f5c-8f2d-3a7f1a8c8302','a933cad8-3039-5942-abdd-0ecc8fa5a37b','call','Generic seed activity')
ON CONFLICT DO NOTHING;


-- lead_tags
INSERT INTO lead_tags (id,name,color) VALUES
('f55a69c7-0403-58d6-811b-b7f16ea56b80','Seed General','#3366FF')
ON CONFLICT DO NOTHING;


-- lead_tag_pivot
INSERT INTO lead_tag_pivot (lead_id,tag_id) VALUES
('a933cad8-3039-5942-abdd-0ecc8fa5a37b','f55a69c7-0403-58d6-811b-b7f16ea56b80')
ON CONFLICT DO NOTHING;


-- follow_ups
INSERT INTO follow_ups (id,lead_id,assigned_to,due_date,note,status) VALUES
('a0ff8499-116f-50ff-8c36-1b7fe57752db','a933cad8-3039-5942-abdd-0ecc8fa5a37b','f54bc944-43f9-5b09-8a79-979d2186bc31',NOW(),'Generic seed follow-up','pending')
ON CONFLICT DO NOTHING;


-- sales_targets
INSERT INTO sales_targets (id,agent_id,month,year,target_amount,target_conversions) VALUES
('7afe9a4d-b2c3-5e97-9d83-73c3fc0f59ec','f54bc944-43f9-5b09-8a79-979d2186bc31',9,2026,100000,10)
ON CONFLICT DO NOTHING;


-- student_profiles
INSERT INTO student_profiles (id,student_id,notes) VALUES
('491f6281-cd74-5f61-ac35-3950d9c03224','b8430eec-4181-577f-a38b-933397704e7a','Generic seed profile')
ON CONFLICT DO NOTHING;


-- student_level_history
INSERT INTO student_level_history (id,student_id,old_level,new_level,reason) VALUES
('94022f20-578b-5ae2-9dee-67d2f269d932','b8430eec-4181-577f-a38b-933397704e7a','A1','A2','course_completion')
ON CONFLICT DO NOTHING;


-- referrals
INSERT INTO referrals (id,referrer_student_id,referred_lead_id,credit_amount,status) VALUES
('c7c263eb-5ecb-5fb0-963f-8cea33974228','b8430eec-4181-577f-a38b-933397704e7a','a933cad8-3039-5942-abdd-0ecc8fa5a37b',100,'pending')
ON CONFLICT DO NOTHING;


-- course_materials
INSERT INTO course_materials (id,course_id,inventory_item_id,is_required,quantity_per_student) VALUES
('527c2266-4873-50b5-a7c6-e98d40aaf5f8','958e6b86-4e2e-5096-8e80-eb398a91350e','743ef857-e671-5a04-9f16-fbab3463d152',TRUE,1)
ON CONFLICT DO NOTHING;


-- groups
INSERT INTO groups (id,name,course_id,teacher_id,branch_id,capacity,start_date,end_date,status,mode) VALUES
('fe652f07-65d3-586c-a5c3-b3ecaeeda736','Seed Groups','958e6b86-4e2e-5096-8e80-eb398a91350e','f54bc944-43f9-5b09-8a79-979d2186bc31','66fc3021-8661-503f-b5c8-cea9e67629e6',20,CURRENT_DATE,CURRENT_DATE+INTERVAL '60 days','upcoming','in_person')
ON CONFLICT DO NOTHING;


-- group_schedules
INSERT INTO group_schedules (id,group_id,day_of_week,start_time,end_time,is_recurring) VALUES
('6f8c07f1-6968-5e28-8406-75b723c937af','fe652f07-65d3-586c-a5c3-b3ecaeeda736',1,'09:00','11:00',TRUE)
ON CONFLICT DO NOTHING;


-- group_students
INSERT INTO group_students (id,group_id,student_id,status) VALUES
('709c8b8d-6893-5a87-9434-ecc45e1db08d','fe652f07-65d3-586c-a5c3-b3ecaeeda736','b8430eec-4181-577f-a38b-933397704e7a','active')
ON CONFLICT DO NOTHING;


-- waitlists
INSERT INTO waitlists (id,student_id,course_id,level,priority,status,notes) VALUES
('07cfdd8c-06b0-546d-8a11-1439dbe61438','b8430eec-4181-577f-a38b-933397704e7a','958e6b86-4e2e-5096-8e80-eb398a91350e','A1',1,'waiting','Generic seed waitlist')
ON CONFLICT DO NOTHING;


-- sessions
INSERT INTO sessions (id,group_id,date,start_time,end_time,mode,topic) VALUES
('23b3756a-0eae-560e-baf6-b47d981b4ff1','fe652f07-65d3-586c-a5c3-b3ecaeeda736',CURRENT_DATE,'09:00','11:00','in_person','Seed session')
ON CONFLICT DO NOTHING;


-- attendances
INSERT INTO attendances (id,session_id,student_id,status,check_in_method,minutes_late) VALUES
('2e981e5a-92a1-5e08-b61d-7065371140eb','23b3756a-0eae-560e-baf6-b47d981b4ff1','b8430eec-4181-577f-a38b-933397704e7a','present','manual',0)
ON CONFLICT DO NOTHING;


-- test_slots
INSERT INTO test_slots (id,branch_id,examiner_id,date,start_time,end_time,mode,capacity,booked_count,status) VALUES
('b7c26f95-cd8a-5d42-bd72-835379c4c2d5','66fc3021-8661-503f-b5c8-cea9e67629e6','f54bc944-43f9-5b09-8a79-979d2186bc31',CURRENT_DATE+INTERVAL '1 day','12:00','13:00','in_person',1,0,'open')
ON CONFLICT DO NOTHING;


-- placement_tests
INSERT INTO placement_tests (id,lead_id,slot_id,examiner_id,scheduled_at,status) VALUES
('4528edc2-673c-51c2-8b4a-ec9405a70eea','a933cad8-3039-5942-abdd-0ecc8fa5a37b','b7c26f95-cd8a-5d42-bd72-835379c4c2d5','f54bc944-43f9-5b09-8a79-979d2186bc31',NOW()+INTERVAL '1 day','scheduled')
ON CONFLICT DO NOTHING;


-- test_questions
INSERT INTO test_questions (id,question_text,type,correct_answer,level,category,points,is_active) VALUES
('36c38ed7-ce4d-55ac-81f6-0631004fae64','Seed question','mcq','"A"'::jsonb,'A1','grammar',1,TRUE)
ON CONFLICT DO NOTHING;


-- placement_test_answers
INSERT INTO placement_test_answers (id,test_id,question_id,answer,score,is_correct) VALUES
('871a352e-c6ae-54a9-949d-e9b84e9503df','4528edc2-673c-51c2-8b4a-ec9405a70eea','36c38ed7-ce4d-55ac-81f6-0631004fae64','"A"'::jsonb,1,TRUE)
ON CONFLICT DO NOTHING;


-- lms_modules
INSERT INTO lms_modules (id,group_id,name,order,is_published) VALUES
('c30e63bc-a75f-53e8-b304-21c7f2640875','fe652f07-65d3-586c-a5c3-b3ecaeeda736','Seed Module',1,TRUE)
ON CONFLICT DO NOTHING;


-- lms_lessons
INSERT INTO lms_lessons (id,module_id,name,order,type,duration_minutes,is_published,content) VALUES
('fad3d413-278b-51de-ad41-05ef90679599','c30e63bc-a75f-53e8-b304-21c7f2640875','Seed Lesson',1,'content',45,TRUE,'Seed lesson content')
ON CONFLICT DO NOTHING;


-- lms_resources
INSERT INTO lms_resources (id,lesson_id,name,type,external_url,access_control) VALUES
('b8d10222-4aeb-5c99-a22e-a8a929d0909c','fad3d413-278b-51de-ad41-05ef90679599','Seed Resource','link','https://example.com/seed','enrolled')
ON CONFLICT DO NOTHING;


-- assignments
INSERT INTO assignments (id,group_id,title,due_at,type,max_grade,allow_late_submission,late_penalty_percent,is_published) VALUES
('265f3866-5e82-5318-bfa1-202d366903de','fe652f07-65d3-586c-a5c3-b3ecaeeda736','Seed Assignment',NOW()+INTERVAL '7 days','text',100,TRUE,10,TRUE)
ON CONFLICT DO NOTHING;


-- submissions
INSERT INTO submissions (id,assignment_id,student_id,content,submitted_at,grade,feedback,status,graded_by,graded_at) VALUES
('e98c0edf-99ef-54cb-a329-e4326937900b','265f3866-5e82-5318-bfa1-202d366903de','b8430eec-4181-577f-a38b-933397704e7a','Seed submission',NOW()-INTERVAL '1 day',88,'Good work','graded','d3995993-c92b-5696-b5eb-f7f09a1031e4',NOW()-INTERVAL '12 hours')
ON CONFLICT DO NOTHING;


-- quizzes
INSERT INTO quizzes (id,group_id,title,time_limit_minutes,max_attempts,shuffle_questions,shuffle_options,release_type,passing_score,is_published) VALUES
('c0e8729c-aca8-5e4e-9f3a-c493539cb88a','fe652f07-65d3-586c-a5c3-b3ecaeeda736','Seed Quiz',20,2,TRUE,TRUE,'instant',60,TRUE)
ON CONFLICT DO NOTHING;


-- quiz_questions
INSERT INTO quiz_questions (id,quiz_id,question_text,type,correct_answer,order,options,points) VALUES
('43234a08-e811-5e42-bb38-f090aaa0bccf','c0e8729c-aca8-5e4e-9f3a-c493539cb88a','Seed quiz question','mcq','"A"'::jsonb,1,'["A","B","C"]'::jsonb,1)
ON CONFLICT DO NOTHING;


-- quiz_attempts
INSERT INTO quiz_attempts (id,quiz_id,student_id,attempt_number,answers,started_at,score,percentage,is_passed,submitted_at,time_spent_seconds,status,graded_by,graded_at) VALUES
('9500fa79-661f-5788-9832-35f3f96f98ea','c0e8729c-aca8-5e4e-9f3a-c493539cb88a','b8430eec-4181-577f-a38b-933397704e7a',1,'{}'::jsonb,NOW()-INTERVAL '1 day',1,100,TRUE,NOW()-INTERVAL '1 day'+INTERVAL '10 minutes',600,'graded','d3995993-c92b-5696-b5eb-f7f09a1031e4',NOW()-INTERVAL '1 day')
ON CONFLICT DO NOTHING;


-- gradebook_categories
INSERT INTO gradebook_categories (id,group_id,name,weight,order) VALUES
('b757ba33-a688-543f-9166-7b06480ae6dc','fe652f07-65d3-586c-a5c3-b3ecaeeda736','Participation',30,1)
ON CONFLICT DO NOTHING;


-- gradebook_entries
INSERT INTO gradebook_entries (id,group_id,student_id,category_id,score,max_score,percentage,weighted_score,reference_type) VALUES
('89d5ee38-9559-5115-abbc-436b48f78df2','fe652f07-65d3-586c-a5c3-b3ecaeeda736','b8430eec-4181-577f-a38b-933397704e7a','b757ba33-a688-543f-9166-7b06480ae6dc',80,100,80,24,'manual')
ON CONFLICT DO NOTHING;


-- teacher_evaluations
INSERT INTO teacher_evaluations (id,group_id,student_id,teacher_id,term,form_data,overall_comment,is_shared_with_student) VALUES
('067a897d-836e-5b52-806c-f360d1c80aa3','fe652f07-65d3-586c-a5c3-b3ecaeeda736','b8430eec-4181-577f-a38b-933397704e7a','f54bc944-43f9-5b09-8a79-979d2186bc31','Seed Term','{}'::jsonb,'Seed evaluation',TRUE)
ON CONFLICT DO NOTHING;


-- student_surveys
INSERT INTO student_surveys (id,group_id,student_id,teacher_id,term,responses,overall_rating,comment,is_anonymous) VALUES
('48e15e8a-a9ac-5cf0-9d43-e0dcf3f69067','fe652f07-65d3-586c-a5c3-b3ecaeeda736','b8430eec-4181-577f-a38b-933397704e7a','f54bc944-43f9-5b09-8a79-979d2186bc31','Seed Term','{"teaching":5,"materials":4,"pace":5}'::jsonb,5,'Seed survey',FALSE)
ON CONFLICT DO NOTHING;


-- promo_codes
INSERT INTO promo_codes (id,code,type,value,expiry_date,max_discount,usage_limit,used_count,applicable_courses,status) VALUES
('5eaa1e00-bc77-5694-adca-e86007c6c649','SEED10','percentage',10,CURRENT_DATE+INTERVAL '90 days',500,100,2,'["SEED-A1-2026","SEED-B1-2026"]'::jsonb,'active')
ON CONFLICT DO NOTHING;


-- enrollments
INSERT INTO enrollments (id,student_id,group_id,total_fee,final_amount,discount_amount,status,enrolled_at) VALUES
('0e84a66f-3de5-5b53-bff7-0bb30a870d83','b8430eec-4181-577f-a38b-933397704e7a','fe652f07-65d3-586c-a5c3-b3ecaeeda736',2500,2500,0,'active',NOW()-INTERVAL '20 days')
ON CONFLICT DO NOTHING;


-- invoices
INSERT INTO invoices (id,invoice_number,enrollment_id,student_id,branch_id,subtotal,total_amount,balance_due,due_date,discount_amount,tax_amount,paid_amount,status,is_e_invoice,notes) VALUES
('72413858-0205-5187-904b-9c4c1feb949a','SEED-INV-001','0e84a66f-3de5-5b53-bff7-0bb30a870d83','b8430eec-4181-577f-a38b-933397704e7a','66fc3021-8661-503f-b5c8-cea9e67629e6',2500,2500,1500,CURRENT_DATE+INTERVAL '15 days',0,0,1000,'partial',FALSE,'Seed invoice')
ON CONFLICT DO NOTHING;


-- payments
INSERT INTO payments (id,invoice_id,amount,method,paid_at,status,receipt_number) VALUES
('eebb1de8-d361-535d-8b91-2f31f6eec30e','72413858-0205-5187-904b-9c4c1feb949a',1000,'cash',NOW()-INTERVAL '3 days','completed','SEED-RCP-001')
ON CONFLICT DO NOTHING;


-- installments
INSERT INTO installments (id,invoice_id,installment_number,amount,due_date,paid_amount,paid_at,status) VALUES
('9520032e-63a4-5825-b833-ed4128575317','72413858-0205-5187-904b-9c4c1feb949a',1,1250,CURRENT_DATE-INTERVAL '5 days',1000,NOW()-INTERVAL '3 days','partial')
ON CONFLICT DO NOTHING;


-- refunds
INSERT INTO refunds (id,payment_id,invoice_id,amount,reason_code,status,approved_by,approved_at,processed_by,processed_at) VALUES
('463a61a6-9977-5f66-b08e-b9ddaa48224d','eebb1de8-d361-535d-8b91-2f31f6eec30e','72413858-0205-5187-904b-9c4c1feb949a',100,'error','processed','31d5ee25-71b5-5dbb-93cb-818ee85e084b',NOW()-INTERVAL '2 days','5ab51db0-5fba-52ca-b0a4-5528705e2e5f',NOW()-INTERVAL '1 day')
ON CONFLICT DO NOTHING;


-- financial_transactions
INSERT INTO financial_transactions (id,transaction_type,direction,amount,transaction_date,description) VALUES
('2979ba26-39f9-5515-bdfc-0366ce06b625','payment','in',1000,NOW()-INTERVAL '3 days','Seed payment')
ON CONFLICT DO NOTHING;


-- invoice_items
INSERT INTO invoice_items (id,invoice_id,item_type,description,total_amount,quantity,unit_price,discount_amount,tax_amount) VALUES
('481ea0c6-834d-5411-a10e-35af026b3d29','72413858-0205-5187-904b-9c4c1feb949a','course','A1 course',2500,1,2500,0,0)
ON CONFLICT DO NOTHING;


-- certificate_templates
INSERT INTO certificate_templates (id,name,html_template,placeholders,is_default,status) VALUES
('dba32d6c-6ecf-52a2-bc60-fce1fe9381b7','Seed Completion Certificate','<html><body>{{student_name}} - {{course_name}}</body></html>','{"student_name":"Student name","course_name":"Course name"}'::jsonb,TRUE,'active')
ON CONFLICT DO NOTHING;


-- certificates
INSERT INTO certificates (id,student_id,course_id,group_id,code,issue_date,status,is_auto_issued) VALUES
('acb0d651-459a-5164-927d-f464bf7423ae','b8430eec-4181-577f-a38b-933397704e7a','958e6b86-4e2e-5096-8e80-eb398a91350e','fe652f07-65d3-586c-a5c3-b3ecaeeda736','SEED-CERT-001',CURRENT_DATE-INTERVAL '10 days','active',TRUE)
ON CONFLICT DO NOTHING;


-- employees
INSERT INTO employees (id,user_id,employee_type,job_title,contract_start,employee_number,salary,currency,status) VALUES
('b28c81bb-4473-56fb-862f-b4acf2938b95','f54bc944-43f9-5b09-8a79-979d2186bc31','full_time','Seed Teacher',CURRENT_DATE-INTERVAL '180 days','SEED-EMP-001',18000,'EGP','active')
ON CONFLICT DO NOTHING;


-- employee_documents
INSERT INTO employee_documents (id,employee_id,name,file_url,document_type,expiry_date) VALUES
('37b0667f-f204-583f-a62c-1941f2811272','b28c81bb-4473-56fb-862f-b4acf2938b95','Seed Contract','https://example.com/seed-contract.pdf','contract',CURRENT_DATE+INTERVAL '300 days')
ON CONFLICT DO NOTHING;


-- teacher_availabilities
INSERT INTO teacher_availabilities (id,employee_id,day_of_week,start_time,end_time,is_available,note) VALUES
('9a1eeb1f-8923-526f-a989-d2d0741afb9a','b28c81bb-4473-56fb-862f-b4acf2938b95',1,'09:00','17:00',TRUE,'Seed availability')
ON CONFLICT DO NOTHING;


-- leave_requests
INSERT INTO leave_requests (id,employee_id,type,start_date,end_date,days_count,reason,status,approved_by,approved_at) VALUES
('5e1da629-31cd-5645-92c2-bf9e8c38d935','b28c81bb-4473-56fb-862f-b4acf2938b95','annual',CURRENT_DATE+INTERVAL '20 days',CURRENT_DATE+INTERVAL '22 days',3,'Seed leave','approved','cc7abac3-7af3-5fd3-8560-e2eaea1a057c',NOW())
ON CONFLICT DO NOTHING;


-- payroll_periods
INSERT INTO payroll_periods (id,name,start_date,end_date,status) VALUES
('72b961fe-e3d6-5cd3-a0da-14ffd38ed053','Seed Payroll Current',DATE_TRUNC('month',CURRENT_DATE)::date,(DATE_TRUNC('month',CURRENT_DATE)+INTERVAL '1 month - 1 day')::date,'open')
ON CONFLICT DO NOTHING;


-- payroll_entries
INSERT INTO payroll_entries (id,payroll_period_id,employee_id,base_amount,total_amount,hours_worked,classes_taught,bonus,deductions,hourly_rate,status) VALUES
('437291c9-904c-50d4-9b60-82b441dcbe64','72b961fe-e3d6-5cd3-a0da-14ffd38ed053','b28c81bb-4473-56fb-862f-b4acf2938b95',18000,18500,160,20,1000,500,112.5,'approved')
ON CONFLICT DO NOTHING;


-- activities
INSERT INTO activities (id,name,type,date,branch_id,capacity,start_time,end_time,location,fee,target_levels,target_groups,is_open_to_all,status) VALUES
('bea0b06b-b2d9-5e79-9f65-dc26f5f9faa7','Seed Conversation Club','conversation_club',CURRENT_DATE+INTERVAL '14 days','66fc3021-8661-503f-b5c8-cea9e67629e6',30,'18:00','20:00','Seed Main Branch',100,'["A1","A2","B1"]'::jsonb,'["seed"]'::jsonb,TRUE,'open')
ON CONFLICT DO NOTHING;


-- activity_registrations
INSERT INTO activity_registrations (id,activity_id,student_id,status,paid_amount) VALUES
('e0a3a323-7024-5183-bedd-4757dc967367','bea0b06b-b2d9-5e79-9f65-dc26f5f9faa7','b8430eec-4181-577f-a38b-933397704e7a','registered',100)
ON CONFLICT DO NOTHING;


-- activity_photos
INSERT INTO activity_photos (id,activity_id,file_url,caption) VALUES
('8e760259-c262-550e-b584-70e1f73df0f3','bea0b06b-b2d9-5e79-9f65-dc26f5f9faa7','https://example.com/seed-activity.jpg','Seed activity photo')
ON CONFLICT DO NOTHING;


-- stock_levels
INSERT INTO stock_levels (id,item_id,branch_id,quantity,reserved_quantity,last_counted_at) VALUES
('bc7b88ed-46f6-559b-8f38-d40a40acc3c8','743ef857-e671-5a04-9f16-fbab3463d152','66fc3021-8661-503f-b5c8-cea9e67629e6',50,2,NOW())
ON CONFLICT DO NOTHING;


-- stock_moves
INSERT INTO stock_moves (id,item_id,branch_id,type,quantity,reason,unit_cost,reference_type) VALUES
('89fe2141-85c5-538b-95c7-e4fa5e937a3b','743ef857-e671-5a04-9f16-fbab3463d152','66fc3021-8661-503f-b5c8-cea9e67629e6','in',50,'Seed opening stock',180,'purchase')
ON CONFLICT DO NOTHING;


-- student_item_issues
INSERT INTO student_item_issues (id,student_id,item_id,branch_id,quantity,cost,issued_at) VALUES
('8e057a5a-f34d-5bb4-b394-d458df3dd5b3','b8430eec-4181-577f-a38b-933397704e7a','743ef857-e671-5a04-9f16-fbab3463d152','66fc3021-8661-503f-b5c8-cea9e67629e6',1,250,NOW()-INTERVAL '4 days')
ON CONFLICT DO NOTHING;


-- kb_categories
INSERT INTO kb_categories (id,name,slug,description,visibility,sort_order) VALUES
('c7cd867b-4245-5707-b9cb-30e2f62e0e0f','Seed Staff Guides','seed-staff-guides','Seed knowledge base category','staff',1)
ON CONFLICT DO NOTHING;


-- kb_articles
INSERT INTO kb_articles (id,category_id,title,body,slug,excerpt,version,visibility,is_pinned,view_count) VALUES
('642be777-9c18-5d37-af58-b0ad1bf2e063','c7cd867b-4245-5707-b9cb-30e2f62e0e0f','Seed Attendance Guide','Seed article body for testing.','seed-attendance-guide','Seed article',1,'staff',TRUE,10)
ON CONFLICT DO NOTHING;


-- kb_article_versions
INSERT INTO kb_article_versions (id,article_id,body,version_number,change_note) VALUES
('3053f295-9e35-578f-bc5e-0f199dc3c2d8','642be777-9c18-5d37-af58-b0ad1bf2e063','Seed version body',1,'Initial seed')
ON CONFLICT DO NOTHING;


-- chat_rooms
INSERT INTO chat_rooms (id,type,name,topic) VALUES
('238d8c87-ad12-5b9f-a30d-94261a593f33','group','Seed A1 Chat','A1 student/teacher chat')
ON CONFLICT DO NOTHING;


-- chat_room_members
INSERT INTO chat_room_members (id,room_id,user_id,role,is_muted,is_banned) VALUES
('7867a92a-7db3-556c-9e5a-de2a56557f9d','238d8c87-ad12-5b9f-a30d-94261a593f33','f54bc944-43f9-5b09-8a79-979d2186bc31','member',FALSE,FALSE)
ON CONFLICT DO NOTHING;


-- chat_messages
INSERT INTO chat_messages (id,room_id,sender_id,body,type,is_flagged) VALUES
('652b95ff-5d8e-5304-91ae-263b0ee9be47','238d8c87-ad12-5b9f-a30d-94261a593f33','f54bc944-43f9-5b09-8a79-979d2186bc31','Hello from the SpeakUp seed dataset.','text',FALSE)
ON CONFLICT DO NOTHING;


-- chat_violations
INSERT INTO chat_violations (id,message_id,room_id,sender_id,rule_matched,original_message,action_taken,detection_method,is_false_positive,moderator_id,moderator_note) VALUES
('13aa70cd-1efb-5332-b1ae-40b422460757','652b95ff-5d8e-5304-91ae-263b0ee9be47','238d8c87-ad12-5b9f-a30d-94261a593f33','f54bc944-43f9-5b09-8a79-979d2186bc31','test_rule','seed flagged message','warned','text_regex',FALSE,'abe6a78b-d48f-534c-976b-5deb78a34c18','Seed moderation case')
ON CONFLICT DO NOTHING;


-- chat_strikes
INSERT INTO chat_strikes (id,user_id,violation_id,strike_number,action,is_active,applied_by,expires_at) VALUES
('2ae02f64-9fd8-5811-9fe7-20ef8a7c52d0','f54bc944-43f9-5b09-8a79-979d2186bc31','13aa70cd-1efb-5332-b1ae-40b422460757',1,'warning',TRUE,'abe6a78b-d48f-534c-976b-5deb78a34c18',NOW()+INTERVAL '30 days')
ON CONFLICT DO NOTHING;


-- blog_posts
INSERT INTO blog_posts (id,title,content,slug,excerpt,status,published_at,view_count) VALUES
('d2ced53b-23b1-511c-9319-51160de826c0','Seed English Learning Tips','Seed public blog post.','seed-english-learning-tips','Seed excerpt','published',NOW()-INTERVAL '5 days',25)
ON CONFLICT DO NOTHING;


-- testimonials
INSERT INTO testimonials (id,name,content,rating,course_name,is_featured,status) VALUES
('5dcd4ed8-c9cc-577e-88c5-ce4e75731545','Seed Student','Great learning experience.',5,'English A1 Foundation',TRUE,'approved')
ON CONFLICT DO NOTHING;


-- page_views
INSERT INTO page_views (id,page_path,referrer,user_agent,ip_address,session_id) VALUES
('c5cef779-997f-50d0-af2c-b4c9eaec6e2f','/courses/english-a1','https://google.com','Seed Browser','127.0.0.1','seed-session-001')
ON CONFLICT DO NOTHING;


-- notifications
INSERT INTO notifications (id,user_id,type,title,body,data,action_url) VALUES
('708dff05-e9d4-5444-bc1c-afa8b8db0fc4','f54bc944-43f9-5b09-8a79-979d2186bc31','seed','Seed Notification','This is a test notification.','{"seed":true}'::jsonb,'/dashboard')
ON CONFLICT DO NOTHING;


-- notification_preferences
INSERT INTO notification_preferences (id,user_id,channel,module,event,is_enabled) VALUES
('22b44015-0a7f-51c0-b8db-6ed9851d8fe2','f54bc944-43f9-5b09-8a79-979d2186bc31','in_app','attendance','marked',TRUE)
ON CONFLICT DO NOTHING;


-- audit_logs
INSERT INTO audit_logs (id,action,module,target_type,target_id,before_state,after_state,description,ip_address,user_agent) VALUES
('1f219b56-3b9f-51f8-b0f8-16dd3b3dfbaf','seed_data','system','seed',NULL,'{}'::jsonb,'{"status":"seeded"}'::jsonb,'Seeded test dataset','127.0.0.1','seed-script')
ON CONFLICT DO NOTHING;


-- settings
INSERT INTO settings (id,key,value,group,is_encrypted,description) VALUES
('4812b6c5-1fd3-575c-98d5-87249939f88b','seed_mode','true','development',FALSE,'Marks database as seeded for testing')
ON CONFLICT DO NOTHING;


INSERT INTO classrooms (id,branch_id,name,capacity,type,status) VALUES
('b89065d2-3297-5761-b917-3b82a073c8fb','66fc3021-8661-503f-b5c8-cea9e67629e6','Seed Lab B',16,'lab','active'),
('d7a829bf-085f-5999-a7a0-81a29f4fa6c3','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','Seed Room 202',20,'standard','active')
ON CONFLICT DO NOTHING;


INSERT INTO leads (id,first_name,last_name,phone,email,national_id,source,status,level_interest,notes,assigned_to,branch_id) VALUES
('ef3f17c4-deee-5015-a3fb-7192a7dc5c6f','Mona','Seed','+201300000002','seed.mona@speakup.test','SEED-NID-002','referral','test_scheduled','B1','Seed placement candidate','78cfa859-27ec-5273-8937-3446b7575ce2','66fc3021-8661-503f-b5c8-cea9e67629e6'),
('01d3e754-72b9-5c8c-9c34-20b67cbce1d3','Omar','Seed','+201300000003','seed.omar@speakup.test','SEED-NID-003','walk_in','interested','A2','Weekend request','78cfa859-27ec-5273-8937-3446b7575ce2','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a')
ON CONFLICT DO NOTHING;


INSERT INTO students (id,user_id,student_number,current_level,status,enrollment_date,branch_id) VALUES
('72233c04-278a-5fb3-bf78-af38772e9a13','006db1c6-18d5-587c-8640-6996aa62605d','SEED-STU-002','B1','active',CURRENT_DATE-INTERVAL '30 days','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a')
ON CONFLICT DO NOTHING;


INSERT INTO courses (id,name,code,level,duration_hours,syllabus,description,default_price,min_age,max_age,status) VALUES
('70d3df4e-04ce-56de-901a-f3bd6a5a0f79','English A2 Elementary','SEED-A2-2026','A2',60,'Seed A2 syllabus','Seed A2',2800,14,70,'active'),
('455c70b3-8433-5dbb-a3a0-105111f88bb5','English B1 Intermediate','SEED-B1-2026','B1',72,'Seed B1 syllabus','Seed B1',3200,14,70,'active'),
('9e91e52e-6f7d-596d-bf63-f601cd60566a','English B2 Upper Intermediate','SEED-B2-2026','B2',72,'Seed B2 syllabus','Seed B2',3600,15,70,'active'),
('587707ba-b5dd-580e-b9cf-64850ee9c831','English C1 Advanced','SEED-C1-2026','C1',80,'Seed C1 syllabus','Seed C1',4200,16,70,'active'),
('ff88bcad-a1c8-57e4-96e6-45600846552a','English C2 Proficiency','SEED-C2-2026','C2',80,'Seed C2 syllabus','Seed C2',4800,16,70,'active')
ON CONFLICT DO NOTHING;


INSERT INTO groups (id,name,course_id,teacher_id,substitute_teacher_id,branch_id,capacity,mode,start_date,end_date,status,created_by) VALUES
('f92fa7a5-6c6a-596c-9af1-dc13dfa70976','Seed B1 Evening','455c70b3-8433-5dbb-a3a0-105111f88bb5','76405d67-fa63-58d9-bfd7-601661734136','d3995993-c92b-5696-b5eb-f7f09a1031e4','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a',18,'hybrid',CURRENT_DATE-INTERVAL '20 days',CURRENT_DATE+INTERVAL '70 days','active','9b3dc22e-70c1-5ab5-85c3-25adcbc05b77'),
('04c1d0a6-9130-5772-b133-8de94693d52f','Seed A2 Online','70d3df4e-04ce-56de-901a-f3bd6a5a0f79','d3995993-c92b-5696-b5eb-f7f09a1031e4',NULL,'66fc3021-8661-503f-b5c8-cea9e67629e6',25,'online',CURRENT_DATE+INTERVAL '5 days',CURRENT_DATE+INTERVAL '95 days','upcoming','9b3dc22e-70c1-5ab5-85c3-25adcbc05b77'),
('c309a563-143b-5bd9-861b-334a0bfec61a','Seed C1 Weekend','587707ba-b5dd-580e-b9cf-64850ee9c831','76405d67-fa63-58d9-bfd7-601661734136',NULL,'41a77ad8-a44e-5f27-9b30-f1ad0e62e98a',20,'in_person',CURRENT_DATE+INTERVAL '7 days',CURRENT_DATE+INTERVAL '110 days','upcoming','9b3dc22e-70c1-5ab5-85c3-25adcbc05b77')
ON CONFLICT DO NOTHING;


-- Explicit role/user testing matrix
-- Students and staff are intentionally distributed across three branches.

-- Course prerequisites
INSERT INTO course_prerequisites(course_id,prerequisite_course_id,is_strict)
VALUES
('70d3df4e-04ce-56de-901a-f3bd6a5a0f79','958e6b86-4e2e-5096-8e80-eb398a91350e',TRUE),
('455c70b3-8433-5dbb-a3a0-105111f88bb5','70d3df4e-04ce-56de-901a-f3bd6a5a0f79',TRUE),
('9e91e52e-6f7d-596d-bf63-f601cd60566a','455c70b3-8433-5dbb-a3a0-105111f88bb5',FALSE),
('587707ba-b5dd-580e-b9cf-64850ee9c831','9e91e52e-6f7d-596d-bf63-f601cd60566a',TRUE)
ON CONFLICT DO NOTHING;

-- Seed group memberships
INSERT INTO group_students(id,group_id,student_id,enrolled_by,status)
VALUES
('709c8b8d-6893-5a87-9434-ecc45e1db08d','fe652f07-65d3-586c-a5c3-b3ecaeeda736','b8430eec-4181-577f-a38b-933397704e7a','78cfa859-27ec-5273-8937-3446b7575ce2','active'),
('8bbccc69-e732-53f8-937b-8d0a2279d2b4','f92fa7a5-6c6a-596c-9af1-dc13dfa70976','72233c04-278a-5fb3-bf78-af38772e9a13','78cfa859-27ec-5273-8937-3446b7575ce2','active'),
('f9395ab5-2415-516c-a62a-09d5d7cb2f65','04c1d0a6-9130-5772-b133-8de94693d52f','b8430eec-4181-577f-a38b-933397704e7a','9b3dc22e-70c1-5ab5-85c3-25adcbc05b77','active'),
('96a02141-fea4-5c98-b6f9-e0f8830cc22d','c309a563-143b-5bd9-861b-334a0bfec61a','72233c04-278a-5fb3-bf78-af38772e9a13','9b3dc22e-70c1-5ab5-85c3-25adcbc05b77','active')
ON CONFLICT DO NOTHING;

-- Make the branch manager relationship explicit again after user inserts.
UPDATE branches SET manager_id=(SELECT id FROM users WHERE email='test.admin@speakup.test') WHERE id='66fc3021-8661-503f-b5c8-cea9e67629e6';
UPDATE branches SET manager_id=(SELECT id FROM users WHERE email='test.manager@speakup.test') WHERE id='41a77ad8-a44e-5f27-9b30-f1ad0e62e98a';

-- Finish deterministic labels overwritten by schema triggers.
UPDATE students SET student_number='SEED-STU-001' WHERE id='b8430eec-4181-577f-a38b-933397704e7a';
UPDATE students SET student_number='SEED-STU-002' WHERE id='72233c04-278a-5fb3-bf78-af38772e9a13';


-- Additional schedules
INSERT INTO group_schedules(id,group_id,day_of_week,start_time,end_time,classroom_id,is_recurring)
VALUES
('9511df77-6a69-539e-8aa7-1b65eed78d5a','fe652f07-65d3-586c-a5c3-b3ecaeeda736',3,'09:00','11:00','20ce1287-84e6-57aa-9854-2d55a7398b69',TRUE),
('8b6fea51-5ec7-5518-8253-f5eaa59562d0','f92fa7a5-6c6a-596c-9af1-dc13dfa70976',2,'18:00','20:00','4e6e86d8-e553-5cac-9735-287a4ba476ac',TRUE),
('77dd226a-7b16-5cd7-9eb4-cd5e13a49f73','f92fa7a5-6c6a-596c-9af1-dc13dfa70976',4,'18:00','20:00','4e6e86d8-e553-5cac-9735-287a4ba476ac',TRUE)
ON CONFLICT DO NOTHING;

-- Placement links: generic test slot/placement rows are valid and tied to real seed users.
UPDATE placement_tests SET slot_id='b7c26f95-cd8a-5d42-bd72-835379c4c2d5', examiner_id='9b3dc22e-70c1-5ab5-85c3-25adcbc05b77'
WHERE id='4528edc2-673c-51c2-8b4a-ec9405a70eea';

-- Assignments/LMS/finance generic rows are already created for all tables.
-- Add a second LMS module/lesson/resource, assignment and quiz scenario.
INSERT INTO lms_modules(id,group_id,name,description,"order",is_published,published_at,created_by)
VALUES
('8018a412-56f7-5dd9-ab41-41f48f3f2a7d','fe652f07-65d3-586c-a5c3-b3ecaeeda736','Seed Module 2','Speaking practice',2,TRUE,NOW(), 'd3995993-c92b-5696-b5eb-f7f09a1031e4')
ON CONFLICT DO NOTHING;

INSERT INTO lms_lessons(id,module_id,name,content,type,duration_minutes,"order",is_published)
VALUES
('ff1fa39c-5c51-5dce-ab4b-93f7670dd539','8018a412-56f7-5dd9-ab41-41f48f3f2a7d','Seed Speaking Task','One-minute self introduction.','content',30,1,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO lms_resources(id,lesson_id,name,type,external_url,access_control)
VALUES
('88284900-9e83-5796-b0f6-eb1f0ad5f2ee','ff1fa39c-5c51-5dce-ab4b-93f7670dd539','Speaking Prompt','link','https://example.com/seed-speaking','enrolled')
ON CONFLICT DO NOTHING;



-- 14) TEST QUALITY FIXUPS
UPDATE groups SET teacher_id='d3995993-c92b-5696-b5eb-f7f09a1031e4' WHERE id='fe652f07-65d3-586c-a5c3-b3ecaeeda736';
UPDATE test_slots SET examiner_id='9b3dc22e-70c1-5ab5-85c3-25adcbc05b77' WHERE id='b7c26f95-cd8a-5d42-bd72-835379c4c2d5';
UPDATE teacher_evaluations SET teacher_id='d3995993-c92b-5696-b5eb-f7f09a1031e4' WHERE id='067a897d-836e-5b52-806c-f360d1c80aa3';
UPDATE student_surveys SET teacher_id='d3995993-c92b-5696-b5eb-f7f09a1031e4' WHERE id='48e15e8a-a9ac-5cf0-9d43-e0dcf3f69067';
UPDATE employees SET user_id='d3995993-c92b-5696-b5eb-f7f09a1031e4' WHERE id='b28c81bb-4473-56fb-862f-b4acf2938b95';

-- Extra employee records for HR/teacher testing
INSERT INTO employees(id,user_id,employee_number,employee_type,job_title,contract_start,salary,currency,status)
VALUES
('36f5ca2e-4a22-521a-be89-c2df80e55605','76405d67-fa63-58d9-bfd7-601661734136','SEED-EMP-002','full_time','Senior English Teacher',CURRENT_DATE-INTERVAL '150 days',19500,'EGP','active'),
('43fb08b6-df0c-54cc-8210-bc99d30afc20','cc7abac3-7af3-5fd3-8560-e2eaea1a057c','SEED-EMP-003','full_time','HR Officer',CURRENT_DATE-INTERVAL '200 days',22000,'EGP','active')
ON CONFLICT DO NOTHING;

-- Extra teacher availability
INSERT INTO teacher_availabilities(id,employee_id,day_of_week,start_time,end_time,is_available,note)
VALUES
('b6bdf665-a7d3-5915-82d7-639b8239e60b','36f5ca2e-4a22-521a-be89-c2df80e55605',3,'10:00','18:00',TRUE,'Seed teacher 2 availability'),
('2c9d5c02-f0e8-5db9-bb68-049ffecdd36f','43fb08b6-df0c-54cc-8210-bc99d30afc20',5,'09:00','16:00',TRUE,'Seed HR availability')
ON CONFLICT DO NOTHING;

-- Extra finance data
INSERT INTO promo_codes(id,code,type,value,max_discount,expiry_date,usage_limit,used_count,applicable_courses,status,created_by)
VALUES
('c361a5bc-5733-5629-9f0c-7b8b01da2c3b','SEED20','percentage',20,800,CURRENT_DATE+INTERVAL '120 days',50,1,'["SEED-A2-2026","SEED-B1-2026"]'::jsonb,'active','78cfa859-27ec-5273-8937-3446b7575ce2')
ON CONFLICT DO NOTHING;

UPDATE invoices SET invoice_number='SEED-INV-001' WHERE id='72413858-0205-5187-904b-9c4c1feb949a';
UPDATE payments SET receipt_number='SEED-RCP-001' WHERE id='eebb1de8-d361-535d-8b91-2f31f6eec30e';

-- Extra website/system records
INSERT INTO settings(id,key,value,"group",is_encrypted,description)
VALUES
('728d4b01-a10d-5a46-8d49-008fd7bbc102','seed_currency','EGP','finance',FALSE,'Seed finance currency'),
('0af9410f-4fba-5786-90c1-229a116c9b78','seed_branch_count','3','system',FALSE,'Number of seed branches'),
('02c20ece-be1c-5ce4-8614-d6376e293efa','seed_lms_enabled','true','lms',FALSE,'Seed LMS flag'),
('c6a4f9cd-3bfa-5265-9d04-17f2cc2e8193','seed_chat_enabled','true','chat',FALSE,'Seed chat flag')
ON CONFLICT (key) DO NOTHING;


-- Additional rich test coverage

UPDATE students SET placement_test_id='4528edc2-673c-51c2-8b4a-ec9405a70eea' WHERE id='b8430eec-4181-577f-a38b-933397704e7a';

-- More sessions + attendance
INSERT INTO sessions(id,group_id,date,start_time,end_time,classroom_id,mode,topic,notes)
VALUES
('f3e8f066-4afa-5b4e-a0c6-12ef6bddd155','fe652f07-65d3-586c-a5c3-b3ecaeeda736',CURRENT_DATE-INTERVAL '7 days','09:00','11:00','20ce1287-84e6-57aa-9854-2d55a7398b69','in_person','Present Simple','Seed completed lesson'),
('5991054a-bd46-59d7-bbe0-ff33f2e2a966','f92fa7a5-6c6a-596c-9af1-dc13dfa70976',CURRENT_DATE-INTERVAL '5 days','18:00','20:00','4e6e86d8-e553-5cac-9735-287a4ba476ac','hybrid','Opinion Speaking','Seed hybrid session')
ON CONFLICT DO NOTHING;

INSERT INTO attendances(id,session_id,student_id,status,check_in_method,check_in_time,minutes_late,notes,created_by)
VALUES
('36f7ff7d-a39d-5faf-bf4e-4f3de8758b63','f3e8f066-4afa-5b4e-a0c6-12ef6bddd155','b8430eec-4181-577f-a38b-933397704e7a','late','qr_code',NOW()-INTERVAL '7 days',10,'Late QR check-in','d3995993-c92b-5696-b5eb-f7f09a1031e4'),
('26db7da7-23dc-5f91-a643-9f571b0a765f','5991054a-bd46-59d7-bbe0-ff33f2e2a966','72233c04-278a-5fb3-bf78-af38772e9a13','absent','manual',NULL,0,'Seed absence','76405d67-fa63-58d9-bfd7-601661734136'),
('8c571666-8d3c-5137-8023-bf14424cedb5','5991054a-bd46-59d7-bbe0-ff33f2e2a966','72233c04-278a-5fb3-bf78-af38772e9a13','excused','manual',NULL,0,'Seed excused absence','76405d67-fa63-58d9-bfd7-601661734136')
ON CONFLICT DO NOTHING;

-- More assignments/submissions
INSERT INTO assignments(id,group_id,title,description,type,due_at,max_grade,allow_late_submission,late_penalty_percent,is_published,created_by)
VALUES
('ea264072-7bc8-5393-b3cb-bf336c1b50c1','f92fa7a5-6c6a-596c-9af1-dc13dfa70976','B1 Opinion Paragraph','Write a structured opinion paragraph.','text',NOW()+INTERVAL '10 days',50,FALSE,0,TRUE,'76405d67-fa63-58d9-bfd7-601661734136')
ON CONFLICT DO NOTHING;

INSERT INTO submissions(id,assignment_id,student_id,content,submitted_at,is_late,grade,feedback,graded_by,graded_at,status)
VALUES
('135e203c-4ec0-59a0-a90a-279c0886d36b','ea264072-7bc8-5393-b3cb-bf336c1b50c1','72233c04-278a-5fb3-bf78-af38772e9a13','I think learning languages improves communication.',NOW()-INTERVAL '2 days',FALSE,45,'Clear argument.','76405d67-fa63-58d9-bfd7-601661734136',NOW()-INTERVAL '1 day','graded')
ON CONFLICT DO NOTHING;

-- Second quiz
INSERT INTO quizzes(id,group_id,title,description,time_limit_minutes,max_attempts,shuffle_questions,shuffle_options,release_type,passing_score,is_published,created_by)
VALUES
('92eced3c-b9bb-59f6-aa85-d6df2564e50f','f92fa7a5-6c6a-596c-9af1-dc13dfa70976','B1 Grammar Quiz','Seed B1 quiz.',25,2,TRUE,TRUE,'instant',60,TRUE,'76405d67-fa63-58d9-bfd7-601661734136')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions(id,quiz_id,question_text,type,options,correct_answer,points,"order")
VALUES
('48fe4848-d921-5bc3-ba38-321f64d707b2','92eced3c-b9bb-59f6-aa85-d6df2564e50f','Choose the correct connector.','mcq','["although","because","so"]'::jsonb,'"although"'::jsonb,1,1)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_attempts(id,quiz_id,student_id,attempt_number,answers,score,percentage,is_passed,started_at,submitted_at,time_spent_seconds,status,graded_by,graded_at)
VALUES
('2ddcb0d7-0daa-5642-ba10-941a7afc2dc5','92eced3c-b9bb-59f6-aa85-d6df2564e50f','72233c04-278a-5fb3-bf78-af38772e9a13',1,'{"48fe4848-d921-5bc3-ba38-321f64d707b2":"although"}'::jsonb,1,100,TRUE,NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days'+INTERVAL '6 minutes',360,'graded','76405d67-fa63-58d9-bfd7-601661734136',NOW()-INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- More gradebook data
INSERT INTO gradebook_categories(id,group_id,name,weight,"order",created_by)
VALUES
('26225faa-c6eb-51a5-8fb0-676865798766','f92fa7a5-6c6a-596c-9af1-dc13dfa70976','Assignments',40,1,'76405d67-fa63-58d9-bfd7-601661734136')
ON CONFLICT DO NOTHING;

INSERT INTO gradebook_entries(id,group_id,student_id,category_id,score,max_score,percentage,weighted_score,reference_type,notes,created_by)
VALUES
('916c523f-adfe-5f85-9c93-7a85371880c0','f92fa7a5-6c6a-596c-9af1-dc13dfa70976','72233c04-278a-5fb3-bf78-af38772e9a13','26225faa-c6eb-51a5-8fb0-676865798766',45,50,90,36,'assignment','Seed grade','76405d67-fa63-58d9-bfd7-601661734136')
ON CONFLICT DO NOTHING;

-- More finance: second enrollment/invoice/payment/installment/transaction
INSERT INTO enrollments(id,student_id,group_id,status,total_fee,discount_amount,final_amount,enrolled_at,enrolled_by)
VALUES
('6ca9061c-aac4-58af-b7a2-4099438439d3','72233c04-278a-5fb3-bf78-af38772e9a13','f92fa7a5-6c6a-596c-9af1-dc13dfa70976','active',3200,200,3000,NOW()-INTERVAL '12 days','78cfa859-27ec-5273-8937-3446b7575ce2')
ON CONFLICT DO NOTHING;

INSERT INTO invoices(id,invoice_number,enrollment_id,student_id,branch_id,subtotal,discount_amount,tax_amount,total_amount,paid_amount,balance_due,status,due_date,notes,created_by)
VALUES
('aeeb8005-a818-5278-a3d6-d544fe9f2462','SEED-INV-002','6ca9061c-aac4-58af-b7a2-4099438439d3','72233c04-278a-5fb3-bf78-af38772e9a13','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a',3200,200,0,3000,3000,0,'paid',CURRENT_DATE+INTERVAL '5 days','Seed paid invoice','5ab51db0-5fba-52ca-b0a4-5528705e2e5f')
ON CONFLICT DO NOTHING;

UPDATE invoices SET invoice_number='SEED-INV-002' WHERE id='aeeb8005-a818-5278-a3d6-d544fe9f2462';

INSERT INTO payments(id,invoice_id,amount,method,reference,paid_at,recorded_by,status,receipt_number)
VALUES
('6baefc71-43a3-5a40-8395-a8566b0f8a8c','aeeb8005-a818-5278-a3d6-d544fe9f2462',3000,'bank_transfer','SEED-BANK-002',NOW()-INTERVAL '5 days','5ab51db0-5fba-52ca-b0a4-5528705e2e5f','completed','SEED-RCP-002')
ON CONFLICT DO NOTHING;

UPDATE payments SET receipt_number='SEED-RCP-002' WHERE id='6baefc71-43a3-5a40-8395-a8566b0f8a8c';

INSERT INTO installments(id,invoice_id,installment_number,amount,due_date,paid_amount,paid_at,status)
VALUES
('6f1439ec-712c-5bdc-bd75-307e462729e4','aeeb8005-a818-5278-a3d6-d544fe9f2462',1,3000,CURRENT_DATE-INTERVAL '5 days',3000,NOW()-INTERVAL '5 days','paid')
ON CONFLICT DO NOTHING;

INSERT INTO financial_transactions(id,branch_id,invoice_id,payment_id,transaction_type,direction,amount,transaction_date,description,created_by)
VALUES
('297d474b-b433-5288-accd-379d8cd82908','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','aeeb8005-a818-5278-a3d6-d544fe9f2462','6baefc71-43a3-5a40-8395-a8566b0f8a8c','payment','in',3000,NOW()-INTERVAL '5 days','Seed bank payment','5ab51db0-5fba-52ca-b0a4-5528705e2e5f')
ON CONFLICT DO NOTHING;

-- More activities
INSERT INTO activities(id,name,description,type,date,start_time,end_time,location,branch_id,capacity,fee,target_levels,target_groups,is_open_to_all,status,created_by)
VALUES
('352c4d22-8676-51c6-939c-d4f5a6a9f0de','Seed Movie Night','Test movie night activity','movie_night',CURRENT_DATE+INTERVAL '20 days','17:00','20:00','Seed Main Branch','66fc3021-8661-503f-b5c8-cea9e67629e6',40,50,'["A1","A2","B1","B2"]'::jsonb,'[]'::jsonb,TRUE,'upcoming','31d5ee25-71b5-5dbb-93cb-818ee85e084b')
ON CONFLICT DO NOTHING;

INSERT INTO activity_registrations(id,activity_id,student_id,status,paid_amount)
VALUES
('93bef0c5-40f9-5911-85a1-7eb64c302b9c','352c4d22-8676-51c6-939c-d4f5a6a9f0de','72233c04-278a-5fb3-bf78-af38772e9a13','registered',50)
ON CONFLICT DO NOTHING;

INSERT INTO activity_photos(id,activity_id,file_url,caption,uploaded_by)
VALUES
('5848217d-2110-5b88-a93e-f125c49b3c55','352c4d22-8676-51c6-939c-d4f5a6a9f0de','https://example.com/seed-movie.jpg','Seed movie night','31d5ee25-71b5-5dbb-93cb-818ee85e084b')
ON CONFLICT DO NOTHING;

-- More inventory movements/issues
INSERT INTO stock_moves(id,item_id,branch_id,type,quantity,unit_cost,reason,reference_type,created_by)
VALUES
('58c9e7c3-4aa4-576d-8148-334bfe74bbdc','46880901-cff0-5c43-a855-91d0d0b457d5','66fc3021-8661-503f-b5c8-cea9e67629e6','out',1,120,'Issued to student','manual','78cfa859-27ec-5273-8937-3446b7575ce2')
ON CONFLICT DO NOTHING;

INSERT INTO stock_levels(id,item_id,branch_id,quantity,reserved_quantity,last_counted_at)
VALUES
('212330d9-4df3-5625-99ad-c4b847dcea44','46880901-cff0-5c43-a855-91d0d0b457d5','66fc3021-8661-503f-b5c8-cea9e67629e6',34,0,NOW())
ON CONFLICT DO NOTHING;

INSERT INTO student_item_issues(id,student_id,item_id,branch_id,quantity,cost,issued_at,created_by)
VALUES
('4604b4da-2e5a-57ec-9daf-cbeed059bfe5','72233c04-278a-5fb3-bf78-af38772e9a13','46880901-cff0-5c43-a855-91d0d0b457d5','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a',1,180,NOW()-INTERVAL '2 days','78cfa859-27ec-5273-8937-3446b7575ce2')
ON CONFLICT DO NOTHING;

-- More KB data
INSERT INTO kb_categories(id,name,slug,description,visibility,sort_order)
VALUES
('f4655370-48c5-5149-9537-c83af2e55b73','Seed Teacher Guides','seed-teacher-guides','Teacher-only seed articles','teacher',2)
ON CONFLICT DO NOTHING;

INSERT INTO kb_articles(id,category_id,title,slug,body,excerpt,version,visibility,is_pinned,view_count,created_by,updated_by)
VALUES
('5d1b8d4b-4451-56b0-96ba-1b4c2134ef45','f4655370-48c5-5149-9537-c83af2e55b73','Seed Grading Guide','seed-grading-guide','How to grade seed assignments.','Seed grading article',1,'teacher',FALSE,4,'d3995993-c92b-5696-b5eb-f7f09a1031e4','d3995993-c92b-5696-b5eb-f7f09a1031e4')
ON CONFLICT DO NOTHING;

INSERT INTO kb_article_versions(id,article_id,body,version_number,change_note,created_by)
VALUES
('333546e2-a2ea-5101-beaf-60a3ba39e5aa','5d1b8d4b-4451-56b0-96ba-1b4c2134ef45','How to grade seed assignments. v2',2,'Added seed rubric note','d3995993-c92b-5696-b5eb-f7f09a1031e4')
ON CONFLICT DO NOTHING;

-- More chat rooms/members/messages
INSERT INTO chat_rooms(id,type,group_id,name,topic,created_by)
VALUES
('e83d30b6-9d35-5d20-95b2-661500d1a153','one_on_one',NULL,'Seed Teacher/Student DM','Testing direct messaging','d3995993-c92b-5696-b5eb-f7f09a1031e4')
ON CONFLICT DO NOTHING;

INSERT INTO chat_room_members(id,room_id,user_id,role)
VALUES
('429c79b2-d217-5192-9145-704b41539708','238d8c87-ad12-5b9f-a30d-94261a593f33','d3995993-c92b-5696-b5eb-f7f09a1031e4','teacher'),
('e4f8c98a-cb79-5b27-ae40-9322e8870392','238d8c87-ad12-5b9f-a30d-94261a593f33','46020932-b634-5ac4-be12-2969f1f15c93','student'),
('2a56c8de-053c-5959-8b45-7f39c216afa7','238d8c87-ad12-5b9f-a30d-94261a593f33','abe6a78b-d48f-534c-976b-5deb78a34c18','moderator'),
('f7fe495d-eefa-5784-93e5-1b22c4ea7b72','e83d30b6-9d35-5d20-95b2-661500d1a153','d3995993-c92b-5696-b5eb-f7f09a1031e4','teacher'),
('e85da89f-53ca-5e7c-80bc-35bcb5986788','e83d30b6-9d35-5d20-95b2-661500d1a153','46020932-b634-5ac4-be12-2969f1f15c93','student')
ON CONFLICT DO NOTHING;

INSERT INTO chat_messages(id,room_id,sender_id,body,type)
VALUES
('6df7c842-1ec3-5085-acf0-ec07a615235e','238d8c87-ad12-5b9f-a30d-94261a593f33','46020932-b634-5ac4-be12-2969f1f15c93','Can I submit my assignment today?','text'),
('c0a83ad7-1c93-564e-b634-6e35f9a19321','238d8c87-ad12-5b9f-a30d-94261a593f33','d3995993-c92b-5696-b5eb-f7f09a1031e4','Yes, before midnight.','text'),
('c5d3f3f9-9acc-55b6-9ab6-1712b74d9afa','e83d30b6-9d35-5d20-95b2-661500d1a153','46020932-b634-5ac4-be12-2969f1f15c93','I need help with pronunciation.','text')
ON CONFLICT DO NOTHING;

INSERT INTO chat_violations(id,message_id,room_id,sender_id,rule_matched,original_message,action_taken,moderator_id,moderator_note,detection_method)
VALUES
('13aa70cd-1efb-5332-b1ae-40b422460757','652b95ff-5d8e-5304-91ae-263b0ee9be47','238d8c87-ad12-5b9f-a30d-94261a593f33','46020932-b634-5ac4-be12-2969f1f15c93','test_rule','Seed flagged message','warned','abe6a78b-d48f-534c-976b-5deb78a34c18','Seed moderation record','text_regex'),
('786821e5-7f43-5a8a-88e6-fd9e178515e3','6df7c842-1ec3-5085-acf0-ec07a615235e','238d8c87-ad12-5b9f-a30d-94261a593f33','46020932-b634-5ac4-be12-2969f1f15c93','tone_check','Can I submit my assignment today?','flagged_only','abe6a78b-d48f-534c-976b-5deb78a34c18','Seed review','text_regex')
ON CONFLICT DO NOTHING;

INSERT INTO chat_strikes(id,user_id,violation_id,strike_number,action,expires_at,applied_by,is_active)
VALUES
('2ae02f64-9fd8-5811-9fe7-20ef8a7c52d0','46020932-b634-5ac4-be12-2969f1f15c93','13aa70cd-1efb-5332-b1ae-40b422460757',1,'warning',NOW()+INTERVAL '30 days','abe6a78b-d48f-534c-976b-5deb78a34c18',TRUE),
('5ea30412-b011-5853-8fbf-17f035c87ffa','006db1c6-18d5-587c-8640-6996aa62605d','786821e5-7f43-5a8a-88e6-fd9e178515e3',1,'warning',NOW()+INTERVAL '30 days','abe6a78b-d48f-534c-976b-5deb78a34c18',TRUE)
ON CONFLICT DO NOTHING;

-- More website / system
INSERT INTO blog_posts(id,title,slug,content,excerpt,status,published_at,author_id,view_count)
VALUES
('2a007b0c-5c52-5f20-857e-61cb0f3ae854','Seed Branch News','seed-branch-news','Seed branch news article.','Seed branch news.','published',NOW()-INTERVAL '2 days','f54bc944-43f9-5b09-8a79-979d2186bc31',10)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials(id,student_id,name,content,rating,course_name,is_featured,status)
VALUES
('12424ef4-6aa9-5b5c-b2c9-61c1ac985a28','72233c04-278a-5fb3-bf78-af38772e9a13','Student Two','The seed dataset is useful for testing.','5','English B1 Intermediate',FALSE,'approved')
ON CONFLICT DO NOTHING;

INSERT INTO page_views(id,page_path,referrer,user_agent,ip_address,session_id)
VALUES
('e79d7041-2e22-5b20-bfa0-c4c6629d4a35','/dashboard','/login','Seed Browser','127.0.0.1','seed-session-002'),
('3a53913a-9e70-5825-a986-e31a0cef8635','/roles','/dashboard','Seed Browser','127.0.0.1','seed-session-003')
ON CONFLICT DO NOTHING;

INSERT INTO notifications(id,user_id,type,title,body,data,action_url)
VALUES
('8fb1f53b-5581-5665-bb01-f04be08601f3','46020932-b634-5ac4-be12-2969f1f15c93','assignment','Seed Assignment','A new seed assignment is available.','{"assignmentId":"265f3866-5e82-5318-bfa1-202d366903de"}'::jsonb,'/assignments/265f3866-5e82-5318-bfa1-202d366903de'),
('e6afa09b-3362-5f9f-a3f8-e96df172b2f6','d3995993-c92b-5696-b5eb-f7f09a1031e4','attendance','Seed Attendance','Attendance was saved for a seed session.','{"sessionId":"23b3756a-0eae-560e-baf6-b47d981b4ff1"}'::jsonb,'/attendance'),
('27ff3d73-e238-5f0b-a340-c08174ed2135','31d5ee25-71b5-5dbb-93cb-818ee85e084b','lead','Seed Lead','A seed lead needs follow-up.','{"leadId":"a933cad8-3039-5942-abdd-0ecc8fa5a37b"}'::jsonb,'/leads')
ON CONFLICT DO NOTHING;

INSERT INTO notification_preferences(id,user_id,channel,module,event,is_enabled)
VALUES
('99b3d764-fe35-5663-a604-6b91534f434a','46020932-b634-5ac4-be12-2969f1f15c93','email','lms','assignment_due',TRUE),
('e7c454f3-64ae-59b1-b3ca-67c802c0a704','d3995993-c92b-5696-b5eb-f7f09a1031e4','in_app','attendance','marked',TRUE),
('0eb65061-a21e-54a1-ae71-8b9eefe28f91','31d5ee25-71b5-5dbb-93cb-818ee85e084b','email','crm','lead_assigned',TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs(id,actor_id,actor_type,action,module,target_type,target_id,before_state,after_state,description,ip_address,user_agent)
VALUES
('99067c0b-6451-53f0-a1da-2b96ee1114c6','f54bc944-43f9-5b09-8a79-979d2186bc31','user','seed_login_test','auth','user','f54bc944-43f9-5b09-8a79-979d2186bc31','{}'::jsonb,'{"role":"super_admin"}'::jsonb,'Seed admin test log','127.0.0.1','Seed Browser'),
('51ec8b4f-822f-5b97-80c1-caaf65043ce9','31d5ee25-71b5-5dbb-93cb-818ee85e084b','user','seed_branch_test','branches','branch','41a77ad8-a44e-5f27-9b30-f1ad0e62e98a','{}'::jsonb,'{"test":"branch_manager"}'::jsonb,'Seed manager branch test','127.0.0.1','Seed Browser')
ON CONFLICT DO NOTHING;


-- Commit only after every table has been populated.
COMMIT;

-- Quick verification
SELECT 'branches' AS table_name, COUNT(*) AS row_count FROM branches WHERE name LIKE 'Seed %'
UNION ALL SELECT 'users', COUNT(*) FROM users WHERE email LIKE '%@speakup.test'
UNION ALL SELECT 'roles', COUNT(*) FROM roles WHERE slug IN ('super_admin','branch_manager','sales','finance','academic','teacher','student','moderator','hr','auditor')
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions WHERE module IN ('users','crm','sales','placement','groups','attendance','lms','chat','finance','certificates','hr','activities','inventory','kb','reports','branches','system')
UNION ALL SELECT 'students', COUNT(*) FROM students WHERE student_number LIKE 'SEED-STU-%'
UNION ALL SELECT 'courses', COUNT(*) FROM courses WHERE code LIKE 'SEED-%'
UNION ALL SELECT 'groups', COUNT(*) FROM groups WHERE name LIKE 'Seed %'
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions WHERE id IN ('23b3756a-0eae-560e-baf6-b47d981b4ff1','f3e8f066-4afa-5b4e-a0c6-12ef6bddd155','5991054a-bd46-59d7-bbe0-ff33f2e2a966')
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices WHERE invoice_number LIKE 'SEED-INV-%'
UNION ALL SELECT 'payments', COUNT(*) FROM payments WHERE receipt_number LIKE 'SEED-RCP-%'
UNION ALL SELECT 'employees', COUNT(*) FROM employees WHERE employee_number LIKE 'SEED-EMP-%'
UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items WHERE sku LIKE 'SEED-%'
UNION ALL SELECT 'kb_articles', COUNT(*) FROM kb_articles WHERE slug LIKE 'seed-%'
UNION ALL SELECT 'chat_messages', COUNT(*) FROM chat_messages WHERE id IN ('652b95ff-5d8e-5304-91ae-263b0ee9be47','6df7c842-1ec3-5085-acf0-ec07a615235e','c0a83ad7-1c93-564e-b634-6e35f9a19321','c5d3f3f9-9acc-55b6-9ab6-1712b74d9afa')
ORDER BY table_name;
