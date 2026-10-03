import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import {   RefreshCw,
  Users,
  Search,
  Trash,} from "lucide-react";
import { User } from "../types";

interface Props {
  currentUser: User;
  addToast: (
    type: "success" | "error" | "info",
    text: string
  ) => void;
}

interface Student {
  _id: string;
  fullname: string;
  regNo: string;
  email: string;
  department: string;
  number: string;
}

export default function StudentManagement({
  addToast,
}: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [isFirstLoad, setIsFirstLoad] = useState(true);



const fetchStudents = async (
  targetPage = 1,
  keyword = search
) => {
  keyword = keyword.trim();
  setLoading(true);
  try {
    const response = await apiFetch<any>(
      `/admin/getStudentList?page=${targetPage}&search=${encodeURIComponent(
        keyword
      )}`
    );


  if (response.success) {
  setStudents(response.data.students);
  setPage(response.data.page);
  setTotalPages(response.data.totalPages);
}
  } catch (err: any) {
    addToast(
      "error",
      err.message || "Unable to load students."
    );
  } finally {
    setLoading(false);
  }
};


  const handleRemoveStudent = async (studentId: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to remove this student?"
  );

  if (!confirmed) return;

  try {
    await apiFetch(`/admin/removeStudent/${studentId}`, {
      method: "DELETE",
    });

    addToast(
      "success",
      "Student removed successfully."
    );

  fetchStudents(page, search);
  } catch (err: any) {
    addToast(
      "error",
      err.message || "Unable to remove student."
    );
  }
};

      

// Initial page load
useEffect(() => {
  const delay = isFirstLoad ? 0 : 400;

  const timer = setTimeout(() => {
    fetchStudents(1, search);

    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, delay);

  return () => clearTimeout(timer);
}, [search, isFirstLoad]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900">
            Student Management
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            View all registered students.
          </p>
        </div>
<div className="flex items-center gap-3">

  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

    <input
      type="text"
      placeholder="Search by name, reg no, email or department..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-80 rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
    />
  </div>

  <button
    onClick={() => fetchStudents(page, search)}
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-slate-50 hover:shadow cursor-pointer"
  >
    <RefreshCw className="h-4 w-4" />
    Refresh
  </button>

</div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-20 flex justify-center">
          <span className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center">
          <Users className="h-10 w-10 mx-auto text-slate-300 mb-4" />

          <h3 className="font-semibold text-slate-900">
            No Students Found
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            There are no registered students.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
           <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Student</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Registration No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Email
                </th>

 <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
  Mobile Number
</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
  Actions
</th>
              </tr>
            </thead>

           <tbody>
  {students.map((student) => (
    <tr
      key={student._id}
      className="border-b border-slate-100 transition-colors hover:bg-indigo-50/40"
    >
      <td className="px-6 py-4 font-semibold text-slate-900">
        {student.fullname}
      </td>

      <td className="px-6 py-4 text-slate-700">
        {student.regNo}
      </td>

      <td className="px-6 py-4 text-slate-700">
        {student.email}
      </td>

<td className="px-5 py-4 font-mono">
  {student.number || "-"}
</td>
      <td className="px-6 py-4 text-slate-700">
        {student.department}
      </td>

      <td className="px-5 py-4 text-right">
      <button
  onClick={() => handleRemoveStudent(student._id)}
  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:shadow-sm cursor-pointer"
>
  <Trash className="h-4 w-4" />
  Remove
</button>
      </td>
    </tr>
  ))}
</tbody>
          </table>

        {students.length > 0 && (
  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">

    <button
      onClick={() => fetchStudents(page - 1, search)}
      disabled={page === 1}
      className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50 cursor-pointer"
    >
      Previous
    </button>

    <span className="text-sm font-semibold text-slate-500">
      Page {page} of {totalPages}
    </span>

    <button
      onClick={() => fetchStudents(page + 1, search)}
      disabled={page === totalPages}
      className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50 cursor-pointer"
    >
      Next
    </button>

  </div>
)}
        </div>
      )}
    </div>
  );
}