import React from "react";
import { MdOutlineWorkOutline, MdMenu } from "react-icons/md";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // Import Link
import ResponsiveMenu from "./ResponsiveMenu.jsx";

// Navbar menu data
const NavbarMenu = [
  {
    id: 1,
    title: "Home",
    link: "/",
  },
  {
    id: 2,
    title: "For Students",
    link: "/for-students",
  },
  {
    id: 3,
    title: "Resources",
    link: "/resources",
  },
  {
    id: 4,
    title: "About Us",
    link: "/about-us",
  },
  {
    id: 5,
    title: "Contact Us",
    link: "/contact-us",
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="container flex justify-between items-center py-6">
          {/* Logo section with Link to home */}
          <div className="text-2xl flex items-center gap-2 font-bold">
            <Link to="/" className="flex items-center gap-2">
              <MdOutlineWorkOutline className="text-3xl text-secondary" />
              <p>Interview Genius</p>
            </Link>
          </div>

          {/* Menu section */}
          <div className="hidden lg:block">
            <ul className="flex items-center gap-10">
              {NavbarMenu.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.link} // Use Link instead of a tag
                    className="inline-block text-gray-600 text-lg xl:text-xl py-1 px-4 hover:text-secondary transition-all duration-300 font-semibold"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button section */}
          <div className="hidden lg:flex space-x-6">
            <Link to="/login"> {/* Use Link for Login */}
              <button className="text-gray-600 font-semibold px-4 py-2 rounded-full hover:bg-gray-200">
                Login
              </button>
            </Link>
            <Link to="/signup"> {/* Optional: Link for Sign Up */}
              <button className="text-white bg-secondary font-semibold rounded-full px-6 py-2 hover:bg-secondary-dark">
                Sign Up
              </button>
            </Link>
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
            <MdMenu className="text-4xl" />
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar section */}
      <ResponsiveMenu isOpen={isOpen} />
    </>
  );
};

export default Navbar;
