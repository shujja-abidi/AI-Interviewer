from docx import Document

def create_document():
    doc = Document()
    doc.add_heading('AI-Interviewer: Final Year Project Overview', 0)
    
    # 1. Project understanding and user experience
    doc.add_heading('1. Project Understanding and Overview', level=1)
    doc.add_paragraph(
        "Our project is an AI-driven recruitment platform connecting businesses with candidates. "
        "It automates the hiring process by using AI to screen resumes and conduct preliminary video interviews. "
        "The goal is to save time for recruiters while providing candidates with a streamlined, modern application experience."
    )

    # 2. UI/UX design and user experience
    doc.add_heading('2. UI/UX Design and User Experience', level=1)
    doc.add_paragraph(
        "The platform is built with a clean, modern user interface using React, Tailwind CSS, and Material UI. "
        "We designed three distinct, intuitive portals: an Admin dashboard, a Business portal for posting jobs, and a Candidate portal. "
        "The layout uses responsive sidebars, interactive tables, and clear buttons to ensure the experience is highly intuitive and easy to navigate for all users."
    )

    # 3. Innovation and originality
    doc.add_heading('3. Innovation and Originality', level=1)
    doc.add_paragraph(
        "Unlike traditional job boards where candidates just submit a resume, our platform integrates Google's Gemini AI to autonomously conduct and grade video interviews. "
        "The AI generates interview questions specifically tailored to the job description the candidate is applying for. "
        "It then analyzes the candidate's video and audio responses to provide an instant evaluation and score, which is a highly innovative approach to recruitment."
    )

    # 4. Usefulness and practical impact
    doc.add_heading('4. Usefulness and Practical Impact', level=1)
    doc.add_paragraph(
        "This project solves a major bottleneck in the recruitment industry: manual screening. "
        "Businesses save hundreds of hours because they only need to review candidates who have already passed the AI-driven ATS screening and video interview phase. "
        "For candidates, the platform is extremely useful as a practice tool, offering a 'Mock Interview' feature to receive instant AI feedback and improve their skills."
    )

    # 5. Business model
    doc.add_heading('5. Business Model', level=1)
    doc.add_paragraph(
        "The project follows a B2B SaaS (Software as a Service) business model. "
        "The platform can charge businesses a subscription or pay-per-listing fee for posting jobs, accessing the AI screening tools, and managing applicants. "
        "Meanwhile, candidates can use the platform for free, which helps drive rapid user growth and creates a large, attractive talent pool for the businesses."
    )

    # 6. Feature implementation and completeness
    doc.add_heading('6. Feature Implementation and Completeness', level=1)
    doc.add_paragraph(
        "The system is fully functional from end to end. Key features implemented include: secure authentication (login/signup), "
        "role-based routing for Admin/Business/Candidate, automated ATS resume parsing, AI-generated interview questions, "
        "real-time video recording and AI analysis, job moderation, and a complete job application tracking system."
    )

    # Save the document
    doc.save('FYP_Project_Overview.docx')
    print("Word document created successfully as 'FYP_Project_Overview.docx'")

if __name__ == "__main__":
    create_document()
