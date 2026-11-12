import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error analyzing repository');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Aceptable';
    return 'Necesita mejoras';
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
          </div>

          <div className={styles.criteriaList}>
            {Object.entries(result.criteria).map(([key, criterion]) => (
              <div key={key} className={`${styles.criterion} ${result.results[key] ? styles.passed : styles.failed}`}>
                <div className={styles.criterionIcon}>{result.results[key] ? '✓' : '✗'}</div>
                <div className={styles.criterionContent}>
                  <div className={styles.criterionTitle}>
                    {criterion.title} (+{criterion.points})
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryTitle}>Resumen</div>
            <strong>Evaluación General:</strong> {getScoreLevel(result.score)}
            <br />
            <strong>Puntos alcanzados:</strong> {result.score}/100
            <br />
            Este repositorio cumple con {result.score}% de los criterios de seguridad.
          </div>
        </div>
      )}
    </div>
  );
}
