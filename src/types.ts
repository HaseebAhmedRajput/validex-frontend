 

export type UserRole = 'student' | 'teacher' | 'admin' | 'superAdmin';

export interface User {
  _id: string;
  fullname: string;
  email: string;
  number: number;
  role: UserRole;
  department: string;
  batch?: string;
  regNo?: string;
  isUserVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllowedLocation {
  lat: number;
  lng: number;
  radius: number;
}

export interface Question {
  _id?: string;
  testId?: string;
  questionType: 'mcq' | 'theory';
  questionText: string;
  options?: string[]; // Must be exactly 4 when mcq
  correctOption?: number; // 0-3 for mcq
  marks: number;
}

export interface Test {
  _id: string;
  title: string;
  description?: string;
  createdBy: string | User;
  subjectCode: string;
  questions?: Question[] | string[];
  duration: number;
  totalMarks?: number;
  testCode: number;
  startTime: string; // ISO DateTime
  endTime: string; // ISO DateTime
  allowedLocation: AllowedLocation;
  createdAt?: string;
  updatedAt?: string;
  isCameraMonitoring:boolean;
}

interface MCQAnswer {
  questionId: Question;
  selectedOption: number;
  obtainedMarks: number;
  isCorrect: boolean;
  status: string;
}

interface TheoryAnswer {
  questionId: Question;
  ans: string;
  obtainedMarks: number;
  feedback?: string;
  status: string;
}

export interface Attempt {
  _id: string;
  testId: string | Test;
  studentId: string | User;
  mcqsAns: MCQAnswer[];
  theoreticalAns: TheoryAnswer[];
  startTime: string;
  submitTime: string;
  totalMarks: number;
  obtainedMarks: number;
  violation?: number;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: any[];
  data?: any;
}
