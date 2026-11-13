import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Matrix.module.css';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/#$%&';
const COLLAPSE_MS = 2600;

function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fontSize = 16;
    let columns = 0;
    let drops = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * (canvas.height / fontSize));
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 1;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.rain} />;
}

export default function Home() {
  const [phase, setPhase] = useState('ask');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (phase !== 'collapsing') return;
    const timer = setTimeout(() => setPhase('gone'), COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

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

  if (phase === 'gone') {
    return <div className={styles.blank} />;
  }

  return (
    <div className={`${styles.stage} ${phase === 'collapsing' ? styles.collapsing : ''}`}>
      <MatrixRain />
      <div className={styles.vignette} />
      {phase === 'collapsing' && <div className={styles.hole} />}

      <main className={styles.content}>
        {(phase === 'ask' || phase === 'collapsing') && (
          <div className={styles.askBox}>
            <p className={styles.question}>¿Quieres revisar un repositorio?</p>
            <div className={styles.pills}>
              <button type="button" className={`${styles.pill} ${styles.bluePill}`} onClick={() => setPhase('input')}>
                Sí
              </button>
              <button type="button" className={`${styles.pill} ${styles.redPill}`} onClick={() => setPhase('collapsing')}>
                No
              </button>
            </div>
          </div>
        )}

        {phase === 'input' && (
          <div className={styles.panel}>
            <h1 className={styles.title}>Check Repo</h1>
            <form onSubmit={handleAnalyze} className={styles.form}>
              <label className={styles.label}>Pega el link del repositorio</label>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className={styles.input}
                  disabled={loading}
                  autoFocus
                />
                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? 'Analizando...' : 'Revisar'}
                </button>
              </div>
            </form>

            {error && <div className={styles.error}>{error}</div>}

            {result && (
              <div className={styles.result}>
                <div className={styles.repoName}>{result.owner}/{result.repo}</div>

                <div className={styles.scoreBlock}>
                  <div className={styles.score}>{result.score}<span>/100</span></div>
                  <div className={styles.riskLabel}>Riesgo {result.level}</div>
                </div>

                <div className={styles.criteriaList}>
                  {result.breakdown.map((item) => (
                    <div key={item.key} className={`${styles.criterion} ${item.passed ? styles.passed : styles.failed}`}>
                      <div className={styles.criterionTitle}>
                        {item.passed ? '[OK]' : '[FALLA]'} {item.title} ({item.earned}/{item.points})
                      </div>
                      <div className={styles.detail}>{item.detail}</div>
                      {!item.passed && (
                        <>
                          <div className={styles.risk}><strong>Riesgo:</strong> {item.risk}</div>
                          <div className={styles.precaution}><strong>Precaución:</strong> {item.precaution}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <button type="button" className={styles.copyButton} onClick={handleCopy}>
                  {copied ? 'Reporte copiado' : 'Copiar reporte'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
