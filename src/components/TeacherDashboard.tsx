import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api-client';
import { User, Test, Question, Attempt } from '../types';
import AdminPanel from './AdminPanel';
import { InteractiveMap } from './InteractiveMap';
import StudentReportView from './StudentReportView';
import StudentManagement from './StudentManagement';
import { getDuration } from '../utills/getDuration';
import * as XLSX from "xlsx";
import {
  ClipboardList,
  ShieldAlert,
  Plus,
  Search,
  Download,
  LogOut,
  Calendar,
  MapPin,
  Eye,
  Users,
  RefreshCw,
  Trash,
  GraduationCap,
  Pencil,
  ChevronRight, X
} from "lucide-react";
import LoadingOverlay from './LoadingOverlay';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function TeacherDashboard({ user, onLogout, addToast }: TeacherDashboardProps) {
  // Navigation & Tabs
  const [currentTab, setCurrentTab] = useState<
  'exams' | 'assemble' | 'admin' | 'students'
>('exams');
  
  // Tests List State
  const [tests, setTests] = useState<Test[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingTests, setLoadingTests] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  
  // Selected Details State (Exam inspection drawer/modal)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");
  
  // Attendees tracker state
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeTestId, setAttendeeTestId] = useState<string | null>(null);

  // Student report state
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Handle viewing specific student's deep-dive report
  const handleViewReport = async (studentId: string) => {
    if (!attendeeTestId) return;
    setLoadingReport(true);
    try {
      const response = await apiFetch<any>(`/teacher/getStudentTestDetails/${attendeeTestId}/${studentId}`);
      // Defensive fallback extraction
      const payload = response.data?.data || response.data;
      if (payload && payload.test && payload.result) {
        setReportData(payload);
      } else if (response && (response as any).test && (response as any).result) {
        setReportData(response);
      } else {
        throw new Error("Invalid report response format returned from school server");
      }
    } catch (err: any) {
      addToast('error', err.message || 'Unable to retrieve evaluation details.');
    } finally {
      setLoadingReport(false);
    }
  };

  //Delete Handler 
  const handleDeleteTest = async (testId: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this test?"
  );

  if (!confirmed) return;

  try {
    await apiFetch(`/teacher/deleteTest/${testId}`, {
      method: "DELETE",
    });

    addToast("success", "Test deleted successfully.");

    setTests((prev) =>
      prev.filter((t) => t._id !== testId)
    );
  } catch (err: any) {
    addToast(
      "error",
      err.message || "Failed to delete test."
    );
  }
};



  // Test Assembly Builder State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDuration, setNewDuration] = useState(20); // 20 mins default
  const [newTotalMarks, setNewTotalMarks] = useState(10);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  
  // Geolocation defaults
  const [newLat, setNewLat] = useState(25.3960); // Pakistan (Hyderabad Center) Standard Fallback
  const [newLng, setNewLng] = useState(68.3578);
  const [newRadius, setNewRadius] = useState(30); // 30 meters default
  const [isGeofenced, setIsGeofenced] = useState(true); // Toggle to choose if teacher wants to bound location
  const [isCameraMonitoring, setIsCameraMonitoring] = useState(false);

  // Questions dynamic stack
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    {
      questionType: 'mcq',
      questionText: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    }
  ]);

  const [assemblySubmitting, setAssemblySubmitting] = useState(false);

  // Fetch paginated exams
  const fetchExams = async (targetPage = 1) => {
    setLoadingTests(true);
    try {
      const response = await apiFetch<Test[]>(`/teacher/getAllTests?page=${targetPage}`);
      if (response.success && response.data) {
        setTests(response.data);
        // Page size is 10. If returned counts are less than 10, there is no next page.
        setHasNextPage(response.data.length === 10);
        setPage(targetPage);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Unable to load examinations list.');
    } finally {
      setLoadingTests(false);
    }
  };
   useEffect(() => {
  if (newStartTime && newEndTime) {
    const start = new Date(newStartTime).getTime();
    const end = new Date(newEndTime).getTime();

    if (end > start) {
      const diffMinutes = Math.floor(
        (end - start) / (1000 * 60)
      );

      setNewDuration(diffMinutes);
    } else {
      setNewDuration(0);
    }
  }
}, [newStartTime, newEndTime]);


  useEffect(() => {
    if (currentTab === 'exams') {
      fetchExams(1);
    }
  }, [currentTab]);

  // Inspect particular exam details (questions list)
  const handleInspectTest = async (testId: string) => {
    setLoadingDetails(true);
    try {
      const response = await apiFetch<Test>(`/teacher/getTestDetails/${testId}`);
      if (response.success && response.data) {
        setSelectedTest(response.data);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error tracking test parameters.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Inspect student attempts (attendees)
  const handleInspectAttendees = async (testId: string) => {
    setLoadingAttendees(true);
    setAttendeeTestId(testId);
    try {
      const response = await apiFetch<any[]>(`/teacher/seeAllAttendees/${testId}`);
      if (response.success && response.data) {
        setAttendees(response.data);
      }
      // console.log(attendees);
      
    } catch (err: any) {
      addToast('error', err.message || 'Could not fetch exam respondents.');
    } finally {
      setLoadingAttendees(false);
    }
  };



  // Build Assembly parameters
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionType: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1
      }
    ]);
  };

  const removeQuestion = (idx: number) => {
    const nextQ = [...questions];
    nextQ.splice(idx, 1);
    setQuestions(nextQ);
  };

  const handleUpdateQuestion = (idx: number, patch: Partial<Question>) => {
    const nextQ = [...questions];
    nextQ[idx] = { ...nextQ[idx], ...patch };
    setQuestions(nextQ);
  };

  const handleUpdateMCQOption = (qIdx: number, optIdx: number, val: string) => {
    const nextQ = [...questions];
    if (nextQ[qIdx].options) {
      const nextOptions = [...nextQ[qIdx].options!];
      nextOptions[optIdx] = val;
      nextQ[qIdx].options = nextOptions;
    }
    setQuestions(nextQ);
  };

  // Test Creation Post Handler
  const handleAssembleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core validation and normalized schemas
    if (!newTitle || !newSubject || !newStartTime || !newEndTime) {
      addToast('error', 'All exam fields are required.');
      return;
    }

    if (newTitle.length < 6) {
      addToast('error', 'The test title must have at least 6 characters.');
      return;
    }

    if (newSubject.length < 6) {
      addToast('error', 'The subject code must have at least 6 characters.');
      return;
    }

    // Inspect questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || q.questionText.length < 5) {
        addToast('error', `Question #${i + 1} text is too short (min 5 characters).`);
        return;
      }
      if (q.questionType === 'mcq') {
        if (!q.options || q.options.some(opt => !opt.trim())) {
          addToast('error', `Ensure Question #${i + 1} has 4 valid, non-empty options.`);
          return;
        }
      }
    }

    setAssemblySubmitting(true);
    try {
      const computedTotal = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      
      const payload = {
        title: newTitle,
        subjectCode: newSubject.toUpperCase(),
          isCameraMonitoring: isCameraMonitoring,
        duration: Number(newDuration),
        totalMarks: computedTotal,
        startTime: new Date(newStartTime).toISOString(),
        endTime: new Date(newEndTime).toISOString(),
        allowedLocation: {
          lat: isGeofenced ? Number(newLat) : 0,
          lng: isGeofenced ? Number(newLng) : 0,
          radius: isGeofenced ? Number(newRadius) : 0,
        },
        questions: questions
      };

     const endpoint = editingTestId ? `/teacher/updateTest/${editingTestId}`: `/teacher/createTest`;

const method = editingTestId ? "PUT" : "POST";

const response = await apiFetch<any>(endpoint, {
  method,
  body: JSON.stringify(payload),
});

      addToast('success', `Exam successfully created! Generated system access code is: ${response.data.testCode}`);
      
      // Reset Assembly state
      setNewTitle('');
      setNewSubject('');
      setNewStartTime('');
      setNewEndTime('');
      setNewLat(25.3960);
setNewLng(68.3578);
setNewRadius(50);
setIsGeofenced(true);
setIsCameraMonitoring(false);
      setNewDuration(10);
      setQuestions([{
        questionType: 'mcq',
        questionText: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1
      }]);

      setEditingTestId(null);
fetchExams();
      
      setCurrentTab('exams');
    } catch (err: any) {
      addToast('error', err.message || 'Error creating test file.');
    } finally {
      setAssemblySubmitting(false);
    }
  };

 


  // Test Edit Handler 
const handleEditTest = async (testId: string) => {
  try {
    const response = await apiFetch<Test>(
      `/teacher/getTestDetails/${testId}`
    );

    if (!response.success || !response.data) return;

    const test = response.data;

    setEditingTestId(test._id);

    setCurrentTab("assemble");

    setNewTitle(test.title);
    setNewSubject(test.subjectCode);

    setNewStartTime(
      new Date(test.startTime).toISOString().slice(0, 16)
    );

    setNewEndTime(
      new Date(test.endTime).toISOString().slice(0, 16)
    );

    setIsCameraMonitoring(
      test.isCameraMonitoring ?? false
    );

    if (test.allowedLocation) {
      setNewLat(test.allowedLocation.lat);
      setNewLng(test.allowedLocation.lng);
      setNewRadius(test.allowedLocation.radius);

      setIsGeofenced(
        test.allowedLocation.radius > 0
      );
    }

    setQuestions(
      (test.questions || []).map((q: any) => ({
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        marks: q.marks,
        _id: q._id,
      }))
    );
  } catch (err: any) {
    addToast(
      "error",
      err.message || "Unable to load test."
    );
  }
};

// test export handler
const handleExportResults = () => {
 const rows = attendees.map((att) => {
    const student = att.studentId;

    const score = att.obtainedMarks ?? 0;
    const total = att.totalMarks ?? 0;

    const percentage =
      total > 0
        ? Math.round((score / total) * 100)
        : 0;

    return {
      "Student Name": student?.fullname,
      "Registration No": student?.regNo,
      Email: student?.email,
      "Obatained Marks" : score,
      "Total Marks": total,
      Percentage: `${percentage}%`,
      Violations: att.violation ?? 0,
      Result: percentage >= 40 ? "Passed" : "Failed",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Results"
  );

 const currentTest = tests.find(
  (t) => t._id === attendeeTestId
);

const title = (currentTest?.title || "Exam")
  .replace(/[\\/:*?"<>|]/g, "")
  .replace(/\s+/g, "_");

const today = new Date().toISOString().split("T")[0];

XLSX.writeFile(
  workbook,
  `${title}_Results_${today}.xlsx`
);
};

 //filtered Attendees for search
const filteredAttendees =
  searchStudent.trim() === ""
    ? attendees
    : attendees.filter((att) => {
        const student = att.studentId;

        const keyword = searchStudent.toLowerCase();

        return (
          (student?.fullname || "").toLowerCase().includes(keyword) ||
          (student?.regNo || "").toLowerCase().includes(keyword) ||
          (student?.email || "").toLowerCase().includes(keyword)
        );
      });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-display font-bold text-lg text-white">
              V
            </div>
            <div>
              <span className="font-display font-medium text-lg text-slate-900 tracking-tight">ValidEx <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 py-0.5 px-2.5 rounded-full font-sans font-semibold ml-2">{user.role === 'admin' || user.role === 'superAdmin' ? 'Administrative Panel' : 'Faculty Panel'}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user.fullname}</p>
                <p className="text-xs text-slate-500 font-medium font-mono uppercase tracking-wider">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors hover:bg-slate-50 p-2 rounded-lg"
              title="End session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Sidebar-like Tabs */}
        <div className="flex items-center border-b border-slate-200">
          <button
            onClick={() => setCurrentTab('exams')}
            className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'exams'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Examination Directory
          </button>
          
          <button
            id="tab-assemble-btn"
            onClick={() => setCurrentTab('assemble')}
            className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'assemble'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" /> Create New Exam
          </button>

          {(user.role === 'admin' || user.role === 'superAdmin') && (
            <button
              id="tab-admin-btn"
              onClick={() => setCurrentTab('admin')}
              className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="h-4 w-4" /> Faculty Governance
            </button>
          )}

          {(user.role === 'admin' || user.role === 'superAdmin') && (
  <button
    id="tab-student-btn"
    onClick={() => setCurrentTab('students')}
    className={`py-4 px-6 font-display font-medium text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
      currentTab === 'students'
        ? 'border-indigo-600 text-indigo-600 font-semibold'
        : 'border-transparent text-slate-500 hover:text-slate-900'
    }`}
  >
    <GraduationCap className="h-4 w-4" />
    Student Management
  </button>
)}
        </div>

        {/* CONTROLS SWITCH */}
        {currentTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">Active Exams</h2>
                <p className="text-xs text-slate-500 mt-1">View and manage all exams created under your verified account.</p>
              </div>
              <button
                onClick={() => fetchExams(1)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh List
              </button>
            </div>

            {loadingTests ? (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-2xl">
                <span className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">Retrieving test listings...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl max-w-lg mx-auto p-8 flex flex-col items-center">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-950">No examinations found</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mt-1.5 mb-5">
                 No exams created yet. Create your first exam by adding questions and, if required, setting a location boundary.
                </p>
                <button
                  onClick={() => setCurrentTab('assemble')}
                  className="bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Create An Exam
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => {
                  const formatDateSafe = (dateVal: any) => {
                    if (!dateVal) return 'N/A';
                    const d = new Date(dateVal);
                    if (isNaN(d.getTime())) return 'N/A';
                    try {
                      return d.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                    } catch (e) {
                      return d.toISOString();
                    }
                  };

                  const start = formatDateSafe(test.startTime);
                  const end = formatDateSafe(test.endTime);

                  return (
                    <motion.div
                      key={test._id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden hover:border-indigo-100 transition-all flex flex-col justify-between"
                    >
                  
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100 uppercase">
                            CODE: {test.testCode}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                            {test.subjectCode}
                          </span>
                        </div>

                       <div className="flex items-start justify-between gap-4">
  <h3
    onClick={() => handleInspectTest(test._id)}
    className="flex-1 font-display font-bold text-slate-950 text-base leading-snug tracking-tight hover:text-indigo-600 transition-colors cursor-pointer"
  >
    {test.title}
  </h3>

  <div className="flex items-center gap-2 flex-shrink-0">
    <button
      onClick={() => handleEditTest(test._id)}
      className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center"
      title="Edit Test"
    >
      <Pencil className="h-4 w-4" />
    </button>

    <button
      onClick={() => handleDeleteTest(test._id)}
      className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
      title="Delete Test"
    >
      <Trash className="h-4 w-4" />
    </button>
  </div>
</div>
                        


                        {/* Timing indicator */}
                        <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                          <p className="flex items-center gap-1.5 font-medium text-slate-600"><Calendar className="h-3.5 w-3.5 text-slate-400" /> TIMING SCOPE:</p>
                          <p className="pl-5 text-[11px] leading-relaxed">
                            Start: <span className="font-semibold text-slate-800">{start}</span><br />
                            End: &nbsp;&nbsp;<span className="font-semibold text-slate-800">{end}</span>
                          </p>
                        </div>
                      </div>

                      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-1">
                        <span className="text-[11px] text-slate-500 font-semibold font-mono">
                         {getDuration(test.startTime, test.endTime)} mins
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            title="Inspect Exam Parameter Questions"
                            onClick={() => handleInspectTest(test._id)}
                            className="p-1 px-2.5 rounded-lg text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> Specs
                          </button>
                          
                          <button
                            title="Review Candidates"
                            onClick={() => handleInspectAttendees(test._id)}
                            className="p-1 px-2.5 rounded-lg text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5" /> Attendees
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {tests.length > 0 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => fetchExams(page - 1)}
                  disabled={page === 1}
                  className="py-1 px-3 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-slate-500 font-mono">
                  PAGE {page}
                </span>
                <button
                  onClick={() => fetchExams(page + 1)}
                  disabled={!hasNextPage}
                  className="py-1 px-3 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {currentTab === 'assemble' && (
          /* NEW TEST ASSEMBLY VIEW */
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
            <div className="px-8 py-6 border-b border-secondary/20 bg-slate-50">
              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">Examination Sheet </h2>
              <p className="text-xs text-slate-500 mt-1">Configure complete test requirements, geolocation coordinates, and questions  below.</p>
            </div>

            <form onSubmit={handleAssembleTest} className="p-8 space-y-8" id="test-assembly-form">
              {/* Basic Details Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">1. Basic Test Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exam Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      placeholder="Midterm Exam: Data Structures"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject Code</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                      placeholder="CSE-202"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      required
                    />
                  </div>

              <div className="space-y-1">

  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
    Duration (Minutes)
  </label>

  <input
    type="number"
    value={newDuration}
    readOnly
    className="w-full px-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl focus:outline-none cursor-not-allowed font-mono"
  />

</div>

                  <div className="space-y-1" />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Start  Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">End Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>




{/* Camera Monitoring Toggle */}
<div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
  <div>
    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">
      Camera Monitoring
    </h4>
    <p className="text-[11px] text-slate-500 mt-1">
      Enable camera verification during the examination.
    </p>
  </div>

  <button
    type="button"
    onClick={() => setIsCameraMonitoring(!isCameraMonitoring)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      isCameraMonitoring
        ? 'bg-indigo-600'
        : 'bg-slate-300'
    }`}
    
  >
 
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
        isCameraMonitoring
          ? 'translate-x-5'
          : 'translate-x-1'
      }`}
    />
  </button>
</div>


            {/* Geoposition Lock */}
<div className="space-y-4 pt-6 border-t border-slate-100">

  {/* Same Toggle Design As Camera Monitoring */}
  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">

    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">
        🔒 2. Access Boundary Control
      </h4>

      <p className="text-[11px] text-slate-500 mt-1">
        Restrict exam access based on geographic department coordinates.
      </p>
    </div>


    <button
      type="button"
      onClick={() => setIsGeofenced(!isGeofenced)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isGeofenced
          ? "bg-indigo-600"
          : "bg-slate-300"
      }`}
    >

      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          isGeofenced
            ? "translate-x-5"
            : "translate-x-1"
        }`}
      />

    </button>

  </div>


  {/* Disabled State */}
  {!isGeofenced ? (

    <div className="p-8 text-center bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex flex-col items-center justify-center space-y-2">

      <span className="text-2xl">
        🌍
      </span>


      <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-900 font-display">
        Global Entrance Allowed, 
      </h4>


      <p className="text-[11px] text-indigo-700 font-semibold max-w-md leading-relaxed">
        Location restrictions are disabled. Students can access this test from any location.
      </p>

    </div>


  ) : (


    <>

      {/* Location Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">


        <div className="space-y-1">

          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Center Latitude
          </label>

          <input
            type="number"
            step="any"
            className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
            value={newLat}
            onChange={(e)=>setNewLat(Number(e.target.value))}
            required
          />

        </div>



        <div className="space-y-1">

          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Center Longitude
          </label>


          <input
            type="number"
            step="any"
            className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
            value={newLng}
            onChange={(e)=>setNewLng(Number(e.target.value))}
            required
          />


        </div>

        <div className="space-y-1">

          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Radius Limit (Meters)
          </label>


          <input
            type="number"
            className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors font-mono"
            value={newRadius}
            onChange={(e)=>setNewRadius(Number(e.target.value))}
            required
          />

        </div>


      </div>



      {/* Map */}
      <div className="border border-slate-100 p-2.5 rounded-2xl bg-slate-50/50">

        <InteractiveMap
          lat={newLat}
          lng={newLng}
          radius={newRadius}
          onChange={(lat,lng)=>{
            setNewLat(lat);
            setNewLng(lng);
          }}
        />

      </div>


    </>

  )}


</div>

              {/* Questions Assembler drawer */}
              <div className="space-y-5 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">3. Questions  ({questions.length})</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="py-1 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-slate-100 shadow-sm p-5 rounded-xl space-y-4 relative bg-slate-50/50">
                      {/* Delete index anchor */}
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Erase question"
                        >
                          <Trash className="h-4 w-4 text-rose-500" />
                        </button>
                      )}

                      <div className="flex flex-wrap items-center gap-4">
                        <span className="h-6 w-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                          {qIdx + 1}
                        </span>

                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { questionType: 'mcq' })}
                            className={`py-1 px-3 rounded-md font-semibold transition-all ${
                              q.questionType === 'mcq'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Multiple Choice
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(qIdx, { questionType: 'theory' })}
                            className={`py-1 px-3 rounded-md font-semibold transition-all ${
                              q.questionType === 'theory'
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Theoretical Question
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold uppercase text-slate-400">Marks:</label>
                          <input
                            type="number"
                            min={1}
                            className="w-16 px-2 py-1 text-xs bg-white border border-slate-200 rounded font-bold font-display"
                            value={q.marks || 1}
                            onChange={(e) => handleUpdateQuestion(qIdx, { marks: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400">Write Your Question</label>
                        <textarea
                          rows={2}
                          className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
                          placeholder="What is the time complexity of retrieval operations inside balanced binary trees?"
                          value={q.questionText}
                          onChange={(e) => handleUpdateQuestion(qIdx, { questionText: e.target.value })}
                          required
                        />
                      </div>

                      {/* Optional Options Stack (MCQ SPECIFIC) */}
                      {q.questionType === 'mcq' && (
                        <div className="space-y-3 pt-2 pl-4 border-l-2 border-indigo-500/30">
                          <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Define Options & Select Correct Ans</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-slate-200">
                                <input
                                  type="radio"
                                  name={`correctOption-${qIdx}`}
                                  checked={q.correctOption === optIdx}
                                  onChange={() => handleUpdateQuestion(qIdx, { correctOption: optIdx })}
                                  className="h-4 w-4 text-indigo-600"
                                />
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  {String.fromCharCode(65 + optIdx)}:
                                </span>
                                <input
                                  type="text"
                                  className="flex-1 px-2 py-1 bg-transparent text-xs text-slate-700 focus:outline-none"
                                  placeholder={`Option # ${optIdx + 1}`}
                                  value={q.options?.[optIdx] || ''}
                                  onChange={(e) => handleUpdateMCQOption(qIdx, optIdx, e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentTab('exams')}
                  className="py-2.5 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={assemblySubmitting}
                  className="py-2.5 px-5 rounded-xl border border-indigo-700 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {assemblySubmitting ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Publish Examination Sheet <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentTab === 'admin' && (
          <AdminPanel currentUser={user} addToast={addToast} />
        )}
        {currentTab === 'students' && (
  <StudentManagement
    currentUser={user}
    addToast={addToast}
  />
)}
      </main>

      {/* MODAL 1: EXAM SPECIFICATIONS (Questions Viewer Drawer) */}
      <AnimatePresence>
        {selectedTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTest(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Drawer header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">
                    CODE: {selectedTest.testCode}
                  </span>
                  <h3 className="font-display font-bold text-slate-900 text-lg tracking-tight mt-2">{selectedTest.title}</h3>
                  <p className="text-slate-500 text-xs font-medium font-mono">Subject: {selectedTest.subjectCode} &middot;{getDuration(selectedTest.startTime, selectedTest.endTime)} mins</p>
                   
                </div>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer scroll container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                 {/* Visual Location Check */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="h-4 w-4 text-indigo-600" /> Location Fence Boundary Parameters</p>
                  {Number(selectedTest.allowedLocation?.radius || 0) === 0 ? (
                    <p className="text-xs text-emerald-700 leading-relaxed font-bold pl-5 flex items-center gap-1.5 antialiased">
                      🌍 Accessible Globally (Location Geofence Bounding is Disabled)
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold pl-5">
                        Latitude: <span className="font-mono text-slate-900 bg-white border px-1 rounded">{selectedTest.allowedLocation.lat}</span> &nbsp;&middot;&nbsp; 
                        Longitude: <span className="font-mono text-slate-900 bg-white border px-1 rounded">{selectedTest.allowedLocation.lng}</span> &nbsp;&middot;&nbsp; 
                        Max allowable Radius: <span className="text-indigo-600 font-mono text-slate-900 bg-white border px-1 rounded">{selectedTest.allowedLocation.radius} meters</span>
                      </p>
                      <p className="text-[10px] text-slate-400 pl-5">
                        Students launching desktop verification outside this circle coordinate perimeter fence will be strictly blocked from exam retrieval actions.
                      </p>
                    </>
                  )}
                </div>

                {/* Drawer questions list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Questions Checklist</h4>
                  
                  {(!selectedTest.questions || selectedTest.questions.length === 0) ? (
                    <p className="text-xs text-slate-500 italic pl-2">No compiled questions loaded in this exam metadata.</p>
                  ) : (
                    <div className="space-y-4">
                      {(selectedTest.questions as Question[]).map((q, idx) => (
                        <div key={q._id || idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-xs font-semibold text-slate-800">Question #{idx + 1}</span>
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-widest uppercase">
                              <span className={`px-2 py-0.5 rounded ${
                                q.questionType === 'mcq' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {q.questionType}
                              </span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Marks: {q.marks}</span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-900 leading-relaxed font-medium">
                            {q.questionText}
                          </p>

                          {q.questionType === 'mcq' && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                                    q.correctOption === optIdx
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-medium'
                                      : 'border-slate-100 bg-white text-slate-600'
                                  }`}
                                >
                                  <span className="font-mono font-bold text-slate-400">
                                    {String.fromCharCode(65 + optIdx)}:
                                  </span>
                                  {opt}
                                  {q.correctOption === optIdx && <span className="text-[10px] bg-emerald-600 text-white rounded px-1.5 py-0.2 select-none uppercase font-mono ml-auto">Correct</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Close container */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTest(null)}
                  className="py-2 px-4 rounded-xl text-slate-600 font-semibold bg-white border border-slate-200 text-xs hover:bg-slate-100 transition-colors transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ATTENDEES TRACKER DRAWER */}
      <AnimatePresence>
        {attendeeTestId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAttendeeTestId(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Drawer header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-lg tracking-tight">Attendies List</h3>
                  <p className="text-slate-500 text-xs mt-1">updated record of students who attempted this particular examination .</p>
                </div>
                <button
                  onClick={() => setAttendeeTestId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Recipient scroll table */}
             <div className="overflow-y-auto flex-1 p-6">
  {loadingAttendees ? (
    <div className="py-20 flex flex-col items-center justify-center gap-2">
      <span className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-400">
        Loading student records...
      </p>
    </div>
  ) : attendees.length === 0 ? (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-md mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Users className="h-7 w-7 text-slate-400" />
      </div>

      <h3 className="text-base font-semibold text-slate-900">
        No Students Yet
      </h3>

      <p className="mt-2 text-sm text-slate-500 leading-6">
        No students have completed this exam yet. Student attempts will
        appear here automatically after they submit the exam.
      </p>
    </div>
  ) : (
<> 
         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

  <div className="relative w-full md:max-w-sm">

    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

    <input
      type="text"
      value={searchStudent}
      onChange={(e) =>
        setSearchStudent(e.target.value)
      }
      placeholder="Search by name, registration number or email..."
      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />

  </div>

  <button
    type="button"
    onClick={handleExportResults}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
  >
    <Download className="h-4 w-4" />
    Export Results
  </button>

</div>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    
                    <table className="w-full text-left text-xs border-collapse">
                     <thead>
  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide border-b border-slate-100">
    <th className="py-3 px-4">Student</th>
    <th className="py-3 px-4">Registration No.</th>
    <th className="py-3 px-4">Email</th>
    <th className="py-3 px-6 text-right">Marks</th>
    <th className="py-3 px-4 text-center">Violations</th>
  </tr>
</thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                        {filteredAttendees.map((att) => {
                          const student = att.studentId;
                          const name = att.fullname || student?.fullname || 'Encrypted Student Key';
                          const reg = student?.regNo || att.studentId?.regNo || 'N/A';
                          const mail = student?.email || att.studentId?.email || 'unknown@academy.edu';
                          const score = att.obtainedMarks ?? 0;
                          const tot = att.totalMarks ?? 10;
                          const percent = Math.round((score / tot) * 100);
                          const violations = att.violation ?? 0;

                          return (
                            <tr key={att._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-slate-900">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const studentId = (student && typeof student === 'object') 
                                      ? (student._id || (student as any).id) 
                                      : (student || att._id);
                                    if (studentId) handleViewReport(studentId);
                                  }}
                                  className="hover:text-indigo-600 hover:underline text-left font-semibold cursor-pointer transition-colors focus:outline-none flex items-center gap-1.5 focus:ring-0"
                                  title="Review student attempt and grading metrics"
                                >
                                  {name}
                                </button>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 font-semibold uppercase">{reg}</td>
                              <td className="py-3.5 px-4 text-slate-500 font-medium">{mail}</td>
                             <td className="py-3.5 px-6 text-right font-semibold text-slate-900">
  <span
    className={`mr-2 inline-block h-2 w-2 rounded-full ${
      percent >= 40 ? "bg-emerald-500" : "bg-rose-500"
    }`}
  />
  {score}
  <span className="text-slate-400 font-normal">
    {" "}
    / {tot}
  </span>
</td>
<td className="py-3.5 px-4 text-center">
  <span
    className={`inline-flex items-center justify-center min-w-[38px] px-2 py-1 rounded-full text-[11px] font-semibold ${
      violations > 0
        ? "bg-amber-50 text-amber-700 border border-amber-100"
        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
    }`}
  >
    {violations}
  </span>
</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div> 
                </>
                )}
              </div>

              {/* Close container */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => attendeeTestId && handleInspectAttendees(attendeeTestId)}
                  className="p-1 px-3 border border-slate-200 bg-white rounded text-[11px] font-bold text-slate-600 flex items-center gap-1 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setAttendeeTestId(null)}
                  className="py-2 px-4 rounded-xl text-slate-600 font-semibold bg-white border border-slate-200 text-xs hover:bg-slate-100 transition-colors transition-all cursor-pointer"
                >
                  Close 
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Detailed Report View overlay */}
      <AnimatePresence>
        {reportData && (
          <StudentReportView
            test={reportData.test}
            result={reportData.result}
            onClose={() => setReportData(null)}
          />
        )}
      </AnimatePresence>

      {/* Report Fetch Loading screen overlay */}
     <AnimatePresence>
         {loadingReport && (
        <LoadingOverlay/>
         )}
       </AnimatePresence>
    </div>
  );
}
