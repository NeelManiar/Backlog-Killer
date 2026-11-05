export const subjects = [
  { id: "physics", name: "Physics", color: "#3b82f6", days: 18 },
  { id: "chemistry", name: "Chemistry", color: "#f5a000", days: 24 },
  { id: "maths", name: "Mathematics", color: "#10b981", days: 30 },
];
export type Chapter = {
  id: string;
  subject: string;
  title: string;
  status: "pending" | "active" | "done";
  minutes: number;
  planned: boolean;
};
export type Session = {
  id: string;
  subject: string;
  title: string;
  minutes: number;
  finishedAt: string;
};
const topics = [
  [
    "physics",
    "Units and Measurements",
    "Motion in a Straight Line",
    "Laws of Motion",
    "Work, Energy and Power",
    "Waves & Oscillations",
    "Electrostatics",
    "Current Electricity",
    "Ray Optics",
    "Magnetism",
    "Thermodynamics",
    "Semiconductors",
    "Atoms and Nuclei",
  ],
  [
    "chemistry",
    "Solutions",
    "Electrochemistry",
    "Chemical Kinetics",
    "Coordination Compounds",
    "d and f Block Elements",
    "Biomolecules",
    "Organic Chemistry",
    "Amines",
    "Alcohols and Phenols",
    "Haloalkanes",
  ],
  [
    "maths",
    "Relations and Functions",
    "Inverse Trigonometry",
    "Matrices",
    "Determinants",
    "Continuity and Differentiability",
    "Integrals",
    "Calculus Revision",
    "Linear Programming",
  ],
];
export const initialChapters: Chapter[] = topics.flatMap(
  ([subject, ...titles]) =>
    titles.map((title, i) => ({
      id: `${subject}-${i}`,
      subject,
      title,
      status:
        i < (subject === "physics" ? 4 : 6)
          ? "done"
          : i === (subject === "physics" ? 4 : 6)
            ? "active"
            : "pending",
      minutes: 25,
      planned:
        (subject === "physics" && i === 4) ||
        (subject === "chemistry" && i === 6) ||
        (subject === "maths" && i === 7),
    })),
);
export const initialSessions: Session[] = [
  {
    id: "demo-1",
    subject: "physics",
    title: "Electrostatics",
    minutes: 25,
    finishedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    subject: "chemistry",
    title: "Organic Chemistry",
    minutes: 25,
    finishedAt: new Date().toISOString(),
  },
];
