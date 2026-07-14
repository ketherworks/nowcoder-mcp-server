# NowCoder ACM Problem MCP Server

Hardened local MCP server for public NowCoder ACM problem pages.

This is a standalone release workspace generated from the audited
[Kether Works OJ adapter source](https://github.com/ketherworks/oj-mcp-adapters/tree/3f7ee0e040d76f6dd5460d5926d8504c8cb20256/packages/nowcoder).
The release package bundles the shared OJ contract implementation, so its runtime does not depend
on unpublished workspace packages.

## Tools

- `oj_capabilities`
- `oj_health`
- `oj_fetch_problem`

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
It never bypasses anti-bot challenges and intentionally remains local stdio only.

The server exposes no run or submit tool. It accepts no judge account credentials. See
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
