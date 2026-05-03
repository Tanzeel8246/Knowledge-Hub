import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Prophet {
  id: number;
  name: string;
  nameAr: string;
  biblicalName?: string;
  title?: string;
  period?: string;
  nation?: string;
  quranMentions: number;
  surahs: string[];
  story: string;
  lesson: string;
  miracles: string[];
  dua?: string;
  duaTranslit?: string;
  duaTrans?: string;
  relation?: string; // relation to other prophets
}

const PROPHETS: Prophet[] = [
  {
    id: 1, name: "Adam", nameAr: "آدَم", biblicalName: "Adam", title: "Father of Humanity", period: "The Beginning of Time", nation: "All of humanity",
    quranMentions: 25, surahs: ["Al-Baqarah", "Al-Imran", "Al-A'raf", "Ta-Ha"],
    story: "Adam (AS) was the first human being and first prophet created by Allah. Allah created him from clay, breathed life into him, and taught him the names of all things. He was placed in Jannah (Paradise) with his wife Hawwa (Eve). After eating from the forbidden tree due to Shaytan's deception, they were sent to Earth. Allah forgave them when they repented sincerely.",
    lesson: "Sincere repentance is always accepted by Allah. Even the greatest fall can be recovered from through tawbah.",
    miracles: ["Created from clay without parents", "Taught the names of all things by Allah directly", "Taught to write by Angel Jibreel (narrated)"],
    dua: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    duaTranslit: "Rabbana zalamna anfusana wa-in lam taghfir lana wa-tarhamna lanakunanna minal-khasirin",
    duaTrans: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
    relation: "Father of all humanity. Father of Habil (Abel) and Qabil (Cain).",
  },
  {
    id: 2, name: "Idris", nameAr: "إِدْرِيس", biblicalName: "Enoch", title: "The Patient Scholar", period: "After Adam (AS)", nation: "Ancient Babylon",
    quranMentions: 2, surahs: ["Maryam", "Al-Anbiya"],
    story: "Idris (AS) was a prophet known for his great intelligence, wisdom, and piety. He was the first person to write with a pen and the first to learn sewing. The Quran describes him as 'truthful and a prophet' and says Allah raised him to a high place. Many scholars believe he was raised alive to the heavens.",
    lesson: "Knowledge, patience, and sincere worship elevate a person in the sight of Allah and humanity.",
    miracles: ["Raised to a 'high place' by Allah (possibly still alive)", "First to write with a pen (some narrations)", "Profound astronomical and engineering knowledge"],
  },
  {
    id: 3, name: "Nuh", nameAr: "نُوح", biblicalName: "Noah", title: "The Thankful Servant", period: "~3000–2000 BCE", nation: "Ancient Mesopotamia",
    quranMentions: 43, surahs: ["Hud", "Nuh", "Al-Anbiya"],
    story: "Nuh (AS) preached to his nation for 950 years but only a small number believed. Allah commanded him to build a great ark (ship). The great flood came and drowned the disbelievers, including his own son who refused to board. Nuh (AS) and the believers survived and started a new civilization.",
    lesson: "Continue in Allah's way with patience regardless of results. Success is measured by obedience, not outcome.",
    miracles: ["Built a massive ship in the middle of land by Allah's command", "Worldwide flood that spared only believers", "Lived to ~950 years of age according to the Quran"],
    dua: "رَّبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ",
    duaTranslit: "Rabbi ghfir li wa-liwalidayya wa-liman dakhala baytiya mu'minan wa-lil-mu'minina wal-mu'minat",
    duaTrans: "My Lord, forgive me and my parents and whoever enters my house as a believer, and the believing men and women.",
    relation: "Descendant of Adam (AS). Among his descendants were Ibrahim (AS) and other prophets.",
  },
  {
    id: 4, name: "Hud", nameAr: "هُود", title: "Messenger to 'Ad", period: "~2000–1500 BCE", nation: "The 'Ad people (Arabian Peninsula)",
    quranMentions: 7, surahs: ["Hud", "Al-A'raf", "Ash-Shu'ara"],
    story: "Hud (AS) was sent to the powerful tribe of 'Ad who built great structures and were physically strong. They rejected his call to monotheism. Allah destroyed them with a violent windstorm that lasted 7 nights and 8 days. Hud (AS) and the believers were saved.",
    lesson: "Physical strength and worldly power are meaningless before Allah's decree. Arrogance leads to destruction.",
    miracles: ["Survived the catastrophic 7-day windstorm that destroyed 'Ad", "Spoke the truth fearlessly before a proud and mighty nation"],
    relation: "Descendant of Nuh (AS) through Sam.",
  },
  {
    id: 5, name: "Salih", nameAr: "صَالِح", title: "Messenger to Thamud", period: "~1500–1200 BCE", nation: "The Thamud people (Arabia)",
    quranMentions: 9, surahs: ["Hud", "Al-A'raf", "An-Naml"],
    story: "Salih (AS) was sent to the Thamud, who carved houses out of mountains. They demanded a miracle — Allah brought forth a miraculous she-camel from a rock. Salih (AS) commanded them not to harm her. When they slaughtered the camel out of defiance, they sealed their fate. Allah destroyed them with a mighty blast.",
    lesson: "Do not transgress the boundaries set by Allah. Disregarding divine signs leads to destruction.",
    miracles: ["A she-camel emerged miraculously from a solid rock", "Foretold the exact timing of their punishment (3 days)"],
    relation: "Descendant of Nuh (AS).",
  },
  {
    id: 6, name: "Ibrahim", nameAr: "إِبْرَاهِيم", biblicalName: "Abraham", title: "Khalilullah — Friend of Allah", period: "~1800–1700 BCE", nation: "Ur (Iraq), then Canaan (Palestine)",
    quranMentions: 69, surahs: ["Al-Baqarah", "Ibrahim", "Al-Anbiya", "As-Saffat"],
    story: "Ibrahim (AS) — the 'Father of Prophets' — was raised in a family of idol-makers. He smashed the idols and was thrown into a massive fire by Nimrod — Allah made it cool and peaceful. He emigrated, established Makkah, and with his son Ismail built the Ka'bah. He was commanded to sacrifice Ismail — both submitted, and Allah replaced Ismail with a ram.",
    lesson: "True submission (Islam) means trusting Allah completely, even when you cannot understand His wisdom.",
    miracles: ["Fire made cool and peaceful (لَنَار كُونِي بَرْدًا وَسَلَامًا)", "Raised 4 birds from the dead to demonstrate resurrection", "Saved from Nimrod's fire", "Command to sacrifice son — replaced by a ram"],
    dua: "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
    duaTranslit: "Rabbi ij'alni muqimas-salati wa-min dhurriyyati, Rabbana wa-taqabbal du'a",
    duaTrans: "My Lord, make me an establisher of prayer, and [many] from my descendants. Our Lord, and accept my supplication.",
    relation: "Father of Ismail (AS) and Ishaq (AS). Ancestor of Muhammad ﷺ through Ismail (AS).",
  },
  {
    id: 7, name: "Lut", nameAr: "لُوط", biblicalName: "Lot", title: "Nephew of Ibrahim", period: "~1800 BCE", nation: "Sodom (modern Jordan area)",
    quranMentions: 27, surahs: ["Hud", "Al-A'raf", "Al-Anbiya"],
    story: "Lut (AS) was the nephew of Ibrahim (AS) and was sent to the people of Sodom who practiced homosexuality and other grave sins openly. He called them to righteousness for years. Angels came to him in human form, and when the town's men tried to harm them, Allah destroyed the cities with a rain of stones and turned them upside down.",
    lesson: "Societies that normalize grave sins face divine punishment. One righteous person among a corrupt society must still speak truth.",
    miracles: ["Escaped the destruction of Sodom while all disbelievers were destroyed", "Hosted angels (Jibreel and others) who came to announce punishment"],
    relation: "Nephew of Ibrahim (AS).",
  },
  {
    id: 8, name: "Ismail", nameAr: "إِسْمَاعِيل", biblicalName: "Ishmael", title: "Father of Arabs", period: "~1750 BCE", nation: "Arabia (Makkah)",
    quranMentions: 12, surahs: ["Al-Baqarah", "Maryam", "As-Saffat"],
    story: "Ismail (AS) was the eldest son of Ibrahim (AS) and Hajar. As an infant he was left in the barren valley of Makkah with his mother. When Hajar ran between Safa and Marwa searching for water, Allah caused the Zamzam spring to gush. He helped his father build the Ka'bah. He submitted to being sacrificed — Allah replaced him with a ram. This is commemorated in Eid al-Adha.",
    lesson: "Complete submission to Allah, even at the cost of one's life, is the highest form of faith.",
    miracles: ["Zamzam water emerged for him as an infant", "Survived the command of sacrifice — Allah replaced him"],
    relation: "Son of Ibrahim (AS). Father of Adnan, ancestor of Muhammad ﷺ.",
  },
  {
    id: 9, name: "Ishaq", nameAr: "إِسْحَاق", biblicalName: "Isaac", title: "Son of Ibrahim", period: "~1700 BCE", nation: "Canaan (Palestine/Israel)",
    quranMentions: 17, surahs: ["Al-Baqarah", "Hud", "Maryam"],
    story: "Ishaq (AS) was the second son of Ibrahim (AS) and Sarah, born miraculously when both parents were very old. Angels announced his birth when they visited Ibrahim (AS). He continued his father's mission of monotheism in Canaan.",
    lesson: "Allah's gifts come at the time He chooses, not the time we expect.",
    miracles: ["Born to elderly parents — Sarah was past childbearing age — a miraculous birth"],
    relation: "Son of Ibrahim (AS) and Sarah. Father of Yaqub (AS).",
  },
  {
    id: 10, name: "Yaqub", nameAr: "يَعْقُوب", biblicalName: "Jacob / Israel", title: "Israel — One Who Strives with Allah", period: "~1650 BCE", nation: "Canaan",
    quranMentions: 16, surahs: ["Al-Baqarah", "Hud", "Yusuf", "Maryam"],
    story: "Yaqub (AS) — also called 'Israel' — was the son of Ishaq (AS) and father of 12 sons including Yusuf (AS). He spent years grieving the apparent loss of his son Yusuf until Allah reunited them in Egypt. He maintained faith in Allah's plan throughout decades of separation.",
    lesson: "Grief is human, but despair of Allah's mercy is forbidden. Beautiful patience (sabr jameel) yields beautiful outcomes.",
    miracles: ["His eyesight was restored when the shirt of Yusuf (AS) was placed on his face (mentioned in Quran)"],
    dua: "فَصَبْرٌ جَمِيلٌ ۖ وَاللَّهُ الْمُسْتَعَانُ عَلَىٰ مَا تَصِفُونَ",
    duaTrans: "So patience is most fitting. And Allah is the One sought for help against that which you describe.",
    relation: "Son of Ishaq (AS). Father of Yusuf (AS) and 11 other sons — the 12 tribes of Israel.",
  },
  {
    id: 11, name: "Yusuf", nameAr: "يُوسُف", biblicalName: "Joseph", title: "The Most Beautiful Story", period: "~1600 BCE", nation: "Canaan → Egypt",
    quranMentions: 27, surahs: ["Yusuf (entire surah)"],
    story: "Yusuf (AS) was given the ability to interpret dreams and extraordinary beauty. His brothers threw him in a well out of jealousy. He was sold as a slave in Egypt, then falsely imprisoned for years. Allah elevated him to become the Treasurer of Egypt, and he ultimately forgave his brothers in one of the Quran's most powerful scenes of mercy.",
    lesson: "Patience through trials, chastity, and forgiveness. Allah's plan works through even the darkest circumstances.",
    miracles: ["Interpreted dreams with divine accuracy", "His shirt that reached his father in Canaan restored Yaqub's sight", "Withstood the greatest temptation with chastity"],
    dua: "رَبِّ قَدْ آتَيْتَنِي مِنَ الْمُلْكِ وَعَلَّمْتَنِي مِن تَأْوِيلِ الْأَحَادِيثِ ۚ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ أَنتَ وَلِيِّي فِي الدُّنْيَا وَالْآخِرَةِ",
    duaTrans: "My Lord, You have given me of sovereignty and taught me the interpretation of dreams. Creator of the heavens and earth, You are my protector in this world and in the Hereafter.",
    relation: "Son of Yaqub (AS). His story comprises the entirety of Surah Yusuf.",
  },
  {
    id: 12, name: "Ayyub", nameAr: "أَيُّوب", biblicalName: "Job", title: "The Most Patient", period: "~1500 BCE", nation: "Land of Uz (possibly Syria/Jordan)",
    quranMentions: 4, surahs: ["Al-Anbiya", "Sad"],
    story: "Ayyub (AS) was tested severely — he lost his wealth, children, and health. He endured 18 years (some narrations say 7 or 3) of illness and hardship without complaining. He called upon Allah humbly and Allah restored everything — health, family, and wealth — double what he had before.",
    lesson: "Patience in trial is not just endurance — it is calling upon Allah without complaint, with complete trust.",
    miracles: ["Healed completely from a severe illness after his dua to Allah", "Everything doubled and restored by Allah's mercy"],
    dua: "أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
    duaTranslit: "Anni massaniya-d-durru wa-Anta arhamur-rahimeen",
    duaTrans: "Indeed, adversity has touched me, and You are the Most Merciful of the merciful.",
    relation: "Descendant of Ishaq (AS). Married to Rahma (narrated).",
  },
  {
    id: 13, name: "Shu'ayb", nameAr: "شُعَيْب", biblicalName: "Jethro (possible)", title: "The Orator of Prophets", period: "~1400 BCE", nation: "Madyan (Northwest Arabia/Sinai)",
    quranMentions: 11, surahs: ["Al-A'raf", "Hud", "Ash-Shu'ara"],
    story: "Shu'ayb (AS) was sent to the people of Madyan who gave short measure in trade and spread corruption. He commanded them to give full weight and measure and forbade evil. They rejected him and Allah destroyed them with a scorching heat followed by a thunderous blast.",
    lesson: "Economic justice is a core demand of Islam — cheating in business is a form of corruption Allah condemns.",
    miracles: ["Eloquence in speech — called 'the orator of prophets'", "Survived the divine punishment that destroyed Madyan"],
    relation: "Father-in-law of Musa (AS) according to many scholars.",
  },
  {
    id: 14, name: "Musa", nameAr: "مُوسَى", biblicalName: "Moses", title: "Kalimullah — Allah's Interlocutor", period: "~1300 BCE", nation: "Egypt → Sinai",
    quranMentions: 136, surahs: ["Al-Baqarah", "Al-A'raf", "Ta-Ha", "Al-Qasas"],
    story: "The most mentioned prophet in the Quran. Born at a time when Pharaoh killed newborn boys, Musa (AS) was placed in the Nile as an infant and raised in Pharaoh's own palace. Allah spoke to him directly at Mount Sinai. He confronted Pharaoh with 9 miracles. He parted the Red Sea and led Bani Israel to freedom. He received the Torah on Mount Sinai.",
    lesson: "Allah prepares His messengers through trials before giving them their mission. Speaking truth to power is a prophetic duty.",
    miracles: ["Staff turned into a serpent", "White glowing hand", "Parting of the Red Sea", "9 signs to Pharaoh (locusts, lice, frogs, blood, flood, darkness)", "Direct speech with Allah (Kalimullah)", "Water from 12 springs when staff struck rock", "Manna and quails provided from heaven"],
    dua: "رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ۝ يَفْقَهُوا قَوْلِي",
    duaTranslit: "Rabbi ishrah li sadri, wa-yassir li amri, wah-lul 'uqdatan min lisani, yafqahu qawli",
    duaTrans: "My Lord, expand for me my chest. And ease for me my task. And untie the knot from my tongue. That they may understand my speech.",
    relation: "Brother of Harun (AS). The Prophet ﷺ met him on the Night Journey (Isra wal Mi'raj).",
  },
  {
    id: 15, name: "Harun", nameAr: "هَارُون", biblicalName: "Aaron", title: "Brother of Musa", period: "~1300 BCE", nation: "Egypt → Sinai",
    quranMentions: 20, surahs: ["Al-A'raf", "Ta-Ha", "Maryam"],
    story: "Harun (AS) was the brother and helper of Musa (AS). When Musa (AS) went to Mount Sinai to receive the Torah, he left Harun in charge. The Samaritan led the people astray to worship a golden calf. Harun (AS) warned them but was outnumbered.",
    lesson: "A leader who speaks the truth and warns against corruption fulfills his duty even if not heeded.",
    miracles: ["His rod blossomed — a sign of prophethood among the 12 tribes"],
    relation: "Elder brother of Musa (AS). Prophet and assistant (wazeer) to Musa.",
  },
  {
    id: 16, name: "Dhul-Kifl", nameAr: "ذُو الكِفْل", biblicalName: "Possibly Ezekiel", title: "Man of the Pledge", period: "~1000 BCE", nation: "Possibly Syria",
    quranMentions: 2, surahs: ["Al-Anbiya", "Sad"],
    story: "Dhul-Kifl (AS) is mentioned briefly in the Quran among the patient and righteous. He fulfilled his promises and pledges steadfastly. Scholars differ on his full story — he may have pledged to maintain prayer and fast all day and judge justly, which he fulfilled completely.",
    lesson: "Faithfulness to one's pledges and commitments is a mark of the righteous.",
    miracles: ["Fulfillment of his pledge despite hardship"],
    relation: "Some scholars say he was a son of Ayyub (AS). Wallahu 'alam.",
  },
  {
    id: 17, name: "Dawud", nameAr: "دَاوُود", biblicalName: "David", title: "Khalifah on Earth", period: "~1000 BCE", nation: "Jerusalem (Bani Israel)",
    quranMentions: 16, surahs: ["Al-Baqarah", "An-Nisa", "Al-Anbiya", "Sad"],
    story: "Dawud (AS) killed Goliath (Jalut) as a young man with a sling, becoming a king. Allah gave him wisdom, the Zabur (Psalms), and the ability to mold iron by hand. He was known for his night prayers, fasting every other day, and melodious voice — mountains and birds would praise Allah with him.",
    lesson: "True leadership combines power, justice, worship, and gratitude.",
    miracles: ["Iron became soft in his hands without fire", "Mountains and birds praised Allah with him", "Understood the language of birds", "Killed Goliath with a single stone"],
    dua: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    duaTrans: "Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.",
    relation: "Father of Sulayman (AS).",
  },
  {
    id: 18, name: "Sulayman", nameAr: "سُلَيْمَان", biblicalName: "Solomon", title: "King of Prophets", period: "~970 BCE", nation: "Jerusalem (Bani Israel)",
    quranMentions: 17, surahs: ["Al-Baqarah", "An-Naml", "Saba", "Sad"],
    story: "Sulayman (AS) was given an unparalleled kingdom — control over wind, jinn, animals, and understanding the language of all creatures including ants and birds. He built magnificent temples. The Queen of Sheba (Bilqis) visited and accepted Islam. He tested the jinn and humans in his service.",
    lesson: "Gratitude for immense blessings preserves them. Power without Allah's obedience is hollow.",
    miracles: ["Commanded the wind", "Commanded armies of jinn, humans, and birds", "Understood the language of animals", "Transported the throne of Bilqis in the blink of an eye", "The ant's conversation with him is recorded in the Quran"],
    dua: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ",
    duaTrans: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents.",
    relation: "Son of Dawud (AS). Sulayman's ring (seal) is famous in Islamic tradition.",
  },
  {
    id: 19, name: "Ilyas", nameAr: "إِلْيَاس", biblicalName: "Elijah", title: "Messenger to Bani Israel", period: "~875 BCE", nation: "Northern Kingdom of Israel",
    quranMentions: 2, surahs: ["Al-An'am", "As-Saffat"],
    story: "Ilyas (AS) was sent to the people of Ba'albek who worshipped an idol called Ba'l. He called them to worship only Allah. Most rejected him. Many scholars say he was taken up alive and will return before the Day of Judgment.",
    lesson: "Persistence in calling to truth even when rejected by an entire nation.",
    miracles: ["Possibly taken alive — similar to Isa (AS) and Idris (AS) per scholarly opinions"],
    relation: "Descendant of Harun (AS) according to some scholars.",
  },
  {
    id: 20, name: "Al-Yasa", nameAr: "الْيَسَع", biblicalName: "Elisha", title: "Successor of Ilyas", period: "~850 BCE", nation: "Northern Kingdom of Israel",
    quranMentions: 2, surahs: ["Al-An'am", "Sad"],
    story: "Al-Yasa (AS) was the student and successor of Ilyas (AS). He continued the prophetic mission after Ilyas. He is praised in the Quran as among the excellent ones.",
    lesson: "Carrying forward the mission of righteous predecessors with devotion.",
    miracles: ["Healed the sick and raised the dead (narrated in biblical parallels)"],
    relation: "Disciple of Ilyas (AS).",
  },
  {
    id: 21, name: "Yunus", nameAr: "يُونُس", biblicalName: "Jonah", title: "Dhul-Nun — Man of the Whale", period: "~780 BCE", nation: "Nineveh (modern Iraq)",
    quranMentions: 4, surahs: ["Al-Anbiya", "Yunus", "As-Saffat", "Al-Qalam"],
    story: "Yunus (AS) was sent to Nineveh but left without Allah's permission when his people rejected him. He boarded a ship, was thrown overboard when lots were drawn, and was swallowed by a great whale. In the whale's belly, he made his famous dua. Allah answered and commanded the whale to release him. He returned to Nineveh and 100,000+ people believed.",
    lesson: "Never leave your post without Allah's permission. Even in the darkest place, sincere dua reaches Allah.",
    miracles: ["Survived inside a whale", "Entire city of 100,000+ people believed after his return — the only city that believed before punishment"],
    dua: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    duaTranslit: "La ilaha illa Anta subhanaka inni kuntu mina-z-zalimin",
    duaTrans: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
    relation: "Descendant of Bani Israel.",
  },
  {
    id: 22, name: "Zakariyya", nameAr: "زَكَرِيَّا", biblicalName: "Zechariah", title: "Guardian of Maryam", period: "~100 BCE", nation: "Jerusalem (Bani Israel)",
    quranMentions: 7, surahs: ["Al-Imran", "Al-Anbiya", "Maryam"],
    story: "Zakariyya (AS) was an old priest who cared for Maryam (AS) in the temple. He saw miraculous provisions appear for her and was moved to ask Allah for a child despite his old age and his wife's barrenness. Allah granted him Yahya (AS), a son who was righteous from childhood.",
    lesson: "Never consider yourself too old or circumstances too impossible for Allah's mercy. Make dua with hope.",
    miracles: ["A son (Yahya) given to him and his barren wife in extreme old age"],
    dua: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ",
    duaTranslit: "Rabbi la tadharni fardan wa-Anta khayrul-waritheen",
    duaTrans: "My Lord, do not leave me alone [with no heir], and You are the best of inheritors.",
    relation: "Uncle of Maryam (AS). Father of Yahya (AS).",
  },
  {
    id: 23, name: "Yahya", nameAr: "يَحْيَى", biblicalName: "John the Baptist", title: "The Living One", period: "~5 BCE", nation: "Jerusalem",
    quranMentions: 5, surahs: ["Al-Imran", "Al-Anbiya", "Maryam"],
    story: "Yahya (AS) was born miraculously and given wisdom and prophethood as a child. He was known for his extreme piety, asceticism, and dedication to worship. He confirmed the message of Isa (AS). He was eventually martyred for speaking truth against the ruler's unlawful marriage.",
    lesson: "Speak truth even before rulers. Piety and wisdom can come at any age.",
    miracles: ["Born to elderly barren parents miraculously", "Given wisdom and prophethood as a child (hakim sabiyya)"],
    relation: "Son of Zakariyya (AS). Contemporary of Isa (AS).",
  },
  {
    id: 24, name: "Isa", nameAr: "عِيسَى", biblicalName: "Jesus", title: "Ruhullah — Spirit of Allah", period: "~4 BCE – ~30 CE", nation: "Palestine (Bani Israel)",
    quranMentions: 25, surahs: ["Al-Imran", "An-Nisa", "Al-Ma'idah", "Maryam"],
    story: "Isa (AS) was born miraculously to the virgin Maryam (AS) without a father, just as Adam was created without parents. He spoke as an infant to defend his mother's honor. He performed extraordinary miracles and called to the worship of Allah alone. The Jews plotted to crucify him — Allah raised him alive to the heavens. He will return before the Day of Judgment.",
    lesson: "Isa (AS) is a mighty messenger and servant of Allah, not divine. He called to tawheed just like all other prophets.",
    miracles: ["Born of a virgin — no father", "Spoke as a newborn infant", "Healed the blind and lepers", "Raised the dead by Allah's permission", "Created a bird from clay that flew by Allah's permission", "Revealed the Injeel (Gospel)", "Raised alive to the heavens — will return before Qiyamah"],
    dua: "اللَّهُمَّ رَبَّنَا أَنزِلْ عَلَيْنَا مَائِدَةً مِّنَ السَّمَاءِ",
    duaTrans: "O Allah, our Lord, send down to us a table [spread with food] from the heaven.",
    relation: "Son of Maryam (AS). Will descend near Isa ibn Maryam's role before the Day of Judgment, praying behind Imam Mahdi.",
  },
  {
    id: 25, name: "Muhammad", nameAr: "مُحَمَّد", title: "Seal of the Prophets — Khatam an-Nabiyyin", period: "570–632 CE", nation: "Arabia (Makkah & Madinah)",
    quranMentions: 4, surahs: ["Ali Imran", "Al-Ahzab", "Muhammad", "Al-Fath"],
    story: "The final messenger and the greatest of all prophets. Born in Makkah as an orphan, he was known as Al-Amin (The Trustworthy) before prophethood. He received the Quran over 23 years and transformed Arabia from idol worship to complete submission to Allah. He established the first Islamic state in Madinah, performed Hijrah, and died having completed the divine message.",
    lesson: "The complete and final guidance for all humanity until the Day of Judgment is preserved in the Quran and Sunnah.",
    miracles: ["The Quran — an everlasting literary and spiritual miracle", "Isra wal Mi'raj — Night Journey to Jerusalem and Heavens", "Splitting of the moon (Surah Al-Qamar)", "Water flowing from his fingers", "Food multiplied for many from little", "Trees and animals bore witness to his prophethood"],
    dua: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ",
    duaTranslit: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad",
    duaTrans: "O Allah, send blessings upon Muhammad and upon the family of Muhammad.",
    relation: "Seal of all prophets. Descendant of Ismail (AS) ibn Ibrahim (AS). Companion to all previous prophets on the Night Journey.",
  },
];

export default function ProphetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Prophet | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? PROPHETS : PROPHETS.filter(p => p.name.toLowerCase().includes(q) || p.nameAr.includes(q) || (p.biblicalName ?? "").toLowerCase().includes(q) || (p.nation ?? "").toLowerCase().includes(q));
  }, [search]);

  const s = makeStyles(colors);

  if (selected) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>Prophet {selected.name} AS</Text>
            <Text style={[s.titleAr, { color: colors.gold }]}>النبي {selected.nameAr} عليه السلام</Text>
          </View>
          <View style={[s.numBadge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[s.numText, { color: colors.primary }]}>#{selected.id}</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* Hero */}
          <View style={[s.hero, { backgroundColor: colors.navy }]}>
            <Text style={s.heroAr}>{selected.nameAr}</Text>
            <Text style={s.heroName}>{selected.name} (AS)</Text>
            {selected.title && <Text style={[s.heroTitle, { color: colors.gold }]}>{selected.title}</Text>}
            <Text style={[s.heroPeriod, { color: "#FFFFFF70" }]}>{selected.period ?? ""} · {selected.nation}</Text>
            {selected.biblicalName && (
              <View style={[s.biblicalBadge, { backgroundColor: "#FFFFFF15" }]}>
                <Text style={[s.biblicalText, { color: "#FFFFFFA0" }]}>Also known as: {selected.biblicalName}</Text>
              </View>
            )}
          </View>

          {/* Quran mentions */}
          <View style={[s.mentionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.mentionStat}>
              <Text style={[s.mentionNum, { color: colors.primary }]}>{selected.quranMentions}</Text>
              <Text style={[s.mentionLabel, { color: colors.mutedForeground }]}>Quran mentions</Text>
            </View>
            <View style={[s.mentionDivider, { backgroundColor: colors.border }]} />
            <View style={s.mentionSurahs}>
              <Text style={[s.mentionSurahsLabel, { color: colors.mutedForeground }]}>Key Surahs</Text>
              <Text style={[s.mentionSurahsText, { color: colors.foreground }]}>{selected.surahs.join(", ")}</Text>
            </View>
          </View>

          {/* Story */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>THE STORY</Text>
          <View style={[s.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.storyText, { color: colors.foreground }]}>{selected.story}</Text>
          </View>

          {/* Key lesson */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>KEY LESSON</Text>
          <View style={[s.lessonCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Feather name="star" size={16} color={colors.primary} />
            <Text style={[s.lessonText, { color: colors.foreground }]}>{selected.lesson}</Text>
          </View>

          {/* Miracles */}
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>MIRACLES & SIGNS</Text>
          <View style={[s.miracleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {selected.miracles.map((m, i) => (
              <View key={i} style={[s.miracleRow, { borderBottomColor: colors.border, borderBottomWidth: i < selected.miracles.length - 1 ? 1 : 0 }]}>
                <Text style={[s.miracleNum, { color: colors.gold }]}>✨</Text>
                <Text style={[s.miracleText, { color: colors.foreground }]}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Dua */}
          {selected.dua && (
            <>
              <Text style={[s.secLabel, { color: colors.mutedForeground }]}>DUA FROM THE QURAN</Text>
              <View style={[s.duaCard, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "40" }]}>
                <Text style={[s.duaAr, { color: colors.foreground }]}>{selected.dua}</Text>
                {selected.duaTranslit && <Text style={[s.duaTranslit, { color: colors.primary }]}>{selected.duaTranslit}</Text>}
                <Text style={[s.duaTrans, { color: colors.mutedForeground, fontStyle: "italic" }]}>"{selected.duaTrans}"</Text>
              </View>
            </>
          )}

          {/* Relations */}
          {selected.relation && (
            <>
              <Text style={[s.secLabel, { color: colors.mutedForeground }]}>FAMILY & RELATIONS</Text>
              <View style={[s.relationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="users" size={15} color={colors.mutedForeground} />
                <Text style={[s.relationText, { color: colors.foreground }]}>{selected.relation}</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Prophets of Islam</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>أنبياء الإسلام</Text>
        </View>
        <View style={[s.numBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.numText, { color: colors.primary }]}>25</Text>
        </View>
      </View>

      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput style={[s.searchInput, { color: colors.foreground }]} placeholder="Search prophets…" placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity> : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {filtered.map((prophet, i) => (
          <TouchableOpacity key={prophet.id} style={[s.prophetRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelected(prophet)} activeOpacity={0.8}>
            <View style={[s.prophetNum, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[s.prophetNumText, { color: colors.primary }]}>{prophet.id}</Text>
            </View>
            <View style={s.prophetBody}>
              <View style={s.prophetTop}>
                <Text style={[s.prophetName, { color: colors.foreground }]}>{prophet.name} (AS)</Text>
                <Text style={[s.prophetAr, { color: colors.gold }]}>{prophet.nameAr}</Text>
              </View>
              {prophet.title && <Text style={[s.prophetTitle, { color: colors.primary }]}>{prophet.title}</Text>}
              <Text style={[s.prophetMeta, { color: colors.mutedForeground }]}>{prophet.nation} · {prophet.quranMentions}× in Quran</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.border} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 12 },
    numBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    numText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 4 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    listContent: { paddingHorizontal: 16, paddingTop: 10 },
    prophetRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
    prophetNum: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    prophetNumText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    prophetBody: { flex: 1 },
    prophetTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
    prophetName: { fontSize: 15, fontFamily: "Inter_700Bold" },
    prophetAr: { fontSize: 16 },
    prophetTitle: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 2 },
    prophetMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },

    // Detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    hero: { borderRadius: 18, padding: 22, alignItems: "center", marginBottom: 16 },
    heroAr: { fontSize: 42, color: "#FFF", lineHeight: 58 },
    heroName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 6 },
    heroTitle: { fontSize: 14, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 6 },
    heroPeriod: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
    biblicalBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    biblicalText: { fontSize: 12, fontFamily: "Inter_400Regular" },

    mentionRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    mentionStat: { alignItems: "center", paddingHorizontal: 20 },
    mentionNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
    mentionLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
    mentionDivider: { width: 1, marginVertical: 4 },
    mentionSurahs: { flex: 1, paddingLeft: 14 },
    mentionSurahsLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
    mentionSurahsText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
    storyCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    storyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },
    lessonCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    lessonText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
    miracleCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
    miracleRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
    miracleNum: { fontSize: 14 },
    miracleText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    duaCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    duaAr: { fontSize: 18, lineHeight: 32, textAlign: "right", marginBottom: 10 },
    duaTranslit: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 6 },
    duaTrans: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    relationCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    relationText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  });
}
