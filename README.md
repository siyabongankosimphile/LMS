# Kayise IT Learning Management System (LMS)

A full-featured LMS built with Next.js 15 App Router, NextAuth v4, MongoDB (Mongoose), and Tailwind CSS.

## Features

### Roles
- Admin - manage users, approve/reject facilitators, view stats
- Facilitator - create courses, modules, lessons, quizzes, assignments, announcements
- Student - browse courses, enroll with a key, track progress, take quizzes, earn certificates

### Auth
- Email + Password (credentials) authentication
- Google OAuth
- Facilitator accounts require admin approval before they can create courses
- Students become active immediately on registration

### Student Experience
- Dashboard with enrolled courses, progress bars, and certificate downloads
- Course catalog with enrollment-key-gated access
- Course/module pages with collapsible sections (Announcements, Week/Topic blocks, Assignments, Quizzes, Final Project)
- Lesson completion tracking with automatic progress calculation
- Quizzes with configurable pass marks and attempt limits
- Auto-generated PDF certificates on course completion

### Facilitator Experience
- Create and manage courses with enrollment keys (stored as SHA-256 hashes)
- Manage modules and lessons (video URL + notes/content + multi-file resources + links)
- Create quizzes, assignments, announcements, and graded feedback
- Create-course flow redirects away from form after submit (to reduce accidental duplicates)
- File upload support backed by MongoDB (GridFS)

### Admin Experience
- Dashboard with key metrics (users, courses, enrollments)
- Facilitator approval/rejection UI
- Full user list with roles and statuses

## Rights and Responsibilities

### Learner (Student)

#### Rights (What learners can do)
- Access assigned courses and learning materials
- View lessons, videos, and documents
- Participate in discussions and forums
- Submit assignments and assessments
- Take quizzes and exams
- View grades and feedback
- Track learning progress
- Download allowed learning resources
- Receive certificates after course completion

#### Responsibilities
- Complete assigned courses on time
- Participate in learning activities
- Submit original work (no plagiarism)
- Follow LMS and institution rules
- Communicate respectfully
- Protect account credentials and use the platform responsibly

### Facilitator (Instructor)

#### Rights (What facilitators can do)
- Create and manage courses
- Upload learning materials (videos, PDFs, slides)
- Create assignments, quizzes, and exams
- Grade learner submissions
- Provide feedback
- Monitor learner progress
- Manage discussions and forums
- Communicate with learners
- Generate course reports

#### Responsibilities
- Provide quality learning materials
- Support and guide learners
- Assess learners fairly
- Provide timely feedback
- Monitor learner performance
- Maintain course structure

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Auth | NextAuth v4 (Credentials + Google) |
| Database | MongoDB via Mongoose |
| File Storage | MongoDB GridFS (served via `/api/files/[...key]`) |
| PDF Generation | jsPDF |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone and install

```bash
git clone https://github.com/siyabongankosimphile/LMS.git
cd LMS
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXTAUTH_SECRET=your-super-secret-key  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<dbUser>:<dbPassword>@cluster0.xxxxx.mongodb.net/lms?retryWrites=true&w=majority
GOOGLE_CLIENT_ID=   # optional
GOOGLE_CLIENT_SECRET=  # optional
OPENAI_API_KEY=  # optional, for landing chat AI responses
# OPENAI_CHAT_MODEL=gpt-4o-mini
# OPENAI_CHAT_URL=https://api.openai.com/v1/chat/completions
```

Atlas checklist:
- Create a database user in MongoDB Atlas.
- Add your machine/server IP to Atlas Network Access (or `0.0.0.0/0` for broad access).
- Use the exact database name you want at the end of MONGODB_URI (here: `lms`).

Note: file uploads now use MongoDB GridFS. No AWS/S3 variables are required.

### 3. Create the first admin user

```bash
npx tsx src/scripts/seed.ts
```

Default admin: `admin@kayiseit.co.za` / `Admin@1234`

Override via env vars:
```env
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=YourSecurePassword
ADMIN_NAME=Your Name
```

### Optional: Repair malformed lesson module references

If learners only see quizzes and not lessons, run:

```bash
npm run repair:lesson-modules:dry
```

Then apply fixes:

```bash
npm run repair:lesson-modules
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Upload Notes

- Default upload size limit: 50MB per file.
- Uploaded files are stored in MongoDB GridFS and streamed through API routes.
- Existing upload endpoint remains `/api/upload`.

## Project Structure

```
src/
|-- app/
|   |-- (auth)/
|   |   |-- login/           # Sign-in page
|   |   `-- register/        # Registration page
|   |-- admin/
|   |   |-- page.tsx         # Admin dashboard
|   |   |-- users/           # User management
|   |   `-- facilitators/    # Facilitator approvals
|   |-- courses/
|   |   |-- page.tsx         # Course catalog
|   |   `-- [id]/
|   |       |-- page.tsx     # Course detail + enrollment
|   |       `-- learn/       # Learning interface
|   |-- dashboard/           # Student dashboard
|   |-- facilitator/
|   |   |-- page.tsx         # Facilitator dashboard
|   |   `-- courses/
|   |       |-- new/         # Create course
|   |       `-- [id]/        # Course editor (modules, lessons, quiz)
|   `-- api/
|       |-- auth/[...nextauth]/
|       |-- register/
|       |-- courses/
|       |-- enrollments/
|       |-- quizzes/
|       |-- certificates/
|       |-- admin/
|       |-- facilitator/
|       |-- chat/
|       |-- files/[...key]/
|       `-- upload/
|-- lib/
|   |-- auth.ts        # NextAuth config
|   |-- db.ts          # MongoDB connection
|   |-- s3.ts          # File storage abstraction (MongoDB GridFS)
|   `-- certificate.ts # PDF certificate generation
|-- models/
|   |-- User.ts
|   |-- Course.ts
|   |-- Module.ts
|   |-- Lesson.ts
|   |-- Enrollment.ts
|   |-- Quiz.ts
|   `-- Certificate.ts
|-- scripts/
|   `-- seed.ts        # Admin user seeder
`-- middleware.ts      # Route protection (RBAC)
```

## Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a project -> APIs & Services -> Credentials
3. Create an OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
5. Copy Client ID and Secret to `.env.local`

## Deployment

1. Set all environment variables in your deployment platform (Vercel, Railway, etc.)
2. Set NEXTAUTH_URL to your production URL
3. Run the seed script once against your production database

## License

MIT
