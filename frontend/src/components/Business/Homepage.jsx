import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NODE_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";

const Homepage = () => {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    hiredCandidates: 0,
    activeInterviews: 0
  });
  const [loading, setLoading] = useState(true);
  const auth = getAuthSession();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!auth.email) return;
        const response = await fetch(`${NODE_API_URL}/business/dashboard-stats?email=${auth.email}`);
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [auth.email]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="w-full flex flex-col">
        <div className="bg-orange-100 px-6 py-4">
          <h2 className="text-orange-600 font-bold text-sm">
            Streamline Your Hiring Process: Create Job Posts, Conduct Interviews, and Hire Top Talent Directly from Our Portal. Start Now!
          </h2>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-gray-800 text-lg font-bold">Business dashboard</h2>
          <p className="text-gray-600 mb-6">Welcome back! Here is an overview of your recruitment activity.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-orange-500 font-medium">Job posts</h3>
                <Link to="/business/manage-jobs" className="text-blue-500 text-sm">
                  Manage jobs
                </Link>
              </div>
              <p className="text-gray-600 mt-2">Active jobs: <span className="font-bold">{loading ? "..." : stats.activeJobs}</span></p>
            </div>
            
            <div className="bg-white p-4 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-green-500 font-medium">Applications</h3>
                <Link to="/business/applications" className="text-blue-500 text-sm">
                  Review applications
                </Link>
              </div>
              <p className="text-gray-600 mt-2">Total Received: <span className="font-bold">{loading ? "..." : stats.totalApplications}</span></p>
              <p className="text-gray-600">Hired: <span className="font-bold">{loading ? "..." : stats.hiredCandidates}</span></p>
            </div>
            
            <div className="bg-white p-4 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-purple-500 font-medium">Interviews</h3>
                <Link to="/business/applications" className="text-blue-500 text-sm">
                  View scheduled
                </Link>
              </div>
              <p className="text-gray-600 mt-2">Active interviews: <span className="font-bold">{loading ? "..." : stats.activeInterviews}</span></p>
            </div>
          </div>

          <div className="flex mt-8">
            <Link
              to="/business/basic-details"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition"
            >
              Start new job post
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
