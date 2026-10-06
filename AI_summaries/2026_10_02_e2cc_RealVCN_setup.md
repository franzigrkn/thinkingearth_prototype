# E2CC RealVNC Setup from a Mac

## Purpose

This runbook records the working method for accessing the E2CC workstation's graphical desktop from a local Mac. RealVNC Viewer connects through an SSH tunnel, so the VNC service is not exposed publicly.

Verified configuration on 2026-10-02:

- Local computer: macOS
- Remote workstation: **1u1g-gen-0432**
- Remote user: **fgerken**
- Remote RealVNC Server port: **5900**
- Local forwarded port: **5901**
- RealVNC Viewer address: **127.0.0.1::5901**
- E2CC graphical display in the verified session: **:1**
- RealVNC Picture quality: **High**
- RealVNC PreferredEncoding: **ZRLE**

The workstation must already have RealVNC Server running and a graphical desktop available. The Mac must be able to reach the workstation with SSH, including through the company VPN if required.

## 1. Install RealVNC Viewer on the Mac

Install the RealVNC desktop Viewer application. Do not use the macOS built-in Screen Sharing application for this workstation. The built-in client reached the server during testing but reported that the remote software was incompatible.

## 2. Create the SSH tunnel

Open Terminal on the Mac and run:

~~~bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:5901:127.0.0.1:5900 \
  fgerken@1u1g-gen-0432
~~~

Enter the workstation password when prompted. After authentication, the terminal normally shows no further output because the -N option creates the tunnel without opening a remote shell. Keep this terminal window open for the entire RealVNC session.

In a second Mac terminal, verify the tunnel:

~~~bash
nc -vz 127.0.0.1 5901
~~~

The test should report that the connection succeeded.

If port 5901 is already in use, use another local port:

~~~bash
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:5902:127.0.0.1:5900 \
  fgerken@1u1g-gen-0432.ipp6a1.colossus.nvidia.com
~~~

In that case, connect RealVNC Viewer to **127.0.0.1::5902**.

## 3. Connect with RealVNC Viewer

In RealVNC Viewer, choose **Make a Direct Connection** and enter exactly:

~~~text
127.0.0.1::5901
~~~

The double colon is important: it tells RealVNC that 5901 is an explicit TCP port. Do not enter localhost:5901, localhost:59014, or add a period after the port.

Authenticate using the credentials configured for the workstation's RealVNC Server. Although RealVNC calls this a direct connection, it is safely directed through the local SSH tunnel.

### Required picture-quality settings for E2CC

Do not leave RealVNC Picture quality on **Automatic** for E2CC validation. During
timeline playback or a large viewport redraw such as toggling the Sun, automatic
quality produced severe palette-like posterization, black sectors, and blurred
timeline text. The transmitted image could later recover while E2CC remained
untouched, which initially made the issue look like a GPU texture failure.

Open the connection's Properties and set:

- **Picture quality:** High
- **PreferredEncoding:** ZRLE

These settings eliminated the apparent collapse for the built-in Base Satellite
and for the `q850`, `q925`, and `q1000` timelines. No E2CC restart is required
when changing the Viewer settings.

## 4. Copy text from the Mac into the remote desktop

Normal clipboard paste did not work reliably in the verified configuration. The working method was RealVNC's **Send clipboard as keystrokes** action.

On the Mac:

1. Open **RealVNC Viewer/RealVNC Connect > Preferences** or **Settings**.
2. Open **Expert** settings.
3. Change **ClipboardKeystrokesEnable** from 2 to 1.
4. Apply the setting and reconnect.

To paste text after reconnecting:

1. Copy the text on the Mac with **Command+C**.
2. Click the target field or terminal inside the remote desktop.
3. Press **Fn+F8** on the Mac.
4. Select **Send clipboard as keystrokes**.
5. Press **Enter** separately when pasting a terminal command.

ClipboardKeystrokesEnable=1 enables this action throughout the remote session. It does not make ordinary Command+V or Ctrl+Shift+V clipboard transfer work automatically.

## 5. Launch E2CC from the remote desktop

Open a terminal inside the RealVNC desktop. Do not launch the graphical application from an ordinary SSH shell because that shell may not have the correct DISPLAY and XAUTHORITY values.

Confirm that the graphical display is set:

~~~bash
echo "$DISPLAY"
~~~

It must print a nonempty display such as :1. Then launch E2CC:

~~~bash
cd /var/tmp/fgerken/e2cc/earth2-weather-analytics && ./earth-2-command-center/_build/linux-x86_64/release/omni.earth_2_command_center.app.sh
~~~

Use the Fn+F8 clipboard procedure to enter the long command. Keep the remote terminal open while E2CC is running.

## 6. Allow the first launch to compile shaders

The first launch displayed a grey window while the RTX ray-tracing pipelines and shaders compiled. This was not a crash.

During the verified launch:

- E2CC reported app ready after approximately 13 seconds.
- First-run RTX pipeline compilation continued for roughly two minutes.
- CPU usage was high during compilation.
- The process used the NVIDIA GPU and eventually about 6 GB of GPU memory.
- The RTX viewport and globe appeared after compilation completed.

Do not terminate E2CC while this compilation is active. If RealVNC keeps displaying a stale grey frame after compilation finishes, press **Fn+F8** and select **Refresh Screen**, resize or restore the E2CC window, or disconnect and reconnect RealVNC. Leave E2CC and its launch terminal running while reconnecting.

E2CC session logs are stored under:

~~~text
~/.nvidia-omniverse/logs/Kit/omni.earth_2_command_center.app/0.0/
~~~

Watch the newest log from a separate SSH shell with:

~~~bash
tail -f "$(ls -1t ~/.nvidia-omniverse/logs/Kit/omni.earth_2_command_center.app/0.0/kit_*.log | head -1)"
~~~

Messages about optional Taiwan Typhoon or Scream datasets being absent did not prevent the default globe from rendering.

## 7. Load the first project dataset

After the default globe renders, use **Add features from metadata file** in E2CC and open:

~~~text
/home/fgerken/CODE/thinkingearth_prototype/check_data/e2cc_exports/q850/q850.e2cc.json
~~~

Verified on 2026-10-05: the corrected metadata file loads successfully. The first attempt failed because each timestamp in `sources` mapped to a one-item list. For a non-mosaic `latlong` sequence, E2CC release 1.1.0 requires a single path string. `scripts/export_e2cc.py` and the generated metadata were corrected accordingly. On 2026-10-06, `q850`, `q925`, and `q1000` were all validated through live timeline playback with the RealVNC settings above.

Validate:

- North/south texture orientation
- Longitude alignment and the date-line seam
- All seven timestamps
- Prediction and temporary-reference toggles
- Colormap behavior
- Timeline animation

## 8. Disconnect safely

To leave E2CC running:

1. Close or disconnect RealVNC Viewer without logging out of the Linux desktop.
2. Stop the Mac SSH tunnel with **Ctrl+C** only after RealVNC has disconnected.

To stop E2CC, focus its launch terminal on the remote desktop and press **Ctrl+C**, or close the application normally. Logging out of the Linux graphical session may terminate graphical applications.

## Troubleshooting

### RealVNC says the connection was refused

- Confirm that the SSH tunnel terminal is still open.
- Run nc -vz 127.0.0.1 5901 on the Mac.
- Use **127.0.0.1::5901** with two colons in RealVNC.
- Confirm the port is 5901, with no extra digit or trailing period.

### The SSH command asks for a password and then appears to hang

This is normal. A tunnel created with ssh -N remains silent and occupied until it is stopped with **Ctrl+C**.

### SSH reports that the local port is already in use

An older tunnel may still be running. Close it or forward local port 5902 and connect RealVNC to **127.0.0.1::5902**.

### macOS Screen Sharing reports incompatible software

Use RealVNC Viewer instead of open vnc://... or the macOS Screen Sharing application.

### Text copied on the Mac cannot be pasted remotely

Set ClipboardKeystrokesEnable=1, copy the text again after connecting, press **Fn+F8**, and choose **Send clipboard as keystrokes**.

### E2CC starts but no graphical window appears

It was probably launched from a plain SSH shell without access to the graphical display. Launch it from a terminal opened inside the RealVNC desktop and confirm that DISPLAY is nonempty.

### E2CC displays only grey immediately after launch

Wait several minutes for first-run shader compilation. Do not stop the process while CPU and GPU activity remain high. Refresh or reconnect RealVNC if the application log shows the viewport was created but Viewer still shows the old grey frame.

### A metadata file is selected but does not load

Check the newest E2CC log. The original `q850` failure reported `TypeError: argument should be a str or an os.PathLike object ... not 'list'` from `metadata_sequences.py`. Its cause was a one-item list at each timestamp in `sources`; non-mosaic `latlong` entries must be path strings. The current exporter and `q850.e2cc.json` contain the corrected representation.

### The timeline works but the data appears as wedges, bands, or black sectors

There are two distinct causes that were observed:

1. Check for `Trying to load a non-jpeg through the jpeg decoder` in the Kit log.
   E2CC release 1.1.0 only loads JPEG files for timestamped sequences. The
   original project exports used PNGs, so use the regenerated metadata whose
   `sources` paths end in `.jpg`.
2. If the built-in Base Satellite and UI text also become posterized, the issue
   is the RealVNC stream. Set Picture quality to **High** and
   PreferredEncoding to **ZRLE**. This was the final cause of the recurring
   apparent collapse after the exports had already been corrected.

## Security notes

- Bind the forwarded port to 127.0.0.1, as shown above.
- Do not expose VNC port 5900 directly to the public internet.
- Keep workstation and VNC passwords out of this document and shell history.
- Close the SSH tunnel when remote access is no longer needed.
