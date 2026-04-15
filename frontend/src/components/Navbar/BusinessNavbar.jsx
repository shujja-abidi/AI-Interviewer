import React from "react";
import { MdOutlineWorkOutline, MdMenu } from "react-icons/md";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { clearAuthSession } from "../../utility/auth";

// Navbar menu data
const BusinessNavbarMenu = [
  {
    id: 1,
    title: "Home",
    link: "/business/home",
  },
  {
    id: 2,
    title: "Job Post",
    link: "/business/basic-details",
  },
  {
    id: 3,
    title: "Profile",
    link: "/business/profile",
  },
];

const BusinessNavbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex">
      {/* Vertical Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="sidebar bg-gray-100 w-80 h-screen fixed top-0 left-0 shadow-lg flex flex-col justify-between"
      >
        {/* Logo Section */}
        <div className="px-8 py-10">
          <div className="flex items-center gap-4">
            <MdOutlineWorkOutline className="text-5xl text-secondary" />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 leading-tight">Interview Genius</h1>
              <p className="text-xl text-secondary font-semibold">Business</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <ul className="mt-6 flex-1 px-4">
          {BusinessNavbarMenu.map((item) => (
            <li key={item.id} className="mb-4">
              <Link
                to={item.link}
                className="block text-gray-700 text-lg py-3 px-6 hover:bg-gray-200 hover:text-secondary transition-all duration-300 font-medium rounded-md"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout Button at the End */}
        <div className="px-4 pb-8">
          <Link
            to="/"
            onClick={clearAuthSession}
            className="block text-red-700 text-lg py-3 px-6 hover:bg-red-100 hover:text-red-600 transition-all duration-300 font-medium rounded-md text-center"
          >
            Logout
          </Link>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="ml-80 w-full">
        <div className="container p-6">
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-secondary text-4xl">
            <MdMenu />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessNavbar;
