import { Search, Download } from "lucide-react";

interface AttendeesTableProps {
  attendees: any[];
  searchValue: string;
  setSearchValue: (value: string) => void;
  onExport?: () => void;
  onViewReport: (
    testId: string,
    studentId: string
  ) => void;
  testId: string;
  showViolations?: boolean;
}

export default function AttendeesTable({
  attendees,
  searchValue,
  setSearchValue,
  onExport,
  onViewReport,
  testId,
  showViolations = true,
}: AttendeesTableProps) {
  const filteredAttendees =
    searchValue.trim() === ""
      ? attendees
      : attendees.filter((att) => {
          const student = att.studentId;

          const keyword = searchValue.toLowerCase();

          return (
            (student?.fullname || "")
              .toLowerCase()
              .includes(keyword) ||
            (student?.regNo || "")
              .toLowerCase()
              .includes(keyword) ||
            (student?.email || "")
              .toLowerCase()
              .includes(keyword)
          );
        });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

          <input
            type="text"
            value={searchValue}
            onChange={(e) =>
              setSearchValue(e.target.value)
            }
            placeholder="Search student..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm"
          />
        </div>

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Reg No</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Marks</th>

              {showViolations && (
                <th className="py-3 px-4">
                  Violations
                </th>
              )}

              <th className="py-3 px-4">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredAttendees.map((att) => {
              const student = att.studentId;

              const studentId =
                student?._id ||
                student?.id;

              const marks =
                att.obtainedMarks ?? 0;

              const total =
                att.totalMarks ?? 0;

              const percent =
                total > 0
                  ? Math.round(
                      (marks / total) * 100
                    )
                  : 0;

              return (
                <tr
                  key={att._id}
                  className="border-b border-slate-100"
                >
                  <td className="py-3 px-4 font-semibold">
                    {student?.fullname}
                  </td>

                  <td className="py-3 px-4">
                    {student?.regNo}
                  </td>

                  <td className="py-3 px-4">
                    {student?.email}
                  </td>

                  <td className="py-3 px-4">
                    {marks}/{total} ({percent}%)
                  </td>

                  {showViolations && (
                    <td className="py-3 px-4">
                      {att.violation ?? 0}
                    </td>
                  )}

                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        if (!studentId) return;

                        onViewReport(
                          testId,
                          studentId
                        );
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700"
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
    </>
  );
}
