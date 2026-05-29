# Problem Templates

Pre-validated problem slugs and their canonical symptom descriptions. Use these as the basis for article slugs and `## What You're Seeing` sections.

---

## HDMI / Signal Problems

| Slug | Symptom |
|------|---------|
| `hdmi-no-signal` | Screen shows "No Signal" or "Check Signal Cable" after switching inputs |
| `hdmi-no-signal-after-tv-boot` | TV shows No Signal when turned on, even though source is powered |
| `hdmi-signal-drops-intermittently` | Picture cuts out briefly every few minutes; reseating cable restores it |
| `4k-signal-dropping` | 4K source works at 1080p but drops when forced to 4K; may relate to HDCP or cable bandwidth |
| `hdmi-handshake-failing` | TV and source don't agree on format; shows black screen with audio, or no output at all |
| `hdmi-no-4k-hdr` | Source is set to 4K HDR but TV only shows 1080p SDR |
| `4k120-not-working-ps5` | PS5 set to 4K@120Hz but TV or receiver only accepts 60Hz |
| `4k120-not-working-xbox` | Xbox Series X set to 4K@120Hz but output falls back to 4K@60Hz |

---

## eARC / ARC / Audio Problems

| Slug | Symptom |
|------|---------|
| `earc-not-working` | eARC-connected soundbar/receiver gets no audio from TV apps |
| `earc-dropout-atmos` | Dolby Atmos audio drops intermittently via eARC |
| `arc-not-working` | ARC-connected soundbar gets no audio; TV internal speakers still work |
| `arc-vs-earc-explainer` | Explainer: difference between ARC and eARC |
| `no-sound-from-receiver` | AV receiver shows correct input but no audio output |
| `sound-out-of-sync` | Audio is delayed or ahead of video; lip-sync issue |
| `dolby-atmos-not-showing` | Receiver or soundbar never shows "Dolby Atmos" on its display |
| `dolby-atmos-not-available` | Streaming app shows Atmos icon but receiver reports Dolby Digital 5.1 |
| `optical-cable-no-surround` | Optical/TOSLINK connected but only stereo audio; expected 5.1 |

---

## HDR / Picture Quality Problems

| Slug | Symptom |
|------|---------|
| `hdr-not-detected` | Source outputs HDR but TV shows SDR; no HDR badge in info bar |
| `hdr-looks-washed-out` | HDR content looks grey/low-contrast; TV not tone-mapping correctly |
| `dolby-vision-not-available` | Dolby Vision content shows HDR10 fallback instead |
| `hdr-greyed-out-in-settings` | TV HDR setting is greyed out and unselectable |
| `samsung-hdr10plus-not-showing` | Samsung TV doesn't show HDR10+ badge on compatible content |

---

## Remote / CEC Problems

| Slug | Symptom |
|------|---------|
| `cec-tv-turns-on-by-itself` | TV powers on unexpectedly when receiver or soundbar is used |
| `cec-remote-not-controlling-soundbar` | TV remote volume buttons don't control soundbar via CEC |
| `simplink-not-working` | LG SimpLink (CEC) not controlling connected devices |
| `anynet-plus-not-working` | Samsung Anynet+ not responding to connected devices |
| `bravia-sync-not-working` | Sony Bravia Sync not sending CEC commands to receiver |

---

## Streaming Device Problems

| Slug | Symptom |
|------|---------|
| `apple-tv-hdr-looks-dark` | Apple TV 4K HDR picture appears dark on OLED; tone-mapping issue |
| `roku-no-4k` | Roku streaming at 1080p despite TV being 4K |
| `fire-stick-buffering` | Fire TV Stick freezing or buffering frequently |
| `chromecast-no-signal` | Chromecast 4K not detected after TV boot |
| `nvidia-shield-no-dolby-vision` | Nvidia Shield not outputting Dolby Vision even on supported TV |

---

## Gaming Console Problems

| Slug | Symptom |
|------|---------|
| `ps5-no-4k` | PS5 only showing 1080p on 4K TV; 4K option missing in Settings |
| `ps5-no-dolby-atmos` | PS5 not outputting Dolby Atmos to receiver/soundbar |
| `xbox-series-x-no-4k120` | Xbox Series X won't output 4K@120Hz to TV or receiver |
| `xbox-series-s-resolution` | Xbox Series S game resolution; clarify 1440p rendering vs 4K output |
| `switch-wont-display-1080p` | Nintendo Switch docked showing 720p instead of 1080p |

---

## AV Receiver Problems

| Slug | Symptom |
|------|---------|
| `receiver-hdmi-no-signal` | AVR HDMI input passes no picture to TV |
| `receiver-no-atmos-decode` | Receiver shows "Dolby Surround" instead of "Dolby Atmos" |
| `receiver-fan-noise` | Loud fan noise from AV receiver during normal use |
| `receiver-protect-mode` | Receiver enters Protection Mode and shuts down |
| `receiver-no-4k120-passthrough` | 4K@120Hz source connected to receiver but TV only gets 4K@60Hz |
| `heos-connection-issues` | Denon/Marantz HEOS app can't find receiver on network |
| `musiccast-connection-issues` | Yamaha MusicCast app can't connect to receiver or soundbar |

---

## Networking / App Update Problems

| Slug | Symptom |
|------|---------|
| `tv-wifi-keeps-disconnecting` | Smart TV drops Wi-Fi every few hours |
| `tv-firmware-update-failing` | TV shows "Update Failed" during firmware update |
| `streaming-app-not-loading` | Netflix/Disney+/etc. app crashes or won't open |
| `tv-slow-smart-interface` | Smart TV menu severely laggy after using for >1 year |

---

## Naming Conventions

Slugs should:
- Use the brand prefix only for brand-specific articles: `lg-earc-not-working`, `samsung-anynet-plus-not-working`
- Be generic for universal troubleshooting: `earc-not-working`, `hdmi-no-signal`
- Avoid version numbers in slugs (models change; slug should remain evergreen)
- Use descriptive nouns + verbs: `earc-dropout-atmos` not `earc-problem`
