export const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "celebrate", emoji: "🎉", label: "Celebrate" },
  { type: "funny", emoji: "😂", label: "Funny" },
  { type: "insightful", emoji: "💡", label: "Insightful" },
  { type: "support", emoji: "🤗", label: "Support" },
];

export const COMMENT_EMOJIS = ["😀", "😁", "😂", "🥹", "😍", "🤩", "👍", "👏", "🙏", "🎉", "🔥", "💯", "💡", "📌", "🚀", "❤️"];

export const getReactionMeta = (type) => REACTIONS.find((reaction) => reaction.type === type) || REACTIONS[0];
