import React from "react";
import HeroImg from "../../assets/hero.png"; // Update with a relevant image if available
import { motion } from "framer-motion";
import { SlideRight } from "../../utility/animation";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  const handleSignUp = (type) => {
    if (type === "candidate") {
      navigate("/signup-candidate"); // Navigate to the Candidate Signup page
    } else if (type === "business") {
      navigate("/signup-business"); // Navigate to the Business Signup page
    }
  };

  return (
    <div className="container grid grid-cols-1 md:grid-cols-2 min-h-[650px] relative">
      {/* Brand Info */}
      <div className="flex flex-col justify-center py-14 md:pr-16 xl:pr-40 md:py-0">
        <div className="text-center md:text-left space-y-6">
          <motion.p
            variants={SlideRight(0.4)}
            initial="hidden"
            animate="visible"
            className="text-blue-600 uppercase font-semibold"
          >
            Transform Your Hiring Process
          </motion.p>
          <motion.h1
            variants={SlideRight(0.6)}
            initial="hidden"
            animate="visible"
            className="text-5xl font-semibold lg:text-6xl !leading-tight"
          >
            AI-Powered <span className="text-primary">Interviews</span> Made Simple
          </motion.h1>
          <motion.p
            variants={SlideRight(0.8)}
            initial="hidden"
            animate="visible"
            className="text-gray-700"
          >
            Accelerate recruitment with automated, intelligent interviews that assess candidates fairly and efficiently, giving you insights that matter.
          </motion.p>
          {/* Signup Buttons Section */}
          <motion.div
            variants={SlideRight(1.0)}
            initial="hidden"
            animate="visible"
            className="flex gap-8 justify-center md:justify-start !mt-8 items-center"
          >
            <button
              
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-dark transition-all duration-300"
              onClick={() => handleSignUp("candidate")}
            >
              Sign Up as Candidate
            </button>
            <button
              className="bg-secondary text-white px-6 py-3 rounded-full font-semibold hover:bg-secondary-dark transition-all duration-300"
              onClick={() => handleSignUp("business")}
            >
              Sign Up as Business
            </button>
          </motion.div>
        </div>
      </div>
      {/* Hero Image */}
      <div className="flex justify-center items-center">
        <motion.img
          initial={{ opacity: 0, x: 200 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          src={HeroImg}
          alt="AI interview illustration"
          className="w-[350px] md:w-[550px] xl:w-[700px]"
        />
      </div>
    </div>
  );
};

export default Hero;
