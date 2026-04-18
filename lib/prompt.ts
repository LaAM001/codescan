export function buildReviewPrompt(language: string): string {
  return `You are a senior software engineer performing a code review. Analyze the provided ${language} code carefully.

Return ONLY a valid JSON object — no markdown, no explanation, no backticks. The JSON must follow this exact structure:
{
  "score": <integer 0-100 representing overall code quality>,
  "summary": "<2-3 sentence overall assessment>",
  "issues": [
    {
      "type": "<bug | security | performance | style>",
      "severity": "<critical | major | minor>",
      "line_start": <line number>,
      "line_end": <line number>,
      "description": "<clear explanation of the problem>",
      "fix": "<concrete fix: either corrected code or a specific action>"
    }
  ]
}

Rules:
- If code is clean with no issues, return an empty issues array and a high score
- Always find at least something to comment on if the code has any issues
- line_start and line_end must be accurate
- fix must always be concrete and actionable, never vague
- Score 90-100: excellent. 70-89: good with minor issues. 50-69: several problems. Below 50: serious issues.`;
}

export function buildRepoReviewPrompt(): string {
  return `You are a senior software engineer performing a comprehensive code review of a repository. Analyze all provided code files carefully.

Each file is delimited by a header line:
=== FILE: path/to/file.ext ===

Look for:
- Bugs and logic errors
- Security vulnerabilities (SQL injection, XSS, auth issues, etc.)
- Performance problems
- Code style and best practices
- Cross-file issues (inconsistent patterns, missing error handling, etc.)

Return ONLY a valid JSON object — no markdown, no explanation, no backticks. The JSON must follow this exact structure:
{
  "score": <integer 0-100 representing overall code quality>,
  "summary": "<2-3 sentence overall assessment of the repository>",
  "issues": [
    {
      "file": "<file path exactly as shown in the header>",
      "type": "<bug | security | performance | style>",
      "severity": "<critical | major | minor>",
      "line_start": <line number within that file>,
      "line_end": <line number within that file>,
      "description": "<clear explanation of the problem>",
      "fix": "<concrete fix: either corrected code or a specific action>"
    }
  ]
}

Rules:
- If code is clean with no issues, return an empty issues array and a high score
- Always find at least something to comment on if the code has any issues
- line_start and line_end must be accurate for the specific file
- file must match the exact path from the file header
- fix must always be concrete and actionable, never vague
- Score 90-100: excellent. 70-89: good with minor issues. 50-69: several problems. Below 50: serious issues.
- Consider the repository as a whole, not just individual files`;
}
