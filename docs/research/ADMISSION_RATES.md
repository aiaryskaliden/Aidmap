# Admissions figures and university marks

Explore shows the latest verified figure available for each institution in the dataset. Research covers 2024–2026 intakes. The profile includes the year, source, date checked and scope of each figure. The **Lowest published rate** sort puts schools with a published rate first.

The figures come from institutional admissions reports, Common Data Sets, NCES Data Feedback Reports and official admissions agencies. AidMap divides the published admits by applications when both counts are available. When an official source publishes a percentage or an upper bound, AidMap displays that figure. Offers per application are labelled **Offer rate**. Sources also distinguish specific programmes, campuses, application routes and admissions releases that precede later waitlist offers.

When the data lacks a verified rate, the Explore row shows another useful fact about the school's admission tests or subjects. The expanded row has available programme, funding and deadline information, with more in the profile. Historical tuition remains tied to its published year.

The source files are `data/admission-rates.json`, `data/admission-rates-us-backfill.json`, and `data/admission-rates-global.json`. The dated evidence for each rate is recorded in its row. `pnpm validate:data` reports coverage. Local university marks have attribution in `data/university-marks.json`; other profiles use an AidMap monogram.
