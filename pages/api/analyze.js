const CRITERIA = {
  securityMd: {
    title: 'SECURITY.md',
    points: 10,
    risk: 'Sin política de seguridad no hay un canal claro para reportar vulnerabilidades; los hallazgos suelen quedar públicos o sin atender.',
    precaution: 'Antes de usarlo, revisa si hay issues abiertos sobre seguridad y evita exponer credenciales o datos sensibles en el repo.',
  },
  license: {
    title: 'License',
    points: 10,
    risk: 'Sin licencia no tienes permiso legal explícito para usar, modificar ni redistribuir el código.',
    precaution: 'No lo integres en producción hasta confirmar con el autor qué licencia aplica.',
  },
  readme: {
    title: 'README.md',
    points: 10,
    risk: 'Sin documentación es difícil saber qué hace el código, qué permisos pide y cómo instalarlo de forma segura.',
    precaution: 'Lee el código de instalación y los scripts antes de ejecutarlos; no confíes en instrucciones que no estén documentadas.',
  },
  maintainedRecently: {
    title: 'Mantenimiento Activo',
    points: 15,
    risk: 'Un proyecto sin cambios recientes no recibe parches de seguridad y sus dependencias pueden tener vulnerabilidades conocidas.',
    precaution: 'Revisa la fecha del último commit y las dependencias antes de instalar; considera alternativas mantenidas si el repo está abandonado.',
  },
  ciWorkflows: {
    title: 'CI/CD Workflows',
    points: 10,
    risk: 'Sin CI no hay pruebas ni análisis automáticos que detecten errores o dependencias vulnerables en cada cambio.',
    precaution: 'Ejecuta el proyecto en un entorno aislado (contenedor o máquina de prueba) y revisa los scripts de build.',
  },
  codeowners: {
    title: 'CODEOWNERS',
    points: 8,
    risk: 'Sin responsables definidos, cualquier cambio puede entrar sin revisión de quien conoce el código sensible.',
    precaution: 'Revisa el historial de commits de los archivos críticos y quién los aprueba.',
  },
  dependabotEnabled: {
    title: 'Dependabot/Renovate',
    points: 12,
    risk: 'Sin actualizaciones automáticas las dependencias quedan desactualizadas y acumulan vulnerabilidades conocidas.',
    precaution: 'Ejecuta una auditoría de dependencias (npm audit, pip-audit o equivalente) antes de instalar.',
  },
  contribGuide: {
    title: 'Contributing Guide',
    points: 10,
    risk: 'Sin guía de contribución no hay proceso definido para revisar cambios, lo que facilita que entre código no auditado.',
    precaution: 'Revisa los pull requests recientes para ver si los cambios pasan por revisión.',
  },
  issueTemplates: {
    title: 'Issue Templates',
    points: 5,
    risk: 'Sin plantillas es menos probable que los reportes de bugs o seguridad lleguen con la información necesaria.',
    precaution: 'Busca si hay issues de seguridad sin resolver antes de adoptar el proyecto.',
  },
  signedCommits: {
    title: 'Verificación de Commits',
    points: 10,
    risk: 'Sin commits firmados no puedes verificar que cada cambio viene de quien dice ser; un atacante con acceso podría insertar código malicioso.',
    precaution: 'Fija una versión concreta (tag o commit hash) en vez de la rama principal, y revisa el diff antes de actualizar.',
  },
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

async function checkSignedCommits(owner, repo, branch) {
  const commits = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=30`
  );
  const total = commits.length;
  const verified = commits.filter((c) => c.commit?.verification?.verified).length;
  return { passed: total > 0 && verified / total >= 0.5, verified, total };
}

async function analyzeRepository(owner, repo) {
  const repoData = await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
  const branch = repoData.default_branch;

  const results = {
    securityMd: await checkFileExists(owner, repo, branch, 'SECURITY.md'),
    license: await checkFileExists(owner, repo, branch, 'LICENSE'),
    readme: await checkFileExists(owner, repo, branch, 'README.md'),
    codeowners: await checkFileExists(owner, repo, branch, 'CODEOWNERS'),
    dependabotEnabled: await checkFileExists(owner, repo, branch, '.github/dependabot.yml'),
    contribGuide: await checkFileExists(owner, repo, branch, 'CONTRIBUTING.md'),
  };

  try {
    const workflows = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows?ref=${branch}`
    );
    results.ciWorkflows = Array.isArray(workflows) && workflows.length > 0;
  } catch {
    results.ciWorkflows = false;
  }

  try {
    const templates = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/contents/.github/ISSUE_TEMPLATE?ref=${branch}`
    );
    results.issueTemplates = Array.isArray(templates) && templates.length > 0;
  } catch {
    results.issueTemplates = false;
  }

  const lastYear = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  results.maintainedRecently = new Date(repoData.pushed_at) > lastYear;

  let signed = { passed: false, verified: 0, total: 0 };
  try {
    signed = await checkSignedCommits(owner, repo, branch);
  } catch {
    signed = { passed: false, verified: 0, total: 0 };
  }
  results.signedCommits = signed.passed;

  const details = {
    securityMd: results.securityMd ? 'Archivo SECURITY.md encontrado.' : 'No existe SECURITY.md en la rama principal.',
    license: results.license ? 'Archivo LICENSE encontrado.' : 'No existe archivo LICENSE.',
    readme: results.readme ? 'README.md encontrado.' : 'No existe README.md.',
    maintainedRecently: results.maintainedRecently
      ? `Último push: ${repoData.pushed_at.slice(0, 10)}.`
      : `Último push: ${repoData.pushed_at.slice(0, 10)} (hace más de un año).`,
    ciWorkflows: results.ciWorkflows ? 'Hay workflows en .github/workflows.' : 'No hay workflows en .github/workflows.',
    codeowners: results.codeowners ? 'Archivo CODEOWNERS encontrado.' : 'No existe CODEOWNERS.',
    dependabotEnabled: results.dependabotEnabled
      ? 'Configuración de Dependabot encontrada.'
      : 'No hay .github/dependabot.yml (no se detecta Renovate).',
    contribGuide: results.contribGuide ? 'CONTRIBUTING.md encontrado.' : 'No existe CONTRIBUTING.md.',
    issueTemplates: results.issueTemplates ? 'Hay plantillas de issues.' : 'No hay plantillas en .github/ISSUE_TEMPLATE.',
    signedCommits: signed.total > 0
      ? `${signed.verified} de ${signed.total} commits recientes están firmados y verificados.`
      : 'No se pudieron leer commits recientes para verificar firmas.',
  };

  return { results, details };
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

function riskLevel(score) {
  if (score >= 80) return 'Bajo';
  if (score >= 60) return 'Medio';
  if (score >= 40) return 'Alto';
  return 'Crítico';
}

function buildBreakdown(results, details) {
  return Object.entries(CRITERIA).map(([key, criteria]) => {
    const passed = Boolean(results[key]);
    return {
      key,
      title: criteria.title,
      points: criteria.points,
      earned: passed ? criteria.points : 0,
      passed,
      detail: details[key],
      risk: passed ? null : criteria.risk,
      precaution: passed ? null : criteria.precaution,
    };
  });
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
    const { results, details } = await analyzeRepository(owner, repo);
    const score = calculateScore(results);
    const breakdown = buildBreakdown(results, details);

    res.status(200).json({
      owner,
      repo,
      score,
      level: riskLevel(score),
      breakdown,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
