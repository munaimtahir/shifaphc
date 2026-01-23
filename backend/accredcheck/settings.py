from pathlib import Path
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]

INSTALLED_APPS = [
  "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes","django.contrib.sessions",
  "django.contrib.messages","django.contrib.staticfiles",
  "corsheaders","rest_framework","core",
]

MIDDLEWARE = [
  "corsheaders.middleware.CorsMiddleware",
  "django.middleware.security.SecurityMiddleware",
  "django.contrib.sessions.middleware.SessionMiddleware",
  "django.middleware.common.CommonMiddleware",
  "django.middleware.csrf.CsrfViewMiddleware",
  "django.contrib.auth.middleware.AuthenticationMiddleware",
  "django.contrib.messages.middleware.MessageMiddleware",
  "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "accredcheck.urls"
TEMPLATES = [{
  "BACKEND":"django.template.backends.django.DjangoTemplates",
  "DIRS":[],
  "APP_DIRS":True,
  "OPTIONS":{"context_processors":[
    "django.template.context_processors.debug",
    "django.template.context_processors.request",
    "django.contrib.auth.context_processors.auth",
    "django.contrib.messages.context_processors.messages",
  ]},
}]
WSGI_APPLICATION = "accredcheck.wsgi.application"

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
  u = urlparse(DATABASE_URL)
  DATABASES = {"default":{
    "ENGINE":"django.db.backends.postgresql",
    "NAME":u.path.lstrip("/"),
    "USER":u.username,
    "PASSWORD":u.password,
    "HOST":u.hostname,
    "PORT":u.port or 5432,
  }}
else:
  DATABASES = {"default":{"ENGINE":"django.db.backends.sqlite3","NAME":BASE_DIR/"db.sqlite3"}}

AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE="en-us"
TIME_ZONE="Asia/Karachi"
USE_I18N=True
USE_TZ=True

STATIC_URL="static/"
DEFAULT_AUTO_FIELD="django.db.models.BigAutoField"

MEDIA_URL="/media/"
MEDIA_ROOT=os.getenv("MEDIA_ROOT", str(BASE_DIR/"media"))

CORS_ALLOWED_ORIGINS=[o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS","").split(",") if o.strip()]

REST_FRAMEWORK = {
  "DEFAULT_AUTHENTICATION_CLASSES":[
    "rest_framework.authentication.SessionAuthentication",
    "rest_framework.authentication.BasicAuthentication",
  ],
  "DEFAULT_PERMISSION_CLASSES":[
    "rest_framework.permissions.IsAuthenticated",
  ],
}
