export type IssueType = "bug" | "security" | "performance" | "style";
export type Severity = "critical" | "major" | "minor";

export interface Issue {
  type: IssueType;
  severity: Severity;
  file?: string;
  line_start: number;
  line_end: number;
  description: string;
  fix: string;
}

export interface ReviewResult {
  score: number;
  issues: Issue[];
  summary: string;
  filesReviewed?: number;
}

export interface RepoTreeFile {
  path: string;
  size: number;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  files: RepoTreeFile[];
}
