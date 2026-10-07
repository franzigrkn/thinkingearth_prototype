# Access the Website Preview

1. Connect the Mac to the company network or VPN.
2. Open `http://10.86.6.247:5000/earth2` in Chrome or Edge.
3. Use only one streaming tab at a time.

The browser must directly reach TCP `5000`, `8011`, `49100`, and UDP `47998`.
If the page loads without video, check UDP `47998`; an SSH tunnel does not
carry the media stream.

The workstation address must be replaced after migration to the Ada machine.
