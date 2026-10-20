# Workast MCP

[![CI](https://github.com/workast/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/workast/mcp/actions/workflows/ci.yml)

Organize work with your team and agents.

Ask Cursor, Claude, or ChatGPT for a task, a meeting follow-up, or a report. The work lands in the spaces your team already uses.

## Add Workast

Add the server, then authorize when the client asks you to sign in to Workast.

The server is `https://mcp.workast.com/mcp`.

### Cursor

Cursor asks you to add Workast, then asks you to sign in.

To add it yourself, put this in `~/.cursor/mcp.json` for every project, or in `.cursor/mcp.json` for one repo:

```json
{
  "mcpServers": {
    "workast": {
      "url": "https://mcp.workast.com/mcp"
    }
  }
}
```

[<img alt="Add Workast MCP server to Cursor" src="https://cursor.com/deeplink/mcp-install-dark.png" height="20">](cursor://anysphere.cursor-deeplink/mcp/install?name=workast&config=eyJ1cmwiOiJodHRwczovL21jcC53b3JrYXN0LmNvbS9tY3AifQ==)

### VS Code

VS Code asks you to sign in to Workast.

To add it yourself, put this in `.vscode/mcp.json`:

```json
{
  "servers": {
    "workast": {
      "type": "http",
      "url": "https://mcp.workast.com/mcp"
    }
  }
}
```

[<img alt="Install in VS Code" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Server&color=0098FF">](vscode:mcp/install?%7B%22name%22%3A%22workast%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.workast.com%2Fmcp%22%7D) [<img alt="Install in VS Code Insiders" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Server&color=24bfa5">](vscode-insiders:mcp/install?%7B%22name%22%3A%22workast%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.workast.com%2Fmcp%22%7D)

### Visual Studio

Visual Studio asks you to sign in to Workast.

[<img alt="Install in Visual Studio" src="https://img.shields.io/badge/Visual_Studio-Install_Server-purple?style=flat-square&logo=visualstudio&logoColor=white">](https://vs-open.link/mcp-install?%7B%22name%22%3A%22workast%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.workast.com%2Fmcp%22%7D)

### Claude

Open **Customize → Connectors → Add → Custom → Web**. Enter `https://mcp.workast.com/mcp` and choose sign in. Claude asks you to authorize.

### ChatGPT

Open **Plugins**, choose **Add custom MCP server**, and enter `https://mcp.workast.com/mcp`. Choose OAuth. ChatGPT asks you to authorize.

### Claude Code

```sh
claude mcp add --transport http workast https://mcp.workast.com/mcp
```

In Claude Code, run `/mcp` and sign in to Workast when asked.

### Any other client

Add `https://mcp.workast.com/mcp`. The client asks you to authorize.

## Ask for work

After you authorize, paste a prompt.

**Turn a plan into tasks**

> Read the launch plan in the Marketing space. Create the tasks on the Open list, and assign them the way that space's README says.

**Pick up a task from a link or a short id**

> What's going on with TQ7ZK? If it's still open, comment that we're blocked on design.

**Close the loop after a meeting**

> From this week's product meeting, comment on each task we discussed. Create anything we agreed to that is not already a task.

**See the work on your plate**

> What is assigned to me this week? Use the saved report if there is one.

**Write a space down**

> Draft a README for the Bugs space from how we already write those tasks. Show it to me before you save it.

**Open a form**

> Create a draft form in the Support space for bug reports. Give me the link to publish it.

## What you can ask for

- **Tasks.** Create, search, update, complete, comment, and split work into subtasks. Personal tasks too.
- **Spaces.** Find or create a space, set its lists, invite people, and update the README that says how work there is written.
- **People.** See who you are, find a teammate, and assign them.
- **Notes and forms.** Read and write notes. Create a draft form that turns responses into tasks. You publish the form.
- **Meetings.** List meetings in a date range and read one, including the transcript when you ask for it.
- **Fields and reports.** Use the custom fields a space already has. Open a saved report and the tasks in it.

## How it stays accurate

This server includes a Workast skill. The client reads it and follows the product's rules.

Before it creates work in a space, it reads that space's README and uses the lists, fields, and format written there.

If the repo has a `WORKAST.md` file, that file names the space for the project.

It looks up spaces, people, and tasks. If a lookup finds nothing, it says so.

## Headless access

Use a key when an agent cannot show a sign-in prompt. Log in to your Workast account and create a key for that agent. You stay logged in as yourself. The agent uses the key.

```json
{
  "mcpServers": {
    "workast": {
      "url": "https://mcp.workast.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_KEY"
      }
    }
  }
}
```

Replace `YOUR_KEY` with the key you created.

## Tools

### Tasks

| Tool | What it does |
| --- | --- |
| `workast_search_tasks` | Search tasks |
| `workast_retrieve_tasks` | Get tasks by id or short id |
| `workast_create_tasks` | Create tasks in a space |
| `workast_create_personal_tasks` | Create personal tasks |
| `workast_create_subtasks` | Create subtasks |
| `workast_update_tasks` | Update tasks |
| `workast_complete_tasks` | Mark tasks done |
| `workast_create_comment` | Comment on a task |
| `workast_list_task_activity` | Read activity on a task |

### Spaces

| Tool | What it does |
| --- | --- |
| `workast_list_spaces` | Find spaces |
| `workast_retrieve_space` | Read a space, its lists, and its README |
| `workast_create_space` | Create a space |
| `workast_update_space` | Update a space, its lists, and its fields |
| `workast_update_space_readme` | Replace a space README |
| `workast_list_space_participants` | See who is in a space |
| `workast_add_space_participants` | Add people to a space |

### People

| Tool | What it does |
| --- | --- |
| `workast_about_me` | Current user and team |
| `workast_list_coworkers` | Find teammates |

### Notes

| Tool | What it does |
| --- | --- |
| `workast_list_notes` | List notes in a space |
| `workast_retrieve_note` | Read a note |
| `workast_create_note` | Create a note |
| `workast_update_note` | Update a note |

### Forms

| Tool | What it does |
| --- | --- |
| `workast_list_forms` | List forms |
| `workast_create_form` | Create a draft form |

### Meetings

| Tool | What it does |
| --- | --- |
| `workast_list_meetings` | List meetings in a date range |
| `workast_retrieve_meeting` | Read a meeting |

### Fields and reports

| Tool | What it does |
| --- | --- |
| `workast_list_fields` | List custom fields |
| `workast_create_field` | Create a field and turn it on for a space |
| `workast_update_field` | Update a field |
| `workast_list_reports` | List saved reports |
| `workast_retrieve_report` | Open a report and its tasks |

### Connection

| Tool | What it does |
| --- | --- |
| `workast_ping` | Check that the connection works |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT
