/** Original writing exercises and fictional applicants for the public library. */
export const essayExercises = [
  {
    id: "translation-on-a-bus",
    title: "The bus-stop translation",
    category: "Personal story",
    prompt:
      "Describe a moment when you changed the way you communicate with someone.",
    wordLimit: 350,
    excerpt:
      "On the bus to the clinic, I translated a text from the nurse into three short instructions. My grandmother stopped me at the first. The exact word I'd chosen meant wait, but what she needed to know was where. I asked what she would need to do next, and we read the message again together. Months later, when I helped a new student follow our lab instructions, I recognised the same pause. This time, my first question was where they wanted to start.",
    takeaway:
      "A small recurring action ties two settings together and shows how the writer changed.",
  },
  {
    id: "cold-greenhouse",
    title: "A colder corner of the greenhouse",
    category: "Academic interest",
    prompt:
      "Explain how a question you explored changed what you want to study.",
    wordLimit: 300,
    excerpt:
      "Our sensor logs showed that the back corner of the greenhouse warmed up sooner. It faced away from the sun, so I expected the opposite. I switched the sensors overnight and the pattern moved with them. We had been measuring a difference between two sensors. Our teacher gave me a spare thermometer, and I spent Friday calibrating them together. I still want to design environmental sensors. Now I want to understand how engineers decide when a reading is good enough to act on.",
    takeaway:
      "The author names a concrete test and connects it to an open academic question.",
  },
  {
    id: "measure-the-queue",
    title: "Measuring the queue",
    category: "Community",
    prompt:
      "Tell a story about improving something with other people. Describe your own contribution.",
    wordLimit: 250,
    excerpt:
      "At our food pantry, I wanted to replace the paper sign-in sheets with an app. Nura, who ran the desk, asked me to stand in line first. On Saturday I counted three trips from the door to the desk for each new visitor. We changed the paper forms so people could fill them in at the door. I tracked the wait for two weekends; the median fell from eighteen minutes to eleven. We kept the paper and started asking visitors what still took too long.",
    takeaway:
      "Show your part in the work, what others contributed and how you measured the result.",
  },
  {
    id: "robot-missed-turn",
    title: "The turn our robot kept missing",
    category: "Challenge",
    prompt: "Describe a setback and one change you made after it.",
    wordLimit: 250,
    excerpt:
      "The robot stopped at the same corner until we carried the track outside. In daylight it stopped everywhere. I had set the threshold in a dim classroom. Before our next competition, I asked a teammate to rotate a lamp while I recorded the readings. We wrote a calibration step that anyone on the team could run. That extra minute before each trial saved us time and gave our newer members a way to diagnose the next failure.",
    takeaway: "The setback leads to a specific change in how the team works.",
  },
  {
    id: "lab-and-workshop",
    title: "From a lab to a repair workshop",
    category: "Academic interest",
    prompt:
      "Connect one course or campus opportunity with something you want to investigate.",
    wordLimit: 200,
    excerpt:
      "At the repair café I can tell whether a loose connector is causing a fault, but I don't know how to redesign the casing so the connector stays in place. In an engineering design course, I would like to compare two mounts and test how often each fails after repeated use. I would bring the designs back to the café and ask volunteers whether the more durable version is still easy to open with the tools we have.",
    takeaway:
      "For a real supplement, name an opportunity you have verified and explain how you would use it.",
  },
  {
    id: "one-quiet-minute",
    title: "One quiet minute before a meeting",
    category: "Community",
    prompt: "Share a small change that helped other people participate.",
    wordLimit: 250,
    excerpt:
      "I used to open our science club by asking everyone for ideas. The same two people answered, often including me. One week I asked everybody to write down a question before anyone spoke. Dani, who repaired bikes after school, asked why we were testing brake pads on only one kind of surface. That question became our next experiment. I still bring spare pencils when I run a meeting.",
    takeaway:
      "Let a scene and its consequences demonstrate the quality you want the reader to notice.",
  },
] as const;
export type EssayExercise = (typeof essayExercises)[number];

export const exampleProfiles = [
  {
    id: "amina",
    title: "Amina",
    category: "Computer Science",
    place: "Kazakhstan",
    academics: "4.6 / 5 GPA · IELTS 7.0",
    description:
      "Documented a school coding club and built a checklist app for classmates.",
    activity:
      "Amina tracks weekly usage and invites learners to report the steps that confuse them.",
    next: "Check submission rules for her qualification and record the scholarship deadlines separately.",
  },
  {
    id: "leo",
    title: "Leo",
    category: "Engineering",
    place: "Vietnam",
    academics: "IB Diploma · SAT 1460",
    description:
      "Works on a robotics team and helps maintain equipment after school.",
    activity:
      "Leo shows how he replaced a fragile mount and how the team tested the new design.",
    next: "Verify whether each programme requires higher-level mathematics or physics.",
  },
  {
    id: "zahra",
    title: "Zahra",
    category: "Data Science",
    place: "Jordan",
    academics: "3.7 / 4 GPA · IELTS 7.5",
    description: "Analyses local transport data with a community group.",
    activity:
      "Zahra describes how missing records changed what she could conclude and how the group checked the results.",
    next: "Compare tuition and funding in the same currency before narrowing her list.",
  },
  {
    id: "niko",
    title: "Niko",
    category: "Engineering",
    place: "Georgia",
    academics: "4.7 / 5 GPA · IELTS 6.5",
    description:
      "Volunteers in a repair workshop and started a guide to common faults.",
    activity:
      "Niko records which parts of the guide new volunteers can follow independently.",
    next: "Check the accepted English test format and whether official results must arrive with the application.",
  },
] as const;
