import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../config/api";

const CandidateHome = () => {
  const navigate = useNavigate();
  const [jobPosts, setJobPosts] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${NODE_API_URL}/getjobs`);
        if (!response.ok) {
          throw new Error("Failed to fetch job posts");
        }
        const data = await response.json();
        setJobPosts(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-grow p-6 bg-gray-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Welcome, Candidate!</h1>
        <p className="text-xl text-gray-600 mb-10">Explore job opportunities and prepare for AI interviews.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {jobPosts.map((job) => (
            <div key={job._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <button
                onClick={() => navigate("/candidate/resume", { state: { job } })}
                className="text-2xl font-semibold text-gray-800 hover:text-blue-600"
              >
                {job.basicDetails?.title || "Job Title"} <br />
                <span className="text-lg text-gray-500">at {job.name || "Unknown Company"}</span>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CandidateHome;
