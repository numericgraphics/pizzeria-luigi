import type { Metadata } from 'next'
import '../css/globals.css'
import '../css/layout.css'
import HeaderShader from '@/modules/HeaderShader'

export const metadata: Metadata = {
  title: "La Pizz' de Luigi",
  description: "Carte des pizzas – La Pizz' de Luigi, Le Beausset",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <div className="layout">
          <header className="header">
            <HeaderShader />
            <img
              src="/logo.svg"
              alt="La Pizz' de Luigi"
              className="header__logo"
              width={200}
              height={255}
            />
            <p className="header__phone">07 61 20 04 69</p>
          </header>
          <main className="main">
            {children}
          </main>
          <footer className="footer">
            La pizz&apos; de Luigi – Carrefour Market – Rond-point Georges Pompidou – 83330 LE BEAUSSET
          </footer>
        </div>
      </body>
    </html>
  )
}
