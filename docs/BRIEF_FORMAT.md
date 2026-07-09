# Brief Format

Markdown actions use one line per connector proposal:

```markdown
- [slack] action=post; message=Post update; approval=required; rollback=delete message
```

JSON briefs use an `actions` array with `target`, `action`, `message`, `approval`, and `rollback` fields. Valid approval values are `required`, `optional`, and `preapproved`.

Known targets receive stable side-effect labels. Unknown targets are classified as `external-write`.
