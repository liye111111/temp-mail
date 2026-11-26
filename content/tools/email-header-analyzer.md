---
title: "Email Header Analyzer Online — SPF, DKIM, DMARC & Raw Source"
description: "Analyze email headers online: receive a test message in a temporary inbox, review SPF, DKIM, and DMARC, and inspect raw source. No paste-in headers; ~10 min session."
slug: email-header-analyzer
category: tools
publishedAt: 2026-08-17
updatedAt: 2026-11-26
author: GetOpenInbox
keywords:
  - email header analyzer
  - email header analyser
  - email header analyzer online
  - analyze email headers
  - check email headers
draft: false
related:
  - analyze-email-headers
  - spf-dkim-dmarc-email-headers
  - temporary-email-for-testing
faq:
  - question: How do I analyze an email header with GetOpenInbox?
    answer: Create a temporary inbox, send the test message to it, open the message, and review the authentication report and raw source.
  - question: Does GetOpenInbox analyze headers pasted from another mailbox?
    answer: No. The current tool analyzes messages received by your active GetOpenInbox session rather than arbitrary pasted headers.
  - question: Can the analyzer prove that an email is safe?
    answer: No. It explains common technical signals and warnings, but no automated header check can guarantee sender identity or harmless content.
  - question: How long do I have to finish the analysis?
    answer: The current inbox session lasts about 10 minutes. Create a new address if the timer expires before you finish.
  - question: Why might SPF fail on a legitimate message?
    answer: Forwarding, shared sending infrastructure, or temporary DNS issues can fail SPF even when the original message was legitimate. Read the evaluated domain and alignment before drawing conclusions.
---

GetOpenInbox provides an **online email header analyzer for messages you receive in a temporary inbox**. After a test or verification message arrives, you can inspect the raw source in the format defined by [RFC 5322](https://www.rfc-editor.org/info/rfc5322/), review reported SPF, DKIM, and DMARC results, and scan common sender, link, and attachment-name warning signals. The tool does **not** accept headers pasted from another mailbox, and a green authentication result is **not** proof that a message is safe.

[Create a temporary inbox to analyze an incoming message](/).

## How to analyze an email header with GetOpenInbox

1. Open GetOpenInbox and copy the generated temporary address.
2. Send the test or verification message to that address from your app, staging environment, or mail provider.
3. When the message appears in the inbox, open it.
4. Review the authentication and risk sections shown for that message.
5. Open the raw source to inspect delivery headers, `Authentication-Results`, and MIME structure.

The inbox session currently lasts about **10 minutes**. Use non-sensitive test data and finish the review before the timer expires. If the session ends, create a [new temporary inbox](/) and resend the test message.

## What the report shows

| Signal | What it helps you see | Limit |
| --- | --- | --- |
| SPF, DKIM, DMARC | Whether common authentication checks passed, failed, or were unavailable for the domains the receiver evaluated | Pass/fail is not a safety verdict |
| Visible vs technical sender | Differences between the displayed `From` domain and technical sender domains | Mismatches can be legitimate (for example, a delivery provider) |
| Links | Shortened URLs, IP-address links, Punycode domains, and similar patterns | Warnings need human context |
| Attachments | Potentially dangerous attachment filenames | Filename checks are not malware scanning |
| Raw source | Original headers and MIME parts for manual investigation | Earlier hops may be forged before a trusted receiver |

## Authentication results are not a safety verdict

SPF, DKIM, and DMARC answer different technical questions about sending authorization, signatures, and domain alignment. A pass means a specific check succeeded for an evaluated domain. It does not prove good intent, and phishing can still arrive from a compromised but authenticated account. A fail can also have benign causes such as forwarding.

For interpretation details, read [How to Read SPF, DKIM, and DMARC Results](/developers/spf-dkim-dmarc-email-headers/) and the [step-by-step email header analysis guide](/developers/analyze-email-headers/).

## What this analyzer does not do

- It does **not** accept arbitrary pasted headers from Gmail, Outlook, or other mailboxes.
- It does **not** scan third-party accounts, crawl mailboxes, or probe SMTP ports.
- It does **not** guarantee that a message is safe, legitimate, or free of phishing.
- It does **not** replace incident-response tooling or a full forensic review.

Use the analyzer as a fast starting point for messages that land in your GetOpenInbox session—not as a complete security product.

## When to use a temporary inbox for header checks

A temporary inbox is useful when you need to:

- Trigger a verification or notification email from a staging app and inspect how it looks on arrival.
- Compare authentication results across test sends without exposing your personal mailbox.
- Practice reading raw headers on low-risk sample messages.

Do not use temporary email for banking, healthcare, password recovery, confidential documents, or any account you may need to recover later. Anyone with access to the active inbox session may be able to read its messages. Temporary email also does not guarantee that third-party sites will accept the address at signup.

For developer and QA workflows, see [Temporary Email for Testing](/developers/temporary-email-for-testing/).

## Next steps

1. [Open a temporary inbox](/) and send a non-sensitive test message.
2. Follow [How to Analyze an Email Header Step by Step](/developers/analyze-email-headers/) if you need a structured reading order.
3. Use [How to Read SPF, DKIM, and DMARC Results](/developers/spf-dkim-dmarc-email-headers/) when authentication outcomes look unexpected.

## References

- [RFC 5322: Internet Message Format](https://www.rfc-editor.org/info/rfc5322/) — message and header-field syntax.
- [RFC 8601: Authentication-Results](https://www.rfc-editor.org/info/rfc8601/) — how receiving systems record authentication results.
- [RFC 7208: SPF](https://www.rfc-editor.org/info/rfc7208/), [RFC 6376: DKIM](https://www.rfc-editor.org/info/rfc6376/), and [RFC 9989: DMARC](https://www.rfc-editor.org/info/rfc9989/) — the relevant authentication standards.
- [CISA Secure Our World](https://www.cisa.gov/secure-our-world) — recognizing phishing and handling suspicious messages.
- [Cloudflare Email Routing](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/) — routing documentation for the underlying inbound-email platform.
