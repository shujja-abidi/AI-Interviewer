import React from "react";
import { motion } from "framer-motion";
import { SlideUp } from "../../utility/animation";

// Import images
import JobImage from "../../assets/job.png";
import ScreeningImage from "../../assets/screening.png";
import ReviewImage from "../../assets/review.png";
import DataImage from "../../assets/data.png";
import Footer from "../Footer/Footer"; // Adjust the import based on your file structure

const AboutUs = () => {
  const features = [
    {
      title: "Post a Job Opportunity",
      desc: "Our platform automates the entire pre-screening process—including mapping résumés to your job description, assessing your candidates’ skills, and evaluating their soft skills—all within 10 minutes. Share your job interview link on your career page, social media, or job sites, and let Interviewer.AI handle the rest.",
      img: JobImage,
    },
    {
      title: "Let Interviewer.AI Handle the Initial Screening",
      desc: "Spend less time on pre-screen interviews and focus on the top candidates. Our platform takes care of the heavy lifting, allowing you to evaluate the best applicants.",
      img: ScreeningImage,
    },
    {
      title: "Review the Most Qualified Candidates",
      desc: "Interviewer.AI provides stack ranking of candidates, making it easier for employers to shortlist candidates for interviews. Get in-depth hiring insights to identify the best fit for your team.",
      img: ReviewImage,
    },
    {
      title: "Use Data to Decide Which Candidates to Interview",
      desc: "Beyond résumés, Interviewer.AI provides meaningful data to guide your hiring decisions. Our platform interviews every applicant and creates detailed profiles to help you decide who to invite for in-person interviews.",
      img: DataImage,
    },
  ];

  return (
    <div className="py-14 bg-gray-100">
      <div className="container">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.h1
            variants={SlideUp(0.5)}
            initial="hidden"
            whileInView="visible"
            className="text-4xl font-semibold"
          >
            About Interviewer.AI
          </motion.h1>
          <motion.p
            variants={SlideUp(0.7)}
            initial="hidden"
            whileInView="visible"
            className="text-lg text-gray-600"
          >
            Revolutionizing the Hiring Process with Intelligent Automation
          </motion.p>
        </div>

        {/* Features Section */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8" key={index}>
              {/* Text Section */}
              <motion.div
                variants={SlideUp(0.9 + index * 0.2)}
                initial="hidden"
                whileInView="visible"
                className="bg-white shadow-md rounded-lg p-6 space-y-4"
              >
                <h3 className="text-2xl font-semibold">
                  {index + 1}. {feature.title}
                </h3>
                <p className="text-gray-500">{feature.desc}</p>
              </motion.div>
              {/* Image Section */}
              <motion.div
                variants={SlideUp(1.1 + index * 0.2)}
                initial="hidden"
                whileInView="visible"
                className="flex justify-center items-center"
              >
                <motion.img
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                  src={feature.img}
                  alt={feature.title}
                  className="w-[350px] md:w-[450px] xl:w-[550px] rounded-lg"
                />
              </motion.div>
            </div>
          ))}
        </div>

        {/* Footer Section with Margin */}
        <div className="mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
