import React from "react";
import { FaRobot, FaRegClock } from "react-icons/fa";
import { GiChecklist, GiChart } from "react-icons/gi";
import { motion } from "framer-motion";
import { SlideLeft } from "../../utility/animation";

const WhyChooseData = [
  {
    id: 1,
    title: "AI-Driven Assessments",
    desc: "Leverage AI algorithms to evaluate candidate responses and provide unbiased feedback.",
    icon: <FaRobot />,
    bgColor: "#0063ff",
    delay: 0.3,
  },
  {
    id: 2,
    title: "Customizable Interview Templates",
    desc: "Tailor interview questions and formats to match your company’s requirements.",
    icon: <GiChecklist />,
    bgColor: "#73bc00",
    delay: 0.6,
  },
  {
    id: 3,
    title: "24/7 Candidate Support",
    desc: "Our platform provides round-the-clock support to help candidates with any queries.",
    icon: <FaRegClock />,
    bgColor: "#fa6400",
    delay: 0.9,
  },
  {
    id: 4,
    title: "Data-Driven Insights",
    desc: "Get analytics and insights into candidate performance to make informed hiring decisions.",
    icon: <GiChart />,
    bgColor: "#fe6baa",
    delay: 1.2,
  },
];

const WhyChooseUs = () => {
  return (
    <div className="bg-[#f9fafc]">
      <div className="container py-24">
        {/* Header section */}
        <div className="space-y-4 p-6 text-center max-w-[500px] mx-auto mb-5">
          <h1 className="uppercase font-semibold text-orange-600">Why Choose Us</h1>
          <p className="font-semibold text-3xl">Benefits of Using Our AI Interview System</p>
        </div>
        {/* Cards section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {WhyChooseData.map((item) => (
            <motion.div
              key={item.id}
              variants={SlideLeft(item.delay)}
              initial="hidden"
              whileInView="visible"
              className="space-y-4 p-6 rounded-xl shadow-[0_0_22px_rgba(0,0,0,0.15)]"
            >
              {/* Icon section */}
              <div
                style={{ backgroundColor: item.bgColor }}
                className="w-10 h-10 rounded-lg flex justify-center items-center text-white"
              >
                <div className="text-2xl">{item.icon}</div>
              </div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs;
