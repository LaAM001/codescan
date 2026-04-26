# CodeScan - AI Repository Reviewer

An AI-powered GitHub repository review tool built with Next.js and Claude. Enter any public GitHub repository URL and get a comprehensive code review covering bugs, security vulnerabilities, performance issues, and style problems across your entire codebase.

![CodeScan Screenshot](public/Screenshot_2.png)

## Features

- **Full Repository Scanning** - Fetches and reviews up to 50 code files (200 KB total) from any public GitHub repo
- **File Selection** - Toggle select mode to choose specific files before scanning
- **AI-Powered Analysis** - Uses Claude (Anthropic) to identify bugs, security issues, performance problems, and style improvements
- **Severity Scoring** - Overall quality score (0–100) with per-issue severity and type badges
- **GitHub OAuth** - Sign in with GitHub to access private repositories and browse your repos from a dropdown
- **Persistent Results** - Last review saved to localStorage and restored on page load

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Anthropic Claude API (`claude-sonnet-4-6`)
- NextAuth.js v5 (GitHub OAuth)
- Lucide React (icons)

## Setup

### 1. Install dependencies

```bash
cd codescan
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the `codescan` directory:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to **API Keys** and click **Create Key**
3. Paste the key as `ANTHROPIC_API_KEY` in `.env.local`

### 4. Set up GitHub OAuth (optional — required for private repos)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set the **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** into `.env.local`
5. Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use CodeScan.

## Usage

1. Enter a GitHub repository URL (e.g. `https://github.com/owner/repo`) or `owner/repo` shorthand
2. Click **Fetch Repo** — CodeScan fetches the repo's file tree and displays it
3. Optionally toggle **Select specific files** to choose which files to include
4. Click **Scan Full Repository** (or **Scan X Selected Files**)
5. View the score card, summary, and detailed issue list with suggested fixes
6. Click **Copy fix** on any issue to copy the AI-suggested code fix

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/repo` | POST | Fetches repo file tree from GitHub |
| `/api/scan` | POST | Fetches file contents and runs Claude review |
| `/api/auth/[...nextauth]` | GET/POST | GitHub OAuth via NextAuth |

## License

MIT
