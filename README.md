# Interview Genius

Interview Genius is a multi-role recruitment platform with:

- candidate resume upload and ATS scoring
- real-time AI interview analysis
- business job posting flows
- admin analytics and user management

## Project Structure

- `frontend/` React + Vite client
- `backend/` Node API, Python AI service, database models, and runtime storage

## Environment Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Copy `frontend/.env.example` to `frontend/.env`
3. Fill in your MongoDB, Google OAuth, Gemini, and mail credentials

## Run Locally

From the existing batch scripts:

- `install.bat`
- `start-everything.bat`

Or manually:

1. Start the Node backend in `backend/`
2. Start the Python backend in `backend/`
3. Start the Vite frontend in `frontend/`
