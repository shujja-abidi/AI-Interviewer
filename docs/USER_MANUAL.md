# User Manual

## Project Name

Interview Genius

## Overview

Interview Genius is an AI-powered recruitment platform for candidates, businesses, and admins. It supports resume parsing, ATS scoring, real-time AI interview sessions, transcript-aware interview analysis, non-verbal behavior indicators, saved interview history, and recruiter-side candidate comparison.

## User Roles

1. Candidate
2. Business
3. Admin

## Candidate Manual

### 1. Candidate Registration and Login

1. Open the application
2. Select candidate sign up or candidate login
3. Enter required credentials
4. After successful login, the candidate dashboard opens

### 2. Browse Job Opportunities

1. Open the candidate home page
2. Review available job cards
3. Click a role to continue to the resume workflow

### 3. Upload Resume

1. On the resume page, upload a PDF file
2. Wait for extraction to complete
3. Review extracted education, projects, experience, and skills
4. Click `Proceed` to continue

### 4. View ATS Report

1. The ATS page generates a report automatically
2. Review:
   - overall score
   - breakdown by category
   - matched keywords
   - missing keywords
   - formatting issues
   - strengths and weaknesses
   - improvement suggestions
3. Use:
   - `Download ATS Report`
   - `Print Report`
   - `Continue To Interview`

### 5. Start Real-Time AI Interview

1. Open the AI interview setup page
2. Allow camera and microphone access
3. Complete the checklist
4. Select:
   - interview type
   - difficulty
   - number of questions
5. Click `Start Interview Session`

### 6. Complete Interview Session

1. Read the displayed question
2. Start recording
3. Answer the question through the camera and microphone
4. Stop recording
5. Click `Analyze Answer`
6. Review the generated report
7. Move to the next question
8. Repeat until the session is completed

### 7. Review Interview History

1. Open the `History` page from the candidate menu
2. Review saved sessions
3. Open the summaries mentally from the page or export the JSON copy
4. Use `Download Session JSON` if needed

## Business Manual

### 1. Business Registration and Login

1. Open business sign up or login
2. Enter credentials
3. After successful login, the business dashboard opens

### 2. Create Job Post

1. Open the job posting workflow
2. Enter basic details
3. Configure MCQs
4. Configure technical interview section
5. Configure HR interview section
6. Preview the complete job configuration
7. Save the job

### 3. Review Candidate Comparison

1. Open the recruiter comparison page
2. Review candidate ranking by score
3. Optionally filter by role
4. Export the comparison data if needed

## Admin Manual

### 1. Admin Login

1. Open the admin login page
2. Enter admin credentials
3. Open the dashboard

### 2. Admin Capabilities

Admin can:

- view candidate count
- view business count
- view AI usage
- manage users

## Report Interpretation Guide

### ATS Report

- `Overall Score`: total ATS compatibility against the selected job
- `Keyword Coverage`: matched and missing job-relevant terms
- `Section Scores`: explain which parts of the resume are strong or weak
- `Improvement Plan`: targeted actions for resume enhancement

### Interview Report

- `Overall Score`: quality of the current answer
- `Transcript`: best-effort text extracted from the recorded answer
- `Transcript Metrics`: word count, filler count, keyword hits
- `Verbal Analysis`: clarity, confidence, relevance, sentiment, pace
- `Content Analysis`: structure, specificity, and key points covered
- `Non-Verbal Analysis`: face visibility, centering, movement, expression indicators

## Setup Requirements

To use the system correctly:

- browser permissions for camera and microphone must be allowed
- internet connection should be stable
- valid `.env` configuration must exist for frontend and backend
- MongoDB must be reachable
- Gemini API key must be configured

## Known Limitations

- Transcription is currently best-effort through Gemini
- Non-verbal analysis is indicator-based, not definitive psychological assessment
- Poor lighting or unstable internet can reduce interview quality

## Recommended Evaluation Demo Flow

1. Business logs in and shows a posted job
2. Candidate logs in and selects the job
3. Candidate uploads resume and shows ATS report
4. Candidate starts the real-time AI interview session
5. One or more interview questions are answered live
6. Interview report is shown
7. Candidate history is shown
8. Business opens candidate comparison
