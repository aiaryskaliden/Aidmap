import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import type { Page } from "@playwright/test";

async function openStudioSection(page: Page, label: string) {
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: label, exact: true })
    .click();
}

function samplePdf(text: string) {
  const stream = "BT /F1 18 Tf 60 700 Td (" + text + ") Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const position = pdf.length;
    pdf += i + 1 + " 0 obj\n" + object + "\nendobj\n";
    return String(position).padStart(10, "0") + " 00000 n \n";
  });
  const xref = pdf.length;
  pdf +=
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets.join("") +
    "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" +
    xref +
    "\n%%EOF\n";
  return Buffer.from(pdf);
}

test("Studio saves a CV, essay feedback, activities and university readiness", async ({
  page,
}) => {
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Your application studio" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Build my profile" }).click();
  await page.getByRole("button", { name: "Edit · Personal details" }).click();
  const editor = page.getByRole("dialog", { name: "Edit profile" });
  await editor.getByLabel("Name for this workspace").fill("Taylor");
  await editor.getByLabel("Intended subject").selectOption("Computer Science");
  await editor.getByRole("button", { name: "Résumé / CV" }).click();
  await editor.locator('input[type="file"]').setInputFiles({
    name: "practice-resume.pdf",
    mimeType: "application/pdf",
    buffer: samplePdf("SAT 1490. IELTS 7.5."),
  });
  await expect(editor.getByText("practice-resume.pdf")).toBeVisible();
  await page.getByRole("button", { name: "Fill detected scores" }).click();
  await expect(page.getByLabel("SAT", { exact: true })).toHaveValue("1490");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Taylor", exact: true })).toBeVisible();
  await expect(page.getByRole("meter", { name: "SAT", exact: true })).toHaveAttribute("aria-valuenow", "1490");
  await expect(page.getByRole("meter", { name: "IELTS", exact: true })).toHaveAttribute("aria-valuenow", "7.5");

  await openStudioSection(page, "Essays");
  await page.getByRole("button", { name: "New essay" }).click();
  const essay =
    "In the lab on Monday, I built a prototype with a borrowed motor. I realized that a short demonstration let my classmates identify the issues I had missed. Next time we started with their feedback, measured the results, and wrote better instructions together.";
  const xml =
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>' +
    essay +
    "</w:t></w:r></w:p></w:body></w:document>";
  await page.locator('input[type="file"]').setInputFiles({
    name: "practice-essay.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(zipSync({ "word/document.xml": strToU8(xml) })),
  });
  await expect(page.getByLabel("Your draft")).toHaveValue(essay);
  await page.getByRole("button", { name: "Review essay" }).click();
  await expect(page.getByText("Preliminary score")).toBeVisible();
  await expect(page.getByText("Passages to build on")).toBeVisible();

  await openStudioSection(page, "Activities");
  await page.getByRole("button", { name: "Add activity" }).click();
  await page.getByLabel("Activity name").fill("Robotics workshop");
  await page.getByRole("textbox", { name: "Your role" }).fill("Team lead");
  await page.getByLabel("Months involved").fill("7");
  await page.getByLabel("Hours per week").fill("3");
  await page
    .getByLabel("What did you do?")
    .fill(
      "Led weekly robot design sessions and made a tutorial for newer teammates.",
    );
  await page
    .getByLabel("What changed as a result?")
    .fill("Twelve teammates designed prototypes and 8 tested them.");
  await page
    .getByLabel("Evidence or recognition")
    .fill("Tutorial and prototype demo recording");
  const estimatedTier = page.getByRole("status", { name: "Estimated tier" });
  await expect(estimatedTier).toHaveText("A− tier");
  await page.getByRole("combobox", { name: "Reach", exact: true }).selectOption("international");
  await expect(estimatedTier).toHaveText("S tier");
  await expect(page.getByText(/You reported international reach/)).toBeVisible();
  await page.getByRole("button", { name: "Save activity" }).click();
  await expect(
    page.getByRole("button", { name: /Robotics workshop.*S tier/ }),
  ).toBeVisible();
  await page.getByText("How tiers work", { exact: true }).click();
  await expect(page.getByText("C− tier", { exact: true })).toBeVisible();

  await openStudioSection(page, "University fit");
  await page.getByLabel("Choose a university").selectOption("mit");
  await page.getByRole("button", { name: "Check readiness" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Massachusetts Institute of Technology",
    }),
  ).toBeVisible();
  await expect(page.getByText("checks supported")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "University profile" }),
  ).toHaveAttribute("href", "/universities/mit");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("Studio chat answers in the language of each turn and follows the university", async ({
  page,
}) => {
  await page.goto("/advisor");
  const input = page.getByRole("textbox", { name: "Ask a question" });
  await input.fill("Привет!");
  await input.press("Enter");
  await expect(page.getByText(/Привет, я Мэйпл/)).toBeVisible();
  await input.fill("Какие дедлайны у Принстона?");
  await input.press("Enter");
  await expect(
    page.getByText("В деталях указан раунд и отдельные сроки финансирования.", {
      exact: false,
    }),
  ).toBeVisible();
  await input.fill("Ал IELTS ше?");
  await input.press("Enter");
  await expect(
    page
      .locator('article[lang="kk"]')
      .getByRole("link", { name: "Princeton University", exact: true })
      .first(),
  ).toHaveAttribute("href", "/universities/princeton");
  await input.fill("How much does it cost there?");
  await input.press("Enter");
  await expect(
    page
      .locator('article[lang="en"]')
      .getByText(/Princeton University has a published/),
  ).toBeVisible();
});
