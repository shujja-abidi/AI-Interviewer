import React from 'react';
import { Link } from 'react-router-dom'; // Ensure React Router is installed

const Homepage = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <div className="w-full flex flex-col">
        {/* Header */}
        <div className="bg-orange-100 px-6 py-4">
          <h2 className="text-orange-600 font-bold text-sm">
            Streamline Your Hiring Process: Create Job Posts, Conduct Interviews, and Hire Top Talent Directly from Our Portal. Start Now!
          </h2>
        </div>

        {/* Dashboard Content */}
        <div className="px-6 py-4">
          <h2 className="text-gray-800 text-lg font-bold">Business dashboard</h2>
          <p className="text-gray-600 mb-6">Current cards below are placeholder metrics until recruiter analytics are connected.</p>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-orange-500 font-medium">Job posts</h3>
                <Link to="/business/basic-details" className="text-blue-500 text-sm">
                  Create job post
                </Link>
              </div>
              <p className="text-gray-600 mt-2">Active jobs: <span className="font-bold">2</span></p>
              <p className="text-gray-600">Total jobs: <span className="font-bold">2</span></p>
              <p className="text-gray-600">Closed jobs: <span className="font-bold">2</span></p>
            </div>
            <div className="bg-white p-4 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-green-500 font-medium">Candidates</h3>
                <Link to="/business/profile" className="text-blue-500 text-sm">
                  Review profile
                </Link>
              </div>
              <p className="text-gray-600 mt-2">Total Candidates: <span className="font-bold">4</span></p>
              <p className="text-gray-600">Shortlisted: <span className="font-bold">5</span></p>
              <p className="text-gray-600">Hired: <span className="font-bold">1</span></p>
            </div>
            <div className="bg-white p-4 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-purple-500 font-medium">Interviews</h3>
                <Link to="/business/basic-details" className="text-blue-500 text-sm">
                  Configure flow
                </Link>
              </div>
              <p className="text-gray-600 mt-2">Active interviews: <span className="font-bold">4</span></p>
              <p className="text-gray-600">Total interviews: <span className="font-bold">5</span></p>
              <p className="text-gray-600">Closed interviews: <span className="font-bold">1</span></p>
            </div>
          </div>

          {/* Recent Activity */}
          <h3 className="text-gray-800 font-bold mb-4">Recent activity</h3>
          <div className="bg-white shadow-md rounded-lg mb-4">
            <div className="grid grid-cols-3 gap-4 p-4 border-b">
              <p className="font-medium text-gray-600">Activity info</p>
              <p className="font-medium text-gray-600">Activity type</p>
              <p className="font-medium text-gray-600">Created on</p>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 border-b">
              <p className="text-gray-800">React Developer</p>
              <p className="text-orange-500">Job post</p>
              <p className="text-gray-600">11 Jan 2023</p>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 border-b">
              <p className="text-gray-800">React Assessment</p>
              <p className="text-green-500">MCQ test</p>
              <p className="text-gray-600">11 Jan 2023</p>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 border-b">
              <p className="text-gray-800">Flutter Developer</p>
              <p className="text-orange-500">Job post</p>
              <p className="text-gray-600">11 Jan 2023</p>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4">
              <p className="text-gray-800">Interview name</p>
              <p className="text-purple-500">Interview</p>
              <p className="text-gray-600">11 Jan 2023</p>
            </div>
          </div>

          {/* View More Button for Recent Activity */}
          <div className="flex justify-center">
            <Link
              to="/business/basic-details"
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition"
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
