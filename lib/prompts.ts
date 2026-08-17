// Suggested prompts shown on the dashboard and chat empty state
export type PromptCard = {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
};

export const PROMPT_CARDS: PromptCard[] = [
  {
    id: "news",
    emoji: "📢",
    label: "What's new at Habari?",
    prompt: "What's new at Habari?",
  },
  {
    id: "hr",
    emoji: "👥",
    label: "Who should I contact for HR?",
    prompt: "Who should I contact for HR?",
  },
  {
    id: "calendar",
    emoji: "📅",
    label: "What is happening this week?",
    prompt: "What is happening this week?",
  },
  {
    id: "learning",
    emoji: "🎓",
    label: "Show my learning courses",
    prompt: "Show my learning courses",
  },
  {
    id: "policies",
    emoji: "📚",
    label: "Find company policies",
    prompt: "Find company policies",
  },
  {
    id: "it",
    emoji: "💻",
    label: "Help me with IT support",
    prompt: "Help me with IT support",
  },
  {
    id: "about",
    emoji: "🏢",
    label: "Tell me about Habari",
    prompt: "Tell me about Habari",
  },
  {
    id: "contacts",
    emoji: "📞",
    label: "Find quick contacts",
    prompt: "Find quick contacts",
  },
];
