/** Live Google Form, and where its replies can actually be read. */
export const SURVEY_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScmH7Z4FoFH7Y4XzsaMIR2prioWoh6AuHQVxfptRc3qmEzMZQ/viewform";

/**
 * The response sheet is private to the form owner, so linking it would show most
 * visitors an access screen. Results are served from our own copy instead —
 * regenerated from the export by `npm run survey`.
 */
export const SURVEY_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/19nCyRSCC-6rkNExDdZpPFpBI8g1NU-HNdCeeU9bg9s8/edit?usp=sharing";

export const SURVEY_RESPONSES_URL = "/survey";
