export const quotes = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
  { text: "Preparation is the key to confidence.", author: "Unknown" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "A little progress each day adds up to big results.", author: "Unknown" },
  { text: "Confidence comes from preparation, not from luck.", author: "Unknown" },
];

export function randomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
