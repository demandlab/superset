ARG INSENTRIC_SUPERSET_VERSION

FROM us-central1-docker.pkg.dev/insentric-root/insentric-docker/insentric-superset-build:${INSENTRIC_SUPERSET_VERSION} as base

ARG GOOGLE_AUTH_CLIENT_SECRET
ARG GOOGLE_AUTH_CLIENT_ID
ARG SMTP_USER
ARG SMTP_PASSWORD
ARG SUPERSET_VERSION

USER root

# Install common Python packages
RUN . /app/.venv/bin/activate && \
    uv pip install gunicorn psycopg2-binary sqlalchemy-bigquery authlib google-cloud-bigquery-storage celery pillow firebase_admin "pyjwt<2.10" sentry-sdk[flask]

COPY --chown=superset:superset config/ /app/

COPY replace_vars.sh /app/

# Set permissions for /tmp directory
RUN chmod -R 1777 /tmp && \
    chown -R superset:superset /tmp

ENV GOOGLE_AUTH_CLIENT_SECRET=${GOOGLE_AUTH_CLIENT_SECRET}
ENV GOOGLE_AUTH_CLIENT_ID=${GOOGLE_AUTH_CLIENT_ID}
ENV SMTP_USER=${SMTP_USER}
ENV SMTP_PASSWORD=${SMTP_PASSWORD}

RUN chmod +x  /app/replace_vars.sh

USER superset
ENV SUPERSET_CONFIG_PATH /app/superset_config.py

# Stage 1: Init Script
FROM base as init

USER root
COPY --chown=superset:superset init.sh /init.sh
COPY --chown=superset:superset roles.json /roles.json
RUN chmod +x /init.sh

ENV PYTHONPATH=/app

USER superset
ENTRYPOINT ["/init.sh"]

# Stage 2: Web App
FROM base as run

RUN chmod -R 1777 /tmp

# https://superset.apache.org/docs/configuration/configuring-superset/#running-on-a-wsgi-http-server
# https://cloud.google.com/run/docs/tips/python#optimize_the_wsgi_server
ENTRYPOINT ["gunicorn", "-w", "5", "--threads", "4", "--timeout", "0", "-b", "0.0.0.0:8080", "--limit-request-line", "0", "--limit-request-field_size", "0", "superset.app:create_app()"]

# Stage 3: Celery Worker
FROM base as celery_worker

USER root
RUN apt-get update && \
    apt-get install --no-install-recommends -y firefox-esr wget build-essential

ENV GECKODRIVER_VERSION=0.36.0
RUN wget -q https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz && \
    tar -x geckodriver -zf geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz -O > /usr/bin/geckodriver && \
    chmod 755 /usr/bin/geckodriver && \
    rm geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz


# Ensure selenium cache directory exists and is owned by superset
RUN mkdir -p /app/superset_home/.cache/selenium && chown -R superset:superset /app/superset_home/.cache

RUN . /app/.venv/bin/activate && \
    uv pip install --no-cache gevent psycopg2-binary redis

# create the directory /var/www/.mozilla and change its owner to superset
RUN mkdir -p /var/www/.mozilla && chown -R superset:superset /var/www/.mozilla

USER superset
ENTRYPOINT ["/bin/bash", "-c", "source /app/.venv/bin/activate && celery --app=superset.tasks.celery_app:app worker --pool=prefork -O fair -E"]

# Stage 4: Celery Beat
FROM base as celery_beat

USER root
RUN mkdir -p /tmp && chown -R superset:superset /tmp /app

USER superset
ENTRYPOINT ["/bin/bash", "-c", "source /app/.venv/bin/activate && celery --app=superset.tasks.celery_app:app beat --pidfile /tmp/celerybeat.pid -l INFO -s /app/celerybeat-schedule"]
