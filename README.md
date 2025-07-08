# Hackathon Project: Playwright Trace CLI

An **interactive CLI** for analyzing Playwright trace files, with the intent of making trace file analysis more streamlined and simple

![pw-trace-cli demo](gif/2025-07-08%2012.22.50.gif)

---

## 🎯 Project Goal

In this hackathon, we aimed to build a **QA Friendly** tool that:  
- Provides the most important information from Playwright trace files
- Easy to set up  
- Utilizes clack/prompts package for easy of use

---

## ⚙️ Features

- **Interactive Menu**: Pick traces, analyses, and filters via arrow keys  
- **Summary Report**: Total events, duration, start/end timestamps, event‑type breakdown  
- **Type Listing**: View all unique record types in a trace  
- **Network Dump**: List HTTP requests/responses, with optional URL filters  

---

## 🛠 Tech Stack

- **Node.js** & **TypeScript**: Core runtime and static typing  
- **Playwright Test**: Generates real-world trace data  
- **JSZip**: Parses ZIP archives in-memory  
- **@clack/prompts**: Lightweight, customizable terminal prompts & spinners  
- **picocolors**: Terminal color styling

---

## 🚀 Setup & Run

1. **Clone & Install**  
   ```bash
   git clone git@github.com:willdarkins/Playwright-Trace-Analyzer.git
   cd pw-trace-cli
   npm install
   ```

2. **Generate a Trace** (in another terminal)  
   ```bash
   npx playwright test tests/network-trace.spec.ts
   ```
   Code produces trace ZIPs under `test-results/` by default
   This can be edited...

3. **Build & Link**  
   ```bash
   npm run build
   npm link
   ```

4. **Launch the CLI**  
   ```bash
   pw-trace-cli
   ```
   - Select your trace file  
   - Choose **📝 Summary** to view event metrics
   - Choose **🔍 Types** lists the trace events
   - Choose **🌐 Network** to inspect HTTP calls
   - Choose **📦 Resources** provides all other non-trace artifacts/files in zip

---

## 🤷‍♂️ Lessons Learned

- The project was most likely too ambitious for my current skill level
- Much of the functionality remains missing and bug ridden
- Considering two days were spent mostly setting up the CLI framework, I should have worked harder on nailing down the logic
- Did not have time to publish to NPM registry

---

## 👟 Next Steps

- Collaborate with developer to refine logic in `analyzer.ts` file
- Present to QA team and get feedback