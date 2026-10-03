 

import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  GraduationCap, 
  BookOpen, 
  Award,
  HelpCircle,
  Check,
  AlertOctagon
} from 'lucide-react';
import { Attempt, Test, Question } from '../types';

interface StudentReportViewProps {
  test: Test;
  result: Attempt & {
    studentId: {
      _id: string;
      fullname: string;
      email: string;
    }
  };
  onClose: () => void;
}

export default function StudentReportView({ test, result, onClose }: StudentReportViewProps) {
  const mcqs = Array.isArray(result?.mcqsAns) ? result.mcqsAns : [];
  const theoretical = Array.isArray(result?.theoreticalAns) ? result.theoreticalAns : [];

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'N/A';
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper to find question details by ID
  // const findQuestion = (qId: string): Question | undefined => {
  //   const list = Array.isArray(test.questions) ? (test.questions as Question[]) : [];
  //   return list.find((q) => q._id === qId || (q as any).id === qId);
  // };

  // Duration in minutes computation
  const getDurationString = () => {
    if (!result.startTime || !result.submitTime) return 'N/A';
    const start = new Date(result.startTime).getTime();
    const submit = new Date(result.submitTime).getTime();
    if (isNaN(start) || isNaN(submit)) return 'N/A';
    const diffMins = Math.round((submit - start) / 60000);
    return `${diffMins} minutes`;
  };

  const hasViolations = (result.violation ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Absolute Backdrop with motion transition */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
      />




      {/* Main Report Container Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header containing name & closing controls */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 font-mono">Student Exam Report</span>
            <h3 className="font-display font-black text-slate-900 text-2xl tracking-tight">
              {result.studentId?.fullname || 'Student'}
            </h3>
            <p className="text-slate-500 text-xs font-mono">{result.studentId?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
            title="Dismiss Report"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-8 font-sans">
          
          {/* Bento-grid Grid representing Metadata Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Core Score card */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Exam Score</span>
                <Award className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-black text-slate-950 font-mono">
                  {result.obtainedMarks ?? 0} <span className="text-sm font-normal text-slate-400">/ {result.totalMarks ?? test.totalMarks ?? 100}</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                   Overall Score : {Math.round(((result.obtainedMarks ?? 0) / (result.totalMarks ?? test.totalMarks ?? 1)) * 100)}%
                </p>
              </div>
            </div>

            {/* Proctoring violations tracker card */}
            <div className={`border rounded-2xl p-5 flex flex-col justify-between ${
              hasViolations 
                ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                : 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest font-mono">Proctoring Status</span>
                {hasViolations ? <AlertOctagon className="h-5 w-5 text-rose-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-black font-mono">
                  {result.violation ?? 0} <span className="text-xs font-normal">violation{(result.violation ?? 0) !== 1 ? 's' : ''}</span>
                </h4>
                <p className="text-[11px] font-semibold mt-1">
                  {hasViolations 
                    ? 'Security violations were detected during the exam..' 
                    : 'No security violations detected during the exam.'}
                </p>
              </div>
            </div>
         
            {/* Time efficiency card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Time Spent</span>
                <Clock className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold text-slate-900 font-mono">
                  {getDurationString()}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                 Total time taken to complete the exam.
                </p>
              </div>
            </div>

          </div>

          {/* Test Parameters specification card */}
          <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <BookOpen className="h-4 w-4 text-indigo-500" /> Exam Details
            </h4>
            <div className="space-y-1.5 pl-5">
              <h5 className="font-extrabold text-slate-900 text-base">{test.title || 'Exam Information'}</h5>
              {/* <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">{test.description || 'No subject syllabus reference summary submitted.'}</p> */}
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono font-medium pl-5 pt-1 text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /> Started: {formatTime(result.startTime)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> Submitted: {formatTime(result.submitTime)}</span>
            </div>
          </div>

          {/* SECTION A: MCQ REVIEWS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 font-mono">
              <Award className="h-4 w-4 text-indigo-500" /> Section A: Multiple Choice Question (MCQ) 
            </h4>

            {mcqs.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold pl-5 italic">No multiple-choice questions were included in this exam.</p>
            ) : (
              <div className="space-y-4 pl-1">
                {mcqs.map((ans, idx) => {
                 const q = ans?.questionId;
                  const qText = q?.questionText || `Evaluation Question Reference #${idx + 1}`;
                  const optionsList = q?.options || [];
                  const selectedOptionNum = ans.selectedOption;
                  const correctOptionNum = q?.correctOption ?? -1;

                  return (
                    <div key={q?._id || `${idx}-${ans?.selectedOption ?? 'na'}`} className="border border-slate-100 rounded-2xl p-5 space-y-3 bg-white hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Question {idx + 1}</span>
                          <p className="text-sm font-bold text-slate-900 leading-snug">{qText}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-semibold tracking-wider uppercase font-mono ${
                            ans.isCorrect 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {ans.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {ans.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-50 border px-1.5 py-0.5 rounded">
                            Marks: {ans.obtainedMarks ?? 0} / {q?.marks ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Display choices if available */}
                      {optionsList.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {optionsList.map((opt, optIdx) => {
                            const isSelected = optIdx === selectedOptionNum;
                            const isCorrectAns = optIdx === correctOptionNum;
                            
                            let borderClass = 'border-slate-100 bg-slate-50/50';
                            let textClass = 'text-slate-600';
                            let badgeLabel = null;

                            if (isSelected) {
                              if (ans.isCorrect) {
                                borderClass = 'border-emerald-200 bg-emerald-50/30';
                                textClass = 'text-emerald-950 font-bold';
                                badgeLabel = 'Student Selected ';
                              } else {
                                borderClass = 'border-rose-200 bg-rose-50/30';
                                textClass = 'text-rose-950 font-bold';
                                badgeLabel = 'Student Selected';
                              }
                            } else if (isCorrectAns) {
                              borderClass = 'border-emerald-200 bg-emerald-50/10';
                              textClass = 'text-emerald-800 font-bold';
                              badgeLabel = 'Correct Answer Key';
                            }

                            return (
                              <div key={optIdx} className={`border p-3 rounded-xl flex items-center justify-between text-xs transition-colors ${borderClass}`}>
                                <span className={textClass}>
                                  <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                                </span>
                                {badgeLabel && (
                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md font-mono ${
                                    isCorrectAns ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {badgeLabel}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: THEORY REVIEWS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 font-mono">
              <MessageSquare className="h-4 w-4 text-indigo-500" /> Section B: Theorey Questions
            </h4>

            {theoretical.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold pl-5 italic">No Any Theoretical Questions Found.</p>
            ) : (
              <div className="space-y-4 pl-1">
                {theoretical.map((ans, idx) => {
                 const q = ans?.questionId;
                  const qText = q?.questionText || `Theory Prompt Reference #${idx + 1}`;

                  return (
                    <div key={q?._id || `${idx}-${ans?.status ?? 'na'}`} className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-white hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Theory Question {idx + 1}</span>
                          <p className="text-sm font-bold text-slate-900 leading-snug">{qText}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5 shrink-0 font-mono">
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border px-1.5 py-0.5 rounded">
                            Marks: {ans.obtainedMarks ?? 0} / {q?.marks ?? 0}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                            ans.status === 'graded' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {ans.status === 'graded' ? 'Reviewed' : 'Pending Review'}
                          </span>
                        </div>
                      </div>

                      {/* Display actual Student Answer */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Student Answer</label>
                        <div className="p-4 bg-gray-700 text-slate-100 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {ans.ans || '[No answer was cataloged inside student attempt stream]'}
                        </div>
                      </div>

                      {/* Evaluator feedback quote */}
                      {ans.feedback && (
                        <div className="p-3 bg-amber-50/40 border border-amber-100/50 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-800 uppercase tracking-wider font-extrabold font-mono">
                            <MessageSquare className="h-3 w-3" /> Instructor Feedback
                          </div>
                          <p className="text-xs text-amber-900 italic font-medium pl-4">
                            "{ans.feedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions panel */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-6 rounded-xl text-slate-700 font-extrabold bg-white border border-slate-200 text-xs hover:bg-slate-100 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
