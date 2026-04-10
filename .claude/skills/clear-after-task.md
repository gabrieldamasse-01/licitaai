# Clear After Task Skill

Use this skill when a task is completed or abandoned to clear context and save tokens.

## When to Use

Invoke this skill when:
1. **Task Completed**: You successfully finished the requested work (e.g., fixed a bug, implemented a feature)
2. **Task Abandoned**: User decides to skip/move on to another task without completing the current one
3. **Context Reset Needed**: After a significant piece of work is done and user wants to start fresh

## When NOT to Use

Do NOT use this skill when:
- Task is partially complete and needs continuation
- User is asking follow-up questions about the same work
- There are pending subtasks to complete

## Instructions

After completing or abandoning a task:

1. **Confirm with user**: Say something like "Tarefa concluída! Limpando contexto para economizar tokens..."

2. **Use /clear**: The clear command will be executed by the user or you can suggest they type `/clear`

3. **Reference CLAUDE.md**: Always start fresh by reading CLAUDE.md first to understand project context without reading chat history

## Token Economy Rules

- Always read CLAUDE.md first to find where files are located
- Use the folder map to go directly to the correct file
- Never read entire directories when you know the specific file path
- Avoid reading unrelated files (e.g., don't read supabase files if working on frontend)
- Check CLAUDE.md for the exact path before using Glob/Grep

## Example

```
User: "Arruma o botão de login"
[... fixes login button ...]
Assistant: "Botão de login arrumado! ✓

Tarefa concluída. Para economizar tokens, execute /clear para limpar o contexto.
O CLAUDE.md contém todo o contexto necessário para próximas tarefas."
```