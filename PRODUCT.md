# PRODUCT.md — EHRPlus Patient Portal

register: product

## Product purpose

A patient-facing portal for WHO Nepal's EHRPlus hospitals. A patient signs in with
their hospital + Medical Record Number (MRN), verifies identity (insurance or mobile
number), and **views their own health record**: visits, lab results, medications,
prescriptions, bills/insurance, and documents.

One Expo codebase ships **both** the mobile app (iOS/Android) and the web app
(react-native-web). Both must feel native and premium on their platform.

## Hard product rule: read-only

The patient can **only view** data for their hospital. There is **no mutation** of
any kind in this MVP — no editing, no admit/discharge/transfer, no booking. This is
an architectural invariant, not a UI choice (see DESIGN.md → Security).

## Users

- Patients in Nepal, frequently on low-end Android phones.
- Context of use: bright outdoor daylight (glare) and dim clinic waiting rooms.
- Mixed digital literacy; many read Nepali more comfortably than English.
- Often anxious (checking a result), in a hurry, or sharing the screen with family.

Implication: large legible type, high contrast, generous touch targets, plain-language
status ("Normal" / "High"), minimal chrome, fast first paint, works on small screens
and flaky networks.

## Brand / tone

Calm, trustworthy, clinical, precise. Quietly Nepali, not loud. The tool disappears
into the task. Never playful with health data; never alarmist.

## Anti-references

- The healthcare-SaaS reflex: bright teal + white, rounded hero cards, gradient stat tiles.
- Consumer fitness-app gamification (rings, streaks, confetti).
- Dense clinician EHR UI (the patient is not a doctor).

## Strategic principles

1. Answer the patient's real questions first: "Is my result OK?", "What do I owe?",
   "What medicine, how often?", "When was my visit, who saw me?".
2. Status before numbers. A lab value leads with Normal/Low/High, then the number.
3. Trust through clarity: show reference ranges, dates, the doctor's name, the source.
4. Never block on the network: skeletons, cached reads, graceful empty/error states.
