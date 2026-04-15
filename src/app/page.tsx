import pageData from '@/data/page.json'
import Bienvenue from '@/modules/Bienvenue'
import Menu from '@/modules/Menu'
import Supplements from '@/modules/Supplements'
import Boissons from '@/modules/Boissons'
import Offres from '@/modules/Offres'
import '@/css/page.css'

export default function Home() {
  return (
    <div className="page">

      {/* Bienvenue */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Bienvenue</h2>
        </div>
        <Bienvenue text={pageData.bienvenue.text} />
      </div>

      {/* Nos Pizzas */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Nos Pizzas</h2>
        </div>
        <Menu categories={pageData.pizzas.categories} />
      </div>

      {/* Les Suppléments */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Les Suppléments</h2>
        </div>
        <Supplements items={pageData.supplements} />
      </div>

      {/* Boissons */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Boissons</h2>
        </div>
        <Boissons items={pageData.boissons} />
      </div>

      {/* Nos Offres */}
      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Nos Offres</h2>
        </div>
        <Offres items={pageData.offres} />
      </div>

    </div>
  )
}
