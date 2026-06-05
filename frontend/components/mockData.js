import { makeId } from "./utils"

export const INITIAL_CONVERSATIONS = [
  {
    id: "c1",
    title: "Marketing plan for launch",
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messageCount: 12,
    preview: "Drafting a 4-week GTM plan with channels, KPIs, and budget...",
    pinned: true,
    folder: "Work Projects",
    messages: [
      {
        id: makeId("m"),
        role: "user",
        content: "Draft a 4-week GTM plan.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: makeId("m"),
        role: "assistant",
        content: "Sure — phases, owners, risks, and KPIs coming up.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
      },
    ],
  },
]

export const INITIAL_TEMPLATES = [
  {
    id: "t1",
    name: "Bug Report",
    content: `**Bug Report**

  **Description:**
  Brief description of the issue

  **Steps to Reproduce:**
  1. Step one
  2. Step two
  3. Step three

  **Expected Behavior:**
  What should happen

  **Actual Behavior:**
  What actually happens

  **Environment:**
  - Browser/OS:
  - Version:
  - Additional context:`,
    snippet: "Structured bug report template with steps to reproduce...",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const INITIAL_FOLDERS = [
  { id: "f1", name: "Work Projects" },
]
