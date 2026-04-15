import React from "react";
import Slider from "react-slick";

const TestimonialsData = [
  {
    id: 1,
    name: "Emily Johnson",
    role: "HR Manager",
    text: "The AI-powered interview scheduling tool has transformed our hiring process. It saves us time and helps us find the right candidates more efficiently.",
    img: "https://picsum.photos/101/101",
    delay: 0.2,
  },
  {
    id: 2,
    name: "Michael Lee",
    role: "Software Engineer",
    text: "As a candidate, I found the interview process to be seamless and user-friendly. The platform helped me prepare and connect with employers easily.",
    img: "https://picsum.photos/102/102",
    delay: 0.5,
  },
  {
    id: 3,
    name: "Sarah Patel",
    role: "Recruiter",
    text: "This platform has significantly improved our ability to manage interviews. The AI insights provided valuable feedback on candidates.",
    img: "https://picsum.photos/104/104",
    delay: 0.8,
  },
  {
    id: 4,
    name: "David Brown",
    role: "Job Seeker",
    text: "I appreciate the feedback I received after my interviews. It helped me improve for future opportunities and increased my confidence.",
    img: "https://picsum.photos/103/103",
    delay: 1.1,
  },
];

const Testimonial = () => {
  const setting = {
    dots: true,
    arrow: false,
    infinite: true,
    speed: 500,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    cssEase: "linear",
    pauseOnHover: true,
    pauseOnFocus: true,
    responsive: [
      {
        breakpoint: 10000,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="py-14 mb-10 bg-gray-50">
      <div className="container">
        {/* Header Section */}
        <div className="space-y-4 p-6 text-center max-w-[600px] mx-auto mb-6">
          <h1 className="uppercase font-semibold text-orange-600">Testimonials</h1>
          <p className="font-semibold text-3xl">
            What Our Users Say About Us
          </p>
        </div>
        {/* Testimonial Cards Section */}
        <div>
          <Slider {...setting}>
            {TestimonialsData.map((item) => {
              return (
                <div key={item.id}>
                  <div className="flex flex-col gap-4 p-8 shadow-lg mx-4 rounded-xl bg-white">
                    {/* Upper Section */}
                    <div className="flex justify-start items-center gap-5">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <div>
                        <p className="text-xl font-bold text-black">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.role}</p>
                      </div>
                    </div>
                    {/* Bottom Section */}
                    <div className="py-6 space-y-4">
                      <p className="text-sm text-gray-600">{item.text}</p>
                      <p>⭐⭐⭐⭐⭐</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
