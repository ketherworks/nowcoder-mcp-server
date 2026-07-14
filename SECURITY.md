# Security Policy

Report vulnerabilities through the private GitHub Security Advisory form for
`ketherworks/nowcoder-oj-mcp`. Do not include judge cookies, account tokens, source code,
or other secrets in a public issue.

This server is read-only. Its only credential-forwarding path is an optional Cookie read from
`NOWCODER_SESSION_COOKIE` at local process startup and sent to an allowlisted
`https://ac.nowcoder.com` request. The Cookie must never enter tool arguments, output, logs,
files, cross-origin redirects, or a remotely hosted transport. The server must not gain automatic
browser-cookie extraction, submission, code execution, or challenge-bypass behavior without a
separate threat model and explicit security review.
