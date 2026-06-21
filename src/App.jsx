import { useEffect, useState } from 'react'
import config from './projects.json'
import './App.css'

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  'C++': '#f34b7d',
  C: '#555555',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
}

function describe(repo) {
  return config.descriptions[repo.name] || repo.description || ''
}

// Fallback project list built from the curated JSON, used if the
// GitHub API is unreachable or rate-limited.
function fallbackProjects() {
  return Object.entries(config.descriptions).map(([name, description]) => ({
    name,
    description,
    html_url: `https://github.com/${config.githubUsername}/${name}`,
    language: null,
    stargazers_count: 0,
  }))
}

function ProjectCard({ repo }) {
  const description = describe(repo)
  return (
    <a className="card" href={repo.html_url} target="_blank" rel="noreferrer">
      <h3>{repo.name}</h3>
      {description && <p>{description}</p>}
      <div className="card-meta">
        {repo.language && (
          <span className="lang">
            <span
              className="lang-dot"
              style={{ background: LANGUAGE_COLORS[repo.language] || '#888' }}
            />
            {repo.language}
          </span>
        )}
        {repo.stargazers_count > 0 && (
          <span className="stars">★ {repo.stargazers_count}</span>
        )}
      </div>
    </a>
  )
}

function App() {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const url = `https://api.github.com/users/${config.githubUsername}/repos?per_page=100&sort=updated`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API: ${res.status}`)
        return res.json()
      })
      .then((repos) => {
        const exclude = new Set(config.exclude)
        const filtered = repos
          .filter((r) => !r.fork && !exclude.has(r.name))
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
        setProjects(filtered)
      })
      .catch(() => {
        setError(true)
        setProjects(fallbackProjects())
      })
  }, [])

  return (
    <main>
      <header className="hero">
        <h1>{config.name}</h1>
        <p className="tagline">{config.tagline}</p>
        <p className="bio">{config.bio}</p>
        <div className="hero-links">
          <a href={config.links.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`mailto:${config.links.email}`}>Email</a>
        </div>
      </header>

      <section className="projects">
        <h2>Projects</h2>
        {error && (
          <p className="notice">
            Couldn&apos;t reach the GitHub API right now — showing a saved list.
          </p>
        )}
        {projects === null ? (
          <p className="notice">Loading projects…</p>
        ) : (
          <div className="grid">
            {projects.map((repo) => (
              <ProjectCard key={repo.name} repo={repo} />
            ))}
          </div>
        )}
      </section>

      <footer>
        <p>
          Built with React + Vite ·{' '}
          <a href={config.links.github} target="_blank" rel="noreferrer">
            @{config.githubUsername}
          </a>
        </p>
      </footer>
    </main>
  )
}

export default App
