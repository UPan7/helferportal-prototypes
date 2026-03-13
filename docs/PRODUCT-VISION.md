# Helferportal — Product Vision

> What the platform is, who it serves, and where this project fits.

---

## What is Helferportal?

Helferportal is a German digital platform that connects **people in need of everyday support** with **volunteers willing to help** — coordinated through **municipalities and social organizations**. It addresses the growing gap in community-based care by making it easy to find, offer, and manage informal help.

## Target Audiences

### Help Seekers (Hilfesuchende) — Blue

Individuals or families who need everyday support: elderly people, caregiving relatives (pflegende Angehörige), people with disabilities, or anyone facing temporary hardship. They use the platform to find local volunteers and request help.

### Volunteers (Engagierte / Helfer) — Orange

People who want to give back to their community: retirees, students, professionals, or anyone with spare time. They register, browse opportunities, and connect with help seekers in their area.

### Municipalities & B2B (Kommunen, Organisationen, Gesundheitsdienstleister) — Purple

Local governments, social organizations, and healthcare providers who coordinate volunteer programs. They use the platform to manage helpers, track engagement, and integrate Helferportal into existing social infrastructure.

### Accent: Green

Used for positive signals across all audiences — cost-free badges, security indicators, checkmarks, and success states.

## Role of This Project

This repository (`helferportal-prototypes`) produces **visual HTML prototypes** and **structured content tables** for client review. The prototypes are clickable wireframes at ~70-80% design fidelity, showing what each page will look like before production development begins.

**These are NOT production files.** They are deliverables for:

1. **Client approval** — stakeholders review and provide feedback on layouts and content
2. **Content gathering** — structured JSON and Excel tables document every field on every page
3. **Design handoff** — prototypes inform the future React-based production build

The CMS pipeline (Supabase → JSON → HTML) enables non-technical editors to modify content without touching code, while maintaining round-trip fidelity between HTML and structured data.

## Prototype Pages

| Page | URL | Audience | Color |
|------|-----|----------|-------|
| Startseite | `/` | All | Blue (default) |
| Hilfe finden | `/hilfe-finden` | Help seekers | Blue |
| Engagieren | `/engagieren` | Volunteers | Orange |
| Für die öffentliche Hand | `/fuer-kommunen` | B2B | Purple |
| Über uns | `/ueber-uns` | All | Blue |
| Kontakt | `/kontakt` | All | Blue |
| München (Stadtseite) | `/muenchen` | All | Orange |

## Future Direction

The prototypes and content pipeline will feed into a **React-based Content Editor** — the production CMS for managing Helferportal content at scale. The current Supabase backend, JSON schema, and block registry are designed to transfer directly to the production system.
