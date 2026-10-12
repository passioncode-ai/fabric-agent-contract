# OpenRouter attribution — the organization's products as apps on OpenRouter

DEC-0065 · rule code `FAC-SEM-098` · schema
[`openrouter-attribution.schema.json`](../../schemas/openrouter-attribution.schema.json) · code
[`src/openrouter-attribution.ts`](../../src/openrouter-attribution.ts) · vectors
[`fixtures/vectors/openrouter-attribution.json`](../../fixtures/vectors/openrouter-attribution.json)

A product of the organization that calls a model through OpenRouter can be credited for that traffic, so it appears in
OpenRouter's rankings and analytics as its own app. OpenRouter identifies an app by request headers. This page fixes
which headers a product sends, for which requests, and when it sends none (the organization's roadmap, RM-16).

Source: OpenRouter's *App Attribution* page, retrieved 2026-10-12 and hashed in the
[source ledger](../evidence/sources.md).

## The setting

A product that attributes its traffic keeps one setting ([schema](../../schemas/openrouter-attribution.schema.json)):

- `product`: a lower-case slug. The product's app is its product page, `https://passioncode.ai/<product>/`, one app per
  product (Fabric ADR-0090). The page is derived from the slug, so no free URL can name another product's app.
- `title`: the product's full name, as OpenRouter shows it. Printable ASCII, 1 to 100 characters, no space at either
  end, so a header value never carries CR or LF.
- `categories` (optional): at most two of the categories OpenRouter recognizes, each once. OpenRouter drops an
  unrecognized category without an error, so the contract refuses one before it is sent.

`FAC-SEM-098` (kind `openrouter-attribution`) checks the setting; the schema carries the same list and limit, and a test
keeps the two equal. **Without a setting, a product sends no attribution:** attribution is off by default, and a kit
that offers it (the adapter's) keeps it off until the product's operator sets it.

## The headers

For a request that passes every rule below, a product adds exactly these headers and nothing else:

| Header | Value |
|---|---|
| `HTTP-Referer` | `https://passioncode.ai/<product>/` |
| `X-OpenRouter-Title` | the setting's `title` (OpenRouter still reads the legacy `X-Title`; a product sends the current name) |
| `X-OpenRouter-Categories` | the setting's categories joined by `,`, only when there are any |

`attributionHeaders(setting, request)` returns them, or no headers and the reason, checked in this order:

1. `no-setting`: there is no setting.
2. `invalid-setting`: `FAC-SEM-098` refuses the setting.
3. `not-openrouter`: the request does not go to `https://openrouter.ai` exactly. Another host, a subdomain, a lookalike
   such as `openrouter.ai.example.org`, a trailing root dot, plain `http`, a non-default port or user information in the
   URL all fail. The host is compared after WHATWG URL parsing, which lower-cases it and drops the default port `:443`;
   a port follows WHATWG for the forms RFC 3986 reads differently (a backslash, a missing `//`), as the vectors show.
4. `forwarded`: the product did not originate the request. A request it forwards for someone else's agent (a router, a
   proxy, an agent a user built with the adapter) keeps that agent's attribution; crediting it to the product would
   misstate who used the model.
5. `user-set`: the request already carries an attribution header (`HTTP-Referer`, `Referer`, `X-OpenRouter-Title`,
   `X-Title` or `X-OpenRouter-Categories`, compared case-insensitively). The user's own attribution wins whole, and the
   product adds none of its own, so the two are never mixed.

The function returns only the three attribution headers. The product's key travels in the request it already makes, and
attribution never reads, copies or sends a key anywhere else. The `X-OpenRouter-App-Visibility` header is not sent:
every product's app is public.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-098` | `openrouter-attribution` | the setting names a lower-case product slug, a printable-ASCII title of 1 to 100 characters with no space at either end, and at most two categories OpenRouter recognizes, each once (DEC-0065) |

## Consumers

Project Observatory is the one product that calls OpenRouter today; it moves from its earlier repository-URL referer to
its product page, and its old app keeps its history. Every other product adopts the setting with its first model call
through OpenRouter. The adapter's kits offer the setting, off by default. The board names each consumer's row.
