---
name: workast
description: >
  Manage Workast spaces, tasks, notes, forms, meetings, and reports.
  Use when the user mentions Workast, pastes a Workast URL, or wants to
  create, assign, search, or complete work. Workast is the system of
  record for work done by people and agents.
---

# Workast

Never invent space, user, task, field, tag, or list ids.

## Product model

A **task** is the unit of work. Every task belongs to a **Space** and a
**List** inside that Space. Built-in status is only open or complete.
Do not invent other statuses. Teams track progress by moving tasks
between Lists, or with a custom field that has options.

### Lists

Every Space has at least one List. New Spaces start with a default List
named "Open Tasks" that can be renamed. Tasks created without a specific
list land on the default List.

Lists are flexible groupings defined for that Space. A List can represent
status stages (Open, In Progress, Review), sprints or phases, clients,
categories, or small projects inside a larger Space.

Create a List with `workast_create_sublist` when the workflow needs one
that does not exist. Prefer the lists already in the Space and named in
the README before creating new ones. Board view shows each List as a
column.

Space types:

- **Group** — shared project, department, or client. Default.
- **Personal** — one per user. Private. Cannot assign, invite, rename,
  or delete. Use `workast_create_personal_tasks`.
- **Direct** — one-to-one between two people.

A Space README is living guidance for humans and agents: how to write
tasks, which list, required fields, what to do on complete. Notes are
longer docs in the Space (processes, skills). The README may link to them.

Forms collect responses that become tasks. Create a draft with
`workast_create_form`; the user publishes it at the returned `editUrl`.
List forms with `workast_list_forms` (`submitUrl` is the public page).

## Project file

Before creating or searching, look for `WORKAST.md` in the repo root.

If it exists, use its pinned space, default list, and conventions. They
beat guessing. If it conflicts with the space README, follow the README
for how the task is written and `WORKAST.md` for which space.

If no `WORKAST.md` exists and the user is working in a repo that maps to
one space (repeated creates, a named project, or a coding agent session),
suggest creating one after the first successful task. Offer this stub
and fill the space id you just used:

```markdown
# Workast

Space: <name>
Space id: <id>
Default list: <name or id>

## Conventions
- Summaries are imperative
- 
```

Do not create the file unless the user agrees.

## Create a task in a space

1. Resolve the space. Id from `WORKAST.md` or the user, or
   `workast_list_spaces` by name. Each result includes `hasReadme`.
2. If `hasReadme` is true, `workast_retrieve_space` and follow the
   README for lists, fields, assignees, and format. Note `defaultList`
   and list ids. If the README points at a Note, `workast_retrieve_note`.
   Skip retrieve when `hasReadme` is false unless you need list ids.
   If the task belongs in a list that does not exist, create it with
   `workast_create_sublist` rather than forcing it onto the default.
3. Resolve people with `workast_list_coworkers`. Filter by `name`
   (case-insensitive) or exact `email`. `assignedTo` is user ids, not
   names. `role` is `admin`, `member`, `guest`, or `viewer` — a viewer
   cannot create, edit, or complete work. Use
   `workast_list_space_participants` only to check membership or answer
   who is in the space. Do not assign in a Personal Space.
4. Required custom fields → `workast_list_fields` and set them.
5. Confirm summary, list, assignees, and due date when inferred.
6. `workast_create_tasks`. Title goes in `summary`. Description is GFM
   (no images, raw HTML, or mentions). Use `subListId` for a specific
   list; omit it to land on `defaultList`. Omit empty fields.

No space, or the user’s own private work → `workast_create_personal_tasks`.

## Find or change

- Pasted URL: task id is the `/task/` segment, not the space id.
  Then `workast_retrieve_tasks`.
- Short ids (`TQ7ZK`) go to `workast_retrieve_tasks` via `shortIds`.
- Search with filters, not title guesses.
- Reschedule with `workast_update_tasks`. Complete only with
  `workast_complete_tasks`, and only when asked. Completing a recurring
  task creates the next one.
- Break work with `workast_create_subtasks`. A subtask cannot have
  subtasks.
- Space rules live in the README. Update them with
  `workast_update_space_readme` (GFM, no images or raw HTML).

## Reply

Link the task summary in markdown: `[Ship the skill](https://...)`.
Add the short id after the link only if the user needs a handle
(`TQ7ZK`). Do not dump tool JSON. If a lookup finds nothing, say so.
