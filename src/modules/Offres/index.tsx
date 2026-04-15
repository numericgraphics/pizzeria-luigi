import './styles.css'

type Offre = { title: string; description: string }

export default function Offres({ items }: { items: Offre[] }) {
  return (
    <section className="offres">
      {items.map((item) => (
        <div key={item.title} className="offre-item">
          <h3 className="offre-item__title">{item.title}</h3>
          <p className="offre-item__description">{item.description}</p>
        </div>
      ))}
    </section>
  )
}
