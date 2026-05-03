import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";

interface Name {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  description: string;
}

const NAMES: Name[] = [
  { number: 1, arabic: "اللَّهُ", transliteration: "Allah", meaning: "The One Deserving All Worship", description: "The Greatest Name of Allah, the proper name of God. All other names describe an attribute of His, but this name encompasses all attributes." },
  { number: 2, arabic: "الرَّحْمَٰنُ", transliteration: "Ar-Rahman", meaning: "The Most Compassionate", description: "The One who has vast mercy for all creation in this world. His mercy encompasses all things, believers and unbelievers alike in this life." },
  { number: 3, arabic: "الرَّحِيمُ", transliteration: "Ar-Rahim", meaning: "The Most Merciful", description: "The One whose mercy is specific and continuous for the believers in the Hereafter. This mercy is reserved for those who believe and do righteous deeds." },
  { number: 4, arabic: "الْمَلِكُ", transliteration: "Al-Malik", meaning: "The King, The Sovereign", description: "The absolute ruler of the universe, Whose sovereignty is real and permanent. No one can override His decrees or question His dominion." },
  { number: 5, arabic: "الْقُدُّوسُ", transliteration: "Al-Quddus", meaning: "The Absolutely Pure", description: "The One who is free from every imperfection and deficiency. He is pure from all faults, attributes of creation, and anything unworthy of His majesty." },
  { number: 6, arabic: "السَّلَامُ", transliteration: "As-Salam", meaning: "The Source of Peace", description: "The One who is free from all defects and flaws. He is the source of peace and safety for His creation. Paradise is the abode of peace (Dar as-Salam)." },
  { number: 7, arabic: "الْمُؤْمِنُ", transliteration: "Al-Mu'min", meaning: "The Granter of Security", description: "The One who has given security to His creation by sending messengers and revealing books to guide them and protect them from going astray." },
  { number: 8, arabic: "الْمُهَيْمِنُ", transliteration: "Al-Muhaymin", meaning: "The Guardian, The Witness", description: "The One who oversees and preserves all things. He watches over all of creation and nothing escapes His knowledge and control." },
  { number: 9, arabic: "الْعَزِيزُ", transliteration: "Al-Aziz", meaning: "The Almighty, The Invincible", description: "The One who cannot be overcome or overpowered. He is mighty in a way that nothing can resist or challenge. All power belongs to Him." },
  { number: 10, arabic: "الْجَبَّارُ", transliteration: "Al-Jabbar", meaning: "The Compeller, The Restorer", description: "The One who compels all things to follow His will, and who also repairs and mends what is broken. He restores those who are broken-hearted." },
  { number: 11, arabic: "الْمُتَكَبِّرُ", transliteration: "Al-Mutakabbir", meaning: "The Supreme, The Majestic", description: "The One who possesses every right to be proud and exalted. His pride and greatness are justified because He truly is the Greatest." },
  { number: 12, arabic: "الْخَالِقُ", transliteration: "Al-Khaliq", meaning: "The Creator", description: "The One who creates from nothing. He creates all things and determines their proportions and measures before bringing them into existence." },
  { number: 13, arabic: "الْبَارِئُ", transliteration: "Al-Bari", meaning: "The Originator, The Maker", description: "The One who creates things distinct and separate from one another. He fashions creation without any prior model or pattern." },
  { number: 14, arabic: "الْمُصَوِّرُ", transliteration: "Al-Musawwir", meaning: "The Fashioner of Forms", description: "The One who gives everything its specific shape and form. Each creature has a unique form that distinguishes it from all others." },
  { number: 15, arabic: "الْغَفَّارُ", transliteration: "Al-Ghaffar", meaning: "The Repeatedly Forgiving", description: "The One who forgives repeatedly, no matter how many times a servant sins and repents. His forgiveness is vast and continuous for those who turn to Him." },
  { number: 16, arabic: "الْقَهَّارُ", transliteration: "Al-Qahhar", meaning: "The Subduer, The Dominant", description: "The One who subdues all things and brings them under His power. Every creature is subdued to His will and none can resist His dominance." },
  { number: 17, arabic: "الْوَهَّابُ", transliteration: "Al-Wahhab", meaning: "The Bestower of Gifts", description: "The One who gives abundantly without any compensation or motive. He gives freely and generously from His bounty without expecting anything in return." },
  { number: 18, arabic: "الرَّزَّاقُ", transliteration: "Ar-Razzaq", meaning: "The Provider, The Sustainer", description: "The One who provides sustenance for all living creatures. He provides both physical sustenance (food, water) and spiritual sustenance (knowledge, faith)." },
  { number: 19, arabic: "الْفَتَّاحُ", transliteration: "Al-Fattah", meaning: "The Opener, The Judge", description: "The One who opens the door of provision, mercy, and victory for His servants. He removes difficulties and opens what was closed." },
  { number: 20, arabic: "الْعَلِيمُ", transliteration: "Al-Alim", meaning: "The All-Knowing, The Omniscient", description: "The One whose knowledge encompasses everything — past, present, and future. He knows the seen and unseen, the apparent and hidden." },
  { number: 21, arabic: "الْقَابِضُ", transliteration: "Al-Qabid", meaning: "The Withholder", description: "The One who withholds and constricts. He constricts sustenance and provision according to His infinite wisdom." },
  { number: 22, arabic: "الْبَاسِطُ", transliteration: "Al-Basit", meaning: "The Expander", description: "The One who extends and expands. He expands sustenance and provision according to His infinite wisdom and mercy." },
  { number: 23, arabic: "الْخَافِضُ", transliteration: "Al-Khafid", meaning: "The Humbler, The Abaser", description: "The One who lowers and humbles whoever He wills. He brings down the arrogant and those who disobey Him." },
  { number: 24, arabic: "الرَّافِعُ", transliteration: "Ar-Rafi", meaning: "The Exalter, The Raiser", description: "The One who raises and elevates whoever He wills. He exalts His righteous servants in rank and status." },
  { number: 25, arabic: "الْمُعِزُّ", transliteration: "Al-Mu'izz", meaning: "The Honorer, The Bestower of Honor", description: "The One who grants honor and dignity to whoever He wills. True honor comes only from Allah." },
  { number: 26, arabic: "الْمُذِلُّ", transliteration: "Al-Mudhill", meaning: "The Dishonorer, The Humiliator", description: "The One who humiliates whoever He wills. He humiliates those who turn away from Him and oppose His messengers." },
  { number: 27, arabic: "السَّمِيعُ", transliteration: "As-Sami", meaning: "The All-Hearing", description: "The One who hears all sounds and voices, no matter how quiet or distant. He hears the whisper of the heart and the call of those in need." },
  { number: 28, arabic: "الْبَصِيرُ", transliteration: "Al-Basir", meaning: "The All-Seeing", description: "The One who sees everything, the apparent and the hidden. Nothing is concealed from His sight, not even a black ant on a black rock in the darkest night." },
  { number: 29, arabic: "الْحَكَمُ", transliteration: "Al-Hakam", meaning: "The Judge, The Arbitrator", description: "The One who judges and decides between all disputes. His judgment is final, perfect, and just in all matters." },
  { number: 30, arabic: "الْعَدْلُ", transliteration: "Al-Adl", meaning: "The Utterly Just", description: "The One who is perfectly just in all His dealings. He never wrongs anyone and gives everyone exactly what they deserve." },
  { number: 31, arabic: "اللَّطِيفُ", transliteration: "Al-Latif", meaning: "The Subtle, The All-Aware", description: "The One who is subtle and gentle in His actions. He reaches the most hidden matters and provides for His servants in ways they cannot perceive." },
  { number: 32, arabic: "الْخَبِيرُ", transliteration: "Al-Khabir", meaning: "The All-Aware, The Acquainted", description: "The One who is fully aware of all things including the most hidden and innermost secrets. Nothing escapes His knowledge." },
  { number: 33, arabic: "الْحَلِيمُ", transliteration: "Al-Halim", meaning: "The Forbearing, The Clement", description: "The One who is deliberate and patient, not rushing to punish. He forbears and gives time for repentance despite seeing disobedience." },
  { number: 34, arabic: "الْعَظِيمُ", transliteration: "Al-Azim", meaning: "The Magnificent, The Tremendous", description: "The One who is tremendously great in every aspect — in His essence, attributes, and actions. His greatness is beyond imagination." },
  { number: 35, arabic: "الْغَفُورُ", transliteration: "Al-Ghafur", meaning: "The Forgiving, The Pardoner", description: "The One who forgives sins completely and covers them. He does not expose or punish those whose sins He has forgiven." },
  { number: 36, arabic: "الشَّكُورُ", transliteration: "Ash-Shakur", meaning: "The Appreciative, The Grateful", description: "The One who multiplies rewards for even the smallest of good deeds. He appreciates His servants' efforts and rewards them many times over." },
  { number: 37, arabic: "الْعَلِيُّ", transliteration: "Al-Aliyy", meaning: "The Most High, The Exalted", description: "The One who is above all things in His essence, attributes, and power. His highness is absolute and complete in every sense." },
  { number: 38, arabic: "الْكَبِيرُ", transliteration: "Al-Kabir", meaning: "The Most Great", description: "The One who is great in the true sense — greater than anything in existence. His greatness cannot be comprehended by human minds." },
  { number: 39, arabic: "الْحَفِيظُ", transliteration: "Al-Hafiz", meaning: "The Preserver, The Protector", description: "The One who preserves all things. He preserves the deeds of His servants and protects the believers from harm and evil." },
  { number: 40, arabic: "الْمُقِيتُ", transliteration: "Al-Muqit", meaning: "The Sustainer, The Nourisher", description: "The One who provides sustenance and strength to all creatures. He nourishes all of creation with what they need physically and spiritually." },
  { number: 41, arabic: "الْحَسِيبُ", transliteration: "Al-Hasib", meaning: "The Reckoner, The Sufficient", description: "The One who takes account of all things and is sufficient for His servants. He will hold all creatures accountable for their deeds on the Day of Judgment." },
  { number: 42, arabic: "الْجَلِيلُ", transliteration: "Al-Jalil", meaning: "The Majestic, The Glorious", description: "The One who possesses perfect and complete attributes of majesty. He is majestic in His essence, attributes, and actions." },
  { number: 43, arabic: "الْكَرِيمُ", transliteration: "Al-Karim", meaning: "The Most Generous, The Bountiful", description: "The One who is generous and noble in character. He gives without being asked, forgives without making the sinner feel embarrassed." },
  { number: 44, arabic: "الرَّقِيبُ", transliteration: "Ar-Raqib", meaning: "The Watchful, The Vigilant", description: "The One who watches over all things without being absent for even a moment. He sees all the deeds of His servants and will hold them accountable." },
  { number: 45, arabic: "الْمُجِيبُ", transliteration: "Al-Mujib", meaning: "The Responsive, The Answerer of Prayers", description: "The One who answers the prayers of His servants. He responds to every sincere dua and never rejects the prayer of the supplicant." },
  { number: 46, arabic: "الْوَاسِعُ", transliteration: "Al-Wasi", meaning: "The All-Encompassing, The All-Sufficient", description: "The One whose mercy and knowledge encompass everything. His provisions are vast and He encompasses all of creation in His care." },
  { number: 47, arabic: "الْحَكِيمُ", transliteration: "Al-Hakim", meaning: "The All-Wise", description: "The One who places everything in its proper place with perfect wisdom. All His decrees, commands, and actions are based on perfect wisdom." },
  { number: 48, arabic: "الْوَدُودُ", transliteration: "Al-Wadud", meaning: "The Loving, The Most Affectionate", description: "The One who loves His righteous servants with a love that gives them honor and through whose love they attain eternal happiness." },
  { number: 49, arabic: "الْمَجِيدُ", transliteration: "Al-Majid", meaning: "The All-Glorious, The Most Honorable", description: "The One who combines nobility and generosity. He is glorious in His attributes and generous in His actions." },
  { number: 50, arabic: "الْبَاعِثُ", transliteration: "Al-Ba'ith", meaning: "The Resurrector, The Raiser of the Dead", description: "The One who resurrects all creation after death for the final accounting. He will raise all beings from their graves on the Day of Judgment." },
  { number: 51, arabic: "الشَّهِيدُ", transliteration: "Ash-Shahid", meaning: "The Witness, The All-Present", description: "The One who witnesses all things. He is present and aware of all that happens, and He will be the ultimate witness on the Day of Judgment." },
  { number: 52, arabic: "الْحَقُّ", transliteration: "Al-Haqq", meaning: "The Truth, The Reality", description: "The One who is true in His existence, attributes, promises, and words. He is the only true deity and everything else is false." },
  { number: 53, arabic: "الْوَكِيلُ", transliteration: "Al-Wakil", meaning: "The Disposer of Affairs, The Trustee", description: "The One in whom believers place their trust and to whom they entrust their affairs. He manages the affairs of all creation perfectly." },
  { number: 54, arabic: "الْقَوِيُّ", transliteration: "Al-Qawiyy", meaning: "The All-Strong, The Most Powerful", description: "The One who possesses perfect and complete strength. His strength cannot be weakened or challenged by anything." },
  { number: 55, arabic: "الْمَتِينُ", transliteration: "Al-Matin", meaning: "The Firm, The Steadfast", description: "The One whose strength and power are firm and unwavering. He does not become weak or tired, and His power is absolute." },
  { number: 56, arabic: "الْوَلِيُّ", transliteration: "Al-Wali", meaning: "The Protecting Friend, The Ally", description: "The One who takes the believers as His close friends and allies. He loves them, supports them, guides them, and protects them." },
  { number: 57, arabic: "الْحَمِيدُ", transliteration: "Al-Hamid", meaning: "The Praiseworthy, The Laudable", description: "The One who deserves all praise and is praised in His essence, attributes, and actions. All praise rightfully belongs to Him alone." },
  { number: 58, arabic: "الْمُحْصِيُ", transliteration: "Al-Muhsi", meaning: "The Reckoner, The Accounter", description: "The One who has counted and enumerated all things. He has full knowledge of the number and details of all created things." },
  { number: 59, arabic: "الْمُبْدِئُ", transliteration: "Al-Mubdi", meaning: "The Originator, The Initiator", description: "The One who began creation from nothing without any prior example or prototype. He started everything from non-existence." },
  { number: 60, arabic: "الْمُعِيدُ", transliteration: "Al-Mu'id", meaning: "The Restorer, The Reinstater", description: "The One who restores and recreates all things after their destruction. He will resurrect all of creation as He originally created them." },
  { number: 61, arabic: "الْمُحْيِيُ", transliteration: "Al-Muhyi", meaning: "The Giver of Life", description: "The One who grants life. He gives physical life to bodies, spiritual life to hearts through faith and knowledge, and will give life on the Day of Resurrection." },
  { number: 62, arabic: "الْمُمِيتُ", transliteration: "Al-Mumit", meaning: "The Taker of Life, The Causer of Death", description: "The One who causes death. He takes life away whenever and however He wills. Death comes only by His command and decree." },
  { number: 63, arabic: "الْحَيُّ", transliteration: "Al-Hayy", meaning: "The Ever-Living, The Alive", description: "The One who is eternally alive with no beginning and no end. His life is not like the life of creatures which had a beginning and will have an end." },
  { number: 64, arabic: "الْقَيُّومُ", transliteration: "Al-Qayyum", meaning: "The Self-Subsisting, The Sustainer", description: "The One who is self-sustaining and upon whom all things depend. He needs nothing while everything needs Him for its existence and continuance." },
  { number: 65, arabic: "الْوَاجِدُ", transliteration: "Al-Wajid", meaning: "The Finder, The Perceiver", description: "The One who finds all things as He wishes and wills. He perceives and is aware of all things without exception." },
  { number: 66, arabic: "الْمَاجِدُ", transliteration: "Al-Majid", meaning: "The Noble, The Glorious", description: "The One who combines nobility of character with vast generosity. His glory extends to all aspects of His being." },
  { number: 67, arabic: "الْوَاحِدُ", transliteration: "Al-Wahid", meaning: "The One, The Unique", description: "The One who is unique and singular in His essence and attributes. He has no partner, rival, or equal in any aspect whatsoever." },
  { number: 68, arabic: "الْأَحَدُ", transliteration: "Al-Ahad", meaning: "The Unique, The Only One", description: "The Absolutely One, with no multiplicity of any kind. This name emphasizes uniqueness more strongly than Al-Wahid." },
  { number: 69, arabic: "الصَّمَدُ", transliteration: "As-Samad", meaning: "The Eternal, The Self-Sufficient", description: "The One who all creation turns to in their needs. He is independent of all things while everything depends on Him." },
  { number: 70, arabic: "الْقَادِرُ", transliteration: "Al-Qadir", meaning: "The All-Powerful, The Capable", description: "The One who has perfect power over all things. He can do whatever He wills and nothing can prevent Him from His actions." },
  { number: 71, arabic: "الْمُقْتَدِرُ", transliteration: "Al-Muqtadir", meaning: "The All-Determiner, The Powerful", description: "The One who has absolute and unrestrained power. He exercises power with complete mastery and dominance over all things." },
  { number: 72, arabic: "الْمُقَدِّمُ", transliteration: "Al-Muqaddim", meaning: "The Expediter, The Promoter", description: "The One who brings forward whatever He wills. He advances some things and people in wisdom according to His perfect plan." },
  { number: 73, arabic: "الْمُؤَخِّرُ", transliteration: "Al-Mu'akhkhir", meaning: "The Delayer, The Deferrer", description: "The One who delays whatever He wills and puts things back in their place according to His wisdom." },
  { number: 74, arabic: "الْأَوَّلُ", transliteration: "Al-Awwal", meaning: "The First", description: "The One who has no beginning. He existed before all things and there was nothing before Him." },
  { number: 75, arabic: "الْآخِرُ", transliteration: "Al-Akhir", meaning: "The Last", description: "The One who has no end. He will exist after all things cease, and there is nothing after Him." },
  { number: 76, arabic: "الظَّاهِرُ", transliteration: "Az-Zahir", meaning: "The Manifest, The Apparent", description: "The One whose existence is evident through clear proofs and signs. Everything in creation points to His existence." },
  { number: 77, arabic: "الْبَاطِنُ", transliteration: "Al-Batin", meaning: "The Hidden, The Inner", description: "The One who is hidden from eyes in His essence. No one can see Him in this life, and His true essence cannot be comprehended." },
  { number: 78, arabic: "الْوَالِيُ", transliteration: "Al-Wali", meaning: "The Governor, The Patron", description: "The One who governs all affairs and is in complete control of creation. He is the supreme administrator of the universe." },
  { number: 79, arabic: "الْمُتَعَالِيُ", transliteration: "Al-Muta'ali", meaning: "The Most Exalted, The Supreme", description: "The One who is supremely exalted above all things. He is too great to be fully encompassed by any mind or description." },
  { number: 80, arabic: "الْبَرُّ", transliteration: "Al-Barr", meaning: "The Source of All Goodness", description: "The One who is kind and full of goodness. He is the source of all goodness for His creation and treats His servants with great kindness." },
  { number: 81, arabic: "التَّوَّابُ", transliteration: "At-Tawwab", meaning: "The Ever-Accepting of Repentance", description: "The One who accepts repentance repeatedly. He enables His servants to turn to Him in repentance and accepts their sincere turning back to Him." },
  { number: 82, arabic: "الْمُنْتَقِمُ", transliteration: "Al-Muntaqim", meaning: "The Avenger", description: "The One who exacts retribution from wrongdoers and takes vengeance on behalf of the oppressed. His punishment reaches whoever deserves it." },
  { number: 83, arabic: "الْعَفُوُّ", transliteration: "Al-Afuww", meaning: "The Pardoner, The Eraser of Sins", description: "The One who completely pardons and erases sins without leaving any trace. He not only forgives but completely wipes away the sin." },
  { number: 84, arabic: "الرَّؤُوفُ", transliteration: "Ar-Ra'uf", meaning: "The Compassionate, The Kind", description: "The One who is extremely kind and gentle. This is an intensified form of mercy — a special, tender compassion that He shows to His servants." },
  { number: 85, arabic: "مَالِكُ الْمُلْكِ", transliteration: "Malik-ul-Mulk", meaning: "The Owner of All Sovereignty", description: "The One who possesses absolute sovereignty over all dominion. He gives kingdoms to whom He wills and takes them from whom He wills." },
  { number: 86, arabic: "ذُو الْجَلَالِ وَالْإِكْرَامِ", transliteration: "Dhul-Jalali wal-Ikram", meaning: "The Lord of Majesty and Generosity", description: "The One who combines majesty and generosity. This grand name encompasses both His overwhelming greatness and His boundless kindness." },
  { number: 87, arabic: "الْمُقْسِطُ", transliteration: "Al-Muqsit", meaning: "The Equitable, The Just", description: "The One who is perfectly equitable and just in all His dealings. He maintains justice throughout the universe." },
  { number: 88, arabic: "الْجَامِعُ", transliteration: "Al-Jami", meaning: "The Gatherer, The Collector", description: "The One who gathers all creation together. He will gather all of creation on the Day of Judgment for the final accounting." },
  { number: 89, arabic: "الْغَنِيُّ", transliteration: "Al-Ghani", meaning: "The Self-Sufficient, The Independent", description: "The One who is completely free from any need whatsoever. He needs nothing while all creation needs Him." },
  { number: 90, arabic: "الْمُغْنِيُ", transliteration: "Al-Mughni", meaning: "The Enricher, The Emancipator", description: "The One who enriches and satisfies whoever He wills. He gives wealth and makes His servants free of need." },
  { number: 91, arabic: "الْمَانِعُ", transliteration: "Al-Mani", meaning: "The Withholder, The Shielder", description: "The One who withholds and prevents harm from His servants. He shields them from what would harm them through His wisdom." },
  { number: 92, arabic: "الضَّارُّ", transliteration: "Ad-Darr", meaning: "The Distressor, The Harmful", description: "The One who allows harm to reach whom He wills. He may allow trials and difficulties to test His servants and purify them." },
  { number: 93, arabic: "النَّافِعُ", transliteration: "An-Nafi", meaning: "The Propitious, The Benefactor", description: "The One who benefits and helps whoever He wills. All benefit comes from Him and through Him." },
  { number: 94, arabic: "النُّورُ", transliteration: "An-Nur", meaning: "The Light", description: "The One who is the true light. He illuminates the heavens, the earth, and the hearts of the believers with His divine light." },
  { number: 95, arabic: "الْهَادِيُ", transliteration: "Al-Hadi", meaning: "The Guide", description: "The One who guides His servants to the straight path and to what leads to His pleasure. All guidance is in His hands." },
  { number: 96, arabic: "الْبَدِيعُ", transliteration: "Al-Badi", meaning: "The Incomparable, The Originator", description: "The One who creates in a wonderful and unprecedented way with no prior example. Everything He creates is perfectly unique and wondrous." },
  { number: 97, arabic: "الْبَاقِيُ", transliteration: "Al-Baqi", meaning: "The Ever-Lasting, The Everlasting", description: "The One who is eternal and everlasting. He has no end and will exist forever after all creation has perished." },
  { number: 98, arabic: "الْوَارِثُ", transliteration: "Al-Warith", meaning: "The Inheritor", description: "The One who inherits all things after their owners have passed away. All things return to Him and He alone remains." },
  { number: 99, arabic: "الرَّشِيدُ", transliteration: "Ar-Rashid", meaning: "The Guide to the Right Path", description: "The One who guides all affairs to their right conclusion. His guidance is perfect and leads everything to its proper and rightful outcome." },
];

const COLORS = [
  "#0D9373", "#D4A843", "#1D4ED8", "#7C3AED", "#DC2626",
  "#059669", "#D97706", "#0891B2", "#9333EA", "#16A34A",
];

export default function NamesOfAllahScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Name | null>(null);

  const filtered = useMemo(() => {
    if (!search) return NAMES;
    const q = search.toLowerCase();
    return NAMES.filter(n =>
      n.transliteration.toLowerCase().includes(q) ||
      n.meaning.toLowerCase().includes(q) ||
      n.arabic.includes(search) ||
      String(n.number) === search
    );
  }, [search]);

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>99 Names of Allah</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>أسماء الله الحسنى</Text>
        </View>
        <View style={[s.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.countText, { color: colors.primary }]}>{filtered.length}/99</Text>
        </View>
      </View>

      {/* Bismillah Banner */}
      <View style={[s.banner, { backgroundColor: colors.navy }]}>
        <Text style={s.bannerText}>وَلِلَّهِ الأَسْمَاءُ الحُسْنَى فَادْعُوهُ بِهَا</Text>
        <Text style={[s.bannerTrans, { color: colors.gold }]}>And to Allah belong the best names, so invoke Him by them — Quran 7:180</Text>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search by name or meaning..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Names Grid */}
      <FlatList
        data={filtered}
        keyExtractor={n => String(n.number)}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 60, gap: 10 }}
        renderItem={({ item, index }) => {
          const color = COLORS[item.number % COLORS.length];
          return (
            <TouchableOpacity
              style={[s.nameCard, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setSelected(item)}
            >
              <View style={[s.nameNumber, { backgroundColor: color + "20" }]}>
                <Text style={[s.nameNumberText, { color }]}>{item.number}</Text>
              </View>
              <Text style={[s.nameArabic, { color: colors.foreground }]}>{item.arabic}</Text>
              <Text style={[s.nameTranslit, { color }]} numberOfLines={1}>{item.transliteration}</Text>
              <Text style={[s.nameMeaning, { color: colors.mutedForeground }]} numberOfLines={2}>{item.meaning}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={[s.modal, { backgroundColor: colors.background }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <View style={[s.modalNum, { backgroundColor: COLORS[selected.number % COLORS.length] + "20" }]}>
                <Text style={[s.modalNumText, { color: COLORS[selected.number % COLORS.length] }]}>{selected.number}</Text>
              </View>
              <TouchableOpacity onPress={() => {
                Clipboard.setStringAsync(`${selected.arabic}\n${selected.transliteration}\n${selected.meaning}`);
              }}>
                <Feather name="copy" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center", paddingBottom: 60 }}>
              <Text style={[s.modalArabic, { color: COLORS[selected.number % COLORS.length] }]}>{selected.arabic}</Text>
              <Text style={[s.modalTranslit, { color: colors.foreground }]}>{selected.transliteration}</Text>
              <View style={[s.meaningBadge, { backgroundColor: COLORS[selected.number % COLORS.length] + "15" }]}>
                <Text style={[s.meaningText, { color: COLORS[selected.number % COLORS.length] }]}>{selected.meaning}</Text>
              </View>
              <Text style={[s.modalDesc, { color: colors.foreground }]}>{selected.description}</Text>

              <View style={s.navButtons}>
                <TouchableOpacity
                  style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }, selected.number === 1 && { opacity: 0.4 }]}
                  onPress={() => setSelected(NAMES.find(n => n.number === selected.number - 1) ?? selected)}
                  disabled={selected.number === 1}
                >
                  <Feather name="chevron-left" size={20} color={colors.foreground} />
                  <Text style={[s.navBtnText, { color: colors.foreground }]}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.navBtn, { backgroundColor: colors.card, borderColor: colors.border }, selected.number === 99 && { opacity: 0.4 }]}
                  onPress={() => setSelected(NAMES.find(n => n.number === selected.number + 1) ?? selected)}
                  disabled={selected.number === 99}
                >
                  <Text style={[s.navBtnText, { color: colors.foreground }]}>Next</Text>
                  <Feather name="chevron-right" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    countText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    banner: { marginHorizontal: 16, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 },
    bannerText: { fontSize: 17, color: "#FFF", textAlign: "center", marginBottom: 6 },
    bannerTrans: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center" },
    searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10, marginHorizontal: 16, marginBottom: 12 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
    nameCard: { borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center", gap: 6 },
    nameNumber: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    nameNumberText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    nameArabic: { fontSize: 22, textAlign: "center" },
    nameTranslit: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    nameMeaning: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
    modal: { flex: 1 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    modalNum: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    modalNumText: { fontSize: 15, fontFamily: "Inter_700Bold" },
    modalArabic: { fontSize: 52, textAlign: "center", marginBottom: 8 },
    modalTranslit: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 16 },
    meaningBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
    meaningText: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    modalDesc: { fontSize: 16, lineHeight: 28, textAlign: "center", fontFamily: "Inter_400Regular" },
    navButtons: { flexDirection: "row", gap: 12, marginTop: 32 },
    navBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
    navBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  });
}
