import React, { useEffect, useMemo, useState } from "react";
import { PYTHON_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";
import { downloadJsonReport } from "../../utility/reportActions";

const Profiles = () => {
  const auth = getAuthSession();
  const [comparison, setComparison] = useState({ candidates: [], by_job: {} });
  const [selectedJob, setSelectedJob] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComparison = async () => {
      if (!auth.email) {
        setError("Business email is missing from the current session.");
        setLoading(false);
        return;
      }

      try {
        const query = new URLSearchParams({ business_email: auth.email });
        if (selectedJob) {
          query.set("job_title", selectedJob);
        }
        const response = await fetch(`${PYTHON_API_URL}/api/business/candidate-comparison?${query.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load candidate comparison.");
        }
        setComparison(data);
      } catch (err) {
        setError(err.message || "Failed to load candidate comparison.");
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [auth.email, selectedJob]);

  const jobTitles = useMemo(() => Object.keys(comparison.by_job || {}), [comparison.by_job]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-orange-500 p-6 text-white">
        <h1 className="text-2xl font-bold">Candidate Comparison and Ranking</h1>
        <p className="text-sm mt-2 text-orange-50">
          Review saved interview sessions, compare candidates for the same role, and export recruiter-facing rankings.
        </p>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Recruiter View</h2>
            <p className="text-sm text-gray-600">This ranking is built from the persisted interview session reports.</p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={selectedJob}
              onChange={(event) => {
                setLoading(true);
                setSelectedJob(event.target.value);
              }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All roles</option>
              {jobTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                downloadJsonReport("candidate-comparison.json", {
                  generatedAt: new Date().toISOString(),
                  comparison,
                })
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Export Ranking
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-600">Loading saved candidate sessions...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && comparison.candidates.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
            No candidate interview sessions have been saved for this business yet.
          </div>
        )}

        {!loading && !error && comparison.candidates.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-4 border-b bg-gray-50 text-sm font-semibold text-gray-600">
              <p>Candidate</p>
              <p>Role</p>
              <p>Interview Type</p>
              <p>Questions Done</p>
              <p>Score</p>
              <p>Decision</p>
            </div>
            {comparison.candidates.map((candidate) => (
              <div key={candidate.session_id} className="grid grid-cols-6 gap-4 p-4 border-b text-sm text-gray-700">
                <div>
                  <p className="font-semibold">{candidate.candidate_name || "Unnamed Candidate"}</p>
                  <p className="text-gray-500">{candidate.candidate_email}</p>
                </div>
                <p>{candidate.job_title || "Unspecified role"}</p>
                <p>{candidate.interview_type || "Mixed"}</p>
                <p>
                  {candidate.responses_completed}/{candidate.question_count}
                </p>
                <p className="font-semibold text-blue-600">{candidate.overall_score}</p>
                <p>{candidate.recommended_decision || "Pending"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profiles;
