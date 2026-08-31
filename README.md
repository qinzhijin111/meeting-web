This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local development

This section explains how to set up and run the `meeting-web` project locally.

The application is built with **Next.js** and uses **LiveKit Cloud** for real-time audio/video communication. A LiveKit Cloud project and valid development credentials are required to use the meeting functionality.

---

### 1. Prerequisites

Before starting, make sure the following tools are installed on your machine:

* **Git**
* **Node.js** — use a current LTS version
* **npm** — included with Node.js
* A modern browser such as **Google Chrome**, **Microsoft Edge**, or **Firefox**
* A **LiveKit Cloud** account and project

You can verify that Git, Node.js, and npm are installed by running:

```bash
git --version
node -v
npm -v
```

Each command should print a version number.

For example:

```text
git version 2.x.x
v22.x.x
10.x.x
```

If `node` or `npm` is not recognized, install Node.js from the official Node.js website and restart your terminal.

If `git` is not recognized, install Git and restart your terminal.

---

### 2. Clone the Repository

Choose a directory where you want to store the project.

Clone the repository:

```bash
git clone https://github.com/<username-or-organization>/meeting-web.git
```

Then enter the project directory:

```bash
cd meeting-web
```

If the repository is private, GitHub may ask you to authenticate before cloning.

You can confirm that you are in the correct directory by checking that files such as the following exist:

```text
meeting-web/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── public/
└── src/
```

---

### 3. Install Dependencies

From the project root, install all Node.js dependencies:

```bash
npm install
```

This installs the packages listed in `package.json`, including the Next.js and LiveKit dependencies required by the application.

You do **not** need to install the LiveKit packages separately after cloning the repository if they are already listed in `package.json`.

For a completely clean install using the versions recorded in `package-lock.json`, you may instead run:

```bash
npm ci
```

Use either `npm install` or `npm ci`, not both.

---

### 4. Create a LiveKit Cloud Project

The meeting page connects to **LiveKit Cloud**, so a LiveKit project is required before the meeting functionality can run.

After signing in to LiveKit Cloud:

1. Create a new LiveKit project, or use an existing development project.
2. Locate the project's **WebSocket URL**.
3. Create or locate an **API Key**.
4. Save the corresponding **API Secret**.

You will need three values:

```text
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

The LiveKit URL normally looks similar to:

```text
wss://your-project.livekit.cloud
```

The API key and API secret will be provided by LiveKit Cloud.

> **Security warning:** Never commit a real LiveKit API secret to GitHub, paste it into source code, or expose it in client-side code.

---

### 5. Configure Environment Variables

Create a file named:

```text
.env.local
```

in the **project root**, at the same level as `package.json`.

The project should look approximately like this:

```text
meeting-web/
├── .env.local
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── public/
└── src/
```

Add the following variables to `.env.local`:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

Replace the placeholder values with the credentials from your own LiveKit Cloud project.

For example, **do not literally use**:

```env
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

Those values are only placeholders for documentation.

Do not add quotation marks unless they are actually part of the value.

---

### 6. Verify That `.env.local` Is Ignored by Git

The `.env.local` file contains sensitive credentials and must never be committed to the repository.

Run:

```bash
git status
```

`.env.local` should **not** appear as an untracked or modified file.

You can also explicitly check whether Git is ignoring the file:

```bash
git check-ignore -v .env.local
```

If the file is correctly ignored, Git should print a rule from `.gitignore` that matches `.env.local`.

If `.env.local` appears in `git status`, **do not commit or push it**. Check `.gitignore` before continuing.

Never commit:

```text
LIVEKIT_API_SECRET
```

to GitHub.

---

### 7. Start the Development Server

From the project root, run:

```bash
npm run dev
```

Wait until Next.js reports that the development server is ready.

You should see output similar to:

```text
Next.js

Local:
http://localhost:3000

Ready
```

Keep this terminal window running while developing.

---

### 8. Open the Application

Open the following URL in your browser:

```text
http://localhost:3000
```

This is the main landing page.

The development meeting page is available at:

```text
http://localhost:3000/meeting
```

When opening the meeting page, the browser may ask for permission to access your:

* Camera
* Microphone

Allow these permissions if you want to test audio and video.

---

### 9. Development Token Endpoint

During local development, the application uses a temporary Next.js server endpoint to generate a LiveKit access token.

The endpoint is:

```text
GET /api/token
```

When running locally, it can be accessed at:

```text
http://localhost:3000/api/token
```

The endpoint reads the following server-side environment variables:

```text
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

It generates a temporary LiveKit access token that allows a development participant to join the development meeting room.

A successful response should look approximately like:

```json
{
  "token": "<generated-token>",
  "serverUrl": "wss://your-project.livekit.cloud",
  "roomName": "dev-room",
  "participantIdentity": "dev-user-..."
}
```

The exact token and participant identity will be different each time.

The generated token should be treated as temporary development data.

> The `/api/token` endpoint is intended for **development only**. It currently does not represent the final production authentication and authorization flow.

---

### 10. How the Meeting Page Works

The local meeting flow is:

```text
Browser
   |
   v
/meeting
   |
   v
GET /api/token
   |
   v
Next.js server reads LiveKit credentials
   |
   v
Generate temporary LiveKit access token
   |
   v
Return token + LiveKit server URL
   |
   v
LiveKitRoom connects to LiveKit Cloud
   |
   v
VideoConference renders the meeting UI
```

The LiveKit API secret stays on the server.

The browser receives a temporary access token instead of receiving the API secret directly.

---

### 11. Test the Meeting Page

After starting the development server, open:

```text
http://localhost:3000/meeting
```

A successful setup should result in the LiveKit meeting interface loading without an environment-variable or connection error.

You should be able to grant camera and microphone access and join the development room.

## Data Model

Week 2 introduces the first persistent application data using Supabase Postgres.

### profiles

The `profiles` table stores application-level information associated with a Supabase Auth user.

Important fields:

- `id`: UUID that references the authenticated Supabase user.
- `display_name`: Optional display name for the user.
- `created_at`: Timestamp for when the profile was created.

The profile ID is linked to `auth.users.id`, allowing application data to be associated with the authenticated user.

### rooms

The `rooms` table stores meeting room records created by users.

Important fields:

- `id`: Unique room identifier.
- `title`: User-provided room title.
- `host_user_id`: References the authenticated user who created the room.
- `status`: Current room state. During Week 2, newly created rooms use the `draft` status.
- `created_at`: Timestamp for when the room record was created.

For Week 2, creating a room only creates a draft database record. LiveKit room creation and password protection will be implemented in a later stage.

### Row Level Security

Row Level Security (RLS) is enabled for the application tables.

Users can only read rooms where their authenticated user ID matches the room's `host_user_id`. Users can also only create rooms using their own authenticated user ID.

This prevents one authenticated user from reading another user's private draft rooms through normal application queries.

# Week 2 Manual Test Checklist

## Authentication

- [x] Sign up with a new email and password.
  - New user appears in Supabase Authentication.
  - User is asked to verify their email when email confirmation is enabled.

- [x] Login with valid credentials.
  - User is redirected to `/dashboard`.
  - Dashboard displays the authenticated user's email.

- [x] Login with an incorrect password.
  - User is not authenticated.
  - A friendly "Invalid email or password" message is displayed.

- [x] Refresh the browser after login.
  - Authentication session persists.
  - User remains on the dashboard.

- [x] Access `/dashboard` while logged out.
  - User is redirected to `/login`.

## Room Creation

- [x] Create a room with a valid title.
  - A new row appears in the `rooms` table.
  - `host_user_id` matches the authenticated user.
  - Room status is `draft`.

- [x] Submit an invalid room title.
  - Invalid input is rejected.
  - A friendly validation message is displayed.

- [x] Create a room successfully.
  - A success message is displayed.
  - The room appears in Recent Rooms.

## Row Level Security

- [x] User A creates a private draft room.

- [x] User B signs in using a separate browser session.

- [x] User B performs a normal authenticated query against the `rooms` table.
  - User B cannot read User A's private draft room.
  - User B can only see rooms permitted by RLS.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
