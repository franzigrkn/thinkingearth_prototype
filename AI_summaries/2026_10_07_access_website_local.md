# Access the Internal Website Preview

1. Connect the Mac to the company network or VPN.
2. Open `http://<WORKSTATION_ADDRESS>:5000/earth2` in Chrome or Edge.
3. Use only one streaming tab at a time.

The browser must directly reach TCP `5000`, `8011`, `49100`, and UDP `47998`.
If the page loads without video, check UDP `47998`; an SSH tunnel does not
carry the media stream.

Use the Ada workstation address after migration. The operator records the
reviewer video through this page; reviewers do not receive live site access.
