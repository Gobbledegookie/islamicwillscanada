# Guided Windsor will experiment

The `/interactive/` route is an experimental drafting interface. It does not certify that a will is complete or valid. It does not save or transmit answers. Both download formats are assembled in the visitor's browser from the same structured document blocks.

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

## Items requiring human review

- The Windsor document contains apparent inconsistent article references in its allocation and distribution clauses. The original wording is retained; a qualified reviewer should resolve them before use.
- The template's witness and signing instructions call for the testator and two adult non-heir witnesses to sign each page and addendum in each other's presence. Downloading a file does not sign it.
- The form cannot check whether a named person is an heir, whether the named people consent to serve, whether family details are exhaustive, or whether a nomination works under provincial law.
- The PDF embeds Noto Sans for clear Latin-script text. Complex-script names should be checked visually in the export; the editable DOCX is available if corrections are needed.
- Source files were downloaded temporarily for the content comparison and are not committed. The blank [Windsor template](https://drive.google.com/open?id=1dda59Ce2HcNm8Cp1ZHMrlQ_wZZnChfPO) remains accessible from the page.

## Privacy and maintenance

Form state exists only in browser memory. There is no API endpoint, account, analytics event, local storage of answers, or recovery after a refresh. The site-wide theme preference remains separate. Build-time dependencies are pinned in `package-lock.json`; `dist/` is generated and ignored.
