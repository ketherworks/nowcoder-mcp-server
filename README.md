# NowCoder ACM Problem MCP Server

[简体中文](README.zh-CN.md)

Hardened local MCP server for allowlisted NowCoder ACM problem pages.

This is a standalone release workspace generated from the audited
[Kether Works OJ adapter source](https://github.com/ketherworks/oj-mcp-adapters/tree/b23d435a4840f798e93c879a9e4f543529056a26/packages/nowcoder).
The release package bundles the shared OJ contract implementation, so its runtime does not depend
on unpublished workspace packages.

## Tools

- `oj_capabilities`
- `oj_health`
- `oj_fetch_problem`
- `nowcoder_auth_status`

## Local Stdio

Requires Node.js 22 or newer.

```bash
npm ci
npm run check
npm run build
node packages/nowcoder/dist/index.js
```

MCP client configuration from a source checkout:

```json
{
  "servers": {
    "nowcoder": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/packages/nowcoder/dist/index.js"]
    }
  }
}
```

Tagged GitHub releases attach a standalone npm tarball. npm Registry and official MCP Registry
publication are intentionally separate steps and are not claimed until their ownership checks pass.

## Policy

This project is unofficial and is not affiliated with or endorsed by NowCoder.
It supports an optional startup-injected local session, never bypasses anti-bot challenges, and
intentionally remains local stdio only.

The server exposes no run or submit tool. The server accepts an optional NowCoder Cookie only from `NOWCODER_SESSION_COOKIE` at local
stdio process startup. Inject it from a trusted secret manager; never put it in tool arguments,
MCP configuration files, command-line arguments, logs, or committed files. See
[SECURITY.md](SECURITY.md) for the security boundary and [PROVENANCE.md](PROVENANCE.md) for the
canonical source revision.

## Development

```bash
npm ci
npm run check
npm run pack:check
```

## License

Adapter source code is MIT licensed. Judge problem content and trademarks are not relicensed by
this repository.
