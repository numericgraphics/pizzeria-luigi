import './styles.css'

type Pizza = { name: string; ingredients: string; price: number }
type Category = { id: string; name: string; pizzas: Pizza[] }

type MenuProps = {
  categories: Category[]
}

export default function Menu({ categories }: MenuProps) {
  return (
    <div className="menu">
      {categories.map((category) => (
        <section key={category.id} className="category">
          <div className="category__header">
            <h3 className="category__title">{category.name}</h3>
            <div className="category__divider" aria-hidden="true" />
          </div>
          <div className="pizza-grid">
            {category.pizzas.map((pizza) => (
              <article
                key={pizza.name}
                className={`pizza-card${pizza.name === 'Luigi' ? ' pizza-card--signature' : ''}`}
              >
                <div className="pizza-card__header">
                  <h4 className="pizza-card__name">{pizza.name}</h4>
                  <span className="pizza-card__price">{pizza.price} €</span>
                </div>
                <p className="pizza-card__ingredients">{pizza.ingredients}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

    </div>
  )
}
