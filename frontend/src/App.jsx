import { Suspense, lazy, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";

import Banner from "./components/Banner/Banner";
import Footer from "./components/Footer/Footer";
import Hero from "./components/Hero/Hero";
import Navbar from "./components/Navbar/Navbar";
import NavbarBanner from "./components/Navbar/NavbarBanner";
import NumberCounter from "./components/NumberCounter/NumberCounter";
import Testimonial from "./components/Testimonial/Testimonial";
import WhyChooseUs from "./components/WhyChooseUs/WhyChooseUs";
import Img1 from "./assets/banner1.png";
import Img2 from "./assets/banner2.png";

const AboutUs = lazy(() => import("./components/AboutUs/AboutUs"));
const ContactUs = lazy(() => import("./components/ContactUs/ContactUs"));
const Login = lazy(() => import("./components/Login/Login"));
const SignUp = lazy(() => import("./components/SignUp/SignUp"));
const ForgotPassword = lazy(() => import("./components/Login/ForgotPassword"));
const Resources = lazy(() => import("./components/Resources/Resources"));
const ForStudents = lazy(() => import("./components/ForStudents/ForStudents"));
const SideMenu = lazy(() => import("./components/SideMenu/SideMenu"));
const CandidateHome = lazy(() => import("./components/CandidateHome/CandidateHome"));
const Resume = lazy(() => import("./components/Resume/Resume"));
const Ats = lazy(() => import("./components/Resume/Ats"));
const History = lazy(() => import("./components/History/History"));
const Profile = lazy(() => import("./components/Profile/Profile"));
const Settings = lazy(() => import("./components/Settings/Settings"));
const SignUpCandidate = lazy(() => import("./components/SignUp/SignUpCandidate"));
const LoginCandidate = lazy(() => import("./components/Login/LoginCandidate"));
const BusinessNavbar = lazy(() => import("./components/Navbar/BusinessNavbar"));
const Homepage = lazy(() => import("./components/Business/Homepage"));
const Overview = lazy(() => import("./components/Business/Jobpost/Overview"));
const BasicDetails = lazy(() => import("./components/Business/Jobpost/BasicDetails"));
const Mcqs = lazy(() => import("./components/Business/Jobpost/Mcqs"));
const TechnicalInterview = lazy(() => import("./components/Business/Jobpost/TechnicalInterview"));
const HRInterview = lazy(() => import("./components/Business/Jobpost/HRInterview"));
const Profiles = lazy(() => import("./components/Business/Profiles"));
const SignUpBusiness = lazy(() => import("./components/SignUp/SignUpBusiness"));
const LoginBusiness = lazy(() => import("./components/Login/LoginBusiness"));
const Preview = lazy(() => import("./components/Business/Jobpost/Preview"));
const LoginAdmin = lazy(() => import("./components/Login/LoginAdmin"));
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const AdminHome = lazy(() => import("./components/Admin/AdminHome"));
const AdminUsers = lazy(() => import("./components/Admin/AdminUsers"));
const AIInterviewStart = lazy(() => import("./components/AIInterviewStart/AIInterviewStart"));
const AIInterviewInstructions = lazy(() => import("./components/AIInterviewInstructions/AIInterviewInstructions"));

const BannerData = {
  image: Img1,
  tag: "SCHEDULE WITH EASE",
  title: "Flexible Interview Scheduling for Your Hiring Needs",
  subtitle:
    "Our AI-powered platform allows you to schedule interviews based on your availability. Effortlessly track and manage interview schedules, ensuring a smooth process for your team. Harness the best scheduling tools for efficient candidate management.",
  link: "#",
};

const BannerData2 = {
  image: Img2,
  tag: "ACCESS TOP TALENT",
  title: "AI-Driven Insights for Finding the Right Fit",
  subtitle:
    "Our system leverages AI to analyze candidate responses and provide insightful recommendations, helping you find the best match for your job requirements. Transform your hiring with data-driven decisions.",
  link: "#",
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
    Loading...
  </div>
);

const App = () => {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const toggleSideMenu = () => {
    setIsSideMenuOpen((prev) => !prev);
  };

  return (
    <Router>
      <main className="overflow-x-hidden">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Navbar className="sticky-navbar" />
                  <NavbarBanner />
                  <Hero />
                  <NumberCounter />
                  <WhyChooseUs />
                  <Banner {...BannerData} />
                  <Banner {...BannerData2} reverse={true} />
                  <Testimonial />
                  <Footer />
                </>
              }
            />
            <Route
              path="/about-us"
              element={
                <>
                  <Navbar className="sticky-navbar" />
                  <AboutUs />
                </>
              }
            />
            <Route
              path="/contact-us"
              element={
                <>
                  <Navbar className="sticky-navbar" />
                  <ContactUs />
                </>
              }
            />
            <Route
              path="/resources"
              element={
                <>
                  <Navbar className="sticky-navbar" />
                  <Resources />
                </>
              }
            />
            <Route
              path="/for-students"
              element={
                <>
                  <Navbar className="sticky-navbar" />
                  <ForStudents />
                </>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signup-business" element={<SignUpBusiness />} />
            <Route path="/signup-candidate" element={<SignUpCandidate />} />
            <Route path="/login-business" element={<LoginBusiness />} />
            <Route path="/login-candidate" element={<LoginCandidate />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login-admin" element={<LoginAdmin />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route path="home" element={<AdminHome />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="/candidate" element={<Navigate to="/candidate/home" />} />
            <Route
              path="/candidate/*"
              element={
                <div className={`candidate-layout flex ${isSideMenuOpen ? "ml-64" : ""}`}>
                  <SideMenu isOpen={isSideMenuOpen} toggleMenu={toggleSideMenu} />
                  <div className="candidate-content flex-grow p-6 transition-all">
                    <Routes>
                      <Route path="home" element={<CandidateHome />} />
                      <Route path="resume" element={<Resume />} />
                      <Route path="ats" element={<Ats />} />
                      <Route path="history" element={<History />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="ai-mock-interview" element={<AIInterviewInstructions />} />
                      <Route path="ai-mock-interview/start" element={<AIInterviewStart />} />
                      <Route path="ai-interview" element={<AIInterviewInstructions />} />
                      <Route path="ai-interview/start" element={<AIInterviewStart />} />
                    </Routes>
                  </div>
                </div>
              }
            />

            <Route
              path="/business/*"
              element={
                <div className="app-layout flex">
                  <BusinessNavbar />
                  <main className="main-content flex-1 p-6 bg-gray-100">
                    <Routes>
                      <Route path="/" element={<Navigate to="/business/home" replace />} />
                      <Route path="home" element={<Homepage />} />
                      <Route path="overview" element={<Overview />} />
                      <Route path="basic-details" element={<BasicDetails />} />
                      <Route path="mcqs" element={<Mcqs />} />
                      <Route path="hr-interview" element={<HRInterview />} />
                      <Route path="technical-interview" element={<TechnicalInterview />} />
                      <Route path="profile" element={<Profiles />} />
                      <Route path="preview" element={<Preview />} />
                    </Routes>
                  </main>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
};

export default App;
