# Writing Guidelines

## Audience

BuildGuiders readers are:
- **Consumer electronics owners** — not installers or technicians
- **Frustrated** — they came here because something stopped working
- **Time-constrained** — they want the answer immediately
- Age range skews 25–55, mixed technical confidence
- Most are comfortable following numbered steps but don't know what "TMDS" or "HDCP" stands for

Write for the homeowner who just bought a new 4K TV and can't get the PS5 to show proper HDR. Not the A/V enthusiast who reads forum threads about EDID handshake negotiation.

---

## Tone

**Calm and competent, not corporate.**

- Direct and confident — tell the reader what to do, don't hedge unnecessarily
- Warm but minimal small talk — "Here's how to fix it" is better than "Great question! There are several things you can try!"
- Use "you" freely — address the reader directly
- No excessive exclamation points
- No filler phrases: "In this article, we'll be taking a look at..." → cut it

**Good:**
> "The most common cause is that the HDMI port your PS5 is connected to doesn't support 4K@120Hz. On most TVs, only one or two ports have full HDMI 2.1 bandwidth."

**Bad:**
> "There could be a number of potential issues that might be causing this problem. Let's explore some of the things we can try to potentially resolve this."

---

## Technical Language Rules

### Use plain language for consumer terms

| Technical term | Use instead |
|---------------|------------|
| TMDS clock | (don't use — explain the effect) |
| EDID negotiation | (don't use — say "TV and source agree on format") |
| Color subsampling | Explain as "color detail" or just mention if relevant |
| Signal handshake | "Connection negotiation" or "the TV and device agreeing on format" |
| Bitstream passthrough | "Passing audio directly to your receiver" |

### Use correct technical terms for supported concepts

These terms are appropriate and readers benefit from knowing them:
- HDMI ARC / eARC (explain on first use)
- Dolby Atmos, DTS:X, Dolby Digital Plus (explain briefly)
- 4K, 1080p, 4K@120Hz (these are familiar)
- HDR, HDR10, Dolby Vision, HDR10+ (explain on first use if obscure)
- VRR (explain as "Variable Refresh Rate — reduces game stutter")
- ALLM (explain as "Auto Low Latency Mode — automatically switches to Game Mode")

---

## Article-Specific Guidelines

### Quick Answer section
Use a numbered list or bullets — never prose. This section is for scanners.

```md
## Quick Answer
- Make sure your HDMI cable is rated "Ultra High Speed" (48 Gbps) — not standard or high-speed.
- Connect the PS5 to an HDMI 2.1 port on your TV (usually labeled or listed in the manual).
- In PS5 Settings, go to **Screen and Video → Video Output → 4K Video Transfer Rate** and select **-1 (Automatic)**.
- Power cycle both the TV and PS5 (unplug for 30 seconds, not just standby).
```

### Step-by-Step Fix
Number every step. Each step is one action. Do not combine actions.

**Good:**
> **Step 1:** Turn off both the TV and the PS5.
> **Step 2:** Unplug both from the wall. Wait 30 seconds.

**Bad:**
> Turn off and unplug both devices, wait, and then attempt to reconnect them.

### Menu paths
Write menu paths in bold with → arrows:
```md
Go to **Settings → Display & Sound → Audio Output → eARC**.
```

Brand-specific paths:
- LG webOS: **Settings (gear icon) → All Settings → Sound → Sound Out**
- Samsung (Tizen): **Settings → Sound → Sound Output**
- Sony Google TV: **Settings → Display & Sound → Audio output**
- Denon: **Menu → Audio → HDMI Audio Out**

### Power cycle instructions
Always specify the wait time and always say "unplug from the wall" not just "turn off":

```md
Unplug the TV from the wall (don't just use the remote). Wait **30 seconds** — this fully clears the hardware cache. Plug back in.
```

Never write "wait 10 seconds" for a power cycle.

---

## What to Avoid

**Avoid vague troubleshooting:**
- "Make sure your cables are properly connected" → Be specific: "Press the HDMI connector firmly until you feel/hear it click into place"
- "Check your TV settings" → Specify exactly which settings

**Avoid hedging without value:**
- "It could possibly be a firmware issue" → Either say "This is often a firmware bug — here's how to update" or don't mention firmware

**Avoid recommending unnecessary actions:**
- Don't suggest factory reset in step 1. It should be last resort only.
- Don't suggest "contact support" without first exhausting the steps the user can take themselves.

**Avoid brand-specific errors:**
- Samsung: never mention Dolby Vision (Samsung does NOT support it)
- LG: say "SimpLink," not "Anynet+"
- Yamaha: say "MusicCast," not "HEOS"
- Nintendo Switch: never mention 4K

---

## Affiliate Product Integration

- The product listed in frontmatter should be genuinely relevant to the problem
- The `description` field in the product object should explain **why this product helps with this specific problem**

**Good product description:**
> "A Certified Ultra High Speed HDMI cable provides the 48 Gbps bandwidth required for 4K@120Hz and eARC — which standard cables lack."

**Bad product description:**
> "High-quality HDMI cable for connecting devices."

---

## FAQ Guidelines

Each FAQ question should be a real question a user might Google. Use question phrasing naturally:
- "Why does my TV keep switching to 1080p?"
- "Does the PS5 need a special HDMI cable for 4K@120Hz?"
- "What's the difference between ARC and eARC?"

Keep FAQ answers tight — 2–4 sentences. Link to other articles where appropriate.

---

## Internal Linking

Add at least 2–3 internal links within the article body. For example:
- An eARC article should link to the ARC article and the Dolby Atmos explainer
- A PS5 4K@120Hz article should link to the HDMI 2.1 cable guide and the TV gaming settings article

Use descriptive anchor text:
- Good: "See our guide to [setting up eARC on LG webOS TVs](../lg-earc-setup)"
- Bad: "Click [here](../lg-earc-setup) for more information"
