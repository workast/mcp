---
name: workast
description: >
  Manage Workast spaces, lists, tasks, notes, forms, meetings, and reports.
  Use when the user mentions Workast, pastes a workast.com or workast.app
  URL, gives a short task id, or asks to create, assign, search, complete,
  or comment on work in Workast.
---

# Workast

Never invent space, user, task, field, tag, or list ids. If a lookup finds nothing, say so. If more than one person matches, ask which one.

## Product model

A task belongs to a Space and a List in that Space. Users say open and complete. Search with `statusIs` `pending` and `done`. `removed` is only a search filter. Create and update do not take a status. Track progress by moving tasks between Lists, or with an options field.

Every Space has a default List, initially "Open Tasks", which can be renamed. Omit `listId` to land there.

Change lists with `workast_update_space` after `workast_retrieve_space`. Use list ids from that result. Prefer lists the README already names.

- `lists.add` (`name`).
- `lists.rename` (`id`, `name`), including the default list.
- `lists.remove` (ids) deletes the open tasks on those lists. Move them with `workast_update_tasks` (`listId`) first. The default list cannot be removed. Set `defaultList` to another existing list in the same call, then remove the old one.
- A list added in this call cannot be `defaultList` until a later call returns its id.

Space types: `group` (shared; default), `personal` (one per user; cannot assign, invite, rename, or delete), `direct` (two people; cannot rename; assign only participants of that space).

The README is how tasks in that Space are written. Notes are longer docs. The README may point at a Note.

Forms become tasks. Create a draft with `workast_create_form`; the user publishes it at `editUrl`. `workast_list_forms` returns `submitUrl` when `canSubmit` is true. List forms before creating one the user says may already exist.

## Project file

Before creating or searching, look for `WORKAST.md` in the repo root.

If it exists, use its space, default list, and conventions. If it conflicts with the space README, follow the README for how the task is written and `WORKAST.md` for which space.

If none exists and this repo maps to one space, offer this stub after the first successful task and fill the space id you used. Create the file only after the user agrees.

```markdown
# Workast

Space: <name>
Space id: <id>
Default list: <name or id>

## Conventions
- Summaries are imperative
```

## Create a task

1. Resolve the space from `WORKAST.md`, the user, or `workast_list_spaces`. Pass the candidate name as `name` (case-insensitive substring of the stored space name). For a shared space, also pass `type` `group`. Each result includes `hasReadme`. Keep the space whose name equals the request, ignoring case. A shorter space that only shares a word is a different space. To create a space, list with that `name` first. An exact name match is that space. No exact name match: `workast_create_space`. Two exact names: ask which one. Do not retrieve partial matches. `privacy` is `private` or `team` (default `team`).
2. If `hasReadme` is true, `workast_retrieve_space` and follow the README for lists, fields, assignees, and format. Note `defaultList` and list ids. If the README points at a Note, `workast_retrieve_note`. Skip retrieve when `hasReadme` is false unless you need list ids. Add a missing list with `lists.add` instead of forcing the task onto the default.
3. Resolve people with `workast_list_coworkers` (`name` is case-insensitive, `email` is exact). `assignedTo` is user ids. A `viewer` cannot create, edit, or complete work. Use `workast_list_space_participants` to check membership or say who is in the space. Do not assign in a personal space. For the current user, call `workast_about_me`.
4. Required custom fields come from `workast_list_fields`.
5. Apply the summary, list, assignees, and due date the user stated or clearly implied, such as Friday or this week.
6. `workast_create_tasks`. Title is `summary`. Description is GFM without images, raw HTML, or mentions. Pass `listId` for a specific list. Pass `repeat` with the due date when the task recurs. Omit empty fields.

`startDate` and `dueDate` are `YYYY-MM-DD` for a whole day, for example `2026-04-10`. When the user gives a time, use `YYYY-MM-DDTHH:mm:ss`, for example `2026-04-10T17:00:00`.

No space, or the user's own private work: `workast_create_personal_tasks`.

## Find or change

- `https://open.workast.app/<team>/task/<taskId>`: the task id is the segment after `/task/`. Retrieve it with `workast_retrieve_tasks`.
- `https://<team>.workast.com/space/<spaceId>?task=<taskId>`: the task id is the `task` query parameter. The `/space/` segment is the space id.
- `/space/<spaceId>` with no `task` parameter: `workast_search_tasks` with that `spaceId`.
- Short ids (`TQ7ZK`) go to `workast_retrieve_tasks` via `shortIds`.
- Search with filters combined with AND. Use `q` for words in the summary. `list` takes list names, not ids. For the current user's tasks, filter `assignedTo` with the id from `workast_about_me`. Follow `has_more` before saying that is all.
- A named report, including "assigned to me": `workast_list_reports`, then `workast_retrieve_report` with an id from that list.
- Meetings: `workast_list_meetings` with both `startDateAfter` and `startDateBefore`, then `workast_retrieve_meeting` for notes.
- Comments and "any movement": `workast_create_comment` and `workast_list_task_activity` after the task id is known.
- Notes: `workast_list_notes` for the space, `workast_retrieve_note` for content, `workast_create_note` to add one. List first when the user wants to avoid a duplicate.
- Add a person to a space with `workast_add_space_participants` after resolving their user id.
- Reschedule with `workast_update_tasks`, using the same `startDate` and `dueDate` shapes as create. Pass `null` to clear the due date and the start date.
- Change assignees with `workast_update_tasks`. `addAssignee` adds user ids and leaves the others. `removeAssignee` unassigns those ids after the add. To replace the assignees, add the new ids and remove the current ones. Resolve ids the same way as create.
- `repeat` needs a due date. `freq` is `daily`, `weekly`, `fortnight`, `monthly`, or `yearly`. Weekdays are `daily` with `byweekday` `0`–`4` (`0` is Monday, `6` is Sunday). The nth weekday of the month is `monthly` with `bysetpos` (`1`–`4`, or `-1` for the last) and one `byweekday`. On `workast_update_tasks`, `null` clears it; omit it to leave the current repeat.
- Complete only with `workast_complete_tasks`, and only when asked. Completing a recurring task creates the next one.
- Break work with `workast_create_subtasks`. A subtask cannot have subtasks.
- Change a space, including its readme, with `workast_update_space`. Send only the sections that change. `name` renames a group space. `readme` replaces the README (GFM, no images, raw HTML, or mentions); an empty string clears it. `defaultList` is an existing list id.
- Enable an existing field with `fields.add`. Disable it on this space with `fields.remove`. Disabling leaves the field and its task values in place.
- Edit a field's name, description, or options with `workast_update_field`. That change applies everywhere the field is enabled. For an options field, `options` is the full set: include `id` to keep an option, omit `id` to add one, and leave an option out to delete it. Create a field with `workast_create_field`.

## Reply

Link the task summary in markdown: `[Ship the skill](https://...)`.
Add the short id after the link only when the user needs a handle (`TQ7ZK`). Do not dump tool JSON.
