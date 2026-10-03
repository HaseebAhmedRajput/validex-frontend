 

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api-client';
import { User, UserRole, Test } from '../types';
import { getDuration } from '../utills/getDuration';
import StudentReportView from './StudentReportView';

import { 
  Users, ShieldCheck, ShieldAlert, UserCheck, Trash2, KeyRound, Search, 
  RefreshCw, Award, Lock, UserMinus, ShieldQuestion, HelpCircle,
  ArrowLeft, Calendar, MapPin, Eye, ClipboardList, X, ChevronRight, Clock, BookOpen, AlertCircle
} from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';

interface AdminPanelProps {
  currentUser: User;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function AdminPanel({ currentUser, addToast }: AdminPanelProps) {
  const [faculty, setFaculty] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
 

  // States for Teacher drill-down details, tests, and attendees
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [teacherTests, setTeacherTests] = useState<Test[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Selector functions
  const handleSelectTeacher = async (teacher: User) => {
    setSelectedTeacher(teacher);
    setTeacherTests([]);
    setLoadingTests(true);
    setSelectedTestId(null);
    setAttendees([]);
    setReportData(null);
    try {
      const response = await apiFetch<Test[]>(`/admin/getAllTests/${teacher._id}`);
      if (response.success && response.data) {
        setTeacherTests(response.data);
      }
    } catch (err: any) {
      addToast('error', err.message || `Error compiling exam assets for ${teacher.fullname}`);
    } finally {
      setLoadingTests(false);
    }
  };

const handleViewStudentReport = async (
  testId: string,
  studentId: string
) => {
  try {
    setLoadingReport(true);

    const response: any = await apiFetch(
      `/teacher/getStudentTestDetails/${testId}/${studentId}`
    );

    // console.log("REPORT RESPONSE:", response);

    const payload =
      response?.data?.data ||
      response?.data ||
      response;

    if (!payload) {
      throw new Error("No report data received.");
    }

    setReportData(payload);
  } catch (err: any) {
    console.error(err);

    addToast(
      "error",
      err?.message || "Failed to fetch student report."
    );
  } finally {
    setLoadingReport(false);
  }
};
  const handleInspectAttendees = async (testId: string) => {
    setSelectedTestId(testId);
    setLoadingAttendees(true);
    setAttendees([]);
    setReportData(null);
    try {
      const response = await apiFetch<any[]>(`/teacher/seeAllAttendees/${testId}`);
      if (response.success && response.data) {
        setAttendees(response.data);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error tracking and fetching test respondents.');
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Fetch approved/registered faculty list
  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<User[]>('/admin/getTeachersList');
      if (response.success && response.data) {
        setFaculty(response.data);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error compiling faculty database.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchFaculty();
  }, []);

  // 1. APPROVE TEACHER ACCOUNT
  const handleApproveTeacher = async (teacherId: string, fullname: string) => {
    setActionLoadingId(teacherId);
    try {
      const response = await apiFetch<any>(`/admin/approveTeacher/${teacherId}`, {
        method: 'POST',
      });
      addToast('success', response.message || `${fullname} approved successfully!`);
      // Update local state without full reload
      setFaculty(prev => 
        prev.map(f => f._id === teacherId ? { ...f, isUserVerified: true } : f)
      );
    } catch (err: any) {
      addToast('error', err.message || `Could not approve ${fullname}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. REMOVE TEACHER ACCOUNT
  const handleRemoveTeacher = async (teacherId: string, fullname: string) => {
    if (!window.confirm(`Are you absolutely sure you want to completely remove ${fullname} from the ValidEx database?`)) {
      return;
    }
    setActionLoadingId(teacherId);
    try {
      const response = await apiFetch<any>(`/admin/removeTeacher/${teacherId}`, {
        method: 'POST',
      });
      addToast('success', response.message || `${fullname} successfully deleted.`);
      // Remove from state list
      setFaculty(prev => prev.filter(f => f._id !== teacherId));
    } catch (err: any) {
      addToast('error', err.message || `Failed to remove ${fullname}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. TOGGLE ADMIN GRADE ROLE
  const handleToggleAdminStatus = async (teacherId: string, fullname: string) => {
    if (currentUser.role !== 'superAdmin') {
      addToast('error', 'Only fully accredited Super Administrators can edit administrative clearances.');
      return;
    }
    setActionLoadingId(teacherId);
    try {
      const response = await apiFetch<any>(`/admin/adminHandler/${teacherId}`, {
        method: 'POST',
      });
      addToast('success', response.message || `Clearance modified for ${fullname}`);
      // Toggle role in local client memory
      setFaculty(prev => 
        prev.map(f => {
          if (f._id === teacherId) {
            const nextRole: UserRole = f.role === 'admin' ? 'teacher' : 'admin';
            return { ...f, role: nextRole };
          }
          return f;
        })
      );
    } catch (err: any) {
      addToast('error', err.message || `Failed to toggle clearance for ${fullname}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Find verified and pending counts
  const unverifiedCount = faculty.filter(f => f.isUserVerified === false).length;
  const verifiedCount = faculty.filter(f => f.isUserVerified !== false).length;

  const query = searchQuery.toLowerCase();

  // Filter and split roster into two distinct portions: pending and verified
  const pendingFaculty = faculty.filter(f => {
    if (f.isUserVerified !== false) return false;
    return (
      f.fullname.toLowerCase().includes(query) ||
      f.email.toLowerCase().includes(query) ||
      f.department.toLowerCase().includes(query) ||
      f.role.toLowerCase().includes(query)
    );
  });


  const verifiedFaculty = faculty.filter(f => {
    if (f.isUserVerified === false) return false;
    return (
      f.fullname.toLowerCase().includes(query) ||
      f.email.toLowerCase().includes(query) ||
      f.department.toLowerCase().includes(query) ||
      f.role.toLowerCase().includes(query)
    );
  });

  if (selectedTeacher) {
    return (
      <>
      
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-premium">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSelectedTeacher(null);
                setTeacherTests([]);
                setSelectedTestId(null);
                setAttendees([]);
              }}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-100 flex items-center justify-center"
              title="Return to Faculty database"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                
              </div>
              <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                Respected {selectedTeacher.fullname}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!selectedTeacher.isUserVerified ? (
              <button
                disabled={actionLoadingId === selectedTeacher._id}
                onClick={async () => {
                  setActionLoadingId(selectedTeacher._id);
                  try {
                    await handleApproveTeacher(selectedTeacher._id, selectedTeacher.fullname);
                    setSelectedTeacher(prev => prev ? { ...prev, isUserVerified: true } : null);
                  } catch (e) {}
                  setActionLoadingId(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="h-3.5 w-3.5" /> Approve Institutional Access
              </button>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full py-1.5 px-4 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Verified Profile
              </span>
            )}
          </div>
        </div>

        {/* Faculty Demographics Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium">
            <h3 className="font-display font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" /> Account Specifications
            </h3>
            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Name</span>
                <span className="font-semibold text-slate-900 text-sm">{selectedTeacher.fullname}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Primary Department</span>
                <span className="font-semibold text-slate-700">{selectedTeacher.department || 'General Science & Humanities'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Institutional Email Address</span>
                <span className="font-mono text-slate-800 break-all bg-slate-50 p-1.5 rounded border border-slate-100 block mt-1">{selectedTeacher.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">System Identifier</span>
                <span className="font-mono text-slate-500 break-all block">{selectedTeacher._id}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Registered Identity Role</span>
                <span className="inline-block font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">{selectedTeacher.role}</span>
              </div>
            </div>
          </div>

          {/* Schedulers or general statistics summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium md:col-span-2 flex flex-col">
  <div>
    <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-sm font-bold tracking-tight text-slate-900">
      <ClipboardList className="h-4 w-4 text-indigo-600" />
      Created Exams
    </h3>

    <p className="mt-3 text-xs leading-5 text-slate-500">
      View all exams created by this instructor. Administrators can review
      exam details, monitor student participation, and access student results.
    </p>
  </div>

  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Total Exams
      </p>

      <p className="mt-2 font-display text-3xl font-extrabold text-indigo-600">
        {loadingTests ? "..." : teacherTests.length}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Exams created by this instructor
      </p>
    </div>

    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Account Status
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            selectedTeacher.isUserVerified
              ? "bg-emerald-500"
              : "bg-amber-500"
          }`}
        />

        <span className="text-sm font-semibold text-slate-900">
          {selectedTeacher.isUserVerified
            ? "Verified Instructor"
            : "Verification Pending"}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Current verification status
      </p>
    </div>
  </div>
</div>
        </div>

        {/* Created Exams & Roster Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className={`space-y-4 ${selectedTestId ? 'xl:col-span-6' : 'xl:col-span-12'}`}>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium">
              <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight mb-4 flex items-center justify-between">
                <span>Created Exams List</span>
                {loadingTests && <span className="text-xs text-slate-400 flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Fetching exams...</span>}
              </h4>

              {loadingTests ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                  <span className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500">Retrieving test metrics...</p>
                </div>
              ) : teacherTests.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 flex flex-col items-center">
                  <BookOpen className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="font-semibold text-slate-800 text-xs">No exams  found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">This instructor has not created any exams yet..</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Subject Code</th>
                        <th className="py-3 px-4">Exam Title</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Active Schedule</th>
                        <th className="py-3 px-4 text-right">Results</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                      {teacherTests.map((test) => {
                        const isSelected = selectedTestId === test._id;
                        return (
                          <tr key={test._id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600 uppercase text-[10px]">
                              {test.subjectCode || 'GEN-101'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">{test.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Code: {test.testCode || 'N/A'}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-medium">
                            {getDuration(test.startTime, test.endTime)} mins
                            </td>
                            <td className="py-3 px-4 text-[10px] text-slate-500 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Start: {test.startTime ? new Date(test.startTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                <span>End: {test.endTime ? new Date(test.endTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleInspectAttendees(test._id)}
                                className={`py-1 px-2 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-auto ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                }`}
                              >
                                {isSelected ? 'Inspecting' : 'View Attendees'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Attendees and Marks side block */}
          {selectedTestId && (
            <div className="xl:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-premium self-start space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-700" /> Registered Attendees & Results
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Real-time candidate list and scoring.</p>
                </div>
                <button
                  onClick={() => setSelectedTestId(null)}
                  className="p-1 px-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="Close attendees pane"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {loadingAttendees ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <span className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500">Compiling attendee reports...</p>
                </div>
              ) : attendees.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 flex flex-col items-center">
                  <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="font-semibold text-slate-800 text-xs">No attempt records found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No students have submitted the examination yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Student & Reg No</th>
                        <th className="py-3 px-4 flex-1">Contact Email</th>
                       <th className="py-3 px-4 text-right">Marks</th>
<th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                      {attendees.map((att) => {
                        const studentDetails = att.studentId;
                        const studName = att.fullname || studentDetails?.fullname || att.name || studentDetails?.name || 'Encrypted Student Key';
                        const studReg = studentDetails?.regNo || att.studentId?.regNo || 'N/A';
                        const studEmail = studentDetails?.email || att.studentId?.email || 'N/A';
                        const scoreObtained = att.obtainedMarks ?? 0;
                        const maxScore = att.totalMarks ?? 10;
                        const scorePercent = Math.round((scoreObtained / maxScore) * 100);

                        return (
                          <tr key={att._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">{studName}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">{studReg}</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-500 text-[10px]">
                              {studEmail}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${scorePercent >= 40 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="text-xs">{scoreObtained}</span>
                                <span className="text-slate-400 font-normal text-[10px]">/ {maxScore} ({scorePercent}%)</span>
                              </div>
                            </td>
                           <td className="py-3 px-4 text-right">
  <button
  onClick={() => {
    const studentId =
      studentDetails?._id ||
      studentDetails?.id;

    if (!selectedTestId) {
      addToast("error", "Test ID not found");
      return;
    }

    if (!studentId) {
      addToast("error", "Student ID not found");
      return;
    }

    handleViewStudentReport(selectedTestId, studentId);
  }}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md cursor-pointer"
>
  View Report
</button>

</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
     {reportData && (
       <StudentReportView
         test={reportData.test}
         result={reportData.result}
         onClose={() => setReportData(null)}
       />
     )}
   </AnimatePresence>

   <AnimatePresence>
     {loadingReport && (
    <LoadingOverlay/>
     )}
   </AnimatePresence>
</>
      
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-premium">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" /> Faculty & Administrator Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
Manage faculty accounts, verify newly registered instructors, and control administrator access.
          </p>
        </div>
        
        <button
          onClick={fetchFaculty}
          disabled={loading}
          className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </button>
      </div>

      {/* Query Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
          placeholder="Lookup faculty member by display name, institutional email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 2 portions layout */}
      <div className="space-y-8">
        
        {/* PORTION 1: PENDING STAFF (Awaiting Approval) */}
        <div className="bg-white border border-amber-100 rounded-2xl shadow-premium overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 rounded-lg bg-amber-100 text-amber-800 text-[10px] uppercase font-bold font-mono">Pending</span>
              <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Pending Staff (Awaiting Approval)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">
              {pendingFaculty.length} / {unverifiedCount}
            </span>
          </div>

          <div className="p-0">
            {loading && faculty.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <span className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Querying faculty...</p>
              </div>
            ) : pendingFaculty.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                {searchQuery ? "No matching pending staff found." : "Excellent! There are no pending staff waiting for approval."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 font-display">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Institutional Email</th>
                      <th className="py-3 px-6">Department</th>
                      <th className="py-3 px-6">Role</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                    {pendingFaculty.map((f) => {
                      const isSelf = f._id === currentUser._id;

                      return (
                        <tr key={f._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                            <button
                              onClick={() => handleSelectTeacher(f)}
                              className="hover:text-indigo-600 text-left transition-colors font-semibold focus:outline-none cursor-pointer flex items-center gap-1"
                              title="Audit achievements, exams & marks"
                            >
                              {f.fullname}
                            </button>
                            {isSelf && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 border px-1.5 py-0.2 rounded font-mono font-bold uppercase">You</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[11px] font-medium">{f.email}</td>
                          <td className="py-4 px-6 font-medium text-slate-700">{f.department}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center bg-indigo-50 text-indigo-700 border border-indigo-100 py-0.5 px-2 rounded-full text-[10px] font-semibold tracking-wider font-mono uppercase">
                              {f.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-semibold uppercase font-sans bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                              Awaiting Approval
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-1.5">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleSelectTeacher(f)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer"
                                title="Audit academic profile & exams"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                disabled={actionLoadingId === f._id}
                                onClick={() => handleApproveTeacher(f._id, f.fullname)}
                                className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <UserCheck className="h-3 w-3" /> Approve Access
                              </button>
                              {!isSelf && (
                                <button
                                  disabled={actionLoadingId === f._id}
                                  onClick={() => handleRemoveTeacher(f._id, f.fullname)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Remove access completely"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PORTION 2: VERIFIED STAFF (Accredited) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold font-mono border border-emerald-100">Verified</span>
              <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified Faculty & Administrators
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 py-0.5 px-2 rounded-full border border-slate-200">
              {verifiedFaculty.length} / {verifiedCount}
            </span>
          </div>

          <div className="p-0">
            {loading && faculty.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                <span className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Querying faculty...</p>
              </div>
            ) : verifiedFaculty.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                {searchQuery ? "No matching verified faculty found." : "No verified faculty profiles exist."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 font-display">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Institutional Email</th>
                      <th className="py-3 px-6">Department </th>
                      <th className="py-3 px-6">Authentication Role</th>
                      <th className="py-3 px-6 text-center">Number</th>
                      <th className="py-3 px-6 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                    {verifiedFaculty.map((f) => {
                      const isSelf = f._id === currentUser._id;
                      const isSAdmin = currentUser.role === 'superAdmin';

                      return (
                        <tr key={f._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                            <button
                              onClick={() => handleSelectTeacher(f)}
                              className="hover:text-indigo-600 text-left transition-colors font-semibold focus:outline-none cursor-pointer flex items-center gap-1"
                              title="Audit achievements, exams & marks"
                            >
                              {f.fullname}
                            </button>
                            {isSelf && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 border px-1.5 py-0.2 rounded font-mono font-bold uppercase">You</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-mono text-[11px] font-medium">{f.email}</td>
                          <td className="py-4 px-6 font-medium text-slate-700">{f.department}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[10px] font-semibold tracking-wider font-mono uppercase ${
                              f.role === 'superAdmin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : f.role === 'admin'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}>
                              {f.role}
                            </span>
                          </td>
                        <td className="py-4 px-6 font-mono text-slate-600">
  {f.number || "N/A"}
</td>
                          <td className="py-4 px-6 text-right space-x-1.5">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleSelectTeacher(f)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer"
                                title="Audit academic profile & exams"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {isSAdmin && !isSelf && (
                                <button
                                  disabled={actionLoadingId === f._id}
                                  onClick={() => handleToggleAdminStatus(f._id, f.fullname)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 ${
                                    f.role === 'admin'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title={f.role === 'admin' ? "Demote to standard Teacher" : "Promote to Admin council"}
                                >
                                  <KeyRound className="h-3 w-3" /> {f.role === 'admin' ? "Remove Admin" : "Make Admin"}
                                </button>
                              )}
                              {!isSelf && f.role !== 'superAdmin' && (
                                <button
                                  disabled={actionLoadingId === f._id}
                                  onClick={() => handleRemoveTeacher(f._id, f.fullname)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Remove access completely"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>


      </div>
   
    </div>
    
  );
}
