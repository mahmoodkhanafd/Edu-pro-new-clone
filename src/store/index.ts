'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Student {
  id: string;
  name: string;
  fatherName: string;
  dob?: string;
  gender?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  photo?: string;
  classId: string;
  className?: string;
  rollNo: string;
  familyId?: string;
  sessionId: string;
  admissionDate?: string;
  totalFee: number;
  monthlyFee: number;
  isActive: boolean;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  section?: string;
  order: number;
  sessionId: string;
}

export interface Family {
  id: string;
  familyCode: string;
  fatherName?: string;
  phone?: string;
  address?: string;
}

export interface MonthlyFee {
  id: string;
  studentId: string;
  sessionId: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'pending' | 'partial' | 'paid';
  dueDate?: string;
  isArrears: boolean;
}

export interface FeePayment {
  id: string;
  studentId: string;
  familyId?: string;
  sessionId: string;
  receiptNo: string;
  amount: number;
  paymentDate: string;
  paymentMonth: number;
  paymentYear: number;
  paymentMode: string;
  particulars?: Record<string, number>[];
  remarks?: string;
  receivedBy?: string;
  smsSent: boolean;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  joiningDate?: string;
  salary: number;
  address?: string;
  photo?: string;
  isTeacher: boolean;
  isActive: boolean;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  leaveType?: 'sick' | 'urgent' | 'casual';
  leaveApproved?: boolean;
  remarks?: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  date: string;
  description?: string;
  receiptNo?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ExamType {
  id: string;
  name: string;
  sessionId: string;
  maxMarks: number;
  passingMarks: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examTypeId: string;
  subjectId: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  classId: string;
  teacherId?: string;
}

export interface FeeParticular {
  id: string;
  name: string;
  type: 'admission' | 'monthly' | 'exam' | 'misc';
  defaultAmount: number;
  isActive: boolean;
}

export interface GradeSetting {
  id: string;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  remarks?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  type: string;
  template: string;
  isActive: boolean;
}

export interface SmsLog {
  id: string;
  studentId?: string;
  studentName?: string;
  phone: string;
  message: string;
  type: 'sms' | 'whatsapp';
  status: string;
  sentAt: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  startMonth: number;
  endMonth: number;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

export interface SchoolSettings {
  schoolName: string;
  schoolSlogan?: string;
  schoolLogo?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  theme: 'default' | 'green' | 'purple' | 'orange';
  darkMode: boolean;
  currentMonth: number;
  currentYear: number;
  whatsappConnected: boolean;
  smsApiKey?: string;
  smsEnabled: boolean;
}

interface AppState {
  // Data
  sessions: AcademicSession[];
  activeSession: AcademicSession | null;
  classes: Class[];
  students: Student[];
  families: Family[];
  monthlyFees: MonthlyFee[];
  feePayments: FeePayment[];
  staff: Staff[];
  attendance: Attendance[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  examTypes: ExamType[];
  examResults: ExamResult[];
  subjects: Subject[];
  feeParticulars: FeeParticular[];
  gradeSettings: GradeSetting[];
  smsTemplates: SmsTemplate[];
  smsLogs: SmsLog[];
  settings: SchoolSettings;
  
  // UI State
  sidebarOpen: boolean;
  currentUser: { id: string; name: string; role: string } | null;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentUser: (user: { id: string; name: string; role: string } | null) => void;
  
  // Session Actions
  addSession: (session: AcademicSession) => void;
  updateSession: (id: string, session: Partial<AcademicSession>) => void;
  setActiveSession: (id: string) => void;
  
  // Class Actions
  addClass: (cls: Class) => void;
  updateClass: (id: string, cls: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  
  // Student Actions
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  bulkPromoteStudents: (fromClassId: string, toClassId: string) => void;
  
  // Family Actions
  addFamily: (family: Family) => void;
  updateFamily: (id: string, family: Partial<Family>) => void;
  
  // Fee Actions
  addMonthlyFee: (fee: MonthlyFee) => void;
  updateMonthlyFee: (id: string, fee: Partial<MonthlyFee>) => void;
  generateMonthlyFeesForStudent: (studentId: string, month: number, year: number) => void;
  processMonthlyDues: (currentMonth: number, currentYear: number) => void;
  
  // Payment Actions
  addFeePayment: (payment: FeePayment) => void;
  
  // Staff Actions
  addStaff: (s: Staff) => void;
  updateStaff: (id: string, s: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  
  // Attendance Actions
  addAttendance: (att: Attendance) => void;
  updateAttendance: (id: string, att: Partial<Attendance>) => void;
  
  // Expense Actions
  addExpenseCategory: (cat: ExpenseCategory) => void;
  updateExpenseCategory: (id: string, cat: Partial<ExpenseCategory>) => void;
  deleteExpenseCategory: (id: string) => void;
  addExpense: (exp: Expense) => void;
  updateExpense: (id: string, exp: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Exam Actions
  addExamType: (exam: ExamType) => void;
  updateExamType: (id: string, exam: Partial<ExamType>) => void;
  deleteExamType: (id: string) => void;
  addExamResult: (result: ExamResult) => void;
  updateExamResult: (id: string, result: Partial<ExamResult>) => void;
  
  // Subject Actions
  addSubject: (sub: Subject) => void;
  updateSubject: (id: string, sub: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Fee Particulars Actions
  addFeeParticular: (fp: FeeParticular) => void;
  updateFeeParticular: (id: string, fp: Partial<FeeParticular>) => void;
  deleteFeeParticular: (id: string) => void;
  
  // Grade Settings Actions
  addGradeSetting: (gs: GradeSetting) => void;
  updateGradeSetting: (id: string, gs: Partial<GradeSetting>) => void;
  deleteGradeSetting: (id: string) => void;
  
  // SMS Actions
  addSmsTemplate: (tpl: SmsTemplate) => void;
  updateSmsTemplate: (id: string, tpl: Partial<SmsTemplate>) => void;
  deleteSmsTemplate: (id: string) => void;
  addSmsLog: (log: SmsLog) => void;
  
  // Settings Actions
  updateSettings: (settings: Partial<SchoolSettings>) => void;
  
  // Data Management
  exportData: () => string;
  importData: (json: string) => boolean;
  clearAllData: () => void;
  
  // Utility
  getStudentDues: (studentId: string) => { currentMonthDues: number; previousDues: number; totalDues: number };
  getClassStudents: (classId: string) => Student[];
  getFamilyStudents: (familyId: string) => Student[];
}

const generateId = () => crypto.randomUUID();

const defaultSettings: SchoolSettings = {
  schoolName: 'Sunshine Education Complex',
  schoolSlogan: 'Illuminating Minds, Shaping Futures',
  theme: 'default',
  darkMode: false,
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  whatsappConnected: false,
  smsEnabled: false,
};

const defaultGradeSettings: GradeSetting[] = [
  { id: generateId(), grade: 'A+', minPercentage: 90, maxPercentage: 100, remarks: 'Excellent' },
  { id: generateId(), grade: 'A', minPercentage: 80, maxPercentage: 89, remarks: 'Very Good' },
  { id: generateId(), grade: 'B+', minPercentage: 70, maxPercentage: 79, remarks: 'Good' },
  { id: generateId(), grade: 'B', minPercentage: 60, maxPercentage: 69, remarks: 'Satisfactory' },
  { id: generateId(), grade: 'C', minPercentage: 50, maxPercentage: 59, remarks: 'Average' },
  { id: generateId(), grade: 'D', minPercentage: 33, maxPercentage: 49, remarks: 'Below Average' },
  { id: generateId(), grade: 'F', minPercentage: 0, maxPercentage: 32, remarks: 'Fail' },
];

const defaultFeeParticulars: FeeParticular[] = [
  { id: generateId(), name: 'Monthly Fee', type: 'monthly', defaultAmount: 0, isActive: true },
  { id: generateId(), name: 'Admission Fee', type: 'admission', defaultAmount: 0, isActive: true },
  { id: generateId(), name: 'Exam Fee', type: 'exam', defaultAmount: 0, isActive: true },
  { id: generateId(), name: 'Miscellaneous', type: 'misc', defaultAmount: 0, isActive: true },
];

const defaultExpenseCategories: ExpenseCategory[] = [
  { id: generateId(), name: 'Utility', description: 'Electricity, Water, Gas' },
  { id: generateId(), name: 'Maintenance', description: 'Repairs and maintenance' },
  { id: generateId(), name: 'Stationery', description: 'Office supplies' },
  { id: generateId(), name: 'Salary', description: 'Staff salaries' },
  { id: generateId(), name: 'Miscellaneous', description: 'Other expenses' },
];

const defaultSmsTemplates: SmsTemplate[] = [
  {
    id: generateId(),
    name: 'Fee Payment - English',
    type: 'fee_payment',
    template: 'Dear Parent, an amount of Rs. {amount} has been received for {studentName}. Current Month Dues: Rs. {currentDues}, Total Dues: Rs. {totalDues}. Thank you - {schoolName}',
    isActive: true,
  },
  {
    id: generateId(),
    name: 'Fee Payment - Urdu',
    type: 'fee_payment_urdu',
    template: 'محترم والدین، {studentName} کے لیے {amount} روپے موصول ہو گئے ہیں۔ اس ماہ کے واجبات: {currentDues} روپے، کل واجب الادا رقم: {totalDues} روپے۔ شکریہ - {schoolName}',
    isActive: true,
  },
  {
    id: generateId(),
    name: 'Dues Reminder - English',
    type: 'dues_reminder',
    template: 'Dear Parent, {studentName} has outstanding dues. Current Month Dues: Rs. {currentDues}, Total Dues: Rs. {totalDues}. Please pay at your earliest. - {schoolName}',
    isActive: true,
  },
  {
    id: generateId(),
    name: 'Dues Reminder - Urdu',
    type: 'dues_reminder_urdu',
    template: 'محترم والدین، {studentName} کے واجبات باقی ہیں۔ اس ماہ کے واجبات: {currentDues} روپے، کل واجب الادا رقم: {totalDues} روپے۔ براہ کرم جلد ادائیگی کریں۔ - {schoolName}',
    isActive: true,
  },
  {
    id: generateId(),
    name: 'Attendance Alert',
    type: 'attendance',
    template: 'Dear Parent, {studentName} was marked {status} on {date}. - {schoolName}',
    isActive: true,
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      sessions: [],
      activeSession: null,
      classes: [],
      students: [],
      families: [],
      monthlyFees: [],
      feePayments: [],
      staff: [],
      attendance: [],
      expenses: [],
      expenseCategories: defaultExpenseCategories,
      examTypes: [],
      examResults: [],
      subjects: [],
      feeParticulars: defaultFeeParticulars,
      gradeSettings: defaultGradeSettings,
      smsTemplates: defaultSmsTemplates,
      smsLogs: [],
      settings: defaultSettings,
      sidebarOpen: true,
      currentUser: { id: '1', name: 'Admin', role: 'admin' },

      // UI Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentUser: (user) => set({ currentUser: user }),

      // Session Actions
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      setActiveSession: (id) => set((state) => ({
        sessions: state.sessions.map((s) => ({ ...s, isActive: s.id === id })),
        activeSession: state.sessions.find((s) => s.id === id) || null,
      })),

      // Class Actions
      addClass: (cls) => set((state) => ({ classes: [...state.classes, cls] })),
      updateClass: (id, updates) => set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      deleteClass: (id) => set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
      })),

      // Student Actions
      addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
      updateStudent: (id, updates) => set((state) => ({
        students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      deleteStudent: (id) => set((state) => ({
        students: state.students.filter((s) => s.id !== id),
      })),
      bulkPromoteStudents: (fromClassId, toClassId) => set((state) => ({
        students: state.students.map((s) =>
          s.classId === fromClassId && s.isActive ? { ...s, classId: toClassId } : s
        ),
      })),

      // Family Actions
      addFamily: (family) => set((state) => ({ families: [...state.families, family] })),
      updateFamily: (id, updates) => set((state) => ({
        families: state.families.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      })),

      // Fee Actions
      addMonthlyFee: (fee) => set((state) => ({ monthlyFees: [...state.monthlyFees, fee] })),
      updateMonthlyFee: (id, updates) => set((state) => ({
        monthlyFees: state.monthlyFees.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      })),
      
      generateMonthlyFeesForStudent: (studentId, month, year) => {
        const state = get();
        const student = state.students.find((s) => s.id === studentId);
        if (!student) return;
        
        const existingFee = state.monthlyFees.find(
          (f) => f.studentId === studentId && f.month === month && f.year === year
        );
        
        if (!existingFee) {
          const newFee: MonthlyFee = {
            id: generateId(),
            studentId,
            sessionId: student.sessionId,
            month,
            year,
            totalAmount: student.monthlyFee,
            paidAmount: 0,
            dueAmount: student.monthlyFee,
            status: 'pending',
            isArrears: false,
          };
          set((state) => ({ monthlyFees: [...state.monthlyFees, newFee] }));
        }
      },
      
      processMonthlyDues: (currentMonth, currentYear) => {
        set((state) => {
          const updatedFees = state.monthlyFees.map((fee) => {
            // Mark past unpaid fees as arrears
            if (fee.status !== 'paid') {
              const feeDate = new Date(fee.year, fee.month - 1);
              const currentDate = new Date(currentYear, currentMonth - 1);
              if (feeDate < currentDate) {
                return { ...fee, isArrears: true };
              }
            }
            return fee;
          });
          return { monthlyFees: updatedFees };
        });
      },

      // Payment Actions
      addFeePayment: (payment) => {
        set((state) => {
          // Update monthly fees based on payment
          let remainingAmount = payment.amount;
          const updatedMonthlyFees = [...state.monthlyFees].sort((a, b) => {
            // Sort by date, oldest first (pay arrears first)
            const dateA = new Date(a.year, a.month - 1);
            const dateB = new Date(b.year, b.month - 1);
            return dateA.getTime() - dateB.getTime();
          });
          
          for (const fee of updatedMonthlyFees) {
            if (fee.studentId === payment.studentId && fee.dueAmount > 0 && remainingAmount > 0) {
              const paymentForThisFee = Math.min(remainingAmount, fee.dueAmount);
              fee.paidAmount += paymentForThisFee;
              fee.dueAmount -= paymentForThisFee;
              fee.status = fee.dueAmount <= 0 ? 'paid' : 'partial';
              remainingAmount -= paymentForThisFee;
            }
          }
          
          return {
            feePayments: [...state.feePayments, payment],
            monthlyFees: updatedMonthlyFees,
          };
        });
      },

      // Staff Actions
      addStaff: (s) => set((state) => ({ staff: [...state.staff, s] })),
      updateStaff: (id, updates) => set((state) => ({
        staff: state.staff.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      deleteStaff: (id) => set((state) => ({
        staff: state.staff.filter((s) => s.id !== id),
      })),

      // Attendance Actions
      addAttendance: (att) => set((state) => ({ attendance: [...state.attendance, att] })),
      updateAttendance: (id, updates) => set((state) => ({
        attendance: state.attendance.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),

      // Expense Actions
      addExpenseCategory: (cat) => set((state) => ({ expenseCategories: [...state.expenseCategories, cat] })),
      updateExpenseCategory: (id, updates) => set((state) => ({
        expenseCategories: state.expenseCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      deleteExpenseCategory: (id) => set((state) => ({
        expenseCategories: state.expenseCategories.filter((c) => c.id !== id),
      })),
      addExpense: (exp) => set((state) => ({ expenses: [...state.expenses, exp] })),
      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      })),

      // Exam Actions
      addExamType: (exam) => set((state) => ({ examTypes: [...state.examTypes, exam] })),
      updateExamType: (id, updates) => set((state) => ({
        examTypes: state.examTypes.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      deleteExamType: (id) => set((state) => ({
        examTypes: state.examTypes.filter((e) => e.id !== id),
      })),
      addExamResult: (result) => set((state) => ({ examResults: [...state.examResults, result] })),
      updateExamResult: (id, updates) => set((state) => ({
        examResults: state.examResults.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),

      // Subject Actions
      addSubject: (sub) => set((state) => ({ subjects: [...state.subjects, sub] })),
      updateSubject: (id, updates) => set((state) => ({
        subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter((s) => s.id !== id),
      })),

      // Fee Particulars Actions
      addFeeParticular: (fp) => set((state) => ({ feeParticulars: [...state.feeParticulars, fp] })),
      updateFeeParticular: (id, updates) => set((state) => ({
        feeParticulars: state.feeParticulars.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      })),
      deleteFeeParticular: (id) => set((state) => ({
        feeParticulars: state.feeParticulars.filter((f) => f.id !== id),
      })),

      // Grade Settings Actions
      addGradeSetting: (gs) => set((state) => ({ gradeSettings: [...state.gradeSettings, gs] })),
      updateGradeSetting: (id, updates) => set((state) => ({
        gradeSettings: state.gradeSettings.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      })),
      deleteGradeSetting: (id) => set((state) => ({
        gradeSettings: state.gradeSettings.filter((g) => g.id !== id),
      })),

      // SMS Actions
      addSmsTemplate: (tpl) => set((state) => ({ smsTemplates: [...state.smsTemplates, tpl] })),
      updateSmsTemplate: (id, updates) => set((state) => ({
        smsTemplates: state.smsTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
      deleteSmsTemplate: (id) => set((state) => ({
        smsTemplates: state.smsTemplates.filter((t) => t.id !== id),
      })),
      addSmsLog: (log) => set((state) => ({ smsLogs: [...state.smsLogs, log] })),

      // Settings Actions
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      // Data Management
      exportData: () => {
        const state = get();
        const exportObj = {
          sessions: state.sessions,
          classes: state.classes,
          students: state.students,
          families: state.families,
          monthlyFees: state.monthlyFees,
          feePayments: state.feePayments,
          staff: state.staff,
          attendance: state.attendance,
          expenses: state.expenses,
          expenseCategories: state.expenseCategories,
          examTypes: state.examTypes,
          examResults: state.examResults,
          subjects: state.subjects,
          feeParticulars: state.feeParticulars,
          gradeSettings: state.gradeSettings,
          smsTemplates: state.smsTemplates,
          settings: state.settings,
          exportDate: new Date().toISOString(),
        };
        return JSON.stringify(exportObj, null, 2);
      },
      
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            sessions: data.sessions || [],
            classes: data.classes || [],
            students: data.students || [],
            families: data.families || [],
            monthlyFees: data.monthlyFees || [],
            feePayments: data.feePayments || [],
            staff: data.staff || [],
            attendance: data.attendance || [],
            expenses: data.expenses || [],
            expenseCategories: data.expenseCategories || defaultExpenseCategories,
            examTypes: data.examTypes || [],
            examResults: data.examResults || [],
            subjects: data.subjects || [],
            feeParticulars: data.feeParticulars || defaultFeeParticulars,
            gradeSettings: data.gradeSettings || defaultGradeSettings,
            smsTemplates: data.smsTemplates || defaultSmsTemplates,
            settings: { ...defaultSettings, ...data.settings },
          });
          return true;
        } catch {
          return false;
        }
      },
      
      clearAllData: () => set({
        sessions: [],
        activeSession: null,
        classes: [],
        students: [],
        families: [],
        monthlyFees: [],
        feePayments: [],
        staff: [],
        attendance: [],
        expenses: [],
        expenseCategories: defaultExpenseCategories,
        examTypes: [],
        examResults: [],
        subjects: [],
        feeParticulars: defaultFeeParticulars,
        gradeSettings: defaultGradeSettings,
        smsTemplates: defaultSmsTemplates,
        smsLogs: [],
        settings: defaultSettings,
      }),

      // Utility Functions
      getStudentDues: (studentId) => {
        const state = get();
        const { currentMonth, currentYear } = state.settings;
        const studentFees = state.monthlyFees.filter((f) => f.studentId === studentId);
        
        let currentMonthDues = 0;
        let previousDues = 0;
        
        studentFees.forEach((fee) => {
          if (fee.status !== 'paid') {
            if (fee.month === currentMonth && fee.year === currentYear) {
              currentMonthDues += fee.dueAmount;
            } else {
              // Check if this fee is from a previous month
              const feeDate = new Date(fee.year, fee.month - 1);
              const currentDate = new Date(currentYear, currentMonth - 1);
              if (feeDate < currentDate) {
                previousDues += fee.dueAmount;
              }
            }
          }
        });
        
        return {
          currentMonthDues,
          previousDues,
          totalDues: currentMonthDues + previousDues,
        };
      },
      
      getClassStudents: (classId) => {
        return get().students.filter((s) => s.classId === classId && s.isActive);
      },
      
      getFamilyStudents: (familyId) => {
        return get().students.filter((s) => s.familyId === familyId && s.isActive);
      },
    }),
    {
      name: 'edupro-storage',
    }
  )
);
