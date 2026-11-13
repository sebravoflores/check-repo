import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error analyzing repository');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildReportText = (data) => {
    const lines = [
      `Reporte de seguridad: ${data.owner}/${data.repo}`,
      `Puntuación: ${data.score}/100 (riesgo ${data.level})`,
      '',
    ];
    data.breakdown.forEach((item) => {
      lines.push(`${item.passed ? '[OK]' : '[FALLA]'} ${item.title} (${item.earned}/${item.points})`);
      lines.push(`  Detalle: ${item.detail}`);
      if (!item.passed) {
        lines.push(`  Riesgo: ${item.risk}`);
        lines.push(`  Precaución: ${item.precaution}`);
      }
    });
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(result));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Check Repo</h1>
        <p className={styles.subtitle}>Security Scanner for GitHub Repositories</p>
      </div>

      <form onSubmit={handleAnalyze} className={styles.form}>
        <label className={styles.label}>Repository URL</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/nvidia/skillspector"
            className={styles.input}
            disabled={loading}
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Analizando...' : 'Revisar'}
          </button>
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Analizando repositorio...</p>
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <div className={styles.repoInfo}>
            <div className={styles.repoName}>📦 {result.owner}/{result.repo}</div>
            <div className={styles.repoUrl}>{url}</div>
          </div>

          <div className={styles.scoreContainer}>
            <div className={styles.scoreLabel}>Puntuación de Seguridad</div>
            <div
              className={styles.scoreCircle}
              style={{ '--score-percent': `${(result.score / 100) * 360}deg` }}
            >
              <div className={styles.scoreText}>{result.score}</div>
            </div>
            <div className={styles.riskLabel}>Riesgo {result.level}</div>
          </div>

          <div className={styles.criteriaList}>
            {result.breakdown.map((item) => (
              <div key={item.key} className={`${styles.criterion} ${item.passed ? styles.passed : styles.failed}`}>
                <div className={styles.criterionIcon}>{item.passed ? '✓' : '✗'}</div>
                <div className={styles.criterionContent}>
                  <div className={styles.criterionTitle}>
                    {item.title} ({item.earned}/{item.points})
                  </div>
                  <div className={styles.detail}>{item.detail}</div>
                  {!item.passed && (
                    <>
                      <div className={styles.risk}><strong>Riesgo:</strong> {item.risk}</div>
                      <div className={styles.precaution}><strong>Precaución:</strong> {item.precaution}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={`${styles.button} ${styles.copyButton}`} onClick={handleCopy}>
            {copied ? 'Reporte copiado' : 'Copiar reporte'}
          </button>
        </div>
      )}
    </div>
  );
}
