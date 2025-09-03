import os
import math
from superset.superset_typing import CacheConfig
from superset.tasks.types import FixedExecutor
from flask_appbuilder.security.manager import AUTH_DB, AUTH_OAUTH
from custom_security_manager import CustomSecurityManager
from celery.schedules import crontab
from urllib.parse import urlparse
from datetime import timedelta
import sentry_sdk
from sqlalchemy import pool
from time_grains import *

logoPath = os.getenv('LOGO_PATH')

LOG_LEVEL = 'DEBUG'

FLASK_APP="superset"
SECRET_KEY = os.getenv('SUPERSET_SECRET_KEY')
APP_NAME = "Insentric"
APP_ICON = logoPath or "/static/assets/images/insentric-logo.svg"
FAVICONS = [{"href": "/static/assets/images/insentric-favicon.png"}]

# Postgres Database Connection
DATABASE_USER = os.getenv('DATABASE_USER')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
DATABASE_HOST = os.getenv('DATABASE_HOST')
DATABASE_PORT = os.getenv('DATABASE_PORT')
DATABASE_DB_NAME = os.getenv('DATABASE_DB_NAME')

SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_DB_NAME}"

SQLALCHEMY_ENGINE_OPTIONS = {
    "poolclass": pool.NullPool,              
    "connect_args": {
        "connect_timeout": 60,       
    }
}

# Redis Connection
REDIS_HOST = os.environ.get("REDIS_HOST")
REDIS_PORT = os.environ.get("REDIS_PORT", '6379') 
REDIS_CELERY_DB = os.environ.get("REDIS_CELERY_DB", 2)  
REDIS_RESULTS_DB = os.environ.get("REDIS_RESULTS_DB", 3)  
REDIS_CACHE_DB = os.environ.get("REDIS_CACHE_DB", 4)
REDIS_RATELIMIT_DB = os.environ.get("REDIS_RATELIMIT_DB", 5)

# Security
ENABLE_PROXY_FIX = True

# Flask-WTF flag for CSRF
WTF_CSRF_ENABLED = True

# Add endpoints that need to be exempt from CSRF protection
WTF_CSRF_EXEMPT_LIST = [
    "superset.views.core.log",
    "superset.views.core.explore_json",
    "superset.charts.data.api.data",
]

TALISMAN_ENABLED=True

imgSrc = [ 
    "'self'", 
    "blob:", 
    "data:",
    "https://insentric.com",
    "https://apachesuperset.gateway.scarf.sh",
    "https://static.scarf.sh/",
    # Google Tag Manager and Google Analytics
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
    "https://ssl.gstatic.com",
    "https://www.gstatic.com",
    "https://fonts.gstatic.com"
]

if (logoPath):
    imgSrc.append(urlparse(logoPath).netloc)

TALISMAN_CONFIG = {
    "content_security_policy": {
        "base-uri": ["'self'"],
        "default-src": ["'self'"],
        "img-src": imgSrc,
        "worker-src": ["*"],
        "connect-src": [
            "'self'",
            "https://api.mapbox.com",
            "https://events.mapbox.com",
            # Google Tag Manager and Google Analytics
            "https://*.googletagmanager.com",
            "https://*.google-analytics.com",
            "https://*.analytics.google.com",
            # Sentry
            "https://*.sentry.io",
            "https://5c40cd88f441f3d29e3508a8318de48e@o4509000299773952.ingest.us.sentry.io/4509006032535552",
            # insentri-admin
            "https://*.insentric.net"
        ],
        "object-src": ["'none'"],
        "style-src": [
            "'self'",
            "'unsafe-inline'",
            # Google Tag Manager and Google Analytics
            "https://fonts.googleapis.com",            
            "https://*.googletagmanager.com",
            "https://tagmanager.google.com"
        ],
        "style-src-elem": [
            "'self'",
            "'unsafe-inline'",
            # Google Tag Manager and Google Analytics
            "https://fonts.googleapis.com",            
            "https://*.googletagmanager.com",
            "https://tagmanager.google.com"
        ],
        "font-src": [
            "data:",
            "'self'",
            # Google Tag Manager and Google Analytics
            "https://fonts.gstatic.com"
        ],
        "script-src": [
            "'self'", 
            "data:",
            "'strict-dynamic'", 
            "'unsafe-inline'",
            "'unsafe-eval'",
            # Google Tag Manager and Google Analytics
            "https://*.googletagmanager.com",
            "https://tagmanager.google.com",
            "https://www.gstatic.com",
            "https://www.google.com",
            "https://www.google-analytics.com/analytics.js",
            # Sentry
            "https://js.sentry-cdn.com",
            "https://browser.sentry-cdn.com"

        ],
        "frame-src": [
            "'self'",
            "https://www.google.com"
        ],
        "frame-ancestors": [
            "https://*.insentric.net",
            "https://*.hubspot.com"
        ],
        "upgrade-insecure-requests" : ''
    },
    "content_security_policy_nonce_in": ["script-src"],
    "force_https": True,
    "session_cookie_secure": True,
    "feature_policy": {
        "accelerometer": "()",
        "ambient-light-sensor": "()",
        "autoplay": "()",
        "battery": "()",
        "camera": "'self'",
        "display-capture": "()",
        "document-domain": "'self'",
        "encrypted-media": "()",
        "execution-while-not-rendered": "'self'",
        "execution-while-out-of-viewport": "'self'",
        "fullscreen": "'self'",
        "geolocation": "'self'",
        "gyroscope": "()",
        "keyboard-map": "'self'",
        "magnetometer": "()",
        "microphone": "'self'",
        "midi": "()",
        "navigation-override": "()",
        "payment": "()",
        "publickey-credentials-get": "()",
        "screen-wake-lock": "()",
        "sync-xhr": "'self'",
        "usb": "()",
        "web-share": "()",
        "xr-spatial-tracking": "()",
        "clipboard-read": "'self'",
        "clipboard-write": "()",
        "gamepad": "()",
        "speaker-selection": "()"
    },
    "frame_options" : None
}

FAB_ADD_SECURITY_API = True

# FAB Rate limiting: this is a security feature for preventing DDOS attacks. The
# feature is on by default to make Superset secure by default, but you should
# fine tune the limits to your needs. You can read more about the different
# parameters here: https://flask-limiter.readthedocs.io/en/stable/configuration.html
RATELIMIT_ENABLED = False if os.getenv('DISABLE_RATE_LIMIT') == 'true' else True
RATELIMIT_APPLICATION = "50 per second"
AUTH_RATE_LIMITED = True
AUTH_RATE_LIMIT = "5 per second"

# A storage location conforming to the scheme in storage-scheme. See the limits
# library for allowed values: https://limits.readthedocs.io/en/stable/storage.html
RATELIMIT_STORAGE_URI = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_RATELIMIT_DB}"
# A callable that returns the unique identity of the current request.
# RATELIMIT_REQUEST_IDENTIFIER = flask.Request.endpoint

# Authentication
AUTH_TYPE = AUTH_OAUTH if os.getenv('AUTH_TYPE') == 'OAUTH' else AUTH_DB
CUSTOM_SECURITY_MANAGER = CustomSecurityManager

OAUTH_PROVIDERS = [
{
    'name': 'google',
    'icon': 'fa-google',
    'token_key': 'access_token',
    'remote_app': {
        'api_base_url': 'https://www.googleapis.com/oauth2/v2/',
        'client_kwargs': {
            'scope': 'email profile'
        },
        'request_token_url': None,
        'access_token_url': 'https://accounts.google.com/o/oauth2/token',
        'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
        'client_id': '$GOOGLE_AUTH_CLIENT_ID',
        'client_secret': '$GOOGLE_AUTH_CLIENT_SECRET'
    }
}]

PERMANENT_SESSION_LIFETIME= timedelta(minutes=30)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "Strict"
SESSION_COOKIE_NAME = "reportsession"

FEATURE_FLAGS = {
    'ENABLE_TEMPLATE_PROCESSING': True,
    'TAGGING_SYSTEM': True,
    'THUMBNAILS': True,
    'THUMBNAILS_SQLA_LISTENERS': True,
    'ALERT_REPORTS': True,
    'ALERT_REPORT_TABS': True,
    'DASHBOARD_RBAC': True,
    'LISTVIEWS_DEFAULT_CARD_VIEW': True,
    'DRILL_BY': True,
    'ALLOW_ADHOC_SUBQUERY' : True,
    "EMBEDDED_SUPERSET": True

}

class CeleryConfig(object):
    broker_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_CELERY_DB}"
    imports = (
        "superset.sql_lab",
        "superset.tasks.scheduler",
        "superset.tasks.thumbnails",
    )
    result_backend = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_RESULTS_DB}"
    worker_prefetch_multiplier = 1
    worker_concurrency = 1
    task_acks_late = True
    task_annotations = {
        "sql_lab.get_sql_results": {
            "rate_limit": "100/s",
        },
    }
    beat_schedule = {
        "reports.scheduler": {
            "task": "reports.scheduler",
            "schedule": crontab(minute="*", hour="*"),
        },
        "reports.prune_log": {
            "task": "reports.prune_log",
            "schedule": crontab(minute=0, hour=0),
        },
    }
    
CELERY_CONFIG = CeleryConfig

CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": int(timedelta(minutes=1).total_seconds()),
    "CACHE_KEY_PREFIX": "superset_cache",
    "CACHE_REDIS_URL": f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_CACHE_DB}",
    "CACHE_THRESHOLD": math.inf
}

DATA_CACHE_CONFIG : CacheConfig = {
    **CACHE_CONFIG,
    "CACHE_DEFAULT_TIMEOUT": int(timedelta(hours=1).total_seconds()),
    "CACHE_KEY_PREFIX": "data_cache_"
}

FILTER_STATE_CACHE_CONFIG = {
    **CACHE_CONFIG,
    "CACHE_DEFAULT_TIMEOUT": int(timedelta(days=1).total_seconds()),
    "CACHE_KEY_PREFIX": "filter_state_cache_"
}

EXPLORE_FORM_DATA_CACHE_CONFIG = {
    **CACHE_CONFIG,
    "CACHE_DEFAULT_TIMEOUT": int(timedelta(days=1).total_seconds()),
    "CACHE_KEY_PREFIX": "explore_form_data_cache_"
}

THUMBNAIL_CACHE_CONFIG: CacheConfig = {
    **CACHE_CONFIG,
    'CACHE_DEFAULT_TIMEOUT': int(timedelta(days=30).total_seconds()),
    'CACHE_KEY_PREFIX': 'thumbnail_cache_'
}

# Async selenium thumbnail task will use the following user
THUMBNAIL_EXECUTORS = [FixedExecutor(os.getenv("PROJECT_ID"))]

WEBDRIVER_TYPE = "firefox"

WEBDRIVER_BASEURL = os.getenv('WEBDRIVER_BASEURL')
WEBDRIVER_OPTION_ARGS = [
        "--force-device-scale-factor=2.0",
        "--high-dpi-support=2.0",
        "--headless",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-extensions",
        ]

SCREENSHOT_LOCATE_WAIT = 1000
SCREENSHOT_LOAD_WAIT = 2000

# Email configuration
SMTP_HOST = "smtp.mailersend.net"
SMTP_PORT = 587 
SMTP_STARTTLS = True
SMTP_SSL_SERVER_AUTH = True
SMTP_SSL = False
SMTP_USER = "$SMTP_USER" 
SMTP_PASSWORD = "$SMTP_PASSWORD" 
SMTP_MAIL_FROM = "noreply@insentric.com"
EMAIL_REPORTS_SUBJECT_PREFIX = "[Insentric] "
EMAIL_REPORTS_CTA = "Explore in Insentric"
# The base URL for the email report hyperlinks.
WEBDRIVER_BASEURL_USER_FRIENDLY = WEBDRIVER_BASEURL


sentry_sdk.init(
    dsn="https://f9fad10fc8c8c306b39fc749f0f42f89@o4509000299773952.ingest.us.sentry.io/4509000315895808",
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    traces_sample_rate=0.1
)

# DEBUG = True
