import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../config/api";

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`${NODE_API_URL}/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job details");
        }
        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleApply = () => {
    // Navigate to the resume upload/ATS flow with the job data
    navigate("/candidate/resume", { state: { job } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-red-600">Job not found.</p>
      </div>
    );
  }

  const { basicDetails } = job;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header section */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{basicDetails?.title || job.name}</h1>
              <p className="text-xl text-gray-600 mb-4">{basicDetails?.company || job.name || "Unknown Company"}</p>
              
              <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                {basicDetails?.location && (
                  <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {basicDetails.location}
                  </span>
                )}
                {basicDetails?.jobType && (
                  <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    {basicDetails.jobType}
                  </span>
                )}
                {basicDetails?.salary && (
                  <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {basicDetails.salary}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleApply}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition flex-shrink-0"
            >
              Apply Now
            </button>
          </div>
        </div>

        {/* Content section */}
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job Description</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {basicDetails?.description || "No description provided."}
            </div>
          </div>

          {basicDetails?.responsibilities && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Responsibilities</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {basicDetails.responsibilities}
              </div>
            </div>
          )}

          {basicDetails?.requirements && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Requirements</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {basicDetails.requirements}
              </div>
            </div>
          )}
          
          {basicDetails?.qualifications && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Preferred Qualifications</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {basicDetails.qualifications}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
