/*
 * Content data for the module. Kept separate from app logic so the
 * text can be reviewed/edited by librarians without touching JS behavior.
 */
var DATA = {

  // ---- Frame: Authority Is Constructed and Contextual ----
  authority: {
    prompt: "Every research situation calls for a different kind of authority. There's no single “best” source — match each situation on the left to the source on the right that is the strongest authority for THAT situation.",
    needs: [
      { id: "n1", text: "You need the most current unemployment rate for North Carolina to cite in a policy memo." },
      { id: "n2", text: "You're writing a literature review on the psychological effects of social media use in teens for a research paper." },
      { id: "n3", text: "You want to understand what people who lived through a recent hurricane actually experienced." },
      { id: "n4", text: "You need a plain-language overview of a medical condition before a doctor's appointment." },
      { id: "n5", text: "You're trying to verify whether a claim you saw circulating on social media is actually true." },
      { id: "n6", text: "You need the scientific consensus on a contested, highly technical question — like whether a new drug is safe." }
    ],
    sources: [
      { id: "s1", text: "Government statistical agency report (e.g., Bureau of Labor Statistics, NC Dept. of Commerce)" },
      { id: "s2", text: "Peer-reviewed journal article found through a library database" },
      { id: "s3", text: "First-person interview or oral history account" },
      { id: "s4", text: "Reputable health organization website (e.g., CDC, Mayo Clinic)" },
      { id: "s5", text: "Fact-checking organization (e.g., AP Fact Check, Snopes)" },
      { id: "s6", text: "Peer-reviewed systematic review or meta-analysis" }
    ],
    // shuffled display order so the correct pairing isn't just "top to top"
    sourceDisplayOrder: ["s4", "s2", "s6", "s1", "s5", "s3"],
    correctPairs: { n1: "s1", n2: "s2", n3: "s3", n4: "s4", n5: "s5", n6: "s6" },
    feedback: {
      n1: "Government agencies collect and publish this data directly. For current statistics, an official .gov source is more authoritative — and more current — than a journal article, which can take months or years to appear.",
      n2: "For an academic literature review, peer-reviewed research is the expected form of authority — it's been vetted by other experts in the field before publication.",
      n3: "For lived experience, the person who was there is the authority. No journal article or government report can substitute for a firsthand account.",
      n4: "Reputable health organizations translate complex medical research into accurate, plain-language information — more useful here than a dense clinical study full of technical detail.",
      n5: "Fact-checking organizations specialize in tracing claims back to their source and weighing evidence quickly — exactly what's needed to check something circulating online.",
      n6: "A systematic review synthesizes findings across many individual studies, which makes it a stronger authority on a contested scientific question than any single study on its own."
    },
    wrongFeedback: "Not quite — that source could be the right authority in a different situation, just maybe not this one. Think about what THIS situation specifically calls for, then try again."
  },

  // ---- Frame: Searching as Strategic Exploration ----
  searching: {
    taskPrompt: "Find sources for a paper on how social media use affects teenagers' mental health. Search the mock database below the way you'd search Discover@Duke — then refine your query based on the feedback.",
    note: "This is a simulated database for practice. Result counts and citations below are illustrative, not real publications.",
    topicGroups: {
      media: ["social media", "instagram", "tiktok", "snapchat", "facebook", "social networking", "social platforms"],
      people: ["teen", "teenager", "teenagers", "adolescent", "adolescents", "youth", "young people", "minors"],
      outcome: ["mental health", "depression", "anxiety", "wellbeing", "well-being", "self-esteem", "psychological"]
    },
    sampleCitations: [
      "Alvarez, R., & Kim, J. (2023). Associations between social media use and psychological well-being among adolescents. Journal of Adolescent Health Research, 41(2), 118–134.",
      "Chen, M., & Patel, S. (2022). Social media and teen mental health: A systematic review. Journal of Child and Youth Studies, 29(3), 201–219.",
      "Osei, D., Larsen, T., & Byrne, K. (2023). Depression, anxiety, and social media use in adolescence: A meta-analysis. International Journal of Adolescent Psychology, 15(1), 44–61.",
      "Novak, L., & Reyes, A. (2022). Screen time, social platforms, and mood in teenagers: A scoping review. Adolescent Development Quarterly, 8(4), 302–320.",
      "Whitfield, E. (2024). Teenagers and social media: A narrative review of recent findings. Youth & Society Review, 12(1), 55–78."
    ]
  }
};
