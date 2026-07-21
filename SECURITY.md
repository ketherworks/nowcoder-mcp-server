# Security Policy

Report vulnerabilities through the private GitHub Security Advisory form for
`ketherworks/nowcoder-mcp-server`. Do not include judge cookies, account tokens, source code,
or other secrets in a public issue.

The server runs as a local stdio process. It reads the complete Cookie from
`NOWCODER_SESSION_COOKIE` at startup. The full Cookie is sent only to validated
`ac.nowcoder.com` pages; the access-token host receives only `csrf_token` and `NOWCODER*`
cookies, and question/judge hosts receive no Cookie. Cookie, CSRF token, judge token, and source code
never enter MCP process logs, MCP errors, capability output, or submission previews.

Problem search, browser import, profile reads, and submission history are bounded and schema checked.
The short-lived Competitive Companion receiver binds loopback only, rejects ordinary web origins,
and closes slow connections; the standard protocol has no sender nonce, so another local process can
still post during an explicitly opened import window.
Judge actions bind the official problem page to a saved local `file:` URI, re-read the file before
upload, and show the canonical problem, submitter, contest, path, language, byte count, and SHA-256.
Platform self-test confirms before uploading source. Real submission uses a two-minute immutable
preview plus MCP form elicitation; one acceptance authorizes exactly one POST. Every unprovable
post-dispatch result returns `outcome_unknown` and is never retried automatically.

The server does not extract browser cookies or bypass anti-bot challenges. Keep it on local stdio;
do not expose authenticated tools through a shared HTTP deployment.
