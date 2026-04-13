# CodeScan - AI Code Reviewer

An AI-powered code review tool built with Next.js and Claude. Paste any code snippet and get instant feedback on bugs, security vulnerabilities, performance issues, and style improvements.

![CodeScan Screenshot](screenshot-placeholder.png)

## Features

- **AI-Powered Reviews** - Uses Claude (Anthropic) to analyze code for bugs, security issues, performance problems, and style
- **Monaco Editor** - Full-featured code editor with syntax highlighting for 17+ languages
- **Severity Scoring** - Overall quality score (0-100) with issue-by-issue breakdown
- **GitHub Integration** - Sign in with GitHub to load files directly from your repositories
- **Streaming Results** - Review results stream in progressively
- **Persistent Results** - Last review saved to localStorage

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Monaco Editor
- Anthropic Claude API
- NextAuth.js v5 (GitHub OAuth)

## Setup

### 1. Install dependencies

```bash
cd codescan
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

### 3. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys** in the settings
4. Click **Create Key**
5. Copy the key and paste it as `ANTHROPIC_API_KEY` in `.env.local`

### 4. Set up GitHub OAuth (optional, for GitHub integration)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set the **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** into `.env.local`
5. Generate a `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use CodeScan.

## Usage

1. Paste code into the editor (a sample with bugs is pre-loaded)
2. Select the language from the dropdown
3. Click **Review Code**
4. View the score, summary, and detailed issues in the right panel
5. Click **Copy fix** on any issue to copy the suggested fix

## License

MIT
