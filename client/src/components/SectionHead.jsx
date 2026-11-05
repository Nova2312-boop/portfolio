import Reveal from './Reveal.jsx';
import Scramble from './Scramble.jsx';

export default function SectionHead({ addr, title }) {
  return (
    <Reveal className="sec-head">
      <span className="addr">{addr}</span>
      <Scramble as="h2" text={title} />
    </Reveal>
  );
}
