# Finca App

Aplicación móvil offline para administrar ganado desde el campo. Organiza animales por finca y hierro y conserva su historial productivo y sanitario.

## Funciones actuales

- Inventario y búsqueda por número.
- Nombres, raza, hierro y fotografía opcionales.
- Registro de crías y relación con la madre.
- Vacunas, enfermedades, tratamientos y evoluciones.
- Compras, ventas y animales fallecidos.
- Persistencia local con SQLite y cola de sincronización.

## Desarrollo

Requiere Node.js 20.19 o superior.

```bash
npm install
npx expo start
```

Validaciones:

```bash
npm run lint
npx tsc --noEmit
```

El proyecto utiliza Expo SDK 54, Expo Router y React Native.
