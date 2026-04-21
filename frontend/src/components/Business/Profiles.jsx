import React, { useEffect, useMemo, useState } from "react";
import { PYTHON_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";
import { buildInterviewPdfPayload, downloadComparisonPdf, downloadInterviewPdf } from "../../utility/reportActions";

const scoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const safeParseResume = (candidateResume) => {
  if (!candidateResume) return null;
  if (typeof candidateResume === "object") return candidateResume;
  try {
    return JSON.parse(candidateResume);
  } catch {
    return null;
  }
};

const Profiles = () => {
  const auth = getAuthSession();
  const [comparison, setComparison] = useState({ candidates: [], by_job: {}, sessions: [] });
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState("prompts");
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
  const selectedSession = useMemo(() => {
    if (!comparison.sessions?.length) return null;
    return (
      comparison.sessions.find((session) => session.session_id === selectedSessionId) || comparison.sessions[0] || null
    );
  }, [comparison.sessions, selectedSessionId]);
  const parsedResume = useMemo(
    () => safeParseResume(selectedSession?.candidate_resume),
    [selectedSession?.candidate_resume]
  );
  const selectedResponse = selectedSession?.responses?.[0] || null;

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
              onClick={() => downloadComparisonPdf("candidate-comparison.pdf", comparison)}
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
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="hidden lg:grid lg:grid-cols-[1.45fr_1.3fr_0.95fr_1.1fr_0.65fr_0.95fr_0.85fr] gap-4 p-4 border-b bg-gray-50 text-sm font-semibold text-gray-600">
                <p>Candidate</p>
                <p>Role</p>
                <p>Interview Type</p>
                <p>Questions Done</p>
                <p>Score</p>
                <p>Decision</p>
                <p>Action</p>
              </div>
              {comparison.candidates.map((candidate) => (
                <div
                  key={candidate.session_id}
                  className="border-b p-4 lg:grid lg:grid-cols-[1.45fr_1.3fr_0.95fr_1.1fr_0.65fr_0.95fr_0.85fr] lg:gap-4 lg:items-start lg:text-sm lg:text-gray-700"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:contents">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 lg:hidden">Candidate</p>
                      <p className="font-semibold break-words leading-6 text-gray-800">{candidate.candidate_name || "Unnamed Candidate"}</p>
                      <p className="text-gray-500 break-words leading-6">{candidate.candidate_email}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 lg:hidden">Role</p>
                      <p className="break-words leading-6 text-gray-700">{candidate.job_title || "Unspecified role"}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 lg:hidden">Interview Type</p>
                      <p className="break-words leading-6 text-gray-700">{candidate.interview_type || "Mixed"}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 lg:hidden">Questions Done</p>
                      <p className="break-words leading-6 text-gray-700">
                        {candidate.response_mode === "single_video"
                          ? `1 final recording (${candidate.generated_question_count || 0} questions)`
                          : `${candidate.responses_completed}/${candidate.question_count}`}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 lg:hidden">Score</p>
                      <p className={`font-semibold ${scoreColor(candidate.overall_score || 0)} leading-6`}>{candidate.overall_score}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 lg:hidden">Decision</p>
                      <p className="break-words leading-6 text-gray-700">{candidate.recommended_decision || "Pending"}</p>
                    </div>

                    <div className="min-w-0 flex items-start lg:block">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(candidate.session_id);
                          setActiveDetailTab("prompts");
                        }}
                        className="text-blue-600 font-medium hover:text-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedSession && (
              <section className="bg-white rounded-lg shadow-md p-6 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {selectedSession.candidate_name || "Unnamed Candidate"}
                    </h2>
                    <p className="text-gray-600">{selectedSession.candidate_email}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedSession.job_title || "Unspecified role"} at{" "}
                      {selectedSession.company_name || "Interview Genius"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Overall Score</p>
                      <div className={`text-4xl font-extrabold ${scoreColor(selectedSession.summary?.overall_score || 0)}`}>
                        {selectedSession.summary?.overall_score || 0}
                      </div>
                      <p className="text-sm text-gray-500">{selectedSession.summary?.recommended_decision || "Pending"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadInterviewPdf(
                          `candidate-session-${selectedSession.session_id}.pdf`,
                          buildInterviewPdfPayload({ session: selectedSession })
                        )
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Export Interview PDF
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                  <p><span className="font-semibold">Interview Type:</span> {selectedSession.interview_type || "Mixed"}</p>
                  <p><span className="font-semibold">Difficulty:</span> {selectedSession.difficulty || "Mid"}</p>
                  <p><span className="font-semibold">Questions Done:</span> {selectedSession.summary?.responses_completed || 0}/{selectedSession.summary?.question_count || 0}</p>
                  <p><span className="font-semibold">Question Format:</span> {selectedSession.summary?.response_mode === "single_video" ? "Single recorded interview" : "Per-question responses"}</p>
                  <p><span className="font-semibold">Updated:</span> {selectedSession.updated_at ? new Date(selectedSession.updated_at).toLocaleString() : "N/A"}</p>
                </div>

                <div className="border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["prompts", "Generated Questions"],
                      ["ats", "ATS Report"],
                      ["transcript", "Full Transcript"],
                      ["report", "Final Report"],
                      ["resume", "Resume"],
                    ].map(([tabId, label]) => (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => setActiveDetailTab(tabId)}
                        className={`px-4 py-2 rounded-t-md text-sm font-medium ${
                          activeDetailTab === tabId
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeDetailTab === "prompts" && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Generated Questions</h3>
                      <div className="space-y-3">
                        {(selectedSession.questions || []).map((item, index) => (
                          <div key={`${item.question}-${index}`} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                            <p className="text-sm font-semibold text-gray-500 mb-1">Question {index + 1}</p>
                            <p className="text-gray-800 font-medium">{item.question}</p>
                            {item.focus && <p className="text-sm text-gray-500 mt-2">Focus: {item.focus}</p>}
                          </div>
                        ))}
                        {(selectedSession.questions || []).length === 0 && (
                          <p className="text-sm text-gray-600">No generated questions were saved for this session.</p>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Interview Overview</h3>
                      <div className="space-y-3 text-sm text-gray-700">
                        <p><span className="font-semibold">Latest Summary:</span> {selectedSession.summary?.last_summary || "No summary available."}</p>
                        <p><span className="font-semibold">Status:</span> {selectedSession.summary?.status || "Pending"}</p>
                        <p><span className="font-semibold">Recommendation:</span> {selectedSession.summary?.recommended_decision || "Pending"}</p>
                        <p><span className="font-semibold">Questions Generated:</span> {(selectedSession.questions || []).length}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === "transcript" && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Full Interview Transcript</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {selectedResponse?.report?.transcript?.summary || "No transcript summary available."}
                    </p>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-md p-4 max-h-[32rem] overflow-y-auto">
                      {selectedResponse?.report?.transcript?.full_text || "Transcript not available."}
                    </div>
                  </div>
                )}

                {activeDetailTab === "ats" && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">ATS Overview</h3>
                      <div className="space-y-3 text-sm text-gray-700">
                        <p><span className="font-semibold">ATS Score:</span> {selectedSession.ats_report?.overall_score ?? selectedSession.ats_score ?? "N/A"}</p>
                        <p><span className="font-semibold">Summary:</span> {selectedSession.ats_report?.summary || "ATS summary not available."}</p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">ATS Suggestions</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(selectedSession.ats_report?.suggestions || []).map((item, index) => (
                          <li key={`ats-suggestion-${index}`} className="border-l-4 border-blue-500 pl-3">{item}</li>
                        ))}
                        {(selectedSession.ats_report?.suggestions || []).length === 0 && (
                          <li className="text-gray-500">No ATS suggestions available.</li>
                        )}
                      </ul>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Matched Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedSession.ats_report?.keywords?.matched || []).map((item, index) => (
                          <span key={`matched-${index}`} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                        {(selectedSession.ats_report?.keywords?.matched || []).length === 0 && (
                          <p className="text-sm text-gray-500">No matched keywords available.</p>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Missing Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedSession.ats_report?.keywords?.missing || []).map((item, index) => (
                          <span key={`missing-${index}`} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                        {(selectedSession.ats_report?.keywords?.missing || []).length === 0 && (
                          <p className="text-sm text-gray-500">No missing keywords available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === "report" && (
                  <div className="space-y-4">
                    {selectedResponse ? (
                      <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-500 mb-1">Final Interview Report</p>
                            <p className="text-gray-800 font-medium">{selectedResponse.question}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Score</p>
                            <div className={`text-2xl font-bold ${scoreColor(selectedResponse.report?.overall_score || 0)}`}>
                              {selectedResponse.report?.overall_score || 0}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-gray-800 mb-2">Evaluation</h4>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Summary:</span> {selectedResponse.report?.summary || "No summary available."}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Sentiment:</span> {selectedResponse.report?.verbal_analysis?.sentiment || "N/A"}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Pace:</span> {selectedResponse.report?.verbal_analysis?.pace || "N/A"}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Observations:</span> {selectedResponse.report?.verbal_analysis?.observations || "No observations saved."}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Eye Contact:</span> {selectedResponse.report?.non_verbal_analysis?.eye_contact || "N/A"}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Body Language:</span> {selectedResponse.report?.non_verbal_analysis?.body_language || "N/A"}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Facial Expression:</span> {selectedResponse.report?.non_verbal_analysis?.facial_expression || "N/A"}</p>
                            <p className="text-sm text-gray-700"><span className="font-semibold">Decision:</span> {selectedResponse.report?.recommended_decision || "Pending"}</p>
                          </div>

                          <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
                              <ul className="space-y-1 list-disc list-inside text-green-800">
                                {(selectedResponse.report?.strengths || []).map((item, index) => (
                                  <li key={`strength-${index}`}>{item}</li>
                                ))}
                                {(selectedResponse.report?.strengths || []).length === 0 && <li>No strengths saved.</li>}
                              </ul>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="font-semibold text-red-900 mb-2">Weaknesses</h4>
                              <ul className="space-y-1 list-disc list-inside text-red-800">
                                {(selectedResponse.report?.weaknesses || []).map((item, index) => (
                                  <li key={`weakness-${index}`}>{item}</li>
                                ))}
                                {(selectedResponse.report?.weaknesses || []).length === 0 && <li>No weaknesses saved.</li>}
                              </ul>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
                              <ul className="space-y-1 list-disc list-inside text-blue-800">
                                {(selectedResponse.report?.recommendations || []).map((item, index) => (
                                  <li key={`recommendation-${index}`}>{item}</li>
                                ))}
                                {(selectedResponse.report?.recommendations || []).length === 0 && <li>No recommendations saved.</li>}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                        This candidate session does not have a saved final report yet.
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === "resume" && (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Candidate Resume</h3>
                    {parsedResume ? (
                      <div className="space-y-4 text-sm text-gray-700">
                        <div>
                          <p className="font-semibold mb-1">Education</p>
                          <ul className="space-y-1 list-disc list-inside">
                            {(parsedResume.Education || []).map((item, index) => (
                              <li key={`education-${index}`}>{item}</li>
                            ))}
                            {(parsedResume.Education || []).length === 0 && <li>No education data saved.</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Projects</p>
                          <ul className="space-y-1 list-disc list-inside">
                            {(parsedResume.Projects || []).map((item, index) => (
                              <li key={`project-${index}`}>{item}</li>
                            ))}
                            {(parsedResume.Projects || []).length === 0 && <li>No project data saved.</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Experience</p>
                          <ul className="space-y-1 list-disc list-inside">
                            {(parsedResume.Experience || []).map((item, index) => (
                              <li key={`experience-${index}`}>{item}</li>
                            ))}
                            {(parsedResume.Experience || []).length === 0 && <li>No experience data saved.</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {(parsedResume.Skills || []).map((item, index) => (
                              <span key={`skill-${index}`} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                {item}
                              </span>
                            ))}
                            {(parsedResume.Skills || []).length === 0 && <p>No skills data saved.</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No structured resume data was saved for this session.</p>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profiles;
