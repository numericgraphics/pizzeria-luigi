import menu from '@/data/menu.json'
import './styles.css'

export default function Menu() {
  return (
    <div className="menu">
      {menu.categories.map((category) => (
        <section key={category.id} className="category">
          <div className="category__header">
            <h2 className="category__title">{category.name}</h2>
            <div className="category__divider" aria-hidden="true" />
          </div>
          <div className="pizza-grid">
            {category.pizzas.map((pizza) => (
              <article
                key={pizza.name}
                className={`pizza-card${pizza.name === 'Luigi' ? ' pizza-card--signature' : ''}`}
              >
                <div className="pizza-card__header">
                  <h3 className="pizza-card__name">{pizza.name}</h3>
                  <span className="pizza-card__price">{pizza.price} €</span>
                </div>
                <p className="pizza-card__ingredients">{pizza.ingredients}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <aside className="menu-notes">
        <h3 className="menu-notes__title">Informations</h3>
        <ul className="menu-notes__list">
          {menu.notes.map((note, i) => (
            <li key={i} className="menu-notes__item">{note}</li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
