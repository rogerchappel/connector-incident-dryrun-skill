# Brief Format

Markdown actions use one line per connector proposal:

```markdown
- [slack] action=post; message=Post update; approval=required; rollback=delete message
```

JSON briefs must use an object at the document root. The optional `actions` field
defaults to an empty array; when present, it must be an array of action objects
with `target`, `action`, `message`, `approval`, and `rollback` fields. Valid
approval values are `required`, `optional`, and `preapproved`.

Malformed JSON, non-object roots (including `null`, arrays, and scalars), and
non-array `actions` values are rejected as input errors. The CLI writes a concise
diagnostic to stderr, prints no plan, and exits with status `1`.

Known targets receive stable side-effect labels. Unknown targets are classified as `external-write`.
