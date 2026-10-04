export const MESSAGE_GIFTS = [
    { id: "gift", emoji: "\u{1F381}" },
    { id: "cake", emoji: "\u{1F382}" },
    { id: "bouquet", emoji: "\u{1F490}" },
    { id: "heart", emoji: "\u2764\uFE0F" },
    { id: "star", emoji: "\u2B50" },
    { id: "party", emoji: "\u{1F389}" },
    { id: "celebrate", emoji: "\u{1F973}" },
    { id: "coffee", emoji: "\u2615" },
    { id: "trophy", emoji: "\u{1F3C6}" },
    { id: "sparkleheart", emoji: "\u{1F496}" },
];

export const MESSAGE_STICKER_IDS = [
    "thumbs",
    "smile",
    "clap",
    "heart",
    "party",
    "fire",
    "wow",
    "think",
    "wave",
    "star",
    "coffee",
    "cool",
];

export const findGift = (giftId) => MESSAGE_GIFTS.find((item) => item.id === giftId);

export const isAllowedSticker = (stickerId) => MESSAGE_STICKER_IDS.includes(String(stickerId || ""));
