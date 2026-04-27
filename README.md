# NovaTravel

Sitio oficial de la agencia migratoria NovaTravel.

## Requisitos

- Node.js 20 o superior
- npm (o pnpm / yarn)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

Para usar otro puerto:

```bash
PORT=8080 npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

Los archivos estáticos quedan en `dist/`.

## Configuración de WhatsApp

Los números rotativos de atención al cliente están en `src/lib/whatsapp.ts`.
Cada vez que un cliente califica en el quiz, se le asigna uno de los números
de forma aleatoria para distribuir la atención entre los asesores.

## Estructura

```
src/
├── App.tsx                     # Componente raíz, navbar, hero, secciones, modales
├── main.tsx                    # Punto de entrada
├── index.css                   # Variables de tema (claro/oscuro), Tailwind v4
├── components/
│   ├── sections/Quiz.tsx       # Quiz de calificación con scoring (≥5/9 = calificado)
│   └── ui/                     # Componentes shadcn/ui
├── data/destinations.ts        # 17 destinos con categoría, precio, requisitos
├── hooks/
│   ├── useModalHistory.ts      # Botón atrás del celular cierra modales
│   └── useTheme.ts             # Toggle modo claro / modo oscuro
├── lib/
│   ├── utils.ts                # cn() helper
│   └── whatsapp.ts             # Selección aleatoria de número de WhatsApp
└── assets/hero.png             # Imagen del hero
```
