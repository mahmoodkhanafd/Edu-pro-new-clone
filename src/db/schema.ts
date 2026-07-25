import { pgTable, uuid, varchar, text, integer, decimal, boolean, date, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Academic Sessions
export const academicSessions = pgTable('academic_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "2025-2026"
  startMonth: integer('start_month').notNull().default(4), // April = 4
  endMonth: integer('end_month').notNull().default(3), // March = 3
  startYear: integer('start_year').notNull(),
  endYear: integer('end_year').notNull(),
  isActive: boolean('is_active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Classes
export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  section: varchar('section', { length: 10 }),
  order: integer('order').default(0),
  sessionId: uuid('session_id').references(() => academicSessions.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Families
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyCode: varchar('family_code', { length: 20 }).notNull().unique(),
  fatherName: varchar('father_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Students
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  fatherName: varchar('father_name', { length: 100 }),
  dob: date('dob'),
  gender: varchar('gender', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  whatsapp: varchar('whatsapp', { length: 20 }),
  address: text('address'),
  photo: text('photo'),
  classId: uuid('class_id').references(() => classes.id),
  rollNo: varchar('roll_no', { length: 20 }),
  familyId: uuid('family_id').references(() => families.id),
  sessionId: uuid('session_id').references(() => academicSessions.id),
  admissionDate: date('admission_date'),
  totalFee: decimal('total_fee', { precision: 10, scale: 2 }).default('0'),
  monthlyFee: decimal('monthly_fee', { precision: 10, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fee Particulars
export const feeParticulars = pgTable('fee_particulars', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // admission, monthly, exam, misc
  defaultAmount: decimal('default_amount', { precision: 10, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Monthly Fee Records - Tracks what each student owes per month
export const monthlyFees = pgTable('monthly_fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  sessionId: uuid('session_id').references(() => academicSessions.id),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
  dueAmount: decimal('due_amount', { precision: 10, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, partial, paid
  dueDate: date('due_date'),
  isArrears: boolean('is_arrears').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fee Payments
export const feePayments = pgTable('fee_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  familyId: uuid('family_id').references(() => families.id),
  sessionId: uuid('session_id').references(() => academicSessions.id),
  receiptNo: varchar('receipt_no', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMonth: integer('payment_month').notNull(),
  paymentYear: integer('payment_year').notNull(),
  paymentMode: varchar('payment_mode', { length: 20 }).default('cash'),
  particulars: jsonb('particulars'), // Array of fee items paid
  remarks: text('remarks'),
  receivedBy: varchar('received_by', { length: 100 }),
  smsSent: boolean('sms_sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Staff/Teachers
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  gender: varchar('gender', { length: 10 }),
  designation: varchar('designation', { length: 50 }),
  department: varchar('department', { length: 50 }),
  qualification: varchar('qualification', { length: 100 }),
  joiningDate: date('joining_date'),
  salary: decimal('salary', { precision: 10, scale: 2 }).default('0'),
  address: text('address'),
  photo: text('photo'),
  isTeacher: boolean('is_teacher').default(true),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subjects
export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }),
  classId: uuid('class_id').references(() => classes.id),
  teacherId: uuid('teacher_id').references(() => staff.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Attendance
export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  classId: uuid('class_id').references(() => classes.id),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // present, absent, late, leave
  leaveType: varchar('leave_type', { length: 20 }), // sick, urgent, casual
  leaveApproved: boolean('leave_approved').default(false),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Staff Attendance
export const staffAttendance = pgTable('staff_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => staff.id).notNull(),
  date: date('date').notNull(),
  checkIn: varchar('check_in', { length: 10 }),
  checkOut: varchar('check_out', { length: 10 }),
  status: varchar('status', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expense Categories
export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => expenseCategories.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  date: date('date').notNull(),
  description: text('description'),
  receiptNo: varchar('receipt_no', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Exam Types
export const examTypes = pgTable('exam_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  sessionId: uuid('session_id').references(() => academicSessions.id),
  maxMarks: integer('max_marks').default(100),
  passingMarks: integer('passing_marks').default(33),
  createdAt: timestamp('created_at').defaultNow(),
});

// Exam Results
export const examResults = pgTable('exam_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  examTypeId: uuid('exam_type_id').references(() => examTypes.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }),
  maxMarks: integer('max_marks').default(100),
  grade: varchar('grade', { length: 10 }),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Grade Settings
export const gradeSettings = pgTable('grade_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  grade: varchar('grade', { length: 10 }).notNull(),
  minPercentage: integer('min_percentage').notNull(),
  maxPercentage: integer('max_percentage').notNull(),
  remarks: varchar('remarks', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// SMS Templates
export const smsTemplates = pgTable('sms_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // fee_payment, dues_reminder, attendance, etc.
  template: text('template').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// SMS Logs
export const smsLogs = pgTable('sms_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id),
  phone: varchar('phone', { length: 20 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // sms, whatsapp
  status: varchar('status', { length: 20 }).default('sent'),
  sentAt: timestamp('sent_at').defaultNow(),
});

// Users & Roles
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('admin'), // admin, teacher, fee_clerk
  permissions: jsonb('permissions'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
});

// School Settings
export const schoolSettings = pgTable('school_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Timetable
export const timetable = pgTable('timetable', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id),
  teacherId: uuid('teacher_id').references(() => staff.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  periodNo: integer('period_no').notNull(),
  startTime: varchar('start_time', { length: 10 }),
  endTime: varchar('end_time', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notices/Announcements
export const notices = pgTable('notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  targetAudience: varchar('target_audience', { length: 50 }), // all, staff, students, parents
  isActive: boolean('is_active').default(true),
  publishDate: date('publish_date'),
  expiryDate: date('expiry_date'),
  createdAt: timestamp('created_at').defaultNow(),
});
