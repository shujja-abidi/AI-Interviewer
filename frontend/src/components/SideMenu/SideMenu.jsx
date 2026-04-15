import { Link, useLocation } from "react-router-dom";
import { FiHome, FiFileText, FiClock, FiUser, FiLogOut, FiMic } from "react-icons/fi";
import { MdOutlineWorkOutline } from "react-icons/md"; // Updated logo icon
import { motion } from "framer-motion"; // Optional for animation
import { clearAuthSession } from "../../utility/auth";

const SideMenu = () => {
  const location = useLocation();

  // Reusable function to check if the current route is active
  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-full bg-gray-100 text-gray-800 flex flex-col p-6 space-y-6 w-80 z-10 shadow-lg" // Increased width to w-80
      >
        {/* Logo Section */}
        <div className="px-8 py-10">
          <div className="flex items-center gap-4">
            <MdOutlineWorkOutline className="text-5xl text-secondary" /> {/* Updated logo */}
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 leading-tight">Interview Genius</h1>
              <p className="text-xl text-secondary font-semibold">Candidate</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <ul className="flex-grow space-y-4">
          {[
            { to: "/candidate/home", icon: <FiHome className="text-2xl" />, label: "Home" },
            { to: "/candidate/resume", icon: <FiFileText className="text-2xl" />, label: "Resume" },
            { to: "/candidate/history", icon: <FiClock className="text-2xl" />, label: "History" },
            { to: "/candidate/profile", icon: <FiUser className="text-2xl" />, label: "Profile" },
            { to: "/candidate/ai-interview", icon: <FiMic className="text-2xl" />, label: "AI Interview" },

          ].map(({ to, icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`flex items-center gap-3 p-3 text-lg font-medium rounded-lg transition-all duration-200 ${
                  isActive(to) ? "bg-gray-200 text-secondary" : "text-gray-800 hover:bg-gray-200"
                }`}
                aria-label={`Navigate to ${label}`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="mt-auto">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 text-lg font-medium text-red-700 hover:bg-gray-200 hover:text-red-600 rounded-lg transition-all duration-200"
            aria-label="Log out"
            onClick={clearAuthSession}
          >
            <FiLogOut className="text-2xl" />
            <span>Logout</span>
          </Link>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-grow ml-80 p-6">
        {" "}
        {/* Updated margin-left to ml-80 to match increased sidebar width */}
        {/* Your actual page content goes here */}
        {/* For example, if it's a dashboard, you can put your actual page content here */}
      </div>
    </div>
  );
};

export default SideMenu;
