# Kayise IT Learning Management System (LMS)

A full-featured LMS built with **Next.js 14 App Router**, **NextAuth v4**, **MongoDB (Mongoose)**, and **Tailwind CSS**.

## Features

### Roles
- **Admin** – manage users, approve/reject facilitators, view stats
- **Facilitator** – create courses, modules, lessons, quizzes
- **Student** – browse courses, enroll with a key, track progress, take quizzes, earn certificates

### Auth
- Email + Password (credentials) authentication
- Google OAuth
- Facilitator accounts require admin approval before they can create courses
- Students become active immediately on registration

### Student Experience
- Dashboard with enrolled courses, progress bars, and certificate downloads
- Course catalog with enrollment-key-gated access
- Lesson completion tracking with automatic progress calculation
- MCQ quizzes with configurable pass marks
- Auto-generated PDF certificates on course completion

### Facilitator Experience
- Create and manage courses with enrollment keys (stored as SHA-256 hashes)
- Manage modules and lessons (video URL + rich text content)
- Create MCQ quizzes with configurable pass marks
- File upload support (S3-compatible storage)

### Admin Experience
- Dashboard with key metrics (users, courses, enrollments)
- Facilitator approval/rejection UI
- Full user list with roles and statuses

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Auth | NextAuth v4 (Credentials + Google) |
| Database | MongoDB via Mongoose |
| File Storage | AWS S3 / S3-compatible (MinIO, Cloudflare R2, etc.) |
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
MONGODB_URI=mongodb://localhost:27017/lms
GOOGLE_CLIENT_ID=   # optional
GOOGLE_CLIENT_SECRET=  # optional
OPENAI_API_KEY=  # optional, for landing chat AI responses
# OPENAI_CHAT_MODEL=gpt-4o-mini
# OPENAI_CHAT_URL=https://api.openai.com/v1/chat/completions
```

For file uploads, configure S3 or a local MinIO instance:

```env
S3_REGION=us-east-1
S3_BUCKET=lms-bucket
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_ENDPOINT=http://localhost:9000   # for MinIO
S3_FORCE_PATH_STYLE=true             # for MinIO
```

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

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/           # Sign-in page
│   │   └── register/        # Registration page
│   ├── admin/
│   │   ├── page.tsx         # Admin dashboard
│   │   ├── users/           # User management
│   │   └── facilitators/    # Facilitator approvals
│   ├── courses/
│   │   ├── page.tsx         # Course catalog
│   │   └── [id]/
│   │       ├── page.tsx     # Course detail + enrollment
│   │       └── learn/       # Learning interface
│   ├── dashboard/           # Student dashboard
│   ├── facilitator/
│   │   ├── page.tsx         # Facilitator dashboard
│   │   └── courses/
│   │       ├── new/         # Create course
│   │       └── [id]/        # Course editor (modules, lessons, quiz)
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── register/
│       ├── courses/
│       ├── enrollments/
│       ├── quizzes/
│       ├── certificates/
│       ├── admin/
│       ├── facilitator/
│       ├── chat/
│       └── upload/
├── lib/
│   ├── auth.ts       # NextAuth config
│   ├── db.ts         # MongoDB connection
│   ├── s3.ts         # S3 file storage abstraction
│   └── certificate.ts # PDF certificate generation
├── models/
│   ├── User.ts
│   ├── Course.ts
│   ├── Module.ts
│   ├── Lesson.ts
│   ├── Enrollment.ts
│   ├── Quiz.ts
│   └── Certificate.ts
├── scripts/
│   └── seed.ts       # Admin user seeder
└── middleware.ts      # Route protection (RBAC)
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials
3. Create an OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
5. Copy Client ID and Secret to `.env.local`

## S3 / MinIO Setup (local dev)

Start MinIO locally:
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

Then configure:
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=lms-bucket
S3_FORCE_PATH_STYLE=true
```

Create the bucket in the MinIO console at [http://localhost:9001](http://localhost:9001).

## Deployment

1. Set all environment variables in your deployment platform (Vercel, Railway, etc.)
2. Set `NEXTAUTH_URL` to your production URL
3. Run the seed script once against your production database

## License

MIT
