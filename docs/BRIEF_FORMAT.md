# Brief Format

Markdown actions use one line per connector proposal:

```markdown
- [slack] action=post; message=Post update; approval=required; rollback=delete message
  - [Notes] action=note; message=Record local observation; rollback=remove note
```

Action bullets may have leading indentation. Connector target matching is
case-insensitive. If `approval` is omitted, `notes` defaults to `optional` and
all other targets default to `required`; explicit approval values are preserved.

JSON briefs must use an object at the document root. The optional `actions` field
defaults to an empty array; when present, it must be an array of action objects
with `target`, `action`, `message`, `approval`, and `rollback` fields. Valid
approval values are `required`, `optional`, and `preapproved`.

Malformed JSON, non-object roots (including `null`, arrays, and scalars), and
non-array `actions` values are rejected as input errors. Every member of
`actions` must itself be an object; `null`, arrays, and scalar members are also
rejected. The CLI writes a concise diagnostic to stderr, prints no plan, and
exits with status `1`.

Markdown plans escape `|` as `\|` and replace line breaks with spaces in every
table cell. Each action therefore remains a single row with exactly seven cells,
even when an input value contains Markdown table delimiters or multiple lines.

Known targets receive stable side-effect labels. Unknown targets are classified as `external-write`.
