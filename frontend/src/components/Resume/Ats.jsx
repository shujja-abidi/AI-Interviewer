import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PYTHON_API_URL } from "../../config/api";
import { downloadAtsPdf, printCurrentPage } from "../../utility/reportActions";

const scoreColor = (score) => {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
};

const formatLabel = (value) =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const Ats = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialContext =
    location.state ||
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem("candidateInterviewContext") || "{}");
      } catch {
        return {};
      }
    })();

  const { resumeData, jobDetails, job } = initialContext;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!resumeData || !jobDetails) {
      setError("Missing resume or job description data.");
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAtsReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${PYTHON_API_URL}/api/ats-score`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume: resumeData,
            job_description: jobDetails,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate ATS report");
        }

        setReport(data.report);
        sessionStorage.setItem(
          "candidateInterviewContext",
          JSON.stringify({
            job,
            jobDetails,
            resumeData,
            atsReport: data.report,
          })
        );
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAtsReport();
  }, [job, jobDetails, resumeData]);

  const handleDownload = () => {
    if (!report) return;
    downloadAtsPdf(`${(jobDetails?.title || "ats-report").toLowerCase().replace(/\s+/g, "-")}.pdf`, {
      jobDetails,
      report,
    });
  };

  const handleInterviewStart = () => {
    navigate("/candidate/ai-mock-interview", {
      state: {
        job,
        jobDetails,
        resumeData,
        atsReport: report,
      },
    });
  };

  if (!resumeData || !jobDetails) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
        <div className="max-w-xl bg-white p-8 rounded-lg shadow-md text-center w-full text-red-600">
          <h2 className="text-2xl font-bold mb-2">Data Missing</h2>
          <p className="mb-4">{error || "No resume or job data found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
        <div className="max-w-xl bg-white p-8 rounded-lg shadow-md text-center w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Generating your ATS report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
        <div className="max-w-xl bg-white p-8 rounded-lg shadow-md text-center w-full text-red-600">
          <h3 className="text-xl font-bold">Error</h3>
          <p>{error || "ATS report could not be generated."}</p>
        </div>
      </div>
    );
  }

  const sectionEntries = Object.entries(report.section_scores || {});

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ATS Resume Report</h1>
              <p className="text-gray-600 mt-2">{report.summary}</p>
              <p className="text-sm text-gray-500 mt-2">
                Role: <span className="font-medium">{jobDetails.title || "Not provided"}</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide text-gray-500">Overall Score</p>
              <div className={`text-6xl font-extrabold ${scoreColor(report.overall_score)}`}>
                {report.overall_score}
              </div>
              <div className="text-gray-400 text-lg">/100</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Download ATS Report
            </button>
            <button
              type="button"
              onClick={printCurrentPage}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Print Report
            </button>
            <button
              type="button"
              onClick={handleInterviewStart}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Continue To Interview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sectionEntries.map(([key, section]) => (
            <div key={key} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{formatLabel(key)}</h2>
                  <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                </div>
                <div className={`text-2xl font-bold ${scoreColor(section.score)}`}>{Math.round(section.score)}</div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Weight: {Math.round(section.weight * 100)}%</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Keyword Coverage</h2>
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-green-700 mb-2">Matched Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {(report.keywords?.matched || []).length > 0 ? (
                  report.keywords.matched.map((keyword) => (
                    <span key={keyword} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No clear matched keywords were detected.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {(report.keywords?.missing || []).length > 0 ? (
                  report.keywords.missing.map((keyword) => (
                    <span key={keyword} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No major missing keywords were found.</p>
                )}
              </div>
            </div>

            {report.keywords?.section_hits && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Where Keywords Were Found</h3>
                <div className="space-y-3">
                  {Object.entries(report.keywords.section_hits).map(([section, hits]) => (
                    <div key={section}>
                      <p className="text-sm font-medium text-gray-600 mb-1">{formatLabel(section)}</p>
                      <div className="flex flex-wrap gap-2">
                        {hits.length > 0 ? (
                          hits.map((keyword) => (
                            <span
                              key={`${section}-${keyword}`}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400">No strong keyword hits detected in this section.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Improvement Suggestions</h2>
            <ul className="space-y-3">
              {(report.suggestions || []).map((suggestion, index) => (
                <li key={index} className="text-gray-700 border-l-4 border-blue-500 pl-3">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Formatting Issues</h2>
            {(report.formatting_issues || []).length > 0 ? (
              <ul className="space-y-3">
                {report.formatting_issues.map((item, index) => (
                  <li key={index} className="text-gray-700 border-l-4 border-amber-500 pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No major formatting issues were detected.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Section-by-Section Plan</h2>
            <ul className="space-y-3">
              {(report.improvement_plan || []).map((item, index) => (
                <li key={index} className="border-l-4 border-blue-500 pl-3">
                  <p className="text-sm font-semibold text-gray-800">{item.section}</p>
                  <p className="text-gray-700">{item.action}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Strengths</h2>
            <ul className="space-y-3">
              {(report.strengths || []).map((item, index) => (
                <li key={index} className="text-gray-700 border-l-4 border-green-500 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weaknesses</h2>
            <ul className="space-y-3">
              {(report.weaknesses || []).map((item, index) => (
                <li key={index} className="text-gray-700 border-l-4 border-red-500 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ats;
