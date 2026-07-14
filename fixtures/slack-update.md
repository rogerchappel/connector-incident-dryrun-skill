# Checkout latency incident
Severity: sev2

- [slack] action=post; message=Post customer-impact update to #incident-checkout; approval=required; rollback=delete Slack message and post correction; evidence=statuspage draft
- [github] action=comment; message=Comment on tracking issue with mitigation status; approval=required; rollback=hide comment and add correction; evidence=tracking issue comment url
