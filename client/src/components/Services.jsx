import SectionHead from './SectionHead.jsx';
import Reveal from './Reveal.jsx';
import CardBot from './CardBot.jsx';

export default function Services({ services }) {
  const ask = (title) => {
    const el = document.getElementById('f-msg');
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, `Bonjour, je suis intéressé(e) par le service « ${title} ». Mon projet : `);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => el?.focus({ preventScroll: true }), 700);
  };

  return (
    <section id="services">
      <div className="wrap">
        <SectionHead addr="0x02" title="Services" />
        <div className="services">
          {services.map((s, i) => (
            <Reveal as="article" className={`svc ${s.featured ? 'featured' : ''}`} key={s.code}>
              <CardBot index={i} />
              <div className="svc-top">
                <span className="addr">{s.code}</span>
                {s.featured && <span className="pill">le plus demandé</span>}
              </div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <ul>
                {s.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="svc-foot">
                <div>
                  <div className="price">{s.price}</div>
                  <div className="delay">Délai : {s.delay}</div>
                </div>
                <button className="link-btn" onClick={() => ask(s.title)}>
                  Demander un devis →
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
