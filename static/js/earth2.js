document.addEventListener('DOMContentLoaded', () => {
    const configElement = document.getElementById('earth2-stream-config');
    const viewer = document.getElementById('earth2-viewer');
    const openLink = document.getElementById('earth2-open');
    const reconnectButton = document.getElementById('earth2-reconnect');
    const status = document.getElementById('earth2-status');
    const message = document.getElementById('earth2-message');

    if (!configElement || !viewer || !openLink || !reconnectButton || !status || !message) {
        return;
    }

    const config = JSON.parse(configElement.textContent);
    const inferredUrl = `${window.location.protocol}//${window.location.hostname}:${config.http_port}/`;
    const streamUrl = config.url || inferredUrl;

    const setStatus = (label, state) => {
        status.className = `stream-status stream-status-${state}`;
        status.lastChild.textContent = ` ${label}`;
    };

    const showMessage = (text, state = 'info') => {
        message.textContent = text;
        message.className = `earth2-message earth2-message-${state}`;
        message.hidden = false;
    };

    const loadViewer = () => {
        setStatus('Loading browser client', 'connecting');
        message.hidden = true;
        viewer.src = 'about:blank';
        window.setTimeout(() => {
            viewer.src = streamUrl;
        }, 50);
    };

    let parsedUrl;
    try {
        parsedUrl = new URL(streamUrl, window.location.href);
    } catch (error) {
        setStatus('Configuration error', 'error');
        showMessage(`Invalid E2CC stream URL: ${streamUrl}`, 'error');
        return;
    }

    openLink.href = parsedUrl.href;

    if (window.location.protocol === 'https:' && parsedUrl.protocol === 'http:') {
        setStatus('HTTPS configuration required', 'error');
        showMessage(
            'The site is using HTTPS but the E2CC viewer is configured for HTTP. Configure TLS or a same-origin reverse proxy before loading the stream.',
            'error'
        );
        return;
    }

    viewer.addEventListener('load', () => {
        if (viewer.src !== 'about:blank') {
            setStatus('Browser client loaded', 'ready');
        }
    });

    reconnectButton.addEventListener('click', loadViewer);
    loadViewer();
});
