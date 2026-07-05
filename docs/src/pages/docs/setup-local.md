---
title: "Setup Local y Entorno de Desarrollo"
description: "Guía paso a paso para clonar, configurar y ejecutar Eventia en tu máquina local."
layout: "../../layouts/DocLayout.astro"
---

Esta guía está diseñada para desarrolladores que desean contribuir al código base de Eventia. El proyecto  utiliza **Next.js 16**, **Drizzle ORM** y **PostgreSQL**. Sigue estos pasos para tener un entorno funcional en minutos.

---

## 1. Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas en tu sistema operativo:
* **Node.js** (v18.17.0 o superior).
* **npm** (v9 o superior).
* Una instancia local de **PostgreSQL** o una base de datos en la nube (como Neon, Supabase o Vercel Postgres).
* Una cuenta en **Pusher** (para WebSockets).
* Una cuenta en **Uploadthing** (para manejo de imágenes).

## 2. Clonación e Instalación

Clona el repositorio desde la rama principal (`developer` si estás desarrollando nuevas características) e instala las dependencias.

```bash
git clone https://github.com/LincolEulogio/SistemaEventsFIN.git
cd SistemaEventsFIN
npm install
```

## 3. Configuración de Variables de Entorno

En la raíz del proyecto, copia el archivo de ejemplo para crear tu propio archivo `.env` o `.env.local`:

```bash
cp .env.example .env.local
```

### Variables Obligatorias

Abre tu archivo `.env.local` e introduce las credenciales necesarias. El sistema no arrancará si faltan estas claves:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/Eventia"

# Autenticación (better-auth)
BETTER_AUTH_SECRET="un-string-largo-generado-aleatoriamente"
BETTER_AUTH_URL="http://localhost:3000"

# Pusher (WebSockets para notificaciones)
NEXT_PUBLIC_PUSHER_APP_KEY="tu-app-key"
PUSHER_APP_ID="tu-app-id"
PUSHER_SECRET="tu-secret"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"

# Uploadthing (Carga de archivos)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="tu-app-id"
```

> [!CAUTION]
> Nunca subas el archivo `.env.local` o `.env` al repositorio público. El archivo `.gitignore` ya está configurado para evitarlo.

## 4. Inicialización de la Base de Datos

Eventia usa **Drizzle ORM**. Antes de arrancar la app, necesitas empujar el esquema a tu base de datos vacía y sembrarla con los roles iniciales.

```bash
# Sincroniza el esquema con tu base de datos Postgres
npm run db:push

# Ejecuta los scripts de sembrado (Roles y Categorías)
npm run db:seed:all
```

## 5. Levantar el Entorno Local

Con la base de datos lista y el `.env` configurado, puedes iniciar el servidor de desarrollo de Next.js:

```bash
npm run dev
```

La aplicación principal estará disponible en `http://localhost:3000`. 
Si deseas modificar la documentación (Astro), debes abrir una segunda terminal, ingresar a la carpeta `docs` y ejecutar el mismo comando.

```bash
cd docs
npm run dev
```

La documentación estará corriendo en `http://localhost:4321`.

---

## Solución de Problemas Comunes

- **Error de Drizzle "relation does not exist":** Significa que no has corrido `npm run db:push`. Asegúrate de que tu `DATABASE_URL` sea correcta.
- **Error en Uploadthing al subir una imagen:** Si trabajas en `localhost`, asegúrate de que tu red permita las llamadas salientes a la API de Uploadthing.
- **No llegan las notificaciones en tiempo real:** Revisa que el Cluster de Pusher en tu `.env` (`NEXT_PUBLIC_PUSHER_CLUSTER`) coincida exactamente con el dashboard de Pusher.
