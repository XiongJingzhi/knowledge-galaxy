# Installing The Knowledge Galaxy Skill

## Overview

This directory contains a distributable agent skill for operating Knowledge Galaxy content repositories through the `kg` CLI.

The skill itself is:

```text
skills/knowledge-galaxy-cli/SKILL.md
```

## General Installation Idea

Most agent systems discover skills by scanning one or more local skill directories for folders that contain a `SKILL.md` file.

To distribute this skill, copy the whole `knowledge-galaxy-cli/` directory into the target agent's local skills directory so that the final structure looks like:

```text
<agent-skills-root>/
  knowledge-galaxy-cli/
    SKILL.md
    INSTALL.md
```

Do not copy only the file contents into another document. Keep the directory structure intact.

## Example: Codex / Agents-Style Local Skill Directory

If the target environment uses a local directory like:

```text
~/.agents/skills/
```

you can install the skill like this:

```bash
mkdir -p ~/.agents/skills
cp -R /path/to/knowledge-galaxy/skills/knowledge-galaxy-cli ~/.agents/skills/
```

The installed result becomes:

```text
~/.agents/skills/knowledge-galaxy-cli/SKILL.md
```

## Verifying The Install

After copying the folder:

1. Confirm the target skill directory contains `knowledge-galaxy-cli/SKILL.md`
2. Restart or reload the agent environment if it caches available skills
3. Ask the agent to perform a Knowledge Galaxy content-repository task such as:
   - create a note
   - validate a repo
   - search documents
   - run a project remote command

## Runtime Assumptions

Installing the skill only teaches the agent how to use the software. The target machine still needs access to this repository or an equivalent `kg` runtime path.

The current skill assumes the safest command path is:

```bash
python3 -m implementations.python.kg --repo /path/to/content-repo ...
```

So the user or agent must also have:

- a checkout of this repository, or
- an adapted environment where the same command path is available

## Recommended Distribution Pattern

If you want other users to install the skill from this repository:

1. Clone the repository
2. Copy `skills/knowledge-galaxy-cli/` into their own agent skills directory
3. Keep this repository available locally if they want the command examples in the skill to work as written

## Notes

- `SKILL.md` tells the agent when and how to use `kg`
- `INSTALL.md` tells humans how to distribute the skill
- If you later change command paths or packaging, update both files together
