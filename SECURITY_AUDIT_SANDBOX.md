# Vurenn Security Audit Sandbox

This branch is an isolated review surface. It is intentionally unable to
connect to Vurenn production infrastructure.

## What is disabled

- Supabase database and service-role access
- Anthropic requests
- Stripe operations and webhook verification
- Railway deployment descriptors
- Production administrator and team identities
- Credential setup utilities
- Automatic deployment workflows

The isolation is hard-coded in `wsgi.py`; supplying environment variables does
not re-enable privileged services on this branch.

## What can be reviewed

- Authentication and authorization boundaries
- Input validation and output sanitization
- File type and size enforcement
- Rate-limit and metering logic
- Ownership scoping for conversations, projects, and files
- Role checks for team and administrator endpoints
- Safety classification helpers
- Existing automated security tests

Run the review suite:

```powershell
python -m unittest discover -v
```

Run the local audit server:

```powershell
flask --app wsgi run --host 127.0.0.1 --port 8000
```

The health endpoint may report integrations as unavailable. That is expected
and confirms sandbox isolation.

## Reporting

Submit findings as issues or pull-request comments. Do not place real
credentials, customer data, production URLs, or copied production logs in this
branch.
