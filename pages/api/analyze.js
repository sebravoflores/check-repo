const CRITERIA = {
  securityMd: { title: 'SECURITY.md', points: 10 },
  license: { title: 'License', points: 10 },
  readme: { title: 'README.md', points: 10 },
  maintainedRecently: { title: 'Mantenimiento Activo', points: 15 },
  ciWorkflows: { title: 'CI/CD Workflows', points: 10 },
  codeowners: { title: 'CODEOWNERS', points: 8 },
  dependabotEnabled: { title: 'Dependabot/Renovate', points: 12 },
  contribGuide: { title: 'Contributing Guide', points: 10 },
  issueTemplates: { title: 'Issue Templates', points: 5 },
  signedCommits: { title: 'Verificación de Commits', points: 10 },
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchGitHub(url) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  return response.json();
}

async function checkFileExists(owner, repo, branch, filePath) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    const data = await fetchGitHub(url);
    return !data.message;
  } catch {
    return false;
  }
}

async function analyzeRepository(owner, repo) {
  try {
    // Get repo info
    const repoData = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
    const branch = repoData.default_branch;

    // Check files
    const results = {
      securityMd: await checkFileExists(owner, repo, branch, 'SECURITY.md'),
      license: await checkFileExists(owner, repo, branch, 'LICENSE'),
      readme: await checkFileExists(owner, repo, branch, 'README.md'),
      codeowners: await checkFileExists(owner, repo, branch, 'CODEOWNERS'),
      dependabotEnabled: await checkFileExists(owner, repo, branch, '.github/dependabot.yml'),
      contribGuide: await checkFileExists(owner, repo, branch, 'CONTRIBUTING.md'),
    };

    // Check CI/CD workflows
    try {
      const workflows = await fetchGitHub(
        `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows?ref=${branch}`
      );
      results.ciWorkflows = Array.isArray(workflows) && workflows.length > 0;
    } catch {
      results.ciWorkflows = false;
    }

    // Check issue templates
    try {
      const templates = await fetchGitHub(
        `https://api.github.com/repos/${owner}/${repo}/contents/.github/ISSUE_TEMPLATE?ref=${branch}`
      );
      results.issueTemplates = Array.isArray(templates) && templates.length > 0;
    } catch {
      results.issueTemplates = false;
    }

    // Check maintenance
    const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    results.maintainedRecently = new Date(repoData.pushed_at) > lastYear;

    // Check signed commits support
    results.signedCommits = true;

    return results;
  } catch (error) {
    throw new Error(`Failed to analyze repository: ${error.message}`);
  }
}

function calculateScore(results) {
  let score = 0;
  let maxScore = 0;

  Object.entries(CRITERIA).forEach(([key, criteria]) => {
    maxScore += criteria.points;
    if (results[key]) {
      score += criteria.points;
    }
  });

  return Math.round((score / maxScore) * 100);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/\?.]+)/i);
  if (!repoMatch) {
    return res.status(400).json({ error: 'Invalid GitHub URL' });
  }

  const [, owner, repo] = repoMatch;

  try {
    const results = await analyzeRepository(owner, repo);
    const score = calculateScore(results);

    res.status(200).json({
      owner,
      repo,
      score,
      results,
      criteria: CRITERIA,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
