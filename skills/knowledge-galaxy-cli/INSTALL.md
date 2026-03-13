# 安装 Knowledge Galaxy Skill

## 概览

这个目录包含一份可分发的 agent skill，用于让其他 agent 通过 `kg` CLI 操作 Knowledge Galaxy 知识仓库。

skill 文件位于：

```text
skills/knowledge-galaxy-cli/SKILL.md
```

## 通用安装思路

大多数 agent 系统会扫描一个或多个本地 skills 目录，并自动加载其中包含 `SKILL.md` 的子目录。

因此分发这份 skill 时，应当复制整个 `knowledge-galaxy-cli/` 目录，而不是只复制其中某个文件。目标目录结构应保持为：

```text
<agent-skills-root>/
  knowledge-galaxy-cli/
    SKILL.md
    INSTALL.md
```

## 安装示例

如果目标环境采用类似下面的本地 skills 目录：

```text
~/.agents/skills/
```

那么可以这样安装：

```bash
mkdir -p ~/.agents/skills
cp -R /path/to/knowledge-galaxy/skills/knowledge-galaxy-cli ~/.agents/skills/
```

安装后的结果应为：

```text
~/.agents/skills/knowledge-galaxy-cli/SKILL.md
```

## 安装后验证

复制完成后，建议按以下顺序验证：

1. 确认目标 skills 目录中存在 `knowledge-galaxy-cli/SKILL.md`
2. 如果 agent 环境会缓存 skills，重新启动或重新加载
3. 让 agent 执行一个 Knowledge Galaxy 仓库操作，例如：
   - 创建 note
   - 校验仓库
   - 搜索文档
   - 执行项目远端命令

## 运行前提

安装 skill 只是在教 agent “如何使用这个软件”，并不会自动把 `kg` 运行时一起安装到目标机器。

目标机器仍然需要满足至少一个条件：

- 本地有这个仓库的 checkout
- 或者已经存在一个等价的 `kg` 运行环境，并且命令路径与 skill 中描述的一致

当前 skill 默认采用最稳妥的命令路径：

```bash
python3 -m implementations.python.kg [--repo /path/to/content-repo] ...
```

因此，目标环境至少还需要：

- Python 3
- 一份当前仓库代码，或者经过适配的等价运行环境

如果省略 `--repo`，当前 CLI 会默认使用：

```text
~/.knowledge-galax
```

## 当前能力边界

截至 2026-03-13，这份 skill 所面向的已实现命令包括：

- `create daily`
- `create note`
- `create decision`
- `create review`
- `create project`
- `append daily`
- `create note --stdin`
- `import clipboard note`
- `validate`
- `list`
- `search`
- `stats`
- 项目远端操作

当前仍在计划中、尚未实现的能力包括：

- 资源导入工作流
- 导出命令

## 推荐分发方式

如果你希望其他用户从这个仓库安装该 skill，推荐流程是：

1. 克隆本仓库
2. 把 `skills/knowledge-galaxy-cli/` 目录复制到对方自己的 agent skills 目录
3. 如果希望 skill 中的命令能直接按原文执行，保留本仓库在本地的可访问路径

## 维护说明

- `SKILL.md` 负责告诉 agent 何时以及如何使用 `kg`
- `INSTALL.md` 负责告诉人类如何分发和安装这份 skill
- 如果以后修改了命令路径、默认仓库行为或安装方式，必须同时更新这两个文件
