# DomusUnify - Web App Features (English)

Last updated: 2026-02-20

This document describes the **user-facing features** of the DomusUnify website/web app (what users can do), without going into technical implementation details.

## 1) What is DomusUnify?

DomusUnify is a family/household coordination web app where you can:
- create an account and sign in
- work inside a shared **Family** space (your household)
- manage shared information such as **Lists**, **Calendar events**, and **Budgets/Finance**
- see updates reflected quickly when other family members make changes (real-time experience)

## 2) Key concepts (how the app is organized)

### 2.1 Account
An account represents one person. With an account you can:
- create a profile (sign up)
- sign in and stay signed in
- sign out

### 2.2 Family workspace
A **Family** is the main shared workspace. Most things you do (lists, calendar, budgets) belong to a family.

If you belong to multiple families, you can select which one you are currently working on.

### 2.3 Roles and permissions
Inside a family, users can have different roles (for example Admin / Member / Viewer). Roles exist to:
- protect shared data (not everyone should be able to delete or edit everything)
- keep the household organized

## 3) Feature catalog (what each feature is for)

### 3.1 Authentication (Sign up / Sign in)
Purpose:
- Let users securely access the app.

What users can do:
- Create an account using name, email, and password
- Sign in using email and password
- (Optional) Sign in using Google, if enabled
- Sign out

### 3.2 Family management (create/select your household)
Purpose:
- Create and manage the shared family space where data lives.

What users can do:
- Create a new family (household)
- View families they belong to
- Select the active family (so the app shows the correct data)
- View the members of the family (and their roles)

### 3.3 Invitations (bring more people into your family)
Purpose:
- Help family members join the same shared space easily.

Typical flow:
1) A family member creates an invite
2) The invited person opens the invite, sees which family it belongs to, and confirms
3) The invited person becomes a member of that family

### 3.4 Shared lists (Shopping / Tasks / Custom)
Purpose:
- Coordinate day-to-day household work and shared checklists.

What users can do:
- Create lists (shopping lists, task lists, or custom lists)
- See all lists for the family
- Track progress (how many items are completed)

List items (inside a list):
- Add items
- Mark items as done / not done
- Rename items
- Delete items

### 3.5 Item categories (optional organization for list items)
Purpose:
- Keep lists easy to scan by grouping items (example: Groceries, Cleaning, Pharmacy).

What users can do:
- Create categories
- Rename/reorder categories
- Assign items to categories (or remove a category from an item)

### 3.6 Calendar (family calendar)
Purpose:
- Keep family events in one place (appointments, birthdays, school events, trips, etc.).

What users can do:
- Create, view, edit, and delete events
- Set recurring events (repeat rules) and manage exceptions (single-occurrence changes)
- Control who participates and who can see an event (visibility)
- Set reminders
- Export events to an `.ics` file (so they can be imported into other calendar apps)

### 3.7 Budgets (household budgeting)
Purpose:
- Track household budgets over time (recurring) or within a specific time window (one-time).

What users can do:
- Create budgets and view budget details
- Decide who can see a budget (private vs shared)
- Configure spending limits (overall limit and per-category limits)
- View totals for the current budget period

### 3.8 Finance (income and expenses inside a budget)
Purpose:
- Record income and expenses so budgets can show totals and reports.

What users can do:
- Create and manage finance categories (Expense / Income)
- Create and manage accounts (cash, bank account, credit card, etc.)
- Add and manage transactions (amount, date, category, account, notes)
- Mark transactions as paid (when relevant)
- View summaries (by category, by person, by account)
- Export transaction data when needed

### 3.9 Real-time experience (automatic refresh)
Purpose:
- Make collaboration smooth when multiple people are using the app at the same time.

What users notice:
- When someone updates shared data (like lists), other users see the change reflected quickly without manually refreshing.

## 4) What is currently visible in the web UI (today)

As of now, the web UI focuses on:
- Signing in / signing up
- Creating or selecting an active family
- Viewing lists and creating new lists
- A basic real-time status indicator on the lists page

## 5) Planned / not yet exposed in the web UI

Depending on your current build, some features may be planned but not visible yet, such as:
- Full list item management screens
- Category management screens
- Invitation screens (create/preview/join)
- Calendar screens
- Budgets and finance screens
