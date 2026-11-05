import { useEffect, useMemo, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import Reveal from './Reveal.jsx';
import { getGithub } from '../api.js';

const LANG_COLORS = { JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Shell: '#89e051', PHP: '#4F5D95', Java: '#b07219', Go: '#00ADD8', HTML: '#e34c26', CSS: '#563d7c', Dart: '#00B4AB' };
const WEEKS = 18;

/** Grille d'activité façon GitHub sur les 18 dernières semaines. */
function Heatmap({ activity }) {
  const { cols, total, best } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7 - 1) - today.getDay());
    const cols = [];
    let total = 0, best = 0;
    for (let w = 0; w < WEEKS + 1; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + d);
        if (day > today) {
          col.push(null);
          continue;
        }
        const key = day.toISOString().slice(0, 10);
        const n = activity[key] || 0;
        total += n;
        best = Math.max(best, n);
        col.push({ key, n });
      }
      cols.push(col);
    }
    return { cols, total, best };
  }, [activity]);

  const level = (n) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / Math.max(best, 1)) * 4)));

  return (
    <div className="heat-wrap">
      <div className="heat" role="img" aria-label={`${total} contributions sur les ${WEEKS} dernières semaines`}>
        {cols.map((col, i) => (
          <div className="heat-col" key={i}>
            {col.map((c, j) =>
              c ? <i key={j} className={`l${level(c.n)}`} title={`${c.n} contribution(s) le ${new Date(c.key).toLocaleDateString('fr-FR')}`} /> : <i key={j} className="empty" />
            )}
          </div>
        ))}
      </div>
      <div className="heat-foot">
        <span>
          <b>{total}</b> contributions · {WEEKS} dernières semaines
        </span>
        <span className="legend">
          moins <i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> plus
        </span>
      </div>
    </div>
  );
}

/** Agrège les langages : dépôts GitHub publics réels + dépôts déclarés dans profile.json. */
function countLanguages(real, declared) {
  const out = { ...(real?.languages || {}) };
  declared.forEach((r) => r.language && (out[r.language] = (out[r.language] || 0) + 1));
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
}

function RepoCard({ r }) {
  const meta = (
    <div className="repo-meta">
      {r.language && (
        <span>
          <i style={{ background: LANG_COLORS[r.language] || 'var(--muted)' }} />
          {r.language}
        </span>
      )}
      {r.platform && <span className="repo-plat">{r.platform}</span>}
      {r.visibility ? <span>{r.visibility}{r.org ? ` · ${r.org}` : ''}</span> : <><span>★ {r.stars}</span><span>⑂ {r.forks}</span></>}
    </div>
  );
  const inner = (
    <>
      <div className="repo-name">▸ {r.name}</div>
      <p>{r.description || 'Pas de description.'}</p>
      {meta}
    </>
  );
  return r.url ? (
    <a className="repo" href={r.url} target="_blank" rel="noopener noreferrer">{inner}</a>
  ) : (
    <div className="repo">{inner}</div>
  );
}

export default function GitHub({ github = {} }) {
  const { username, repos: declared = [] } = github;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getGithub(username).then(setData).catch((e) => setError(e.message));
  }, [username]);

  // un dépôt déclaré qui existe aussi en public sur GitHub n'est affiché qu'une fois
  const realNames = new Set((data?.repos || []).map((r) => r.name));
  const extra = declared.filter((r) => !realNames.has(r.name));
  const repos = [...(data?.repos || []).map((r) => ({ ...r, platform: 'GitHub' })), ...extra];
  const langs = countLanguages(data, extra);
  const langTotal = langs.reduce((s, [, n]) => s + n, 0);
  const platforms = repos.reduce((acc, r) => ((acc[r.platform || 'Git'] = (acc[r.platform || 'Git'] || 0) + 1), acc), {});
  const privateCount = extra.filter((r) => r.visibility === 'privé').length;

  return (
    <section id="github">
      <div className="wrap">
        <SectionHead addr="0x07" title="Activité Git" />
        {error && <p className="err">{error}</p>}
        {privateCount > 0 && (
          <p className="note">
            Mes projets professionnels vivent dans des dépôts privés (GitHub chez SAID, GitLab chez EBURTIS) : le code n'est pas public, seul leur contenu est décrit ici.
          </p>
        )}
        <div className="gh-top">
          <Reveal className="gh-panel">
            {data ? (
              <>
                <div className="gh-head">
                  <a href={data.url} target="_blank" rel="noopener noreferrer">@{data.user} ↗</a>
                  <span>{data.publicRepos} dépôts · {data.stars} ★ · {data.followers} abonnés</span>
                </div>
                <Heatmap activity={data.activity} />
              </>
            ) : (
              <>
                <h3 className="mini-h">Plateformes</h3>
                <ul className="lang-list">
                  {Object.entries(platforms).map(([pl, n]) => (
                    <li key={pl}>
                      <i style={{ background: 'var(--accent)' }} />
                      {pl}
                      <span>{n} dépôt{n > 1 ? 's' : ''}</span>
                    </li>
                  ))}
                </ul>
                <p className="muted mono gh-sub">
                  {repos.length} dépôts · dont {privateCount} privés · workflow Git : branches, merge requests, CI/CD
                </p>
              </>
            )}
          </Reveal>
          <Reveal className="gh-panel">
            <h3 className="mini-h">Langages</h3>
            <div className="lang-bar">
              {langs.map(([l, n]) => (
                <i key={l} style={{ width: `${(n / langTotal) * 100}%`, background: LANG_COLORS[l] || 'var(--muted)' }} />
              ))}
            </div>
            <ul className="lang-list">
              {langs.slice(0, 6).map(([l, n]) => (
                <li key={l}>
                  <i style={{ background: LANG_COLORS[l] || 'var(--muted)' }} />
                  {l}
                  <span>{Math.round((n / langTotal) * 100)} %</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="repos">
          {repos.map((r) => (
            <RepoCard key={r.platform + r.name} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}
