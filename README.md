# TESC-Portal

- [TESC-Portal](#tesc-portal)
- [Links](#links)
- [About the project:](#about-the-project)
  - [The vision](#the-vision)
  - [Project specifications / Todo list:](#project-specifications--todo-list)
- [Getting Started](#getting-started)
  - [Technology](#technology)
  - [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Dependencies](#dependencies)

# Links

- [Site home page](https://portal.tescatucsd.org/)
- [TESC home page](https://www.tescatucsd.org/)
- [TESC tech project ideas doc (for future reference)](https://docs.google.com/document/d/1xEh9ouP2Oy8VpzhOcRKAuuFwGSi-LR7W6LXuGpPliAc/edit?tab=t.0)

# About the project:

Born from combining ideas and suggestions from our PVP members, we needed both a membership portal to monitor membership status and personal points for attending events (attendance verified at the event) along with an interactive bulletin board for clubs to post events on. These ideas were combined and centralised into the TESC-portal project managed by the Tech team [@TESC](https://github.com/UCSDTESC).

## The vision

In creating this portal, we wish to:

- Stream-line interaction and marketing of club events
- Promote membership participation in events
- Provide a central hub for all of our internally developed tools in the future

## Project specifications / Todo list:

- **Basic requirements**

  - [x] User log in and management
  - [x] Different views for TESC internal members, club principal members and general club members

- **Membership requirements**
  - [x] Student points management
  - [ ] Profile picture and description management for clubs
- **Bulletin Board Requirements**
  - [x] Principal members of clubs able to post and edit events and set passwords for events
  - [x] Principal members able to view events they've posted
  - [x] Manage user RSVP and attendance status
  - [x] Sort, Search and filter functionality

# Getting Started

## Technology

- Node.js (v20 or later recommended)
- Text/Code editor

## Installation

1. Clone the repo with `git clone https://github.com/UCSDTESC/tesc-portal.git`
2. Open the repo in your preferred code editor
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

# Folder Structure

```(batch)
📂src
 ┃ ┣ 📂components           # components file
 ┃ ┣ 📂adminUser            # components used by principal members
 ┃ ┃ ┣ 📂Data               # components for the Data Table
 ┃ ┃ ┗ 📂Form               # components for insert form
 ┃ ┣ 📂Bulletin             # components for bulletin
 ┃ ┗ 📂User                 # components for general User
 ┣ 📂lib
 ┃ ┣ 📂hooks                # Custom Hooks
 ┃ ┣ 📜constants.ts         # Global constants
 ┃ ┣ 📜UserContext.tsx      # UserContext and methods for
 ┃ ┗ 📜utils.ts             # utility functions
 ┣ 📂pageRoot               # Root components like navbar, footer...
 ┣ 📂services               # backend middleware
 ┣ 📂supabase               # bank-end connection
```

# Dependencies

The dependencies listed below are the main important ones to understand the project workflow along with the folder structure. Other packages are also used so this list is by no means exhaustive. Please check `package.json` for the actual list of dependencies

- [Vite](https://vite.dev/guide/) - Build Tool
- [React](https://react.dev/reference/react) - Frontend Framework
- [React Router](https://reactrouter.com/home) - Routing
- [Tailwind CSS (v4.0+)](https://tailwindcss.com/docs/font-size) - CSS Framework
- [Supabase](https://supabase.com/docs) - Back-end client for data storage and user auth

---

Contributors: [Hieu Nguyen](https://github.com/Jaerinx), [Nishitha Selvakumar](https://github.com/n1sh1thaS)
Last Edited: 21.04.25

---
