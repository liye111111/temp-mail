---
title: How to Analyze an Email Header Step by Step
description: Learn how to read an email header, trace delivery hops, interpret authentication results, and identify warning signs without overclaiming certainty.
slug: analyze-email-headers
category: developers
publishedAt: 2026-08-17
updatedAt: 2026-08-17
author: GetOpenInbox
keywords:
  - email header analysis
  - analyze email header
  - email header analysis steps
draft: false
related:
  - email-header-analyzer
  - spf-dkim-dmarc-email-headers
  - temporary-email-for-testing
faq:
  - question: Can an email header prove who sent a message?
    answer: No. Headers provide useful routing and authentication evidence, but individual fields can be forged and a compromised authenticated account can still send harmful mail.
  - question: Which Received header should I read first?
    answer: Read the Received chain from the bottom upward to follow the message from earlier hops toward the final receiving system.
---

Email header analysis examines the metadata added as a message moves from the sender to the receiving mailbox. Headers help explain routing, authentication, dates, and identifiers, but they must be interpreted together rather than treating one line as definitive proof.

## 1. Preserve the raw source

Use the mailbox provider's “show original” or “view source” feature. Forwarding a message can add or alter headers. If the message was received by GetOpenInbox, open it and use the raw source view.

## 2. Compare visible and technical identities

Check the visible `From` address, the `Return-Path`, and domains referenced by DKIM and DMARC. Differences can be legitimate—for example, when a delivery provider sends on behalf of a company—but unexplained mismatches deserve attention.

## 3. Trace the Received chain

Mail servers prepend `Received` fields, so the newest hop is normally at the top. Read from the bottom upward. Look for unexpected delays, unfamiliar infrastructure, malformed hostnames, and time-zone inconsistencies. Remember that earlier fields supplied before a trusted receiver handled the message may be forged.

## 4. Read authentication results

Locate `Authentication-Results` added by the receiving system. Review SPF, DKIM, and DMARC outcomes and the domains each check evaluated. A pass means a specific technical check succeeded; it does not guarantee good intent. See [How to Read SPF, DKIM, and DMARC Results](/developers/spf-dkim-dmarc-email-headers/).

## 5. Inspect links and attachments

Compare link destinations with the organization the message claims to represent. Be cautious with URL shorteners, IP-address links, Punycode domains, unexpected archives, and executable attachment names. Do not open suspicious content just to investigate it.

## 6. Form a bounded conclusion

State what the evidence supports: for example, “DKIM passed for the provider domain, but the visible sender domain did not align.” Avoid conclusions such as “safe” or “definitely forged” unless independent evidence justifies them. Use the [online email header analyzer](/tools/email-header-analyzer/) as a starting point, not as a substitute for incident-response tooling.
