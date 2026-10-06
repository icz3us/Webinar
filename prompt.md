# Build: Deepfakes and Digital Trust — Webinar Registration & Management System

Act as a **senior full-stack engineer, product designer, and UI/UX designer from a professional software company**.

Build a production-quality webinar registration and event management web application for:

**Deepfakes and Digital Trust**
**Recognizing AI-Generated Media and Misinformation**
**October 11, 2026**

The application should be built with:

* **Next.js** using the App Router
* **TypeScript**
* **Supabase**

  * Supabase Auth
  * PostgreSQL database
  * Row Level Security
  * Storage where appropriate
* **Google OAuth / Google Sign-In**
* **Tailwind CSS**
* **GSAP** for animations and transitions
* Use additional animation/UI libraries when appropriate, such as **Framer Motion**, but do not overuse animations.
* Use a professional component library if useful, such as **shadcn/ui**
* Use **Lucide icons**
* Use a proper form-validation solution such as **Zod + React Hook Form**
* Use server-side validation for all important operations.
* Follow modern Next.js security and performance practices.

---

# 1. PRODUCT GOAL

Create a complete webinar registration system.

The **public homepage should primarily be the registration experience**, rather than a traditional marketing-heavy landing page.

The visitor should immediately understand:

1. What the webinar is
2. When it happens
3. What the two sessions are
4. What they will learn
5. The registration requirements
6. The registration form
7. How their information will be used

The registration process should feel polished, modern, trustworthy, and easy to complete.

---

# 2. VISUAL DIRECTION

Design the website like a modern technology conference/event platform.

Visual direction:

* Professional
* Modern
* Clean
* Technology-focused
* Editorial
* Slightly futuristic
* Strong typography
* Excellent spacing
* High-quality imagery
* Subtle glassmorphism where appropriate
* Dark/light contrast
* Smooth transitions
* Subtle GSAP animations
* Avoid excessive "AI-generated website" aesthetics
* Avoid excessive gradients
* Avoid unnecessary floating cards everywhere
* Avoid generic SaaS dashboard templates

The design should look like it was created by a professional frontend/product design team.

Use **Arial / Inter / Geist / similar clean sans-serif typography**.

The design must be fully responsive:

* Desktop
* Laptop
* Tablet
* Mobile

Mobile registration should be especially easy to use.

---

# 3. HOMEPAGE

The homepage should focus on **registration**.

Suggested structure:

## Hero / Event Header

Display:

**DEEPFAKES & DIGITAL TRUST**

**Recognizing AI-Generated Media and Misinformation**

**October 11, 2026**

Short description:

"Join us to learn how to identify manipulated AI-generated media and verify online information."

Include a professional event-related image or visual.

The imagery should relate to:

* AI-generated media
* Digital trust
* Deepfakes
* Online misinformation
* Digital verification
* Cyber/digital identity

Do not use cheesy stock imagery.

Use image placeholders if actual images are not available.

---

# 4. SESSION INFORMATION

Clearly show that there are two separate sessions.

Important note:

> Session 1 and Session 2 cover different topics. You may register for one or both sessions.

### SESSION 01

**Deepfakes in Everyday Social Media**

**8:00 AM – 1:00 PM**

Include a short description explaining that this session focuses on identifying deepfakes and manipulated content commonly encountered on social media.

### SESSION 02

**Deepfakes in the Workplace and School**

**2:00 PM – 7:00 PM**

Include a short description explaining that this session focuses on deepfake risks in academic and professional environments.

Clearly display:

> Separate e-certificates will be provided for each session attended.

Use visual differentiation between the two sessions while keeping them part of the same event.

---

# 5. REGISTRATION FORM

The main CTA should take the user to the registration form or smoothly scroll to it.

Registration title:

**Register for the Webinar**

The form must contain:

### Email Address

Required.

Description:

> Please provide an active email where we will send the Zoom link and your e-certificate.

The email should preferably come from the authenticated Google account when the user signs in with Google.

---

### Full Name

Required.

Description:

> Type your name exactly as you want it to appear on your certificate (e.g., Juan Dela Cruz).

This field must be stored exactly as entered.

Do not automatically modify capitalization.

---

### Affiliation / Institution / Company

Required.

Description:

> If you are a student, please put your school (e.g., Gordon College).

---

### Participant Category

Required.

Options:

* Student
* Faculty/Educator
* IT Professional
* General Public
* Other

If "Other" is selected, reveal an additional text field:

**Please specify**

---

### Which session(s) will you attend?

Required.

Allow multiple selections.

Options:

**Session 1: Deepfakes in Everyday Social Media**
8:00 AM – 1:00 PM

**Session 2: Deepfakes in the Workplace and School**
2:00 PM – 7:00 PM

The user must be able to select:

* Session 1 only
* Session 2 only
* Both sessions

---

### Data Privacy Consent

Required checkbox.

Display:

> "I consent to the collection and processing of my personal information for the purpose of registration, attendance tracking, and certificate issuance for this event."

The user must explicitly check the consent box before registration can be submitted.

Store:

* consent status
* consent timestamp

---

# 6. GOOGLE SIGN-IN

Implement Supabase Google OAuth.

Registration flow:

1. User clicks **Continue with Google**
2. Google authentication opens
3. User authenticates
4. Return to the application
5. Retrieve the user's verified Google email
6. Pre-fill the Email Address field
7. Allow the user to complete the remaining registration information
8. Submit registration
9. Show confirmation

Do not require users to manually type an email if Google provides the authenticated email.

However, the registration record must still store the email in the database.

Handle:

* Existing authenticated users
* New users
* OAuth cancellation
* OAuth errors
* Expired sessions
* Duplicate registrations

Do not expose Supabase service-role keys in client-side code.

---

# 7. REGISTRATION LOGIC

A participant should not accidentally create duplicate registrations.

Use the authenticated user's ID and/or email as appropriate.

Create appropriate database constraints.

If the user has already registered:

Display something like:

**You're already registered**

Then show their registration information and selected sessions.

Allow them to review their information.

If appropriate, allow them to edit their registration before the event.

---

# 8. CONFIRMATION SCREEN

After successful registration, display a polished confirmation page.

Show:

**Registration Confirmed**

Then:

* Participant name
* Email
* Affiliation
* Participant category
* Selected session(s)
* Event date
* Session times

Display:

> Your registration has been successfully recorded.

Explain that the Zoom access information will be sent to their registered email.

Do not claim that an email was sent unless the application actually confirms successful email delivery.

Provide a button:

**View My Registration**

And optionally:

**Add to Calendar**

---

# 9. EMAIL SYSTEM

Create an email architecture that can support:

### Registration Confirmation

Send:

* Event title
* Participant name
* Selected sessions
* Event date
* Zoom information when available

### Session Reminder

Allow administrators to send reminders.

### Certificate Notification

When a certificate is generated:

Send an email informing the participant that their certificate is available.

Use a configurable email provider.

Do not hard-code credentials.

---

# 10. CERTIFICATE SYSTEM

This is one of the most important features.

The admin dashboard must support **automatic certificate generation**.

Certificates should be generated separately for each attended session.

Example:

If a participant attended Session 1 and Session 2:

Generate:

* Session 1 certificate
* Session 2 certificate

If they only attended Session 1:

Generate only the Session 1 certificate.

The certificate should contain:

* Event title
* Participant full name
* Session title
* Date
* Organization/event organizer
* Certificate ID
* Optional verification URL
* Signature fields
* Professional certificate design

Generate the certificate as a **PDF**.

Use a reusable certificate template.

The administrator should be able to preview the certificate before generating it.

---

# 11. CERTIFICATE VERIFICATION

Create a public certificate verification page.

Example route:

`/verify/[certificateId]`

The page should display:

**Certificate Verified**

Information:

* Certificate ID
* Participant name
* Session
* Event
* Date issued

Do not expose unnecessary personal information.

Certificate IDs must be unique.

Use a secure/random identifier rather than predictable sequential IDs.

---

# 12. ATTENDANCE SYSTEM

The admin dashboard must have attendance management.

Admins should be able to:

* View registered participants
* Filter by session
* Mark attendance
* Search participants
* Bulk mark attendance
* Import attendance if needed
* Export attendance
* View attendance status

Attendance must be tracked **per session**.

Example:

Participant:

John Doe

Session 1: Present
Session 2: Absent

Only attended sessions should be eligible for certificate generation.

---

# 13. ADMIN DASHBOARD

Create a complete admin dashboard.

Use a professional dashboard layout with:

* Sidebar
* Top navigation
* Responsive mobile navigation
* Breadcrumbs
* Search
* Notifications
* Admin profile menu

Dashboard sections:

### Overview

Show statistics:

* Total registrations
* Session 1 registrations
* Session 2 registrations
* Both-session registrations
* Total attendees
* Session 1 attendance
* Session 2 attendance
* Certificates generated
* Certificates pending

Use professional charts.

Possible charts:

* Registrations over time
* Registrations by participant category
* Session selection distribution
* Attendance rate
* Certificate completion

---

# 14. ADMIN REGISTRATIONS

Create a registration management page.

Features:

* Search
* Pagination
* Filtering
* Sorting
* View participant
* Edit participant
* Delete/cancel registration
* Export CSV
* Filter by session
* Filter by category
* Filter by attendance
* Filter by certificate status

Table columns:

* Name
* Email
* Affiliation
* Category
* Session 1
* Session 2
* Registration date
* Attendance
* Certificate status
* Actions

---

# 15. PARTICIPANT DETAILS

Create a detailed participant page.

Display:

### Participant Information

* Full name
* Email
* Affiliation
* Category
* Registration date

### Sessions

Session 1:

* Registered
* Attendance
* Certificate

Session 2:

* Registered
* Attendance
* Certificate

### Data Privacy

* Consent status
* Consent timestamp

### Activity

Record relevant administrative activity when appropriate.

---

# 16. ATTENDANCE MANAGEMENT

Create a dedicated attendance page.

Admins should be able to select:

**Session 1**

or

**Session 2**

Then see registered participants.

Each participant should have:

* Name
* Email
* Registration status
* Attendance status
* Check-in time if available
* Check-out time if implemented

Allow:

* Mark present
* Mark absent
* Undo attendance
* Bulk actions

---

# 17. CERTIFICATE MANAGEMENT

Create a certificate management section.

Display:

* Participant
* Session
* Certificate ID
* Status
* Date generated
* Date issued

Actions:

* Preview
* Generate
* Regenerate
* Download
* Send via email
* Verify

Support bulk certificate generation for all eligible attendees.

Example:

**Generate Session 1 Certificates**

This should generate certificates only for participants who:

1. Registered for Session 1
2. Were marked present for Session 1
3. Do not already have a valid certificate

Do the equivalent for Session 2.

---

# 18. ADMIN SETTINGS

Create settings for:

### Event

* Event title
* Description
* Event date
* Session names
* Session times
* Session descriptions

### Webinar

* Zoom link
* Zoom meeting ID
* Zoom passcode
* Instructions

### Certificate

* Certificate template
* Organizer name
* Signature information
* Certificate prefix
* Verification URL

### Email

* Sender name
* Email templates
* Registration confirmation
* Reminder
* Certificate notification

### System

* Admin users
* Roles
* Security settings
* Audit logs

---

# 19. ADMIN AUTHORIZATION

Use Supabase authentication and authorization.

Roles should include at minimum:

### Admin

Full access.

### Staff

Can manage:

* Registrations
* Attendance
* Certificates

But should not necessarily be able to change critical system settings.

Protect all admin routes.

Do not rely only on client-side checks.

Use proper server-side authorization and Supabase Row Level Security policies.

---

# 20. DATABASE DESIGN

Create a clean relational database.

Suggested tables:

### profiles

* id
* email
* full_name
* avatar_url
* role
* created_at
* updated_at

### events

* id
* title
* description
* event_date
* created_at
* updated_at

### sessions

* id
* event_id
* title
* description
* start_time
* end_time
* created_at

### registrations

* id
* event_id
* user_id
* email
* full_name
* affiliation
* participant_category
* other_category
* privacy_consent
* privacy_consent_at
* created_at
* updated_at

### registration_sessions

* registration_id
* session_id

### attendance

* id
* registration_id
* session_id
* status
* check_in_at
* check_out_at
* marked_by
* created_at
* updated_at

### certificates

* id
* registration_id
* session_id
* certificate_number
* certificate_url
* issued_at
* generated_by
* status
* created_at

### audit_logs

* id
* user_id
* action
* entity_type
* entity_id
* metadata
* created_at

Adjust the schema if a better normalized structure is appropriate.

Create appropriate indexes, unique constraints, foreign keys, and RLS policies.

---

# 21. SECURITY REQUIREMENTS

Treat this as a real production application.

Implement:

* Supabase Row Level Security
* Server-side authorization
* Input validation
* Zod schemas
* CSRF-aware architecture where applicable
* Rate limiting for sensitive endpoints
* Secure certificate generation
* Secure file storage
* No service-role keys in browser code
* Proper OAuth callback handling
* Secure admin routes
* Audit logging for sensitive admin operations

Do not trust:

* Client-side attendance values
* Client-side certificate eligibility
* Client-provided admin roles
* Client-provided user IDs
* Client-provided certificate IDs

Validate important operations on the server.

---

# 22. ANIMATIONS

Use GSAP thoughtfully.

Possible animations:

* Hero entrance animation
* Text reveal
* Session cards appearing on scroll
* Form section entrance
* Smooth section transitions
* Registration success animation
* Dashboard chart transitions

Animations must remain subtle and professional.

Do not make the registration form difficult to use because of animations.

Respect:

`prefers-reduced-motion`

---

# 23. IMAGES

The homepage should include event-related imagery.

Use images in:

* Hero section
* Session sections
* Optional educational section

Images should visually support:

* Deepfakes
* AI-generated media
* Digital identity
* Media verification
* Online trust

Use proper responsive image optimization through Next.js.

Do not use random unrelated stock photography.

If actual event images are unavailable, create clean placeholders that can easily be replaced later.

---

# 24. RESPONSIVE DESIGN

Desktop:

* Wide event header
* Two-column registration layout where appropriate
* Registration form with clear hierarchy

Mobile:

* Single-column layout
* Large touch targets
* Sticky or easily accessible registration CTA
* Session selection cards optimized for touch
* No horizontal overflow
* Admin dashboard becomes mobile-friendly

Test common widths:

* 375px
* 390px
* 430px
* 768px
* 1024px
* 1440px+

---

# 25. ACCESSIBILITY

Implement:

* Semantic HTML
* Proper labels
* Keyboard navigation
* Focus states
* ARIA labels where necessary
* Accessible form errors
* Sufficient contrast
* Reduced-motion support

Do not rely solely on color to communicate status.

---

# 26. UX DETAILS

Form validation errors should be clear and human-readable.

Examples:

"Please enter your full name."

"Please select at least one session."

"Please accept the data privacy consent before continuing."

For duplicate registrations:

"You are already registered for this event."

Do not display raw database or server errors to users.

Use toast notifications where appropriate.

---

# 27. PROJECT STRUCTURE

Use a maintainable Next.js architecture.

Separate:

* UI components
* Server actions
* API routes
* Supabase utilities
* Database types
* Validation schemas
* Authentication
* Certificate generation
* Email services
* Admin functionality

Do not place the entire application inside one giant page component.

Create reusable components.

---

# 28. ENVIRONMENT VARIABLES

Use environment variables for:

* Supabase URL
* Supabase anonymous/public key
* Supabase service role key
* Google OAuth configuration if required
* Email provider credentials
* Zoom configuration
* Certificate configuration

Never commit secrets.

Create a `.env.example`.

---

# 29. SEED DATA

Create seed data for development.

Include:

Event:

**Deepfakes and Digital Trust**

Date:

**October 11, 2026**

Sessions:

**Session 1: Deepfakes in Everyday Social Media**
8:00 AM – 1:00 PM

**Session 2: Deepfakes in the Workplace and School**
2:00 PM – 7:00 PM

Create sample participants and attendance records only for development/demo purposes.

Clearly separate seed/demo data from production data.

---

# 30. IMPORTANT REGISTRATION CONTENT

Use this exact information on the public registration page:

**Registration: Deepfakes and Digital Trust Webinar**

**October 11, 2026**

> Join us to learn how to identify manipulated AI-generated media and verify online information.

Display this note:

> **Note:** Session 1 and Session 2 cover different topics. You may register for one or both sessions.

And:

> Separate e-certificates will be provided for each session attended.

Registration fields:

**Email Address**

> Please provide an active email where we will send the Zoom link and your e-certificate.

**Full Name**

> Type your name exactly as you want it to appear on your certificate (e.g., Juan Dela Cruz).

**Affiliation / Institution / Company**

> If you are a student, please put your school (e.g., Gordon College).

**Participant Category**

* Student
* Faculty/Educator
* IT Professional
* General Public
* Other

**Which session(s) will you attend?**

* Session 1: Deepfakes in Everyday Social Media (8:00 AM - 1:00 PM)
* Session 2: Deepfakes in the Workplace and School (2:00 PM - 7:00 PM)

**Data Privacy Consent**

> "I consent to the collection and processing of my personal information for the purpose of registration, attendance tracking, and certificate issuance for this event."

Option:

**Yes**

---

# 31. IMPORTANT DESIGN REQUIREMENT

Do NOT build a generic template.

The final result should feel like a real event registration platform that could be used by a college, organization, or technology conference.

Prioritize:

**Trust → Registration → Usability → Accessibility → Administration → Certificates**

The public page should not be overloaded with unnecessary sections.

The primary purpose of the homepage is to get users registered quickly while giving them enough information to make an informed choice between the two sessions.

---

# 32. DEVELOPMENT PROCESS

Before writing significant amounts of code:

1. Inspect the existing project structure.
2. Determine whether Next.js and Supabase are already configured.
3. Reuse existing infrastructure when appropriate.
4. Do not overwrite working functionality unnecessarily.
5. Create the database schema and types.
6. Implement authentication.
7. Implement registration.
8. Implement registration confirmation.
9. Implement admin authentication/authorization.
10. Implement admin dashboard.
11. Implement attendance.
12. Implement certificate generation.
13. Implement certificate verification.
14. Implement email notifications.
15. Polish animations and responsive UI.
16. Run linting/type checking/build.
17. Fix errors.
18. Test the complete registration → attendance → certificate workflow.

Do not stop after creating the UI.

The goal is a **fully functional application**, not just a mockup.

---

# 33. FINAL ACCEPTANCE TEST

The application should support this complete workflow:

Visitor → Google Sign-In → Registration Form → Select Session(s) → Privacy Consent → Submit → Registration Confirmation

Then:

Admin → Login → View Registrations → Select Session → Mark Attendance → Generate Certificates → Download/Email Certificate

Then:

Participant → Open Certificate Verification URL → Verify Certificate

Make sure the database relationships, authorization, UI, and certificate eligibility all work together correctly.

Build the application with clean, production-quality code and a polished visual design.
# 34. DISTINCTIVE VISUAL IDENTITY — IMPORTANT

**DO NOT use the typical AI-generated website aesthetic.**

Avoid the common visual patterns seen in AI-generated SaaS templates, including:

* Purple-to-blue gradient backgrounds
* Generic blue/purple "AI" color palettes
* Excessive glassmorphism
* Excessive rounded cards
* Huge glowing gradient blobs
* Floating 3D objects with no purpose
* Generic dashboard templates
* Excessive shadows
* Neon cyberpunk styling
* Overused dark navy + electric blue combinations
* Every section looking like a separate rounded card
* Generic "AI startup" landing-page layouts
* Excessive animated gradients
* Random decorative elements that don't contribute to the design

The website should have a **distinctive technology/editorial identity**.

Take inspiration from:

* Modern technology conferences
* Digital media publications
* Cybersecurity interfaces
* Information verification systems
* Digital identity platforms
* Swiss/editorial graphic design
* Modern developer tools
* Research/technology institutions
* Contemporary tech event websites
* Data visualization interfaces
* Terminal/interface aesthetics, used subtly

The result should feel like a **real technology event organized by a professional technical organization**, not a template generated by an AI website builder.

---

## COLOR DIRECTION

Do NOT default to the usual purple/blue AI palette.

Explore a more distinctive technology-inspired palette.

Possible direction:

* Warm/off-white backgrounds
* Near-black typography
* Charcoal
* Graphite
* Cool gray
* Muted metallic tones
* One distinctive accent color
* Subtle signal colors for status and interaction

Potential accent directions include:

* Acid/lime green
* Muted orange
* Digital red
* Electric cyan used sparingly
* Signal yellow
* Deep crimson
* Industrial green

Do not automatically use all of these.

Choose **one primary accent direction** and build a coherent visual system around it.

The accent should feel intentional and editorial rather than neon.

For example, a mostly neutral interface with a single strong signal color can create a much more distinctive technology identity than a full gradient palette.

---

## TYPOGRAPHY

Use typography as a major part of the visual identity.

Prefer:

* Clean sans-serif body typography
* Strong editorial headings
* Clear hierarchy
* Large but controlled typography
* Monospace typography for small technical metadata where appropriate

Possible combinations:

* Geist + Geist Mono
* Inter + JetBrains Mono
* IBM Plex Sans + IBM Plex Mono
* Arial + monospace

Do not use overly futuristic display fonts.

The design should remain highly readable and professional.

---

## GRAPHIC LANGUAGE

Create a visual language inspired by **digital verification and information systems**.

Possible elements:

* Thin technical lines
* Registration/status indicators
* Small metadata labels
* Session numbering
* Grid systems
* Coordinate-like details
* Subtle data patterns
* Verification marks
* Technical annotations
* Minimal geometric elements
* Small monospace labels
* Editorial dividers
* Structured information blocks

For example:

`EVENT / 001`

`DATE / 11.10.2026`

`STATUS / REGISTRATION OPEN`

`SESSION / 01`

These should be subtle supporting elements rather than overwhelming the page.

---

## HERO DESIGN

Do not create the standard:

"Massive heading + subtitle + two gradient buttons + floating glass cards."

Instead, experiment with an **editorial technology-event composition**.

For example:

* Large typography
* Strong asymmetric layout
* Event metadata
* A distinctive image treatment
* Technical labels
* Session information
* Registration CTA integrated naturally into the composition

The hero should immediately communicate:

**Deepfakes + Digital Trust + Technology + Verification**

without looking like a generic AI landing page.

---

## IMAGE TREATMENT

Images should feel intentional.

Instead of simply placing a stock image inside a rounded rectangle, experiment with:

* Cropping
* Editorial framing
* Duotone treatment
* Grayscale photography with an accent color
* Image overlays
* Technical labels
* Split-image compositions
* Scanner/verification-inspired overlays

Do not make every image a rounded card.

---

## UI COMPONENTS

Use variation in shape and structure.

Not every component should have:

`border-radius: 16px`

Use a combination of:

* Sharp corners
* Slightly rounded elements
* Lines
* Dividers
* Open layouts
* Panels
* Compact cards
* Full-width sections

Rounded corners should be used intentionally rather than everywhere.

---

## REGISTRATION FORM

The registration form should feel like part of the event's identity.

Do not make it look like a generic SaaS signup form.

Make the form feel like a **professional event registration terminal/interface** while keeping it extremely easy to use.

For example:

**01 / IDENTITY**

Full Name
Email Address

**02 / AFFILIATION**

Institution / Company
Participant Category

**03 / SESSION**

Session 01
Session 02

**04 / CONSENT**

Data Privacy Consent

This structure can be visualized through typography, numbering, dividers, and subtle technical details.

---

## SESSION DESIGN

Make Session 01 and Session 02 visually distinctive.

Use:

**01**
DEEPFAKES IN EVERYDAY SOCIAL MEDIA

and

**02**
DEEPFAKES IN THE WORKPLACE AND SCHOOL

Use editorial typography and technical metadata such as:

`08:00 — 13:00`

`14:00 — 19:00`

Rather than relying on generic colored cards.

---

## MOTION DESIGN

GSAP animations should support the visual identity.

Use motion inspired by:

* Digital interfaces
* Scanning
* Data loading
* Signal detection
* Verification
* Text reveals
* Grid movement
* Information appearing progressively

Keep motion sophisticated and restrained.

Avoid:

* Excessive bouncing
* Random floating elements
* Constant pulsing
* Overly dramatic zoom effects
* Animation on every component

The animation should make the site feel **technical and alive**, not distracting.

---

## OVERALL DESIGN PRINCIPLE

The final website should make someone think:

> "This looks like a professionally designed technology conference/event platform."

NOT:

> "This looks like an AI-generated SaaS landing page."

Prioritize **originality, typography, composition, information hierarchy, and a distinctive color system** over trendy effects.

If there is a choice between adding another visual effect and improving the composition, **choose better composition**.

If there is a choice between using a trendy AI design pattern and creating a simpler but more distinctive interface, **choose the distinctive interface**.
