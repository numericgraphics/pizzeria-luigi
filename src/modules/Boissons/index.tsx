import './styles.css'

type Boisson = { label: string; price: string }

export default function Boissons({ items }: { items: Boisson[] }) {
  return (
    <section className="boissons">
      <ul className="boissons__grid">
        {items.map((item) => (
          <li key={item.label} className="boisson-item">
            <span className="boisson-item__label">{item.label}</span>
            <span className="boisson-item__price">{item.price}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
