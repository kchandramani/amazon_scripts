# 🔧 GeoStudio Scripts - Centralized Tampermonkey Loader

> **Install once, auto-updates forever.** All GeoStudio scripts managed from one place.

[![GitHub](https://img.shields.io/badge/GitHub-kchandramani-blue?style=flat&logo=github)](https://github.com/kchandramani/amazon_scripts)
[![Scripts](https://img.shields.io/badge/Scripts-11-green?style=flat)](#-script-list)
[![Version](https://img.shields.io/badge/Version-1.2.0-orange?style=flat)](#)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [How It Works](#-how-it-works)
- [Repository Structure](#-repository-structure)
- [Script List](#-script-list)
- [Installation Guide](#-installation-guide-for-users)
- [Usage Guide](#-usage-guide)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Admin Guide](#-admin-guide-script-management)
- [Updating Scripts](#-updating-scripts)
- [Adding New Scripts](#-adding-new-scripts)
- [Disabling Scripts](#-disabling-scripts)
- [Emergency Controls](#-emergency-controls)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Changelog](#-changelog)
- [Author](#-author)

---

## 🌟 Overview

This repository contains a **centralized Tampermonkey script loader** for Amazon GeoStudio tools. Instead of installing and updating 11+ individual scripts manually, users install **ONE loader script** that automatically manages everything.

### Key Features

|
 Feature 
|
 Description 
|
|
---
|
---
|
|
 🔄 
**
Auto-Updates
**
|
 Scripts update automatically on every page refresh 
|
|
 📦 
**
Centralized
**
|
 All scripts managed from this single GitHub repository 
|
|
 ⚡ 
**
Fast Loading
**
|
 Scripts cached locally, loads instantly from cache 
|
|
 🎯 
**
Smart Matching
**
|
 Only loads scripts relevant to the current page 
|
|
 🛑 
**
Kill Switch
**
|
 Emergency stop all scripts remotely 
|
|
 📢 
**
Announcements
**
|
 Send messages to all users 
|
|
 🔧 
**
Easy Management
**
|
 Enable/disable scripts without touching user machines 
|
|
 💾 
**
Offline Cache
**
|
 Scripts work even if GitHub is temporarily unreachable 
|

---

## 🔄 How It Works
┌─────────────────────────────────────────────────────────────────┐
│ │
│ FIRST VISIT (one-time): │
│ Page Load → Loader fetches all scripts from GitHub │
│ → Caches them locally in Tampermonkey storage │
│ → Executes scripts for current page │
│ │
│ EVERY VISIT AFTER: │
│ Page Load → Load scripts from local cache (INSTANT, 0ms) │
│ → Background: Check GitHub for new version │
│ → If update found: download silently, cache it │
│ → New version applies on NEXT page refresh │
│ │
│ USER INTERACTIONS (clicks, typing, etc.): │
│ → Run at FULL SPEED, no internet needed │
│ → Identical performance to local Tampermonkey scripts │
│ │
└─────────────────────────────────────────────────────────────────┘



### Update Flow
Admin pushes update to GitHub
│
▼
User refreshes page
│
├── Step 1: Load OLD scripts from cache (instant)
│ User can start working immediately
│
├── Step 2: Background check finds new version
│ Downloads new scripts silently
│ Caches them locally
│
├── Step 3: Shows badge "Update available - Refresh to apply"
│
└── Step 4: User refreshes again → NEW scripts loaded ✅



---

## 📁 Repository Structure
📁 amazon_scripts/
│
├── 📄 README.md ← This file
├── 📄 manifest.json ← Master control file (versions, enable/disable)
├── 📄 loader.user.js ← Main loader (ONLY file users install)
│
└── 📁 scripts/ ← All individual script files
├── 📄 z-mx.js ← Geofence setter (A=25, Z=50)
├── 📄 middle-button-observer.js ← Copy DP to RE geocode button
├── 📄 auto-dismiss-alert.js ← Auto dismiss validation alerts
├── 📄 auto-dropdown-stf.js ← Auto select STF dropdowns
├── 📄 casetype-observer.js ← CaseType display & auto-click
├── 📄 past-deliveries-dropdown.js ← Past deliveries automation
├── 📄 remarks-us.js ← US remarks dropdown
├── 📄 remarks-general.js ← General remarks dropdown
├── 📄 left-paste-buttons.js ← Paste buttons (left side)
├── 📄 right-copy-buttons.js ← Copy buttons (right side)
└── 📄 delivery-reason-filter.js ← Delivery reason filter panel



### File Descriptions

| File | Purpose | Editable? |
|---|---|---|
| `manifest.json` | Controls which scripts load, versions, kill switch | ✅ Admin only |
| `loader.user.js` | Main loader installed by users | ⚠️ Rarely changed |
| `scripts/*.js` | Individual script logic | ✅ Admin edits freely |

---

## 📜 Script List

### Scripts for GeoStudio Place Page
> `https://*.geostudio.last-mile.amazon.dev/place*`

| # | Script | File | Description | Shortcut |
|---|---|---|---|---|
| 1 | **Z MX - Geofence Setter** | `z-mx.js` | Sets geofence value | `A` = 25, `Z` = 50 |
| 2 | **Middle Button Observer** | `middle-button-observer.js` | Arrow button to copy DP geocode → RE geocode | Click ↓ button |
| 3 | **Auto Dismiss Validation Alert** | `auto-dismiss-alert.js` | Auto-dismisses "Validation Failed" alerts | Automatic |
| 4 | **CaseType Observer & Auto-Click** | `casetype-observer.js` | Shows CaseType, auto-clicks buttons, shows address | Automatic |
| 5 | **Past Deliveries & Attribute Dropdown** | `past-deliveries-dropdown.js` | Opens Past Deliveries → Attribute → Count → All | `Q` |
| 6 | **Left Paste Buttons** | `left-paste-buttons.js` | Paste clipboard to DP/RE geocode inputs | Click ○ button |
| 7 | **Right Copy Buttons** | `right-copy-buttons.js` | Copy DP/RE geocode values to clipboard | Click 📋 button |
| 8 | **Delivery Reason Filter** | `delivery-reason-filter.js` | Filter deliveries by reason with toggle panel | Panel UI |

### Scripts for GeoStudio Templates Page
> `https://*.templates.geostudio.last-mile.amazon.dev/*`

| # | Script | File | Description | Shortcut |
|---|---|---|---|---|
| 9 | **Auto Drop Down Selection STF** | `auto-dropdown-stf.js` | Auto-select Save/NA options | `Sv-ST` / `NA` buttons |
| 10 | **GS 2.0 Remarks - US** | `remarks-us.js` | US-specific remarks dropdown | Select from dropdown |
| 11 | **GS 2.0 Remarks - General** | `remarks-general.js` | General remarks dropdown | Select from dropdown |

### Script-Page Mapping
geostudio.last-mile.amazon.dev/place* templates.geostudio.last-mile.amazon.dev/*
├── z-mx.js ✅ ├── auto-dropdown-stf.js ✅
├── middle-button-observer.js ✅ ├── remarks-us.js ✅
├── auto-dismiss-alert.js ✅ (NA only)├── remarks-general.js ✅
├── casetype-observer.js ✅ (NA only)│
├── past-deliveries-dropdown.js✅ │
├── left-paste-buttons.js ✅ │
├── right-copy-buttons.js ✅ │
└── delivery-reason-filter.js ✅ │



---

## 📥 Installation Guide (For Users)

### Prerequisites
✅ Google Chrome browser
✅ Tampermonkey extension installed
(Install from: https://chrome.google.com/webstore/detail/tampermonkey)



### Step 1: Disable Old Scripts

If you have any old individual GeoStudio scripts, **disable them first**:
Click Tampermonkey icon in Chrome toolbar
Click "Dashboard"
Toggle OFF (disable) each old script:
❌ Z MX
❌ Add Middle Button Next to Inputs with observer
❌ Auto Dismiss Validation Failed Alert
❌ Auto Drop Down Selection STF
❌ CaseType Text Observer and Display with Auto-Click
❌ Click Past Deliveries and Open Attribute Dropdown
❌ GS 2.0 Remarks for US
❌ GS 2.0 Remarks
❌ Left button to paste with observer
❌ Right buttons to copy


> ⚠️ **Important:** If old scripts are not disabled, scripts will run TWICE!

### Step 2: Install the Loader

**Click this link:**
https://raw.githubusercontent.com/kchandramani/amazon_scripts/main/loader.user.js



Tampermonkey will show an install popup → Click **"Install"**

### Step 3: Open GeoStudio
Go to your GeoStudio work page
First time: You'll see a loading screen (3-5 seconds)
After loading: Green badge "✅ Scripts installed!"
Done! Start working normally.


### Step 4: Verify Installation
Press F12 → Console tab
You should see green checkmarks:
[🔧 GS Loader] 🚀 Master Loader v1.1.0 starting...
[🔧 GS Loader] ⚡ Loading scripts from cache (v1.2.0)...
[🔧 GS Loader] ✅ Z MX - Geofence Setter
[🔧 GS Loader] ✅ Middle Button Observer
[🔧 GS Loader] ✅ Auto Dismiss Validation Alert
... (more scripts)
[🔧 GS Loader] 🎉 Done! ✅ Loaded: 8 | ⏭️ Skipped: 3



---

## 📖 Usage Guide

### Geofence Setter (`z-mx.js`)
On GeoStudio Place page:
├── Press A → Sets geofence to 25 meters
└── Press Z → Sets geofence to 50 meters



### Copy/Paste Buttons
┌─────────────────────────────────────────────────────────┐
│ │
│ ○ Paste [ DP Geocode Input ] 📋 Copy │
│ │
│ ↓ Arrow (Copy DP → RE) │
│ │
│ ○ Paste [ RE Geocode Input ] 📋 Copy │
│ │
└─────────────────────────────────────────────────────────┘

○ = Left paste button (pastes from clipboard)
📋 = Right copy button (copies to clipboard)
↓ = Middle arrow button (copies DP value to RE)



### Past Deliveries Automation
Press Q on keyboard:
├── Clicks "Past deliveries"
├── Opens "Attribute" dropdown → Selects "Count"
└── Opens "Recent 10" dropdown → Selects "All"



### CaseType Observer
Automatic:
├── Displays CaseType in floating box (top-left)
├── Shows address info (if US address, shows in green)
├── Auto-clicks expand button
├── If source1 detected:
│ ├── Clicks "Shared Delivery Area" accordion
│ └── Clicks "Edit Details"
└── Resets on submit button click



### Auto Dismiss Alert
Automatic:
└── Watches for "Validation Failed" alerts → Dismisses them instantly



### Delivery Reason Filter
Automatic panel appears when deliveries are shown:
┌─────────────────────────────────┐
│ 📍 Delivery Reason Filter 🔄 ✕│
│ │
│ [Reason 1 Button] (5) │
│ [Reason 2 Button] (3) │
│ [Reason 3 Button] (8) │
│ │
│ [Show All] [Hide All] │
└─────────────────────────────────┘

├── Click reason button → Toggle show/hide deliveries
├── Green = Visible, Red = Hidden
├── Show All → Show all deliveries
├── Hide All → Hide all deliveries
├── 🔄 → Refresh/rescan deliveries
├── ✕ → Minimize panel
└── Panel is draggable (grab header)



### STF Dropdowns (`auto-dropdown-stf.js`)
On Templates page:
├── Sv-ST button → Save + Building + Source 4
└── NA button → NA + Granularity 0 + Source 0



### Remarks Dropdowns
On Templates page:

US Remarks (left dropdown): General Remarks (right dropdown):
├── Delivery Hints ├── Delivery Hints
├── Preferred UPID Delivery ├── Preferred Delivery loc
├── RE and DP is disabled ├── Customer preference
├── DP is disabled ├── Locality Mismatch
├── RE is disabled ├── Zip Issue
├── Leasing / Locker not Found ├── NotFoundin3P
├── Mailroom not Found ├── long road
├── Traffic Road issue ├── Zip is on the same road
└── NotFoundin3P ├── CX_Hint Address Conflict
├── Within Locality
├── Multiple Road
├── Partially Matching Road
├── Adjacent locality
├── Long Road / No GCRS
├── Combination Not Found
└── Traffic Road issue



---

## ⌨️ Keyboard Shortcuts

| Key | Action | Page |
|---|---|---|
| `A` | Set geofence to **25** meters | Place page |
| `Z` | Set geofence to **50** meters | Place page |
| `Q` | Open Past Deliveries → Attribute → Count → All | Place page |

---

## 🔧 Admin Guide (Script Management)

### Tampermonkey Menu Options
Right-click Tampermonkey icon on any GeoStudio page:

🔄 Force Update Scripts → Download latest from GitHub immediately
📋 Script Status → See all scripts, versions, cache status
🗑️ Clear Cache & Redownload → Reset everything and re-download
🐛 Toggle Debug Mode → Show/hide detailed console logs
ℹ️ About → Version and author info



### Script Status Legend
✅ = Script is enabled
❌ = Script is disabled
💾 = Script is cached locally
⚠️ = Script not in cache
🟢 = Script runs on current page
🔴 = Script doesn't run on current page



---

## 🔄 Updating Scripts

### Update a Script's Logic
Go to https://github.com/kchandramani/amazon_scripts

Navigate to scripts/[filename].js

Click pencil icon (✏️ Edit)

Make your changes

Click "Commit changes"

Open manifest.json

Change version number:
"version": "1.2.0" → "version": "1.2.1"

Click "Commit changes"

⚠️ IMPORTANT: Always update the version number!
Without version change, users won't get the update.



### Version Numbering Guide
Version format: MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (small fix, typo, minor change)
1.0.1 → 1.1.0 (new feature, new script added)
1.1.0 → 2.0.0 (major rewrite, breaking changes)

Examples:
├── Changed a remark text? → 1.2.0 → 1.2.1
├── Added new script? → 1.2.1 → 1.3.0
├── Fixed a bug? → 1.3.0 → 1.3.1
└── Rewrote the loader? → 1.3.1 → 2.0.0



---

## ➕ Adding New Scripts

### Step 1: Create Script File
Go to GitHub repo
Click "Add file" → "Create new file"
Name: scripts/my-new-script.js
Write your script code (WITHOUT Tampermonkey headers)
Click "Commit changes"


### Step 2: Update manifest.json

Add new entry to the `scripts` array:

```json
{
    "name": "My New Script",
    "file": "my-new-script.js",
    "enabled": true,
    "priority": 12,
    "description": "What this script does",
    "matchPatterns": [
        "geostudio.last-mile.amazon.dev/place"
    ]
}
Step 3: Update Version

"version": "1.2.0" → "version": "1.3.0"
Script File Format

// ❌ DO NOT include Tampermonkey headers:
// ==UserScript==
// @name         ...
// @match        ...
// ==/UserScript==

// ✅ Only include the actual JavaScript code:
(function() {
    'use strict';
    
    // Your script code here
    console.log('My script is running!');
    
})();
matchPatterns Guide

// Runs on ALL GeoStudio place pages (NA, EU, FE):
"matchPatterns": ["geostudio.last-mile.amazon.dev/place"]

// Runs ONLY on NA place page:
"matchPatterns": ["na.geostudio.last-mile.amazon.dev/place"]

// Runs on ALL templates pages:
"matchPatterns": ["templates.geostudio.last-mile.amazon.dev"]

// Runs on BOTH place and templates pages:
"matchPatterns": [
    "geostudio.last-mile.amazon.dev/place",
    "templates.geostudio.last-mile.amazon.dev"
]

// Runs on ALL pages (no filter):
"matchPatterns": []
Priority Guide

Priority determines loading order (lower = loads first):

Priority 1-3:   Critical scripts (observers, event listeners)
Priority 4-7:   Feature scripts (dropdowns, buttons)
Priority 8-10:  UI enhancement scripts (remarks, styling)
Priority 11+:   Optional/new scripts
❌ Disabling Scripts
Disable a Single Script
Edit manifest.json:


// Change enabled from true to false:
{
    "name": "Auto Dismiss Validation Alert",
    "file": "auto-dismiss-alert.js",
    "enabled": false,        ← Change this
    "priority": 3,
    "description": "..."
}
Don't forget to update the version!

Disable Multiple Scripts

// Set enabled: false for each script you want to disable
{
    "name": "Script A",
    "enabled": false    ← Disabled
},
{
    "name": "Script B",
    "enabled": true     ← Still running
},
{
    "name": "Script C",
    "enabled": false    ← Disabled
}
🛑 Emergency Controls
Kill Switch - Stop ALL Scripts
Edit manifest.json:


"globalSettings": {
    "killSwitch": true,     ← Set to true
    "debugMode": false
}
This immediately stops ALL scripts for ALL users on next page refresh.

To re-enable:


"killSwitch": false
Send Announcement to All Users
Edit manifest.json:


"announcement": "⚠️ Maintenance at 10 PM tonight. Scripts may not work."
This shows as a blue badge on all users' screens. Clear it by setting:


"announcement": ""
❓ Troubleshooting
Scripts Not Loading

Problem: No scripts running after installation
Solution:
1. Check if Tampermonkey is enabled in Chrome
2. Check if loader is enabled in Tampermonkey Dashboard
3. Right-click Tampermonkey → "🗑️ Clear Cache & Redownload"
4. Refresh the page
Scripts Running Twice

Problem: Buttons appearing twice, actions happening twice
Solution:
1. Open Tampermonkey Dashboard
2. Disable ALL old individual scripts
3. Keep ONLY "🔧 GeoStudio Scripts - Master Loader" enabled
Update Not Applying

Problem: Changed script on GitHub but users still have old version
Solution:
1. Make sure you updated version in manifest.json
2. Tell users to refresh the page (loads cache + checks update)
3. Tell users to refresh AGAIN (applies the downloaded update)
   OR
4. Tell users: Tampermonkey menu → "🔄 Force Update Scripts"
GitHub Fetch Failing

Problem: "Update check failed" in console
Solution:
1. Check if repository is PUBLIC on GitHub
2. Check internet connection
3. Check if raw.githubusercontent.com is accessible
4. Scripts will still work from cache (offline mode)
Specific Script Not Working

Problem: One script shows ❌ in console
Solution:
1. Press F12 → Console → Look for red error message
2. Check the script file on GitHub for syntax errors
3. Make sure the script doesn't have Tampermonkey headers
4. Check matchPatterns in manifest.json
Console Commands for Debugging

Open F12 → Console and type:

// Check what's cached:
GM_getValue('manifestVersion')

// Check manifest:
JSON.parse(GM_getValue('manifest'))

// Check specific script cache:
GM_getValue('script_z-mx.js')
❓ FAQ
Q: Do users need to install anything after the first time?
A: No. The loader handles everything automatically. Users install once and never need to do anything again.

Q: How fast do updates reach users?
A: On next page refresh. The flow is:

Refresh 1: Loads old cache + downloads new version in background
Refresh 2: Loads new version from cache
Q: Will there be any delay compared to local scripts?
A: First visit has a 3-5 second download. After that, scripts load from local cache with only ~20-50ms overhead (unnoticeable).

Q: What happens if GitHub is down?
A: Scripts load from local cache. They'll continue working normally. Updates will resume when GitHub is accessible again.

Q: Can I have different scripts for different users?
A: Currently all users get the same scripts. You can control which scripts are enabled/disabled globally through manifest.json.

Q: Do scripts work during page navigation without refresh?
A: Yes. Once loaded, scripts run in browser memory. MutationObservers and event listeners continue working during SPA navigation.

Q: Can users force an update?
A: Yes. Right-click Tampermonkey icon → "🔄 Force Update Scripts". This downloads everything fresh and reloads the page.

Q: How do I know which version users are on?
A: Users can check: Tampermonkey menu → "📋 Script Status" or "ℹ️ About". Version is also logged in browser console.

📝 Changelog
v1.2.0 (Latest)

+ Added Delivery Reason Filter script
+ Filter panel appears when deliveries are visible
+ Show/Hide All buttons
+ Draggable panel UI
+ Auto-positions next to accordion
v1.1.0

+ Removed automatic 1-hour update interval
+ Updates now ONLY on manual page refresh
+ Simplified update logic
+ Updated loader version to 1.1.0
v1.0.0

+ Initial release
+ Centralized loader with 10 scripts
+ Cache system for instant loading
+ URL-based script matching
+ Kill switch and announcement support
+ Tampermonkey menu commands
+ Loading overlay for first-time setup
+ Status badge notifications
🔧 manifest.json Reference

{
    "version": "1.2.0",              // Update this on EVERY change
    "lastUpdated": "2025-01-15",     // Date of last update
    "announcement": "",               // Message shown to all users
    "globalSettings": {
        "killSwitch": false,          // true = stop ALL scripts
        "debugMode": false            // true = verbose logging
    },
    "scripts": [
        {
            "name": "Display Name",       // Shown in console & status
            "file": "filename.js",        // File in scripts/ folder
            "enabled": true,              // true/false to enable/disable
            "priority": 1,               // Loading order (lower = first)
            "description": "What it does",// Shown in status panel
            "matchPatterns": [            // URL filters
                "geostudio.last-mile.amazon.dev/place"
            ]
        }
    ]
}
🏗️ Technical Details
Architecture

┌──────────────────────────────────────────────────────────────┐
│ User's Browser                                               │
│                                                              │
│  Tampermonkey Extension                                      │
│  └── loader.user.js (installed once)                         │
│      │                                                       │
│      ├── Cache Manager (GM_setValue / GM_getValue)            │
│      │   ├── manifest (JSON)                                 │
│      │   ├── script_z-mx.js (code string)                    │
│      │   ├── script_middle-button-observer.js                │
│      │   └── ... (all script code cached)                    │
│      │                                                       │
│      ├── URL Matcher                                         │
│      │   └── Checks current page against matchPatterns       │
│      │                                                       │
│      ├── Script Executor                                     │
│      │   ├── Wraps code with GM_ bridge                      │
│      │   └── eval() executes cached code                     │
│      │                                                       │
│      └── Update Checker                                      │
│          └── Fetches manifest.json from GitHub               │
│              └── If new version → downloads all scripts      │
│                                                              │
│  GitHub (raw.githubusercontent.com)                          │
│  └── kchandramani/amazon_scripts/main/                       │
│      ├── manifest.json                                       │
│      └── scripts/*.js                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
GM_ Bridge
Scripts loaded via eval() don't have direct access to Tampermonkey's GM_* functions. The loader creates a bridge:


window.__GM_BRIDGE = {
    GM_setValue, GM_getValue, GM_deleteValue,
    GM_xmlhttpRequest, GM_addStyle,
    GM_notification, GM_registerMenuCommand
};
Each script is wrapped to receive these functions as local variables.

Security Notes

⚠️ This system uses eval() to execute cached scripts.
   - Only scripts from YOUR GitHub repository are executed
   - Repository should be kept secure
   - Review all pull requests carefully
   - Use branch protection on main branch
👤 Author
kchandramani (manichk)

GitHub: github.com/kchandramani
Repository: amazon_scripts
📄 License
This project is for internal use within Amazon GeoStudio teams.

🚀 Quick Start Checklist

For Users:
□ Install Tampermonkey extension
□ Disable all old GeoStudio scripts
□ Click loader install link
□ Open GeoStudio page
□ Wait for first-time download
□ Start working!

For Admin:
□ Upload all files to GitHub
□ Verify manifest.json is correct
□ Test loader yourself first
□ Share install link with team
□ Remember to update version on every change
<p align="center"> <b>Install once. Update from anywhere. Works everywhere.</b> </p> ```
