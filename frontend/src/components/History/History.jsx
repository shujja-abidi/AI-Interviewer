import React, { useEffect, useState } from "react";
import { PYTHON_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";
import { buildInterviewPdfPayload, downloadInterviewPdf, printCurrentPage } from "../../utility/reportActions";

const History = () => {
  const auth = getAuthSession();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.email) {
        setError("Candidate email is missing from the current session.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${PYTHON_API_URL}/api/interview-history?candidate_email=${encodeURIComponent(auth.email)}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load interview history.");
        }
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err.message || "Failed to load interview history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [auth.email]);

  return (
    <main className="flex-grow p-10 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Session History</h1>
          <p className="text-gray-600">
            Review previous AI interview sessions, saved transcripts, and report summaries pulled from MongoDB.
          </p>
        </div>
        <button
          type="button"
          onClick={printCurrentPage}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 self-start"
        >
          Print History
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading interview sessions...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm text-gray-600">
          No interview sessions have been saved yet. Complete an AI interview session to build your history.
        </div>
      )}

      <div className="space-y-6">
        {sessions.map((session) => (
          <section key={session.session_id} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{session.job_title || "Interview Session"}</h2>
                <p className="text-gray-600">{session.company_name || "Interview Genius"}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {session.summary?.response_mode === "single_video"
                    ? `${session.summary?.generated_question_count || 0} questions completed in one recorded interview`
                    : `${session.summary?.responses_completed || 0}/${session.summary?.question_count || 0} questions completed`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm uppercase tracking-wide text-gray-500">Session Score</p>
                <div className="text-4xl font-extrabold text-blue-600">{session.summary?.overall_score || 0}</div>
                <p className="text-sm text-gray-500 mt-1">{session.summary?.recommended_decision || "Pending"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-700">
              <p><span className="font-semibold">Interview Type:</span> {session.interview_type || "Mixed"}</p>
              <p><span className="font-semibold">Difficulty:</span> {session.difficulty || "Mid"}</p>
              <p><span className="font-semibold">Updated:</span> {session.updated_at ? new Date(session.updated_at).toLocaleString() : "N/A"}</p>
            </div>

            <div className="space-y-4">
              {(session.responses || []).map((response) => (
                <div key={`${session.session_id}-${response.question_index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 mb-1">Question {response.question_index + 1}</p>
                      <p className="text-gray-800 font-medium">{response.question}</p>
                      <p className="text-sm text-gray-600 mt-2">{response.report?.summary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Score</p>
                      <div className="text-2xl font-bold text-blue-600">{response.report?.overall_score || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => downloadInterviewPdf(`interview-session-${session.session_id}.pdf`, buildInterviewPdfPayload({ session }))}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Download Interview PDF
              </button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default History;
