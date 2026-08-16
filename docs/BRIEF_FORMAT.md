# Brief Format

Markdown actions use one line per connector proposal:

```markdown
- [slack] action=post; message=Post update; approval=required; rollback=delete message
  - [Notes] action=note; message=Record local observation; rollback=remove note
```

Action bullets may have leading indentation. Connector target matching is
case-insensitive. If `approval` is omitted, `notes` defaults to `optional` and
all other targets default to `required`; explicit approval values are preserved.
Field names are recognized only at the start of the action text or immediately
after a semicolon, so text such as `message=Status disapproval=optional` does not
set the `approval` field.

JSON briefs must use an object at the document root. The optional `actions` field
defaults to an empty array; when present, it must be an array of action objects
with optional `id`, `target`, `action`, `message`, `approval`, `rollback`, and
`evidence` fields. The root's optional `incident`, `title`, and `severity` fields
and every listed action field must be strings when present. Omitting fields keeps
the parser defaults; explicit arrays, objects, numbers, booleans, and `null` are
rejected. Valid approval strings are `required`, `optional`, and `preapproved`.

Malformed JSON, non-object roots (including `null`, arrays, and scalars), and
non-array `actions` values are rejected as input errors. Every member of
`actions` must itself be an object; `null`, arrays, and scalar members are also
rejected. Invalid field diagnostics include the exact field path, including the
action index. The CLI writes the concise diagnostic to stderr, prints no plan,
and exits with status `1`.

Markdown plans escape `|` as `\|` and replace line breaks with spaces in every
table cell. Each action therefore remains a single row with exactly seven cells,
even when an input value contains Markdown table delimiters or multiple lines.

Known targets receive stable side-effect labels. Unknown targets are classified as `external-write`.
