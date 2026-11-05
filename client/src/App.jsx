import { useCallback, useEffect, useMemo, useState } from 'react';
import Boot from './components/Boot.jsx';
import Cursor from './components/Cursor.jsx';
import Nav, { SECTIONS } from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import Process from './components/Process.jsx';
import Skills from './components/Skills.jsx';
import Projects from './components/Projects.jsx';
import Journey from './components/Journey.jsx';
import GitHub from './components/GitHub.jsx';
import Testimonials from './components/Testimonials.jsx';
import Terminal from './components/Terminal.jsx';
import Faq from './components/Faq.jsx';
import Contact from './components/Contact.jsx';
import CV from './components/CV.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { reducedMotion } from './hooks/motion.js';
import { getProfile } from './api.js';
import { useTheme } from './hooks/theme.js';

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });

export default function App() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);
  const [booted, setBooted] = useState(reducedMotion());
  const [cvOpen, setCvOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const openCV = useCallback(() => setCvOpen(true), []);
  const closeCV = useCallback(() => setCvOpen(false), []);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (profile) document.title = `${profile.name} · ${profile.roles[0]}`;
  }, [profile]);

  const actions = useMemo(() => {
    if (!profile) return [];
    const extra = [['process', 'méthode'], ['skills', 'compétences'], ['avis', 'avis clients'], ['terminal', 'terminal'], ['faq', 'questions fréquentes']];
    return [
      // retour en haut de page (indispensable sur téléphone, où le menu remplace les liens)
      { group: 'Aller à', label: 'Accueil', hint: '↑', run: () => go('top') },
      ...[...SECTIONS, ...extra].map(([id, label]) => ({ group: 'Aller à', label: label[0].toUpperCase() + label.slice(1), run: () => go(id) })),
      { group: 'Actions', label: 'Ouvrir mon CV', hint: 'cv', run: openCV },
      { group: 'Actions', label: theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair', hint: theme === 'light' ? '☾' : '☀', run: toggleTheme },
      { group: 'Actions', label: "Copier l'adresse email", run: () => navigator.clipboard?.writeText(profile.contact.email).catch(() => {}) },
      { group: 'Actions', label: 'Demander un devis', run: () => go('contact') },
      { group: 'Liens', label: 'GitHub', hint: '↗', run: () => window.open(profile.contact.github, '_blank', 'noopener') },
      { group: 'Liens', label: 'LinkedIn', hint: '↗', run: () => window.open(profile.contact.linkedin, '_blank', 'noopener') },
    ];
  }, [profile, openCV, theme, toggleTheme]);

  if (error) {
    return (
      <div className="fatal">
        <p className="addr">ERR_CONNECTION_REFUSED</p>
        <h2>Le serveur API ne répond pas</h2>
        <p>
          Lance le back-end avec <code>npm run dev</code> à la racine du projet, puis recharge la page.
        </p>
      </div>
    );
  }

  return (
    <>
      {!booted && <Boot ready={!!profile} onDone={() => setBooted(true)} />}
      <Cursor />
      {profile && (
        <>
          <Nav profile={profile} onPalette={() => setPalette(true)} onOpenCV={openCV} theme={theme} toggleTheme={toggleTheme} />
          <Hero profile={profile} started={booted} onOpenCV={openCV} />
          <Marquee items={profile.marquee} />
          <main>
            <About profile={profile} onOpenCV={openCV} />
            <Services services={profile.services} />
            <Process steps={profile.process} />
            <Skills profile={profile} />
            <Projects projects={profile.projects} />
            <Journey profile={profile} />
            <GitHub github={profile.github} />
            <Testimonials items={profile.testimonials} />
            <Terminal profile={profile} onOpenCV={openCV} />
            <Faq items={profile.faq} />
            <Contact contact={profile.contact} availability={profile.availability} />
          </main>
          <footer>
            <div className="wrap">
              <span>
                © {new Date().getFullYear()} {profile.name} · Fait à la main, sans template
              </span>
              <span>
                React · Three.js · Node.js — <button className="link-btn" onClick={() => setPalette(true)}>Ctrl K</button>
              </span>
            </div>
          </footer>
          <CV open={cvOpen} onClose={closeCV} profile={profile} />
          <CommandPalette open={palette} setOpen={setPalette} actions={actions} />
        </>
      )}
    </>
  );
}
