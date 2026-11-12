# Check Repo - Security Scanner

Un escáner de seguridad minimalista para repositorios de GitHub basado en criterios de NVIDIA.

## Características

- ✅ Análisis de seguridad automático de repositorios
- 📊 Puntuación de 1-100 basada en criterios de seguridad
- 🎨 Interfaz minimalista y moderna
- ⚡ Powered by Next.js y GitHub API
- 🔐 Soporta token de GitHub para límites más altos

## Criterios Evaluados

- **SECURITY.md** (10 pts) - Política de divulgación responsable
- **LICENSE** (10 pts) - Licencia clara y documentada
- **README.md** (10 pts) - Documentación del proyecto
- **Mantenimiento Activo** (15 pts) - Commits recientes (último año)
- **CI/CD Workflows** (10 pts) - Automatización de pruebas
- **CODEOWNERS** (8 pts) - Gestión clara de responsables
- **Dependabot/Renovate** (12 pts) - Automatización de dependencias
- **Contributing Guide** (10 pts) - Guía para contribuidores
- **Issue Templates** (5 pts) - Templates de seguridad
- **Verificación de Commits** (10 pts) - Soporte para commits firmados

## Instalación Local

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev

# Abrir http://localhost:3000
```

## Variables de Entorno

Crea un archivo `.env.local`:

```env
GITHUB_TOKEN=tu_token_github_aqui
```

Para obtener un token: https://github.com/settings/tokens
- Necesita scope: `public_repo`

## Deploy en Vercel

1. **Inicializar Git:**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Crear repo en GitHub:**
   - Ve a https://github.com/new
   - Crea un nuevo repositorio
   - Copia los comandos para pushear

3. **Push a GitHub:**
```bash
git remote add origin https://github.com/tu_usuario/check-repo.git
git branch -M main
git push -u origin main
```

4. **Deploy en Vercel:**
   - Ve a https://vercel.com
   - Click en "New Project"
   - Selecciona tu repo
   - En "Environment Variables", agrega:
     - `GITHUB_TOKEN` = tu token
   - Click "Deploy"

5. **Listo!** Tu app estará en `https://tu-proyecto.vercel.app`

## Estructura del Proyecto

```
.
├── pages/
│   ├── api/
│   │   └── analyze.js      # API endpoint para análisis
│   ├── _document.js        # Documento HTML personalizado
│   └── index.js            # Página principal
├── styles/
│   └── Home.module.css     # Estilos
├── package.json
└── README.md
```

## Cómo Funciona

1. Usuario ingresa URL del repositorio
2. Frontend envía POST a `/api/analyze`
3. Backend valida la URL y consulta GitHub API
4. Analiza presencia de archivos de seguridad
5. Calcula puntuación basada en criterios
6. Retorna resultados con detalles
7. Frontend muestra score y análisis

## Mejoras Futuras

- [ ] Análisis de dependencias vulnerables
- [ ] Check de SBOM (Software Bill of Materials)
- [ ] Análisis de certificaciones
- [ ] Comparación entre repositorios
- [ ] Historial de análisis
- [ ] Export de reportes PDF

## License

MIT
