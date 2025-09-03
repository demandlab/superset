FROM grafana/k6:latest-with-browser

# --no-sandbox - Disables Chromium's main security sandbox (required in containers)
# --disable-setuid-sandbox - Disables the SUID sandbox (alternative sandbox method)
# --disable-ipc-flooding-protection - Removes limits on inter-process communication messages

# Memory Management:

# --disable-dev-shm-usage - Uses /tmp instead of /dev/shm for shared memory (containers have limited shared memory)
# --memory-pressure-off - Disables memory pressure detection that could throttle performance

# Performance & Background Processing:

# --disable-background-timer-throttling - Prevents slowing down JavaScript timers in background tabs
# --disable-backgrounding-occluded-windows - Keeps hidden/covered windows running at full speed
# --disable-renderer-backgrounding - Prevents performance throttling of background renderer processes

# UI Features:

# --disable-features=TranslateUI - Disables Google Translate popup and translation features

# Process Model:

# --single-process - NEW - Runs everything in one process instead of multiple isolated processes (helps avoid privilege issues in restricted environments like Cloud Run)

ENV K6_BROWSER_ARGS="\
--no-sandbox,\
--disable-dev-shm-usage,\
--disable-background-timer-throttling,\
--disable-backgrounding-occluded-windows,\
--disable-renderer-backgrounding,\
--disable-features=TranslateUI,\
--disable-ipc-flooding-protection,\
--disable-setuid-sandbox,\
--memory-pressure-off,\
--single-process"

ENV K6_BROWSER_HEADLESS=true

WORKDIR /app

COPY . .

RUN mkdir -p ./results

ENTRYPOINT ["sh", "./entrypoint.sh"]