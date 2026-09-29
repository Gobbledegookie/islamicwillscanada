# Guided Windsor will experiment

The `/interactive/` route is an experimental drafting interface. It does not certify that a will is complete or valid. It does not submit or store will answers on Islamic Will Canada servers. Article 1 address text is sent directly from the visitor's browser to Komoot's public Photon service for suggestions; no other form answers are attached. Komoot has stated that Photon keeps request logs for a limited time. Both download formats are assembled in the visitor's browser from the same structured document blocks.

## Windsor template coverage

| Guided section | Windsor material filled |
| --- | --- |
| You and family | Article 1: testator, address, immediate family and dates of birth |
| Funeral | Article 3: primary and alternate appointees; funeral and burial directions retained |
| Executors | Article 4: primary and alternate executors |
| Guardians | Article 5: spouse if applicable, primary and alternate guardians for minor children |
| Health care | Article 6: primary and alternate agents |
| Gifts and notes | Articles 8 and 10: recipient, amount or percent, and additional directions |
| Finances | Addendum A: loans received, religious obligations, loans outstanding, automatic withdrawals, and additional assets |
| Witnesses | Testator and two witness details, blank signature and date lines |
| Review | All articles, Windsor disclaimer and instructions, six inheritance schedules in Appendix A, and finance addendum |

The source document's long inheritance appendix is retained as reference text. The tool does **not** calculate shares, verify the one-third gift limit, or reconcile an estate. Empty optional fields are marked “Not supplied in this draft.” It requires names and addresses for appointments and witnesses to avoid a deceptively finished document. These are *draft-generation checks*, not a determination of legal requirements.

The DOCX and PDF exports share the same content blocks and use a consistent print layout. Both include a contents page, distinct article and schedule headings, the Windsor Arabic artwork, bordered inheritance and finance tables, highlighted entered details, page numbers, and signing space. Continuations of the original inheritance tables are joined before layout so headers repeat cleanly across pages. The filled sample's yellow editing notes are deliberately excluded from the generated draft.

## Items requiring human review

- The Windsor document contains apparent inconsistent article references in its allocation and distribution clauses. The original wording is retained; a qualified reviewer should resolve them before use.
- The template's witness and signing instructions call for the testator and two adult non-heir witnesses to sign each page and addendum in each other's presence. Downloading a file does not sign it.
- The form cannot check whether a named person is an heir, whether the named people consent to serve, whether family details are exhaustive, or whether a nomination works under provincial law.
- The PDF embeds Noto Sans for clear Latin-script text. Complex-script names should be checked visually in the export; the editable DOCX is available if corrections are needed.
- Source files were downloaded temporarily for the content comparison and are not committed. The blank [Windsor template](https://drive.google.com/open?id=1dda59Ce2HcNm8Cp1ZHMrlQ_wZZnChfPO) remains accessible from the page.

## Privacy and maintenance

Form state exists only in browser memory. While the visitor types the Article 1 address, its text is sent to the public Photon lookup service for Canadian suggestions. The address field remains editable if suggestions are unavailable or incomplete. Other answers are not sent to a service. There is no account, analytics event, local storage of answers, or recovery after a refresh. The site-wide theme preference remains separate. Build-time dependencies are pinned in `package-lock.json`; `dist/` is generated and ignored.

Photon's public endpoint is a demo service with no uptime guarantee and usage throttling. The field waits until five characters have been typed, debounces requests, limits results to six Canadian street addresses, and allows manual entry. If this experiment becomes a high-traffic service, replace the endpoint with an address provider or self-hosted instance that has suitable availability and privacy terms.
