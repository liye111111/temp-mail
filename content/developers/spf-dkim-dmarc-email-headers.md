---
title: How to Read SPF, DKIM, and DMARC Results in Email Headers
description: Interpret SPF, DKIM, and DMARC results, understand domain alignment, and learn why authentication passes do not guarantee a safe message.
slug: spf-dkim-dmarc-email-headers
category: developers
publishedAt: 2026-08-17
updatedAt: 2026-08-17
author: GetOpenInbox
keywords:
  - DKIM header analyzer
  - DMARC header analyzer
  - SPF DKIM DMARC results
draft: false
related:
  - email-header-analyzer
  - analyze-email-headers
  - temporary-email-for-testing
faq:
  - question: Does SPF passing mean an email is safe?
    answer: No. SPF validates an authorized sending path for an envelope domain. It does not judge message content or the sender's intent.
  - question: Can DMARC pass when SPF fails?
    answer: Yes. DMARC can pass when either aligned SPF or aligned DKIM passes, subject to the domain's alignment policy.
---

SPF, DKIM, and DMARC are related email-authentication mechanisms, but they answer different questions. Read their results with the evaluated domains and alignment—not just the words `pass` or `fail`.

## SPF: was the sending server authorized?

SPF checks whether the connecting mail server is permitted to send for the envelope sender domain. A forwarded message may fail SPF even when the original message was legitimate. SPF does not validate the visible `From` address by itself and does not inspect message intent.

## DKIM: did a valid domain sign the message?

DKIM uses a cryptographic signature and a DNS-published key to verify that signed parts of a message were not changed after signing. Check the signing domain (`d=`). A valid signature proves control of that signing domain's key, not that the visible brand is trustworthy.

## DMARC: does an authenticated domain align with From?

DMARC evaluates whether an SPF-authenticated or DKIM-signing domain aligns with the visible `From` domain. It also lets a domain publish a handling policy. A DMARC pass requires at least one aligned authentication path; both SPF and DKIM do not have to pass.

## Common result meanings

| Result | General meaning | Important limitation |
| --- | --- | --- |
| `pass` | The evaluated check succeeded | Does not prove safe content or intent |
| `fail` | The check did not satisfy its policy | Can result from misconfiguration or forwarding |
| `softfail` | SPF indicates the sender is probably unauthorized | Still requires context |
| `neutral` / `none` | No decisive policy or usable result | Not equivalent to pass |
| `temperror` | A temporary evaluation problem occurred | May succeed when retried |
| `permerror` | The published configuration cannot be evaluated correctly | Domain owner may need to fix DNS |

Use [email header analysis](/developers/analyze-email-headers/) to evaluate routing, identity, links, and context around these results. GetOpenInbox displays authentication results reported in received headers; it does not guarantee that a passing message is trustworthy.
