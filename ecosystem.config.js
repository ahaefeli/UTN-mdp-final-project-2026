const path = require('path');

const root = __dirname;
const isWindows = process.platform === 'win32';
const python = isWindows
  ? path.join(root, 'venv', 'Scripts', 'python.exe')
  : path.join(root, 'venv', 'bin', 'python');

const apiUrl = 'api.voleyhub.com';
const landingUrl = 'voleyhub.com';
const platformUrl = 'plataforma.voleyhub.com';

// NEXT_PUBLIC_* se incrustan en el build de Next. Hay que exportarlas
// antes de `npm run build` en landing y platform; PM2 las vuelve a pasar
// en runtime para el render del servidor.
const publicWebEnv = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: apiUrl,
  NEXT_PUBLIC_PLATFORM_URL: `https://${platformUrl}`,
};

module.exports = {
  apps: [
    {
      name: 'voleyhub-api',
      cwd: path.join(root, 'backend'),
      script: python,
      args: isWindows
        ? 'manage.py runserver 0.0.0.0:8000 --noreload'
        : '-m gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60',
      interpreter: 'none',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        DJANGO_SETTINGS_MODULE: 'core.settings',
        DJANGO_SECRET_KEY: 'django-insecure-zkv%*n+)h4p0j*mx*t$3-*8x4jq&ats7x&k3lmmz^=k)b2m5qx',
        DJANGO_DEBUG: 'false',
        DJANGO_ALLOWED_HOSTS: 'localhost,127.0.0.1,api.voleyhub.com,plataforma.voleyhub.com',
        DB_NAME: 'voley_lnv_db',
        DB_USER: 'postgres',
        DB_PASSWORD: '0102',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_TEST_NAME: 'test_voley_lnv_db',
        CORS_ALLOW_ALL_ORIGINS: 'false',
        CORS_ALLOWED_ORIGINS: `${landingUrl},${platformUrl}`,
        CSRF_TRUSTED_ORIGINS: `${landingUrl},${platformUrl}`,
        DEFAULT_FROM_EMAIL: 'no-reply@voleyhub.com',
        BUCKET_NAME: 'club-photo-bucket',
        PYTHONUNBUFFERED: '1',
      },
    },
    {
      name: 'voleyhub-landing',
      cwd: path.join(root, 'landing'),
      script: path.join(root, 'landing', 'node_modules', 'next', 'dist', 'bin', 'next'),
      args: 'start --hostname 0.0.0.0 --port 3000',
      interpreter: 'node',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        ...publicWebEnv,
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'voleyhub-platform',
      cwd: path.join(root, 'platform'),
      script: path.join(root, 'platform', 'node_modules', 'next', 'dist', 'bin', 'next'),
      args: 'start --hostname 0.0.0.0 --port 3001',
      interpreter: 'node',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        ...publicWebEnv,
        PORT: '3001',
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
