import './styles.css'

type Supplement = { label: string; price: string }

export default function Supplements({ items }: { items: Supplement[] }) {
  return (
    <section className="supplements">
      <ul className="supplements__list">
        {items.map((item) => (
          <li key={item.label} className="supplement-item">
            <span className="supplement-item__label">{item.label}</span>
            <span className="supplement-item__price">{item.price}</span>
          </li>
        ))}
      </ul>
      <p className="supplements__note">
        Toutes nos pizzas peuvent être base crème ou base tomate · Fromage de base&nbsp;: Mozzarella Fior di Latte
      </p>
    </section>
  )
}
