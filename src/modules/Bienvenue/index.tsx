import './styles.css'

export default function Bienvenue({ text }: { text: string }) {
  return (
    <section className="bienvenue">
      <p className="bienvenue__text">{text}</p>
    </section>
  )
}
