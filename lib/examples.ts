export type Platform = "instagram" | "x" | "whatsapp";
export type Language = "hinglish" | "tanglish";

export interface Example {
  language: Language;
  platform: Platform;
  input: string;
  more_native: string;
  balanced: string;
  more_english: string;
}

export const EXAMPLES: Example[] = [
  // Hinglish × Instagram
  {
    language: "hinglish",
    platform: "instagram",
    input: "weekend trip with the gang, finally happened",
    more_native: "akhir kar weekend pe nikal hi gaye gang ke saath ✨",
    balanced: "finally weekend trip ho hi gaya, gang ke saath maza aaya",
    more_english: "weekend trip with the gang, finally hua yaar 🤍",
  },
  {
    language: "hinglish",
    platform: "instagram",
    input: "morning coffee and a good book, that's the vibe",
    more_native: "subah ki coffee aur ek achhi si kitaab - bas yehi toh vibe hai",
    balanced: "morning coffee and a good book - bas yehi vibe hai yaar",
    more_english: "morning coffee and a good book, this is the vibe yaar",
  },

  // Hinglish × X
  {
    language: "hinglish",
    platform: "x",
    input: "indian twitter is wild. half the threads are wisdom, half are vibes",
    more_native: "indian twitter ka kya kehna - aadhe threads gyaan, aadhe sirf vibe",
    balanced: "indian twitter is wild yaar. aadhe threads wisdom hain, aadhe pure vibe",
    more_english: "indian twitter is wild. half the threads are gyaan, half are pure vibe",
  },

  // Hinglish × WhatsApp
  {
    language: "hinglish",
    platform: "whatsapp",
    input: "are you free this weekend? want to plan something",
    more_native: "weekend pe free ho kya? kuch plan karte hain yaar",
    balanced: "weekend free ho? kuch plan karte hain",
    more_english: "free this weekend? kuch plan karte hain yaar",
  },
  {
    language: "hinglish",
    platform: "whatsapp",
    input: "running late, stuck in traffic, will be there in 20 min",
    more_native: "yaar traffic mein phas gaya hu, 20 min mein pahunchta hu",
    balanced: "stuck in traffic yaar, 20 min mein pahunch jaunga",
    more_english: "running late yaar, traffic mein stuck hu, 20 min in",
  },

  // Tanglish × Instagram
  {
    language: "tanglish",
    platform: "instagram",
    input: "weekend trip with the boys, long time coming",
    more_native: "romba naala plan panna trip-u, finally boys oda kelambiten da 💛",
    balanced: "weekend trip with the boys, romba naala wait panna moment da",
    more_english: "weekend trip with the boys, finally happened da 🤍",
  },
  {
    language: "tanglish",
    platform: "instagram",
    input: "filter coffee and an old tamil song, instant therapy",
    more_native: "oru filter coffee, oru pazhaya tamil paatu - manasukku idhe podhum",
    balanced: "filter coffee and an old tamil song - instant therapy da",
    more_english: "filter coffee and an old tamil song, instant therapy machan",
  },

  // Tanglish × X
  {
    language: "tanglish",
    platform: "x",
    input: "every chennai auto guy thinks he is a startup founder",
    more_native: "chennai la oru auto kaaran kooda thanna oru startup founder nu nenaikkuran",
    balanced: "every chennai auto guy thinks he is a startup founder da, vera level confidence",
    more_english: "every chennai auto guy thinks he is a startup founder. romba confidence machan",
  },

  // Tanglish × WhatsApp
  {
    language: "tanglish",
    platform: "whatsapp",
    input: "are you free this weekend? want to plan something",
    more_native: "weekend free ah? edhachum plan pannalama da",
    balanced: "free ah weekend? edhachum plan pannalam da",
    more_english: "free this weekend da? let's plan something",
  },
  {
    language: "tanglish",
    platform: "whatsapp",
    input: "running late, stuck in traffic, will be there in 20 min",
    more_native: "traffic la maatitten da, innum 20 min la vandhuduven",
    balanced: "stuck in traffic da, 20 min la reach aaguven",
    more_english: "running late da, traffic la stuck, 20 min la there",
  },
];

export function examplesForPlatform(platform: Platform): Example[] {
  return EXAMPLES.filter((e) => e.platform === platform);
}
