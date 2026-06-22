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

// Candidate locations for a per-repo thumbnail, in priority order. The repo
// owner drops a `thumbnail.<ext>` (optionally inside a `thumbnail/` folder)
// into each project; we try each until one loads.
function thumbnailCandidates(repo) {
  const branch = repo.default_branch || 'main'
  const base = `https://raw.githubusercontent.com/${config.githubUsername}/${repo.name}/${branch}`
  const paths = [
    'thumbnail.png',
    'thumbnail.jpg',
    'thumbnail.jpeg',
    'thumbnail/thumbnail.png',
    'thumbnail/thumbnail.jpg',
    'thumbnail/thumbnail.jpeg',
  ]
  return paths.map((p) => `${base}/${p}`)
}

function Thumbnail({ repo }) {
  const candidates = thumbnailCandidates(repo)
  const [index, setIndex] = useState(0)

  if (index >= candidates.length) return null

  return (
    <div className="card-thumb">
      <img
        src={candidates[index]}
        alt={`${repo.name} thumbnail`}
        loading="lazy"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  )
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
    default_branch: 'main',
  }))
}

function ProjectCard({ repo }) {
  const description = describe(repo)
  return (
    <a className="card" href={repo.html_url} target="_blank" rel="noreferrer">
      <Thumbnail repo={repo} />
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

// Minimal hash-based router. Hash routing avoids the GitHub Pages
// client-routing 404 problem (no server rewrite needed) — links like
// `#/projects` resolve entirely in the browser.
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#/, '') || '/'
}

function Nav({ route }) {
  return (
    <nav className="nav">
      <a className={route === '/' ? 'active' : ''} href="#/">
        Home
      </a>
      <a className={route === '/projects' ? 'active' : ''} href="#/projects">
        Projects
      </a>
    </nav>
  )
}

function HomePage() {
  return (
    <section className="placeholder">
      <h1>{config.name}</h1>
      <p className="tagline">{config.tagline}</p>
      <p className="bio">Coming soon.</p>
      <div className="hero-links">
        <a href="#/projects">View projects</a>
      </div>
    </section>
  )
}

function ProjectsPage() {
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
  )
}

function App() {
  const route = useHashRoute()

  return (
    <main>
      <Nav route={route} />

      {route === '/projects' ? <ProjectsPage /> : <HomePage />}

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
