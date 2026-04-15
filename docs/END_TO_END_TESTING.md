# End-to-End Testing Package

## Purpose

This document records the end-to-end testing scope for Interview Genius. The goal is to verify that the recruitment workflow works from job creation to ATS scoring, real-time AI interview analysis, saved session history, and recruiter comparison.

## Test Environment

- Frontend: React + Vite
- Node backend: Express
- Python backend: Flask
- Database: MongoDB
- AI services: Gemini API
- Media analysis: OpenCV
- Browser used for validation: Chrome/Edge with camera and microphone permissions enabled

## Modules Covered

1. Candidate authentication
2. Business authentication
3. Job posting workflow
4. Resume upload and parsing
5. ATS report generation
6. Real-time AI interview session setup
7. Dynamic question generation
8. Interview analysis with transcript and non-verbal indicators
9. Interview session persistence in MongoDB
10. Candidate session history
11. Recruiter candidate comparison
12. Admin dashboard basics

## Test Cases

### 1. Candidate Login

- Precondition: Candidate account exists
- Steps:
  1. Open candidate login page
  2. Enter email and password
  3. Submit form
- Expected Result:
  - Candidate is authenticated
  - Candidate is redirected to the candidate dashboard
  - Session values are stored on the client

### 2. Business Login

- Precondition: Business account exists
- Steps:
  1. Open business login page
  2. Enter email and password
  3. Submit form
- Expected Result:
  - Business is authenticated
  - Business is redirected to the business dashboard

### 3. Job Posting Workflow

- Precondition: Business is logged in
- Steps:
  1. Open job posting flow
  2. Enter basic details
  3. Configure MCQs, technical interview, and HR interview
  4. Save the job post
- Expected Result:
  - Job post is stored in MongoDB
  - Candidate dashboard can fetch and display the job

### 4. Resume Upload and Parsing

- Precondition: Candidate is logged in and has selected a job
- Steps:
  1. Open resume page
  2. Upload a PDF resume
  3. Wait for extraction
- Expected Result:
  - Resume sections are extracted
  - Education, projects, experience, and skills appear in the UI

### 5. ATS Report Generation

- Precondition: Parsed resume data and selected job description are available
- Steps:
  1. Continue from resume page to ATS page
  2. Trigger ATS scoring
- Expected Result:
  - Overall ATS score is generated
  - Section-wise breakdown is shown
  - Matched and missing keywords are shown
  - Suggestions, formatting issues, strengths, weaknesses, and improvement plan are shown
  - Report can be downloaded and printed

### 6. Real-Time AI Interview Session Generation

- Precondition: Candidate has ATS/job context available
- Steps:
  1. Open AI interview setup page
  2. Allow camera and microphone access
  3. Select interview type, difficulty, and question count
  4. Start session
- Expected Result:
  - System generates role-specific interview questions
  - A new interview session is created and stored in MongoDB
  - Candidate is taken to the interview session page

### 7. Real-Time Answer Recording and Analysis

- Precondition: Interview session exists
- Steps:
  1. Start recording
  2. Answer the displayed question
  3. Stop recording
  4. Analyze answer
- Expected Result:
  - Video answer is uploaded successfully
  - Transcript is generated
  - Transcript metrics are calculated
  - Verbal analysis is generated
  - Non-verbal indicators are generated
  - Structured report is shown
  - The analyzed answer is saved inside the current interview session

### 8. Multi-Question Session Completion

- Precondition: Question list exists
- Steps:
  1. Complete analysis for the first question
  2. Move to next question
  3. Repeat until final question
- Expected Result:
  - Each answer is stored with question index
  - Session score and completion count update correctly
  - Final session status becomes completed when all questions are analyzed

### 9. Candidate History

- Precondition: At least one session exists for the candidate
- Steps:
  1. Open candidate history page
- Expected Result:
  - Previously saved sessions are loaded from MongoDB
  - Session score, role, company, timestamp, and per-question summaries are visible
  - Session JSON can be downloaded

### 10. Recruiter Candidate Comparison

- Precondition: A business has interview sessions saved for candidates
- Steps:
  1. Log in as business
  2. Open candidate comparison page
  3. Filter by role if needed
- Expected Result:
  - Candidate sessions are ranked by score
  - Role, interview type, completion, score, and recommendation are visible
  - Recruiter comparison export works

### 11. Admin Dashboard

- Precondition: Admin login is successful
- Steps:
  1. Open admin dashboard
- Expected Result:
  - Candidate count is shown
  - Business count is shown
  - AI usage count is shown
  - Job/interview count is shown

## Validation Results Summary

The following technical validations were completed during development:

- `python -m py_compile backend\server.py backend\interview_analysis.py backend\interview_transcription.py backend\report_generator.py backend\ats.py`
- `node --check backend\index.js`
- `npm run lint`
- `npm run build`

## Known Limitations During Testing

- MongoDB connectivity depends on correct `MONGO_URI` and working DNS/network access
- Transcript generation currently relies on Gemini rather than a dedicated STT engine such as Whisper
- Non-verbal analysis uses OpenCV heuristics and should be described as behavioral indicators, not emotion certainty
- Camera and microphone testing must be performed in a browser with permissions granted

## Recommended Demo Test Flow

For evaluation, use this sequence:

1. Business logs in and shows a saved job
2. Candidate opens the job and uploads resume
3. ATS report is generated
4. Candidate starts the real-time AI interview
5. Questions are generated dynamically
6. Candidate records one answer live
7. Structured interview report is shown
8. Candidate history is shown
9. Business opens candidate comparison and ranking
