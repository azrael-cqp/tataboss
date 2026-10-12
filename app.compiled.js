const {
  useState,
  useEffect,
  useRef
} = React;

/* ═══════════════════════════════════════════════════
   SISTEM ANTRENAMENT — versiune romana, text mare
   ═══════════════════════════════════════════════════ */

/* ─── SCARA DE FONTURI (totul mare, pentru citit fara ochelari) ─── */
const F = {
  xs: 16,
  sm: 18,
  md: 21,
  lg: 24,
  xl: 28,
  xxl: 34,
  huge: 46
};

/* ─── STOCARE INDEXEDDB ─── */
const DB_NAME = "AntrenamentRO_DB";
const STORE = "gamedata";
const DATA_KEY = "save";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveToIDB(data) {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, DATA_KEY);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  } catch (e) {
    console.error("Salvare esuata", e);
    return false;
  }
}
async function loadFromIDB() {
  try {
    const db = await openDB();
    return new Promise(res => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(DATA_KEY);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  } catch (e) {
    return null;
  }
}
const SAVE_FIELDS = ["level", "xp", "stats", "done", "doneEx", "doneW", "totalXp", "qC", "streak", "weightLog", "muscleXp", "lastDailyReset", "lastWeeklyReset", "penaltyLog", "liftLog", "vacation", "sleepLog", "workoutCalendar", "exerciseSwaps", "targetWeight", "startDate", "v2"];
const DEFAULT_STATE = {
  level: 1,
  xp: 0,
  stats: {
    STR: 5,
    VIT: 3,
    AGI: 3,
    INT: 2,
    PER: 2
  },
  done: [],
  doneEx: [],
  doneW: [],
  totalXp: 0,
  qC: 0,
  streak: 0,
  weightLog: [],
  muscleXp: {
    piept: 0,
    spate: 0,
    umeri: 0,
    biceps: 0,
    triceps: 0,
    cvadriceps: 0,
    ischio: 0,
    fesieri: 0,
    gambe: 0,
    abdomen: 0,
    cardio: 0
  },
  lastDailyReset: null,
  lastWeeklyReset: null,
  penaltyLog: [],
  liftLog: {},
  vacation: false,
  sleepLog: [],
  workoutCalendar: {},
  exerciseSwaps: {},
  targetWeight: null,
  startDate: null
};

/* ─── RANGURI ─── */
const RANKS = [{
  name: "RANG E",
  min: 1,
  max: 5,
  color: "#94a3b8",
  desc: "Inceput. Fiecare zi conteaza."
}, {
  name: "RANG D",
  min: 6,
  max: 15,
  color: "#22d3ee",
  desc: "Corpul incepe sa se obisnuiasca."
}, {
  name: "RANG C",
  min: 16,
  max: 30,
  color: "#34d399",
  desc: "Obiceiul e format. Se vede."
}, {
  name: "RANG B",
  min: 31,
  max: 50,
  color: "#a78bfa",
  desc: "Mai puternic si mai usor."
}, {
  name: "RANG A",
  min: 51,
  max: 75,
  color: "#f59e0b",
  desc: "Alt om fata de ziua 1."
}, {
  name: "RANG S",
  min: 76,
  max: 100,
  color: "#ef4444",
  desc: "Disciplina de fier."
}, {
  name: "LEGENDA",
  min: 101,
  max: 999,
  color: "#ec4899",
  desc: "Nimic nu te mai opreste."
}];
function getRank(l) {
  for (let i = RANKS.length - 1; i >= 0; i--) if (l >= RANKS[i].min) return RANKS[i];
  return RANKS[0];
}
function getXp(l) {
  return Math.floor(100 * Math.pow(1.15, l - 1));
}
function getRankMultiplier(level) {
  if (level >= 101) return 4.0;
  if (level >= 76) return 3.0;
  if (level >= 51) return 2.5;
  if (level >= 31) return 2.0;
  if (level >= 16) return 1.5;
  if (level >= 6) return 1.2;
  return 1.0;
}
function getStreakMultiplier(streak) {
  if (streak >= 90) return 3.0;
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

/* ─── RANGURI PE GRUPA MUSCULARA ─── */
const MUSCLE_RANKS = [{
  name: "BRONZ",
  min: 0,
  color: "#d97706"
}, {
  name: "ARGINT",
  min: 30,
  color: "#cbd5e1"
}, {
  name: "AUR",
  min: 75,
  color: "#fbbf24"
}, {
  name: "PLATINA",
  min: 150,
  color: "#22d3ee"
}, {
  name: "DIAMANT",
  min: 250,
  color: "#a78bfa"
}, {
  name: "MAESTRU",
  min: 400,
  color: "#f472b6"
}, {
  name: "LEGENDA",
  min: 600,
  color: "#ef4444"
}];
function getMuscleRank(xp) {
  for (let i = MUSCLE_RANKS.length - 1; i >= 0; i--) if (xp >= MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return MUSCLE_RANKS[0];
}
function getNextMuscleRank(xp) {
  for (let i = 0; i < MUSCLE_RANKS.length; i++) if (xp < MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return null;
}
const MUSCLE_GROUPS = [{
  key: "piept",
  name: "Piept",
  icon: "🫁"
}, {
  key: "spate",
  name: "Spate",
  icon: "🔙"
}, {
  key: "umeri",
  name: "Umeri",
  icon: "🔺"
}, {
  key: "biceps",
  name: "Biceps",
  icon: "💪"
}, {
  key: "triceps",
  name: "Triceps",
  icon: "🔱"
}, {
  key: "cvadriceps",
  name: "Cvadriceps",
  icon: "🦵"
}, {
  key: "ischio",
  name: "Ischiogambieri",
  icon: "🦿"
}, {
  key: "fesieri",
  name: "Fesieri",
  icon: "🍑"
}, {
  key: "gambe",
  name: "Gambe",
  icon: "🦶"
}, {
  key: "abdomen",
  name: "Abdomen",
  icon: "🔥"
}, {
  key: "cardio",
  name: "Inima / Cardio",
  icon: "🫀"
}];

/* ─── ZILE ─── */
const DOW_RO = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
const DOW_SHORT = ["D", "L", "Ma", "Mi", "J", "V", "S"];

/* ─── SUNETE ─── */
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur, vol, wave) => {
      const o = ctx.createOscillator();
      const gg = ctx.createGain();
      o.connect(gg);
      gg.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = wave || "sine";
      gg.gain.setValueAtTime(0, ctx.currentTime + start);
      gg.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.04);
      gg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    if (type === "bifa") beep(800, 0, 0.2, 0.15);else if (type === "gata") {
      [523, 659, 784].forEach((f, i) => beep(f, i * 0.09, 0.5, 0.13, "triangle"));
    } else if (type === "intarziat") {
      [600, 400].forEach((f, i) => beep(f, i * 0.16, 0.15, 0.11, "square"));
    } else if (type === "nivel") {
      [261, 329, 392, 523].forEach((f, i) => beep(f, i * 0.11, 0.45, 0.15, "triangle"));
    }
  } catch (e) {
    console.warn("Audio indisponibil", e);
  }
}
/* ═══════════════════════════════════════════════════
   PROGRAM PPL — adaptat pentru incepator, 60 de ani,
   supraponderal. Aparate si gantere, fara ridicari
   grele de la sol, fara sarituri, fara epuizare.
   ═══════════════════════════════════════════════════ */

const REGULI = ["Incalzire 8-10 minute INAINTE de primul exercitiu. Niciodata direct la greutate.", "Opreste setul cand mai poti face 2-3 repetari corecte. NU la epuizare.", "Nu tine niciodata respiratia. Expiri cand impingi sau tragi, inspiri cand revii.", "Miscari lente si controlate: 2 secunde la efort, 3 secunde la revenire.", "Progresia se face in ordinea asta: intai o repetare in plus, apoi o serie in plus, abia la final kilograme.", "Durere ascutita in articulatie = oprire imediata. Oboseala in muschi = normal.", "Intre exercitii bea apa. Antrenamentul dureaza 60-70 de minute, cu mersul pe banda la final."];
const STOP_SEMNE = ["Durere sau apasare in piept", "Ameteala, vedere in ceata, greata", "Respiratie foarte grea care nu se linisteste", "Batai neregulate ale inimii", "Durere care coboara in brat sau in maxilar"];
const PPL = {
  1: {
    day: "Luni",
    type: "IMPINGERE",
    short: "PIEPT · UMERI · TRICEPS",
    color: "#ef4444",
    icon: "🔴",
    nota: "Prima zi a saptamanii. Serii in plus fata de inainte - greutatea ramane aceeasi pana se aseaza tiparul.",
    exercises: [{
      name: "Presa de piept la aparat",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Piept",
      groups: ["piept", "triceps", "umeri"],
      rest: 120,
      inc: 2.5,
      cum: "Te asezi pe aparat cu spatele lipit complet de spatar. Manerele sa fie la nivelul mijlocului pieptului. Impingi inainte pana aproape de intinderea completa a coatelor, dar NU blochezi coatele. Revii lent, 3 secunde, pana simti intinderea in piept. Expiri cand impingi.",
      lucreaza: "Pieptul, in fata umarului si tricepsul.",
      atentie: "Nu ridica fundul de pe scaun si nu curba spatele. Coatele nu coboara mai jos de linia umerilor - protejeaza articulatia. Nu tine respiratia.",
      usor: "Scade greutatea si fa 12 repetari lente. Aparatul e cel mai sigur exercitiu de piept: te ghideaza singur."
    }, {
      name: "Presa de umeri la aparat",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Umeri",
      groups: ["umeri", "triceps"],
      rest: 120,
      inc: 2.5,
      cum: "Sezand, spatele sprijinit. Impingi manerele in sus pe langa cap, pana aproape de intindere. Cobori lent pana cand manerele ajung la nivelul urechilor. Abdomenul strans.",
      lucreaza: "Umerii (partea din fata si laterala) si tricepsul.",
      atentie: "Nu cobori mai jos de nivelul urechilor - forteaza umarul. Nu impinge cu spatele arcuit. Daca umarul te intepa, ridica mai putin.",
      usor: "Fa doar 2 seturi in primele saptamani sau foloseste o greutate care iti permite 12 repetari lejere."
    }, {
      name: "Fluturari la aparat (Pec Deck)",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Piept",
      groups: ["piept"],
      rest: 90,
      inc: 2.5,
      cum: "Sezand, coatele sprijinite pe perne. Aduci coatele in fata pana aproape se ating, strangi pieptul o secunda, apoi le lasi lent inapoi.",
      lucreaza: "Mijlocul pieptului, izolat.",
      atentie: "Nu deschide bratele exagerat in spate. Miscarea vine din piept, nu din smucitura.",
      usor: "Greutate mica, 15 repetari. Aici cauti senzatia in muschi, nu greutatea."
    }, {
      name: "Ridicari laterale cu gantere",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Umeri",
      groups: ["umeri"],
      rest: 75,
      inc: 1,
      cum: "In picioare sau sezand, o gantera mica in fiecare mana. Ridici bratele lateral pana la nivelul umerilor, cu coatele putin indoite. Cobori lent, numarand pana la 3.",
      lucreaza: "Partea laterala a umarului - da latime.",
      atentie: "NU ridica mai sus de umeri. Fara balans din corp. Gantere mici: 2-4 kg sunt suficiente la inceput.",
      usor: "Fa-le sezand pe o banca - elimina balansul. Sau ridica doar pana la jumatate."
    }, {
      name: "Extensii de triceps la cablu",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Triceps",
      groups: ["triceps"],
      rest: 75,
      inc: 2.5,
      cum: "La cablul de sus, cu franghia sau bara. Coatele lipite de corp, nu se misca. Impingi in jos pana intinzi complet bratele, strangi tricepsul, revii lent.",
      lucreaza: "Tricepsul - partea din spate a bratului.",
      atentie: "Coatele stau lipite de corp. Nu te apleca peste cablu si nu impinge cu tot corpul.",
      usor: "Coboara greutatea si fa 15 repetari. E un exercitiu de finisare, nu de forta."
    }, {
      name: "Plank",
      sets: "3 seturi × 30-45 secunde",
      muscle: "Abdomen",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Sprijin pe antebrate si pe varfuri, NU pe genunchi. Corpul in linie dreapta de la cap la calcaie. Strangi abdomenul si fesele tot timpul. Respiri normal si numeri secundele. Tinta: 45 de secunde pe serie.",
      lucreaza: "Abdomenul si zona lombara - sprijinul coloanei.",
      atentie: "Fara fund ridicat si fara sale lasate. In momentul in care salele incep sa cada, opresti seria - nu mai are rost tinut. Daca te doare lombarul, opresti imediat.",
      usor: "Daca nu ajungi la 30 de secunde, imparte: 3 serii de 20 de secunde si creste cate 5 secunde pe saptamana, pana la 45."
    }, {
      name: "Mers pe banda 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "La FINAL, dupa ce ai terminat exercitiile cu greutati. Ritm de plimbare vioaie: viteza 4,5-5,5 km/h, inclinatie 2-4 % daca banda are. Ritmul corect e acela in care inca poti vorbi, dar nu ai mai putea canta. Fara alergare, niciodata.",
      lucreaza: "Inima, circulatia si arderea grasimii. Asta e partea care se vede cel mai mult pe cantar.",
      atentie: "NU te tine de bare in timp ce mergi - strica postura si injumatateste efortul. Daca ti se taie respiratia, scazi viteza, nu te opresti brusc. Ultimele 2 minute le faci lent, ca sa cobori pulsul.",
      usor: "Incepe cu 15 minute fara inclinatie si adaugi cate 5 minute pe saptamana. Daca genunchiul se incarca, dai inclinatia pe 0."
    }]
  },
  2: {
    day: "Marti",
    type: "TRAGERE",
    short: "SPATE · BICEPS",
    color: "#3b82f6",
    icon: "🔵",
    nota: "Ziua de spate. Spatele puternic inseamna postura mai buna si mai putina durere lombara.",
    exercises: [{
      name: "Tractiuni la helcometru",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 120,
      inc: 2.5,
      cum: "Sezand, genunchii fixati sub perne. Priza mai larga decat umerii. Tragi bara spre partea de sus a pieptului, coborand coatele in jos si strangand omoplatii. Lasi bara sus lent, 3 secunde.",
      lucreaza: "Muschiul mare al spatelui (latissimus) si bicepsul.",
      atentie: "Nu tragi bara la ceafa, niciodata. Nu te lasi mult pe spate - maxim 10-15 grade. Nu smuci.",
      usor: "Alege o greutate cu care poti face 12 repetari controlat. Aici forma conteaza mai mult decat kilogramele."
    }, {
      name: "Ramat la aparat cu sprijin pe piept",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 120,
      inc: 2.5,
      cum: "Pieptul sprijinit pe perna aparatului. Tragi manerele spre coaste, strangi omoplatii unul spre altul, tii o secunda, apoi revii lent.",
      lucreaza: "Mijlocul spatelui si bicepsul.",
      atentie: "Pieptul ramane lipit de perna - asa nu se incarca deloc lombarul. Nu tragi din umeri ridicati.",
      usor: "Greutate mai mica si concentrare pe strangerea omoplatilor. Acest aparat inlocuieste ramatul aplecat cu bara, care e riscant pentru spate."
    }, {
      name: "Ramat la cablu sezand",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Spate",
      groups: ["spate"],
      rest: 90,
      inc: 2.5,
      cum: "Sezand, picioarele sprijinite, genunchii putin indoiti. Tragi manerul spre burta, cu spatele drept. Revii lent, fara sa lasi greutatea sa te trage in fata.",
      lucreaza: "Mijlocul spatelui.",
      atentie: "Spatele nu se rotunjeste si nu se leagana inainte-inapoi. Trage cu spatele, nu cu bratele.",
      usor: "Greutate mica si trunchiul complet nemiscat."
    }, {
      name: "Face pull la cablu",
      sets: "3 seturi × 15 repetari",
      muscle: "Umeri / Spate sus",
      groups: ["umeri", "spate"],
      rest: 60,
      inc: 2.5,
      cum: "Cablu la nivelul fetei, cu franghia. Tragi franghia spre fata, desfacand capetele spre exterior, coatele sus. Revii lent.",
      lucreaza: "Spatele umarului si muschii dintre omoplati. Cel mai bun exercitiu pentru sanatatea umarului si pentru postura.",
      atentie: "Greutate mica, mereu. Aici nu se trage greu.",
      usor: "Ramai la 15 repetari usoare. Fa-l chiar si in zilele libere daca stai mult pe scaun."
    }, {
      name: "Flexii de biceps cu gantere",
      sets: "3 seturi × 10-12 repetari",
      muscle: "Biceps",
      groups: ["biceps"],
      rest: 75,
      inc: 1,
      cum: "In picioare sau sezand, cate o gantera in fiecare mana. Ridici greutatea indoind cotul, fara sa misti cotul din loc. Cobori lent, 3 secunde, pana la intindere completa.",
      lucreaza: "Bicepsul.",
      atentie: "Fara balans din spate. Coatele stau lipite de corp.",
      usor: "Fa-le sezand, alternativ, un brat pe rand."
    }, {
      name: "Dead bug",
      sets: "3 seturi × 8 repetari pe parte",
      muscle: "Abdomen / Lombar",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Culcat pe spate, pe saltea. Bratele intinse in sus spre tavan, genunchii ridicati si indoiti la 90 de grade. Cobori incet spre podea bratul drept si piciorul stang in acelasi timp, apoi revii. Schimbi partea. Zero presiune pe genunchi.",
      lucreaza: "Abdomenul profund, cel care tine coloana stabila. Face aceeasi treaba ca bird dog, dar fara sprijin pe genunchi.",
      atentie: "Lombarul ramane lipit de podea tot timpul. Daca se ridica, cobori mai putin. Nu tine respiratia - expiri cand cobori.",
      usor: "Misca doar bratele, apoi doar picioarele, separat. Sau cobori doar pe jumatate de drum."
    }, {
      name: "Mers pe banda 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "La FINAL, dupa ce ai terminat exercitiile cu greutati. Ritm de plimbare vioaie: viteza 4,5-5,5 km/h, inclinatie 2-4 % daca banda are. Ritmul corect e acela in care inca poti vorbi, dar nu ai mai putea canta. Fara alergare, niciodata.",
      lucreaza: "Inima, circulatia si arderea grasimii. Asta e partea care se vede cel mai mult pe cantar.",
      atentie: "NU te tine de bare in timp ce mergi - strica postura si injumatateste efortul. Daca ti se taie respiratia, scazi viteza, nu te opresti brusc. Ultimele 2 minute le faci lent, ca sa cobori pulsul.",
      usor: "Incepe cu 15 minute fara inclinatie si adaugi cate 5 minute pe saptamana. Daca genunchiul se incarca, dai inclinatia pe 0."
    }]
  },
  3: {
    day: "Miercuri",
    type: "PICIOARE",
    short: "CVADRICEPS · ISCHIO · FESIERI · GAMBE",
    color: "#22c55e",
    icon: "🟢",
    nota: "Ziua cea mai importanta pentru genunchi si mobilitate, si cea mai des sarita. Nu o sari. Fara greutati mari, doar control.",
    exercises: [{
      name: "Presa de picioare",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Cvadriceps / Fesieri",
      groups: ["cvadriceps", "fesieri"],
      rest: 150,
      inc: 5,
      cum: "Talpile complet pe platforma, la latimea umerilor. Cobori greutatea pana cand genunchiul face un unghi de aproximativ 90 de grade - nu mai mult la inceput. Impingi prin toata talpa. Nu blochezi genunchii sus.",
      lucreaza: "Fata coapsei si fesierii.",
      atentie: "Fundul si lombarul raman lipite de spatar tot timpul. Daca bazinul se rotunjeste, ai coborat prea mult. Genunchii nu cad spre interior.",
      usor: "Coboara mai putin (jumatate de drum) si foloseste greutate mica. Presa e mult mai sigura pentru tine decat genuflexiunile cu bara."
    }, {
      name: "Ridicari de pe scaun cu gantera",
      sets: "4 seturi × 8-10 repetari",
      muscle: "Cvadriceps / Fesieri",
      groups: ["cvadriceps", "fesieri"],
      rest: 120,
      inc: 2,
      cum: "Stai pe o banca, o gantera tinuta la piept cu ambele mani. Te ridici in picioare fara sa te legeni si fara sa te ajuti cu mainile. Cobori lent, controlat, pana atingi banca. Nu te trantesti pe banca.",
      lucreaza: "Coapsele si fesierii, exact miscarea de care ai nevoie in viata de zi cu zi.",
      atentie: "Genunchii stau in linie cu degetele picioarelor. Spatele drept, privirea in fata.",
      usor: "Fa-le fara gantera, doar cu greutatea corpului. Sau foloseste o banca mai inalta."
    }, {
      name: "Flexii de genunchi la aparat",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Ischiogambieri",
      groups: ["ischio"],
      rest: 90,
      inc: 2.5,
      cum: "Culcat sau sezand la aparat. Indoi genunchii tragand greutatea, strangi o secunda, revii lent 3 secunde.",
      lucreaza: "Spatele coapsei. Muschi aproape mereu slab - protejeaza genunchiul.",
      atentie: "Fara smucituri si fara sa ridici bazinul de pe aparat.",
      usor: "Greutate mica, 15 repetari lente."
    }, {
      name: "Extensii de genunchi la aparat",
      sets: "2 seturi × 12-15 repetari",
      muscle: "Cvadriceps",
      groups: ["cvadriceps"],
      rest: 90,
      inc: 2.5,
      cum: "Sezand, intinzi genunchii pana aproape complet, tii o secunda sus, cobori lent.",
      lucreaza: "Fata coapsei, izolat. Ajuta stabilitatea genunchiului.",
      atentie: "Nu bloca genunchiul brusc si nu lasa greutatea sa cada. Daca simti durere in genunchi, redu amplitudinea.",
      usor: "Lucreaza doar pe ultima jumatate a miscarii, cu greutate mica."
    }, {
      name: "Ridicari pe varfuri",
      sets: "3 seturi × 15 repetari",
      muscle: "Gambe",
      groups: ["gambe"],
      rest: 60,
      inc: 2.5,
      cum: "In picioare, te ridici pe varfuri cat de sus poti, tii o secunda, cobori lent pana la calcaie jos.",
      lucreaza: "Gambele - ajuta echilibrul si circulatia.",
      atentie: "Tine-te de ceva ca sa nu iti pierzi echilibrul. Fara sarituri.",
      usor: "Fara greutate, doar cu corpul, tinandu-te de bara."    }, {
      name: "Mers cu gantera intr-o mana",
      sets: "3 seturi × 30 de pasi pe parte",
      muscle: "Abdomen / Talie",
      groups: ["abdomen"],
      rest: 75,
      inc: 2,
      repsOnly: true,
      finisher: true,
      cum: "Iei o gantera grea intr-o singura mana, bratul intins pe langa corp. Mergi drept, cu umerii la acelasi nivel si fara sa te apleci in partea cu greutatea. 30 de pasi, schimbi mana, repeti. Abdomenul strans tot timpul.",
      lucreaza: "Lateralele abdomenului si muschii care tin coloana dreapta. Lucreaza exact ca atunci cand cari o sacosa grea - de asta e util in viata de zi cu zi.",
      atentie: "Nu te apleca in lateral si nu ridica umarul. Daca incepi sa te inclini, gantera e prea grea. Mergi lent, cu spatele drept si privirea in fata.",
      usor: "Incepe cu 6-8 kg si 20 de pasi. Daca spatiul e mic, mergi dus-intors pe acelasi culoar."
    }, {
      name: "Mers pe banda 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "La FINAL, dupa ce ai terminat exercitiile cu greutati. Ritm de plimbare vioaie: viteza 4,5-5,5 km/h, inclinatie 2-4 % daca banda are. Ritmul corect e acela in care inca poti vorbi, dar nu ai mai putea canta. Fara alergare, niciodata.",
      lucreaza: "Inima, circulatia si arderea grasimii. Asta e partea care se vede cel mai mult pe cantar.",
      atentie: "NU te tine de bare in timp ce mergi - strica postura si injumatateste efortul. Daca ti se taie respiratia, scazi viteza, nu te opresti brusc. Ultimele 2 minute le faci lent, ca sa cobori pulsul.",
      usor: "Incepe cu 15 minute fara inclinatie si adaugi cate 5 minute pe saptamana. Daca genunchiul se incarca, dai inclinatia pe 0."
    }]
  },
  4: {
    day: "Joi",
    type: "IMPINGERE",
    short: "PIEPT · UMERI · TRICEPS",
    color: "#ef4444",
    icon: "🔴",
    nota: "A doua zi de impingere, cu gantere. Ganterele cer mai mult echilibru - greutati mai mici.",
    exercises: [{
      name: "Presa cu gantere pe banca inclinata",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Piept sus",
      groups: ["piept", "umeri", "triceps"],
      rest: 120,
      inc: 2,
      cum: "Banca inclinata la 30-45 de grade. Ganterele pornesc la nivelul pieptului, coatele putin sub linia umerilor. Impingi in sus si putin spre interior. Cobori lent, 3 secunde.",
      lucreaza: "Partea de sus a pieptului, umarul din fata, tricepsul.",
      atentie: "Nu cobori ganterele prea jos - opreste cand simti intinderea, nu mai mult. Ceri ajutor sa ridici ganterele daca sunt grele.",
      usor: "Fa-le pe banca mai inclinata (aproape sezand) - e mai putin solicitant pentru umar."
    }, {
      name: "Presa de umeri cu gantere, sezand",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Umeri",
      groups: ["umeri", "triceps"],
      rest: 120,
      inc: 2,
      cum: "Sezand pe banca cu spatar. Ganterele la nivelul urechilor, palmele in fata. Impingi in sus fara sa blochezi coatele, cobori lent la nivelul urechilor.",
      lucreaza: "Umerii, in special partea din fata.",
      atentie: "Spatele lipit de spatar, abdomenul strans. Daca te doare umarul, tine palmele fata in fata (priza neutra).",
      usor: "Gantere de 4-6 kg sunt un inceput perfect. Alterneaza bratele daca e mai comod."
    }, {
      name: "Fluturari cu gantere pe banca inclinata",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Piept",
      groups: ["piept"],
      rest: 90,
      inc: 1,
      cum: "Culcat pe banca inclinata, ganterele deasupra pieptului, coatele putin indoite. Deschizi bratele lateral ca o imbratisare inversa, pana simti intinderea, apoi le aduci inapoi strangand pieptul.",
      lucreaza: "Pieptul, prin intindere.",
      atentie: "Coatele raman putin indoite tot timpul. Greutati mici - aici nu se merge greu niciodata.",
      usor: "Fa aceeasi miscare la aparatul de fluturari, e mai sigur."
    }, {
      name: "Ridicari frontale la cablu",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Umeri fata",
      groups: ["umeri"],
      rest: 75,
      inc: 2.5,
      cum: "Cablul jos, cu franghia sau maner. Ridici bratele in fata pana la nivelul ochilor, palmele in jos. Cobori lent.",
      lucreaza: "Partea din fata a umarului.",
      atentie: "Nu te lasa pe spate ca sa ridici. Nu depasesti nivelul ochilor.",
      usor: "Greutate mica, un brat pe rand."
    }, {
      name: "Extensii de triceps deasupra capului",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Triceps",
      groups: ["triceps"],
      rest: 75,
      inc: 1,
      cum: "Sezand, o gantera tinuta cu ambele mani deasupra capului. Cobori greutatea in spatele capului indoind doar coatele, apoi intinzi bratele in sus.",
      lucreaza: "Partea lunga a tricepsului.",
      atentie: "Coatele stau aproape de cap, nu se deschid in lateral. Miscare lenta, controlata - aici e usor sa te lovesti.",
      usor: "Fa-o la cablu, cu franghia, cu spatele la aparat - greutatea nu iti cade pe cap."
    }, {
      name: "Presa Pallof la cablu",
      sets: "3 seturi × 10 repetari pe parte",
      muscle: "Abdomen",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "In picioare, lateral fata de cablu, manerul tinut cu ambele mani la piept. Intinzi bratele in fata si te opui rotirii pe care o face cablul. Tii 3 secunde, revii. Apoi te intorci pe partea cealalta.",
      lucreaza: "Abdomenul si muschii care nu lasa coloana sa se rasuceasca.",
      atentie: "Corpul sta nemiscat. Fara rotire din bazin. Greutate mica.",
      usor: "Sta mai aproape de aparat sau tine mai putine secunde."
    }, {
      name: "Mers pe banda 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "La FINAL, dupa ce ai terminat exercitiile cu greutati. Ritm de plimbare vioaie: viteza 4,5-5,5 km/h, inclinatie 2-4 % daca banda are. Ritmul corect e acela in care inca poti vorbi, dar nu ai mai putea canta. Fara alergare, niciodata.",
      lucreaza: "Inima, circulatia si arderea grasimii. Asta e partea care se vede cel mai mult pe cantar.",
      atentie: "NU te tine de bare in timp ce mergi - strica postura si injumatateste efortul. Daca ti se taie respiratia, scazi viteza, nu te opresti brusc. Ultimele 2 minute le faci lent, ca sa cobori pulsul.",
      usor: "Incepe cu 15 minute fara inclinatie si adaugi cate 5 minute pe saptamana. Daca genunchiul se incarca, dai inclinatia pe 0."
    }]
  },
  5: {
    day: "Vineri",
    type: "TRAGERE",
    short: "SPATE · BICEPS",
    color: "#3b82f6",
    icon: "🔵",
    nota: "Ultima zi de sala din saptamana. Sambata si duminica: odihna completa.",
    exercises: [{
      name: "Ramat cu gantera, sprijin pe banca",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 120,
      inc: 2,
      cum: "Un genunchi si o mana pe banca, spatele drept si paralel cu podeaua. Cu mana libera tragi gantera pe langa corp, spre bazin, strangand omoplatul. Cobori lent. Apoi schimbi partea.",
      lucreaza: "O parte a spatelui pe rand - corecteaza diferentele dintre stanga si dreapta.",
      atentie: "Spatele nu se rotunjeste si nu se rasuceste. Nu smuci gantera cu tot corpul.",
      usor: "Sprijina-te cu pieptul pe o banca inclinata si trage cu ambele mani - zero incarcare pe lombar."
    }, {
      name: "Tractiuni la helcometru cu priza neutra",
      sets: "4 seturi × 10-12 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 120,
      inc: 2.5,
      cum: "La helcometru, cu manerul in V (palmele fata in fata). Tragi spre partea de sus a pieptului, coatele coboara pe langa corp. Revii lent.",
      lucreaza: "Spatele si bicepsul. Priza neutra e cea mai blanda cu umerii.",
      atentie: "Nu te lasa mult pe spate. Nu tragi din umeri ridicati spre urechi.",
      usor: "Greutate mai mica, 12 repetari lente."
    }, {
      name: "Pullover la cablu",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Spate",
      groups: ["spate"],
      rest: 75,
      inc: 2.5,
      cum: "In fata cablului de sus, bara sau franghia. Bratele aproape intinse, tragi in jos pe un arc pana la coapse, apoi lasi lent sus. Miscarea vine din spate, nu din coate.",
      lucreaza: "Muschiul mare al spatelui, prin intindere.",
      atentie: "Coatele raman aproape drepte. Trunchiul putin aplecat in fata, dar nemiscat.",
      usor: "Greutate mica si amplitudine mai scurta."
    }, {
      name: "Fluturari inverse la aparat",
      sets: "3 seturi × 15 repetari",
      muscle: "Umeri spate",
      groups: ["umeri", "spate"],
      rest: 60,
      inc: 2.5,
      cum: "La aparatul de fluturari, intors cu pieptul spre perna. Duci bratele in spate, strangand omoplatii. Revii lent.",
      lucreaza: "Spatele umarului si muschii posturii.",
      atentie: "Greutate mica. Fara balans.",
      usor: "Aceeasi miscare cu gantere foarte usoare, aplecat pe o banca inclinata."
    }, {
      name: "Flexii ciocan cu gantere",
      sets: "3 seturi × 12 repetari",
      muscle: "Biceps",
      groups: ["biceps"],
      rest: 75,
      inc: 1,
      cum: "Ganterele tinute ca doua ciocane (palmele fata in fata). Ridici indoind cotul, cobori lent.",
      lucreaza: "Bicepsul si antebratul. Priza cea mai blanda pentru incheietura.",
      atentie: "Fara balans din spate.",
      usor: "Un brat pe rand, sezand."
    }, {
      name: "Plank lateral",
      sets: "3 seturi × 30 secunde pe parte",
      muscle: "Abdomen",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Culcat pe o parte, sprijin pe antebrat si pe marginea talpii de jos, picioarele intinse. Ridici bazinul pana corpul e in linie dreapta. Tii, respiri normal, apoi schimbi partea.",
      lucreaza: "Lateralele abdomenului - talia si stabilitatea bazinului.",
      atentie: "Nu lasi bazinul sa cada si nu te rasuci cu pieptul in fata. Cand bazinul incepe sa coboare, opresti seria.",
      usor: "Varianta cu genunchii indoiti si sprijin pe genunchiul de jos, daca 30 de secunde pe talpi e prea mult."
    }, {
      name: "Mers pe banda 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "La FINAL, dupa ce ai terminat exercitiile cu greutati. Ritm de plimbare vioaie: viteza 4,5-5,5 km/h, inclinatie 2-4 % daca banda are. Ritmul corect e acela in care inca poti vorbi, dar nu ai mai putea canta. Fara alergare, niciodata.",
      lucreaza: "Inima, circulatia si arderea grasimii. Asta e partea care se vede cel mai mult pe cantar.",
      atentie: "NU te tine de bare in timp ce mergi - strica postura si injumatateste efortul. Daca ti se taie respiratia, scazi viteza, nu te opresti brusc. Ultimele 2 minute le faci lent, ca sa cobori pulsul.",
      usor: "Incepe cu 15 minute fara inclinatie si adaugi cate 5 minute pe saptamana. Daca genunchiul se incarca, dai inclinatia pe 0."
    }]
  },
  6: {
    day: "Sambata",
    type: "ODIHNA",
    short: "ZI LIBERA",
    color: "#475569",
    icon: "⚫",
    nota: "Zi libera. Fara sala, fara banda, fara penalizari. Odihna e parte din program.",
    exercises: []
  },
  0: {
    day: "Duminica",
    type: "ODIHNA",
    short: "ZI LIBERA",
    color: "#475569",
    icon: "⚫",
    nota: "Zi libera. Fara sala, fara banda, fara penalizari. Odihna e parte din program.",
    exercises: []
  }
};

/* ─── VARIANTE (cand aparatul e ocupat sau ceva doare) ─── */
const ALT = {
  "Presa de piept la aparat": ["Presa cu gantere pe banca dreapta", "Flotari inclinate cu mainile pe banca", "Presa la aparat Smith"],
  "Presa de umeri la aparat": ["Presa cu gantere sezand", "Presa la cablu cu un brat", "Ridicari laterale (doar)"],
  "Fluturari la aparat (Pec Deck)": ["Fluturari la cablu", "Fluturari cu gantere pe banca inclinata"],
  "Ridicari laterale cu gantere": ["Ridicari laterale la cablu", "Ridicari laterale la aparat"],
  "Extensii de triceps la cablu": ["Extensii deasupra capului cu gantera", "Extensii la aparat", "Flotari la banca (mainile pe banca)"],
  "Plank": ["Dead bug", "Plank cu antebratele pe o banca", "Plank lateral"],
  "Mers pe banda 20 de minute": ["Bicicleta eliptica 20 de minute", "Bicicleta orizontala 20 de minute", "Mers afara 20 de minute"],
  "Mers cu gantera intr-o mana": ["Plank lateral", "Dead bug", "Presa Pallof la cablu"],
  "Tractiuni la helcometru": ["Helcometru cu priza neutra", "Ramat la aparat", "Pulldown cu un brat la cablu"],
  "Ramat la aparat cu sprijin pe piept": ["Ramat la cablu sezand", "Ramat cu gantera sprijinit pe banca"],
  "Ramat la cablu sezand": ["Ramat la aparat", "Ramat cu gantera un brat"],
  "Face pull la cablu": ["Fluturari inverse la aparat", "Desfacere banda elastica in fata"],
  "Flexii de biceps cu gantere": ["Flexii la cablu", "Flexii cu bara EZ", "Flexii ciocan"],
  "Dead bug": ["Plank", "Plank lateral", "Presa Pallof la cablu"],
  "Presa de picioare": ["Genuflexiuni la aparatul Smith, amplitudine mica", "Ridicari de pe scaun", "Presa cu un picior, greutate mica"],
  "Ridicari de pe scaun cu gantera": ["Presa de picioare", "Pas pe treapta joasa", "Genuflexiuni tinut de bara"],
  "Flexii de genunchi la aparat": ["Flexii sezand la aparat", "Punte de fese cu un picior"],
  "Extensii de genunchi la aparat": ["Presa de picioare cu amplitudine mica", "Ridicari de pe scaun"],
  "Punte de fese": ["Extensii de bazin la aparat", "Punte de fese cu un picior"],
  "Ridicari pe varfuri": ["Ridicari pe varfuri la aparat", "Ridicari pe varfuri sezand"],
  "Presa cu gantere pe banca inclinata": ["Presa de piept la aparat", "Presa cu gantere pe banca dreapta"],
  "Presa de umeri cu gantere, sezand": ["Presa de umeri la aparat", "Presa la cablu"],
  "Fluturari cu gantere pe banca inclinata": ["Fluturari la aparat", "Fluturari la cablu"],
  "Ridicari frontale la cablu": ["Ridicari frontale cu gantere", "Ridicari laterale"],
  "Extensii de triceps deasupra capului": ["Extensii la cablu cu franghia", "Extensii la aparat"],
  "Presa Pallof la cablu": ["Plank", "Dead bug", "Plank lateral"],
  "Ramat cu gantera, sprijin pe banca": ["Ramat la aparat cu sprijin pe piept", "Ramat la cablu sezand"],
  "Tractiuni la helcometru cu priza neutra": ["Tractiuni la helcometru priza larga", "Ramat la aparat"],
  "Pullover la cablu": ["Tractiuni la helcometru", "Pullover cu gantera pe banca"],
  "Fluturari inverse la aparat": ["Face pull la cablu", "Fluturari inverse cu gantere"],
  "Flexii ciocan cu gantere": ["Flexii cu gantere clasic", "Flexii la cablu"],
  "Plank lateral": ["Plank", "Dead bug", "Mers cu gantera intr-o mana"]
};

/* ─── INCALZIRE ─── */
const INCALZIRE = {
  IMPINGERE: {
    titlu: "Incalzire 8-10 minute — zi de impingere",
    pasi: ["5 minute bicicleta usoara sau mers pe banda in ritm de plimbare rapida", "10 rotatii lente de umeri in fata, 10 in spate", "10 cercuri mici cu bratele intinse, in fiecare directie", "15 desfaceri de banda elastica in fata (sau doar bratele, fara banda)", "Un set de 15 repetari cu greutate foarte mica la primul exercitiu"]
  },
  TRAGERE: {
    titlu: "Incalzire 8-10 minute — zi de tragere",
    pasi: ["5 minute bicicleta usoara sau mers pe banda", "10 rotatii de umeri in fiecare directie", "15 desfaceri de banda elastica in fata", "10 ridicari si coborari de omoplati atarnat de bara sau la helcometru cu greutate mica", "Un set de 15 repetari usoare la primul exercitiu"]
  },
  PICIOARE: {
    titlu: "Incalzire 10 minute — zi de picioare",
    pasi: ["6-8 minute bicicleta cu rezistenta mica (nu la efort)", "10 ridicari de pe scaun, fara greutate", "15 ridicari pe varfuri", "10 rotatii de bazin in fiecare directie", "Un set la presa de picioare cu greutate mica, 15 repetari"]
  }
};
const RELAXARE = {
  titlu: "Relaxare 5-7 minute — dupa fiecare antrenament",
  pasi: ["3-5 minute mers usor pe banda sau pe loc, pana se linisteste respiratia", "Intindere piept la tocul usii: 30 secunde pe fiecare parte", "Intindere spate: te prinzi de o bara si lasi greutatea sa te intinda, 30 secunde", "Intindere spate coapsa: piciorul pe o banca joasa, te apleci lent, 30 secunde pe picior", "Intindere gamba la perete: 30 secunde pe picior", "10 respiratii adanci, pe nas, cu expiratie lunga"]
};

/* ─── ANTRENAMENT ACASA / IN VACANTA (fara sala) ─── */
const ACASA = {
  1: {
    day: "Luni",
    type: "IMPINGERE",
    short: "ACASA · PIEPT · UMERI · TRICEPS",
    color: "#ef4444",
    icon: "🔴",
    nota: "Fara sala: greutatea corpului si banda elastica. Acelasi tipar, intensitate mai mica.",
    exercises: [{
      name: "Flotari inclinate (mainile pe masa)",
      sets: "3 seturi × 8-12 repetari",
      muscle: "Piept",
      groups: ["piept", "triceps", "umeri"],
      rest: 90,
      repsOnly: true,
      cum: "Mainile pe marginea unei mese sau pe pat, corpul in linie dreapta, picioarele pe podea. Cobori pieptul spre masa in 3 secunde, impingi inapoi. Cu cat suportul e mai inalt, cu atat e mai usor.",
      lucreaza: "Pieptul, umarul din fata, tricepsul.",
      atentie: "Fundul nu se ridica si salele nu se lasa. Coatele la 45 de grade fata de corp, nu lipite si nu larg.",
      usor: "Mainile pe perete, in picioare - cea mai usoara varianta."
    }, {
      name: "Presa de umeri cu banda",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Umeri",
      groups: ["umeri", "triceps"],
      rest: 90,
      repsOnly: true,
      cum: "Calci pe mijlocul benzii, capetele in mani la nivelul umerilor. Impingi in sus pana aproape de intindere, cobori lent.",
      lucreaza: "Umerii si tricepsul.",
      atentie: "Nu arcui salele ca sa impingi. Abdomenul strans.",
      usor: "Prinde banda mai lung (mai putina tensiune). Pentru mai greu: dublezi banda sau o scurtezi."
    }, {
      name: "Fluturari cu banda in fata",
      sets: "2 seturi × 15 repetari",
      muscle: "Piept",
      groups: ["piept"],
      rest: 75,
      repsOnly: true,
      cum: "Banda trecuta pe la spate, pe sub omoplati, capetele in mani. Aduci mainile in fata pieptului ca o imbratisare, strangi o secunda, revii lent.",
      lucreaza: "Pieptul.",
      atentie: "Coatele putin indoite. Fara smucituri.",
      usor: "Prinde banda mai lung."
    }, {
      name: "Extensii de triceps cu banda",
      sets: "3 seturi × 15 repetari",
      muscle: "Triceps",
      groups: ["triceps"],
      rest: 75,
      repsOnly: true,
      cum: "Banda prinsa sus (toc de usa) sau tinuta la ceafa cu o mana. Intinzi cotul pana la capat, revii lent. Cotul nu se misca din loc.",
      lucreaza: "Tricepsul.",
      atentie: "Doar cotul lucreaza, restul corpului sta nemiscat.",
      usor: "Banda mai lunga, mai multe repetari."
    }, {
      name: "Desfacere banda in fata",
      sets: "2 seturi × 15 repetari",
      muscle: "Umeri spate",
      groups: ["umeri", "spate"],
      rest: 60,
      repsOnly: true,
      cum: "Banda tinuta cu ambele mani in fata, la nivelul pieptului, bratele intinse. Desfaci bratele in lateral pana banda atinge pieptul, strangi omoplatii, revii lent.",
      lucreaza: "Spatele umarului si postura. Excelent daca stai mult jos.",
      atentie: "Coatele aproape drepte, umerii jos.",
      usor: "Prinde banda mai lung."
    }, {
      name: "Plank",
      sets: "3 seturi × 30-45 secunde",
      muscle: "Abdomen",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Sprijin pe antebrate si pe varfuri, nu pe genunchi. Corpul in linie dreapta, abdomenul si fesele stranse. Tinta: 45 de secunde.",
      lucreaza: "Abdomenul si sprijinul coloanei.",
      atentie: "Fara sale lasate si fara fund ridicat. Cand salele cad, opresti seria.",
      usor: "3 serii de 20 de secunde, cu 5 secunde in plus pe saptamana."
    }, {
      name: "Mers alert 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "Dupa exercitii, afara sau pe hol. Ritm vioi, in care inca poti vorbi dar nu ai putea canta. 20 de minute neintrerupt.",
      lucreaza: "Inima, circulatia si arderea grasimii.",
      atentie: "Daca e foarte cald, mergi dimineata sau seara si ia apa cu tine. Ultimele 2 minute lent.",
      usor: "Incepe cu 15 minute si creste cate 5 minute pe saptamana. Se pot imparti in doua plimbari de cate 10 minute."
    }]
  },
  2: {
    day: "Marti",
    type: "TRAGERE",
    short: "ACASA · SPATE · BICEPS",
    color: "#3b82f6",
    icon: "🔵",
    nota: "Banda elastica face treaba pentru spate. Repetari mai multe, tensiune constanta.",
    exercises: [{
      name: "Ramat cu banda, sezand",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 90,
      repsOnly: true,
      cum: "Sezi pe podea sau pe scaun, banda trecuta pe sub talpi, capetele in mani. Tragi coatele spre spate, pe langa corp, strangi omoplatii, revii lent.",
      lucreaza: "Mijlocul spatelui si bicepsul.",
      atentie: "Spatele drept, nu te legana. Tragi cu spatele, nu doar cu bratele.",
      usor: "Banda mai lunga. Pentru mai greu: dublezi banda."
    }, {
      name: "Pulldown cu banda",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 90,
      repsOnly: true,
      cum: "Banda prinsa sus, peste toc de usa sau balustrada. In genunchi sau sezand, tragi capetele in jos spre piept, coatele coboara pe langa corp.",
      lucreaza: "Muschiul mare al spatelui.",
      atentie: "Verifica de doua ori ca banda e prinsa bine. Nu te lasa pe spate.",
      usor: "Stai mai departe de punctul de prindere."
    }, {
      name: "Face pull cu banda",
      sets: "2 seturi × 15 repetari",
      muscle: "Umeri spate",
      groups: ["umeri", "spate"],
      rest: 60,
      repsOnly: true,
      cum: "Banda prinsa la nivelul pieptului. Tragi spre fata, desfacand mainile spre exterior, coatele sus la nivelul umerilor.",
      lucreaza: "Spatele umarului, muschii posturii.",
      atentie: "Tensiune mica. Fara smucituri.",
      usor: "Stai mai departe de prindere si trage mai putin."
    }, {
      name: "Flexii de biceps cu banda",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Biceps",
      groups: ["biceps"],
      rest: 75,
      repsOnly: true,
      cum: "Calci pe mijlocul benzii, capetele in mani, palmele in sus. Indoi coatele pana sus, cobori lent, 3 secunde.",
      lucreaza: "Bicepsul.",
      atentie: "Coatele lipite de corp, fara balans.",
      usor: "Prinde banda mai lung."
    }, {
      name: "Dead bug",
      sets: "3 seturi × 8 repetari pe parte",
      muscle: "Abdomen / Lombar",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Culcat pe spate. Bratele in sus spre tavan, genunchii indoiti la 90 de grade. Cobori bratul drept si piciorul stang in acelasi timp, revii, schimbi partea. Fara sprijin pe genunchi.",
      lucreaza: "Abdomenul profund care tine coloana stabila.",
      atentie: "Lombarul ramane lipit de podea. Daca se ridica, cobori mai putin.",
      usor: "Doar bratele, apoi doar picioarele, separat."
    }, {
      name: "Mers alert 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "Dupa exercitii, afara sau pe hol. Ritm vioi, in care inca poti vorbi dar nu ai putea canta. 20 de minute neintrerupt.",
      lucreaza: "Inima, circulatia si arderea grasimii.",
      atentie: "Daca e foarte cald, mergi dimineata sau seara si ia apa cu tine. Ultimele 2 minute lent.",
      usor: "Incepe cu 15 minute si creste cate 5 minute pe saptamana. Se pot imparti in doua plimbari de cate 10 minute."
    }]
  },
  3: {
    day: "Miercuri",
    type: "PICIOARE",
    short: "ACASA · PICIOARE",
    color: "#22c55e",
    icon: "🟢",
    nota: "Picioare fara aparate: scaunul si banda sunt de ajuns.",
    exercises: [{
      name: "Ridicari de pe scaun",
      sets: "3 seturi × 10-12 repetari",
      muscle: "Cvadriceps / Fesieri",
      groups: ["cvadriceps", "fesieri"],
      rest: 90,
      repsOnly: true,
      cum: "Stai pe un scaun stabil, bratele incrucisate la piept. Te ridici fara sa te ajuti cu mainile si fara balans. Cobori lent 3 secunde, atingi scaunul, te ridici din nou.",
      lucreaza: "Coapsele si fesierii - exact miscarea din viata de zi cu zi.",
      atentie: "Scaunul lipit de perete ca sa nu alunece. Genunchii in linie cu picioarele.",
      usor: "Foloseste un scaun mai inalt sau ajuta-te putin cu mainile pe genunchi. Mai greu: tine o sticla de apa mare la piept."
    }, {
      name: "Pas pe treapta",
      sets: "2 seturi × 8 repetari pe picior",
      muscle: "Cvadriceps / Fesieri",
      groups: ["cvadriceps", "fesieri"],
      rest: 90,
      repsOnly: true,
      cum: "O treapta joasa sau un scaunel solid. Urci controlat cu un picior, cobori lent cu acelasi picior. Apoi schimbi.",
      lucreaza: "Coapsele, fesierii si echilibrul.",
      atentie: "Tine-te de perete sau de balustrada. Treapta joasa la inceput - maxim 20 cm.",
      usor: "Treapta mai joasa si mai putine repetari."
    }, {
      name: "Punte de fese",
      sets: "3 seturi × 15 repetari",
      muscle: "Fesieri",
      groups: ["fesieri", "ischio"],
      rest: 75,
      repsOnly: true,
      cum: "Culcat pe spate, genunchii indoiti, talpile pe podea. Ridici bazinul strangand fesele, tii 2 secunde, cobori lent.",
      lucreaza: "Fesierii si spatele coapsei.",
      atentie: "Impingi din fese, nu din sale.",
      usor: "Tine mai putin sus. Mai greu: un picior intins."
    }, {
      name: "Good morning cu banda",
      sets: "2 seturi × 12 repetari",
      muscle: "Ischiogambieri",
      groups: ["ischio", "fesieri"],
      rest: 75,
      repsOnly: true,
      cum: "Calci pe banda, capatul trecut peste ceafa sau tinut la piept. Cu spatele drept si genunchii putin indoiti, impingi bazinul in spate si te apleci pana simti intinderea in spatele coapsei. Revii strangand fesele.",
      lucreaza: "Spatele coapsei si fesierii.",
      atentie: "Spatele ramane DREPT tot timpul. Daca se rotunjeste, te-ai aplecat prea mult. Amplitudine mica la inceput.",
      usor: "Fara banda, doar miscarea, cu mainile la piept."
    }, {
      name: "Ridicari pe varfuri",
      sets: "3 seturi × 20 repetari",
      muscle: "Gambe",
      groups: ["gambe"],
      rest: 60,
      repsOnly: true,
      cum: "In picioare, tinut de un perete. Te ridici pe varfuri cat de sus poti, tii o secunda, cobori lent.",
      lucreaza: "Gambele, echilibrul si circulatia.",
      atentie: "Tine-te mereu de ceva. Fara sarituri.",
      usor: "Mai putine repetari, sprijinit cu ambele mani."
    }, {
      name: "Mers alert 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "Dupa exercitii, afara sau pe hol. Ritm vioi, in care inca poti vorbi dar nu ai putea canta. 20 de minute neintrerupt.",
      lucreaza: "Inima, circulatia si arderea grasimii.",
      atentie: "Daca e foarte cald, mergi dimineata sau seara si ia apa cu tine. Ultimele 2 minute lent.",
      usor: "Incepe cu 15 minute si creste cate 5 minute pe saptamana. Se pot imparti in doua plimbari de cate 10 minute."
    }]
  },
  4: {
    day: "Joi",
    type: "IMPINGERE",
    short: "ACASA · PIEPT · UMERI · TRICEPS",
    color: "#ef4444",
    icon: "🔴",
    nota: "A doua zi de impingere acasa. Aceleasi miscari, alt unghi.",
    exercises: [{
      name: "Flotari la perete",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Piept",
      groups: ["piept", "triceps", "umeri"],
      rest: 90,
      repsOnly: true,
      cum: "In picioare, mainile pe perete la nivelul pieptului, la latimea umerilor. Cobori pieptul spre perete lent, impingi inapoi. Cu cat stai mai departe de perete, cu atat e mai greu.",
      lucreaza: "Pieptul, umerii, tricepsul - varianta cea mai blanda.",
      atentie: "Corpul in linie dreapta, fara fund ridicat.",
      usor: "Stai mai aproape de perete."
    }, {
      name: "Presa de piept cu banda",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Piept",
      groups: ["piept", "triceps"],
      rest: 90,
      repsOnly: true,
      cum: "Banda pe la spate, sub omoplati, capetele in mani la nivelul pieptului. Impingi inainte pana aproape de intindere, revii lent.",
      lucreaza: "Pieptul si tricepsul.",
      atentie: "Nu impinge cu tot corpul in fata. Abdomenul strans.",
      usor: "Prinde banda mai lung."
    }, {
      name: "Ridicari laterale cu banda",
      sets: "2 seturi × 15 repetari",
      muscle: "Umeri",
      groups: ["umeri"],
      rest: 75,
      repsOnly: true,
      cum: "Calci pe banda, capetele in mani pe langa corp. Ridici bratele lateral pana la nivelul umerilor, cobori lent.",
      lucreaza: "Partea laterala a umarului.",
      atentie: "Nu mai sus de umeri. Fara balans.",
      usor: "Un brat pe rand."
    }, {
      name: "Extensii de triceps cu banda deasupra capului",
      sets: "3 seturi × 15 repetari",
      muscle: "Triceps",
      groups: ["triceps"],
      rest: 75,
      repsOnly: true,
      cum: "Banda calcata cu un picior sau prinsa jos in spate. Capetele in mani la ceafa, intinzi coatele in sus. Cotul nu se misca.",
      lucreaza: "Tricepsul.",
      atentie: "Coatele aproape de cap. Miscare lenta.",
      usor: "Banda mai lunga sau doar un brat pe rand."
    }, {
      name: "Desfacere banda in fata",
      sets: "2 seturi × 15 repetari",
      muscle: "Umeri spate",
      groups: ["umeri", "spate"],
      rest: 60,
      repsOnly: true,
      cum: "Banda in fata, bratele intinse la nivelul pieptului. Desfaci lateral pana atinge pieptul, revii lent.",
      lucreaza: "Postura si spatele umarului.",
      atentie: "Umerii jos, coatele aproape drepte.",
      usor: "Prinde banda mai lung."
    }, {
      name: "Dead bug",
      sets: "3 seturi × 8 repetari pe parte",
      muscle: "Abdomen",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Culcat pe spate, genunchii ridicati la 90 de grade, bratele in sus. Cobori spre podea bratul drept si piciorul stang in acelasi timp, fara sa lasi salele sa se ridice. Revii si schimbi.",
      lucreaza: "Abdomenul profund, cel care protejeaza lombarul.",
      atentie: "Lombarul ramane lipit de podea tot timpul. Daca se ridica, cobori mai putin.",
      usor: "Misca doar bratele, apoi doar picioarele."
    }, {
      name: "Mers alert 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "Dupa exercitii, afara sau pe hol. Ritm vioi, in care inca poti vorbi dar nu ai putea canta. 20 de minute neintrerupt.",
      lucreaza: "Inima, circulatia si arderea grasimii.",
      atentie: "Daca e foarte cald, mergi dimineata sau seara si ia apa cu tine. Ultimele 2 minute lent.",
      usor: "Incepe cu 15 minute si creste cate 5 minute pe saptamana. Se pot imparti in doua plimbari de cate 10 minute."
    }]
  },
  5: {
    day: "Vineri",
    type: "TRAGERE",
    short: "ACASA · SPATE · BICEPS · ABDOMEN",
    color: "#3b82f6",
    icon: "🔵",
    nota: "Ultima zi de antrenament din saptamana. Sambata si duminica: doar pasii.",
    exercises: [{
      name: "Ramat cu banda, un brat",
      sets: "3 seturi × 12 repetari pe parte",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 90,
      repsOnly: true,
      cum: "Banda prinsa in fata la nivelul pieptului sau calcata. Tragi cu o mana spre coasta, cotul pe langa corp, strangi omoplatul. Revii lent, apoi schimbi.",
      lucreaza: "Spatele, pe rand fiecare parte.",
      atentie: "Trunchiul nu se rasuceste.",
      usor: "Banda mai lunga."
    }, {
      name: "Pulldown cu banda",
      sets: "3 seturi × 12-15 repetari",
      muscle: "Spate",
      groups: ["spate", "biceps"],
      rest: 90,
      repsOnly: true,
      cum: "Banda prinsa sus. Tragi capetele in jos spre piept, coatele coboara pe langa corp, revii lent.",
      lucreaza: "Muschiul mare al spatelui.",
      atentie: "Verifica prinderea benzii. Nu te lasa pe spate.",
      usor: "Stai mai departe de prindere."
    }, {
      name: "Face pull cu banda",
      sets: "2 seturi × 15 repetari",
      muscle: "Umeri spate",
      groups: ["umeri", "spate"],
      rest: 60,
      repsOnly: true,
      cum: "Banda la nivelul pieptului. Tragi spre fata, desfacand mainile, coatele sus.",
      lucreaza: "Postura si spatele umarului.",
      atentie: "Tensiune mica.",
      usor: "Mai departe de prindere."
    }, {
      name: "Flexii ciocan cu banda",
      sets: "2 seturi × 15 repetari",
      muscle: "Biceps",
      groups: ["biceps"],
      rest: 75,
      repsOnly: true,
      cum: "Calci pe banda, palmele fata in fata. Indoi coatele pana sus, cobori lent.",
      lucreaza: "Bicepsul si antebratul.",
      atentie: "Coatele lipite de corp.",
      usor: "Banda mai lunga, un brat pe rand."
    }, {
      name: "Plank lateral",
      sets: "3 seturi × 30 secunde pe parte",
      muscle: "Abdomen",
      groups: ["abdomen"],
      rest: 60,
      repsOnly: true,
      finisher: true,
      cum: "Culcat pe o parte, sprijin pe antebrat si pe talpi, picioarele intinse, bazinul ridicat, corpul in linie.",
      lucreaza: "Lateralele abdomenului.",
      atentie: "Bazinul nu cade, corpul nu se rasuceste.",
      usor: "Varianta cu genunchii indoiti, sprijin pe genunchiul de jos."
    }, {
      name: "Mers alert 20 de minute",
      sets: "1 serie × 20 de minute",
      muscle: "Inima / Cardio",
      groups: ["cardio"],
      stat: "VIT",
      rest: 0,
      repsOnly: true,
      finisher: true,
      cardio: true,
      cum: "Dupa exercitii, afara sau pe hol. Ritm vioi, in care inca poti vorbi dar nu ai putea canta. 20 de minute neintrerupt.",
      lucreaza: "Inima, circulatia si arderea grasimii.",
      atentie: "Daca e foarte cald, mergi dimineata sau seara si ia apa cu tine. Ultimele 2 minute lent.",
      usor: "Incepe cu 15 minute si creste cate 5 minute pe saptamana. Se pot imparti in doua plimbari de cate 10 minute."
    }]
  },
  6: {
    day: "Sambata",
    type: "ODIHNA",
    short: "ZI LIBERA",
    color: "#475569",
    icon: "⚫",
    nota: "Zi libera. Odihna completa, fara penalizari.",
    exercises: []
  },
  0: {
    day: "Duminica",
    type: "ODIHNA",
    short: "ZI LIBERA",
    color: "#475569",
    icon: "⚫",
    nota: "Zi libera. Odihna completa, fara penalizari.",
    exercises: []
  }
};
const BANDA_NOTA = "Benzile elastice plate au rezistenta mica. Ca sa fie mai greu: dublezi banda, o prinzi mai scurt (mai aproape de punctul fix) sau treci pe o banda mai tare.";
/* ═══════════════════════════════════════════════════
   MISIUNI ZILNICE SI SAPTAMANALE
   ═══════════════════════════════════════════════════ */

const CITATE = [{
  text: "Nu trebuie sa fii cel mai bun. Trebuie doar sa fii mai bun decat ieri.",
  color: "#3b82f6"
}, {
  text: "Un pas mic, facut zilnic, bate un pas mare facut o data.",
  color: "#22c55e"
}, {
  text: "Corpul urmeaza acolo unde merge disciplina.",
  color: "#a78bfa"
}, {
  text: "Ai facut ce trebuia astazi. Asta conteaza.",
  color: "#f59e0b"
}, {
  text: "Puterea nu vine din ce poti face o data, ci din ce faci in fiecare zi.",
  color: "#22d3ee"
}, {
  text: "Sistemul a inregistrat efortul tau.",
  color: "#3b82f6"
}, {
  text: "Ai devenit mai puternic.",
  color: "#22c55e"
}, {
  text: "Cine se prezinta la antrenament castiga, chiar si in zilele slabe.",
  color: "#f97316"
}, {
  text: "Varsta e un numar. Constanta e o alegere.",
  color: "#ec4899"
}, {
  text: "Astazi nu ai gasit scuze. Asta e victoria.",
  color: "#ef4444"
}, {
  text: "Fiecare repetare corecta e o investitie in urmatorii ani.",
  color: "#a78bfa"
}, {
  text: "Incet e bine. Incet si constant e imbatabil.",
  color: "#34d399"
}, {
  text: "Nu conteaza cat de greu, conteaza ca ai inceput.",
  color: "#3b82f6"
}, {
  text: "Muschii cresc in repaus, dar se cheama la antrenament.",
  color: "#f59e0b"
}, {
  text: "Un antrenament facut e un antrenament castigat.",
  color: "#22c55e"
}];
/* ═══════════════════════════════════════════════════
   COMPONENTE DE INTERFATA — totul cu text mare
   ═══════════════════════════════════════════════════ */

const cardStyle = accent => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid " + (accent || "rgba(255,255,255,0.09)"),
  borderRadius: 14,
  padding: 16,
  marginBottom: 14
});
function Sect({
  title,
  right,
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: "2px solid rgba(255,255,255,.08)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: color || "#e2e8f0",
      letterSpacing: 0.5
    }
  }, title), right ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, right) : null), children);
}
function BigBtn({
  onClick,
  children,
  color,
  bg,
  border,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: "100%",
      padding: "18px 16px",
      background: bg || "rgba(59,130,246,.14)",
      border: "2px solid " + (border || "rgba(59,130,246,.4)"),
      borderRadius: 12,
      color: color || "#bfdbfe",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer",
      lineHeight: 1.3,
      ...(style || {})
    }
  }, children);
}
function StatBar({
  label,
  value,
  max,
  color
}) {
  const m = max || 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 5,
      fontSize: F.md,
      color: "#cbd5e1",
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: color,
      fontWeight: 900
    }
  }, value)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12,
      background: "rgba(255,255,255,0.07)",
      borderRadius: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(value / m * 100, 100) + "%",
      background: "linear-gradient(90deg," + color + "," + color + "99)",
      borderRadius: 6,
      transition: "width .6s ease"
    }
  })));
}
function Notif({
  msg,
  onDone
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(110px + env(safe-area-inset-bottom))",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "16px 22px",
      maxWidth: "94vw",
      background: "linear-gradient(135deg,rgba(15,23,42,.98),rgba(30,41,59,.98))",
      border: "2px solid rgba(59,130,246,.55)",
      borderRadius: 12,
      color: "#bfdbfe",
      fontSize: F.md,
      fontWeight: 700,
      textAlign: "center",
      boxShadow: "0 0 30px rgba(0,0,0,.6)",
      lineHeight: 1.4
    }
  }, msg);
}
function LvlModal({
  level,
  rank,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.9)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      letterSpacing: 3,
      color: "#3b82f6",
      marginBottom: 16,
      fontWeight: 800
    }
  }, "NIVEL NOU"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.huge,
      fontWeight: 900,
      color: "#e2e8f0",
      marginBottom: 12,
      textShadow: "0 0 40px " + rank.color
    }
  }, "NIVELUL ", level), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xl,
      color: rank.color,
      fontWeight: 800,
      marginBottom: 20
    }
  }, rank.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8"
    }
  }, "Atinge ecranul ca sa continui")));
}
function QuestPopup({
  quote,
  xpGain,
  multiplier,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.82)",
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 14
    }
  }, "✅"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      color: quote.color,
      fontStyle: "italic",
      lineHeight: 1.5,
      marginBottom: 18
    }
  }, "„", quote.text, "”"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#4ade80"
    }
  }, "+", xpGain, " XP"), multiplier > 1 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#f59e0b",
      marginTop: 8,
      fontWeight: 700
    }
  }, "bonus ", multiplier, "x activ") : null));
}

/* ─── FEREASTRA OBLIGATORIE: SOMN ─── */
function PasiLista({
  data,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: cardStyle("rgba(255,255,255,.1)")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: color,
      marginBottom: 12
    }
  }, data.titlu), data.pasi.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 12,
      marginBottom: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      background: "rgba(255,255,255,.08)",
      color: color,
      fontSize: F.sm,
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.5
    }
  }, p))));
}
/* ═══════════════ TAB: AZI ═══════════════ */

function nrSeturi(txt) {
  const m = (txt || "").match(/^(\d+)/);
  return m ? parseInt(m[1]) : 3;
}
function ExCard({
  ex,
  idx,
  ctx
}) {
  const {
    doneEx,
    openEx,
    setOpenEx,
    toggleEx,
    logSets,
    stergeAzi,
    getLast,
    getRecomandare,
    startRest,
    loggerSets,
    setLoggerSets,
    setSwapModal,
    S,
    todayStr,
    ziSel,
    todayDow,
    selDay
  } = ctx;
  const swapped = (S.exerciseSwaps || {})[todayStr + "_" + ex.name];
  const gata = doneEx.includes(ex.name);
  const deschis = openEx === ex.name;
  const n = nrSeturi(ex.sets);
  const last = getLast(ex.name);
  const esteAzi = selDay === todayDow;
  const sets = loggerSets[ex.name] || Array.from({
    length: n
  }, () => ({
    kg: "",
    reps: ""
  }));
  const setSets = s => setLoggerSets({
    ...loggerSets,
    [ex.name]: s
  });
  const setCell = (i, key, val) => {
    const c = sets.map(x => ({
      ...x
    }));
    c[i][key] = val;
    setSets(c);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: gata ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.03)",
      border: "2px solid " + (gata ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.1)"),
      borderRadius: 14,
      marginBottom: 14,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenEx(deschis ? null : ex.name),
    style: {
      width: "100%",
      display: "flex",
      gap: 12,
      alignItems: "center",
      padding: 16,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 38,
      height: 38,
      borderRadius: 19,
      background: gata ? "#22c55e" : "rgba(255,255,255,.08)",
      color: gata ? "#052e16" : "#94a3b8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: F.md,
      fontWeight: 900
    }
  }, gata ? "✓" : idx + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      fontWeight: 800,
      color: gata ? "#86efac" : "#e2e8f0",
      lineHeight: 1.3
    }
  }, swapped || ex.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 4
    }
  }, ex.sets), swapped ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: "#fbbf24",
      marginTop: 4
    }
  }, "schimbat astazi (initial: ", ex.name, ")") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      color: "#64748b"
    }
  }, deschis ? "▾" : "▸")), deschis ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(0,0,0,.25)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#60a5fa",
      marginBottom: 6
    }
  }, "CUM SE FACE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.cum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#4ade80",
      marginBottom: 6
    }
  }, "CE LUCREAZA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.lucreaza), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#f87171",
      marginBottom: 6
    }
  }, "ATENTIE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.atentie), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#fbbf24",
      marginBottom: 6
    }
  }, "DACA E PREA GREU"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55
    }
  }, ex.usor)), last ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(59,130,246,.1)",
      border: "1px solid rgba(59,130,246,.3)",
      borderRadius: 10,
      padding: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#93c5fd",
      fontWeight: 800,
      marginBottom: 6
    }
  }, "ULTIMA DATA (", last.date, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.5
    }
  }, last.sets.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, s.kg ? s.kg + " kg × " : "", s.reps, " rep", i < last.sets.length - 1 ? "  ·  " : "")))) : null, esteAzi ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#cbd5e1",
      marginBottom: 10
    }
  }, "SCRIE SETURILE DE AZI"), sets.map((s, i) => {
    const rec = getRecomandare(ex.name, i, ex);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 34,
        fontSize: F.md,
        color: "#64748b",
        fontWeight: 900
      }
    }, i + 1, "."), ex.repsOnly ? null : /*#__PURE__*/React.createElement("input", {
      type: "number",
      inputMode: "decimal",
      step: "0.5",
      placeholder: "kg",
      value: s.kg,
      onChange: e => setCell(i, "kg", e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,255,255,.14)",
        borderRadius: 10,
        color: "#e2e8f0",
        fontSize: F.lg,
        fontWeight: 800,
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box"
      }
    }), /*#__PURE__*/React.createElement("input", {
      type: "number",
      inputMode: "numeric",
      placeholder: ex.repsOnly ? "sec / rep" : "rep",
      value: s.reps,
      onChange: e => setCell(i, "reps", e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,255,255,.14)",
        borderRadius: 10,
        color: "#e2e8f0",
        fontSize: F.lg,
        fontWeight: 800,
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box"
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => startRest(ex.name, i + 1, ex.rest || 90, ziSel.color),
      style: {
        padding: "14px 12px",
        background: "rgba(59,130,246,.16)",
        border: "2px solid rgba(59,130,246,.4)",
        borderRadius: 10,
        color: "#93c5fd",
        fontSize: F.sm,
        fontWeight: 900,
        fontFamily: "inherit",
        cursor: "pointer"
      }
    }, "PAUZA")), rec ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.xs,
        color: "#fbbf24",
        marginTop: 4,
        marginLeft: 42
      }
    }, "tinta: ", rec.kg ? rec.kg + " kg × " : "", rec.reps, " — ", rec.nota) : null);
  }), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      const curate = sets.filter(s => s.reps !== "");
      if (!curate.length) {
        alert("Scrie macar un set.");
        return;
      }
      logSets(ex, curate);
    },
    bg: "rgba(34,197,94,.18)",
    border: "rgba(34,197,94,.5)",
    color: "#86efac",
    style: {
      marginBottom: 10
    }
  }, "✓ GATA — SALVEAZA EXERCITIUL")) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#64748b",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Seturile se scriu doar in ziua antrenamentului."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSwapModal(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(168,85,247,.14)",
      border: "2px solid rgba(168,85,247,.35)",
      borderRadius: 10,
      color: "#d8b4fe",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🔄 SCHIMBA"), gata ? /*#__PURE__*/React.createElement("button", {
    onClick: () => stergeAzi(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(239,68,68,.12)",
      border: "2px solid rgba(239,68,68,.35)",
      borderRadius: 10,
      color: "#fca5a5",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "↩ ANULEAZA") : /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleEx(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(34,197,94,.12)",
      border: "2px solid rgba(34,197,94,.35)",
      borderRadius: 10,
      color: "#86efac",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "✓ BIFEAZA"))) : null);
}
function SwapModal({
  ctx
}) {
  const {
    swapModal,
    setSwapModal,
    swapEx,
    revertSwap,
    S,
    todayStr
  } = ctx;
  const ex = swapModal;
  const lista = ALT[ex.name] || [];
  const swapped = (S.exerciseSwaps || {})[todayStr + "_" + ex.name];
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => setSwapModal(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 9000,
      background: "rgba(2,6,23,.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xl,
      fontWeight: 900,
      color: "#d8b4fe",
      marginBottom: 8
    }
  }, "SCHIMBA EXERCITIUL"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      marginBottom: 18,
      lineHeight: 1.5
    }
  }, "In locul lui ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#e2e8f0"
    }
  }, ex.name), ", doar pentru astazi. Foloseste asta daca aparatul e ocupat sau daca te doare ceva."), lista.map(alt => /*#__PURE__*/React.createElement(BigBtn, {
    key: alt,
    onClick: () => swapEx(ex.name, alt),
    bg: "rgba(168,85,247,.14)",
    border: "rgba(168,85,247,.35)",
    color: "#e9d5ff",
    style: {
      marginBottom: 10,
      textAlign: "left"
    }
  }, alt)), swapped ? /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      revertSwap(ex.name);
      setSwapModal(null);
    },
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.35)",
    color: "#fca5a5",
    style: {
      marginBottom: 10
    }
  }, "↩ INAPOI LA EXERCITIUL INITIAL") : null, /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setSwapModal(null),
    bg: "rgba(255,255,255,.06)",
    border: "rgba(255,255,255,.2)",
    color: "#cbd5e1"
  }, "INCHIDE")));
}
function TabSala({
  ctx
}) {
  const {
    PROG,
    ziSel,
    selDay,
    setSelDay,
    doneEx,
    vacation,
    showIncalzire,
    setShowIncalzire,
    showRelaxare,
    setShowRelaxare,
    todayDow
  } = ctx;
  const [showReguli, setShowReguli] = useState(false);
  const ex = ziSel.exercises || [];
  const facute = ex.filter(e => doneEx.includes(e.name)).length;
  const inc = INCALZIRE[ziSel.type];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 18
    }
  }, [1, 2, 3, 4, 5, 6, 0].map(d => {
    const z = PROG[d];
    const activ = selDay === d;
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      onClick: () => setSelDay(d),
      style: {
        flex: 1,
        padding: "12px 0",
        borderRadius: 10,
        background: activ ? z.color + "33" : "rgba(255,255,255,.04)",
        border: "2px solid " + (activ ? z.color : d === todayDow ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.08)"),
        color: activ ? "#fff" : "#94a3b8",
        fontFamily: "inherit",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.md,
        fontWeight: 900
      }
    }, DOW_SHORT[d]));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.04)",
      border: "2px solid " + ziSel.color,
      borderRadius: 14,
      padding: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, ziSel.day.toUpperCase(), selDay === todayDow ? " — ASTAZI" : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: ziSel.color,
      lineHeight: 1.1,
      marginTop: 4
    }
  }, ziSel.icon, " ", ziSel.type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      marginTop: 6
    }
  }, ziSel.short), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 10,
      lineHeight: 1.5
    }
  }, ziSel.nota), ex.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: facute === ex.length ? "#4ade80" : "#f59e0b",
      marginTop: 12,
      fontWeight: 900
    }
  }, facute, " din ", ex.length, " exercitii") : null), vacation ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(245,158,11,.1)",
      border: "2px solid rgba(245,158,11,.3)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#fcd34d",
      marginBottom: 6
    }
  }, "BANDA ELASTICA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55
    }
  }, BANDA_NOTA)) : null, ex.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      textAlign: "center",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 54,
      marginBottom: 12
    }
  }, "😌"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: "#cbd5e1",
      marginBottom: 8
    }
  }, "Zi de odihna"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      lineHeight: 1.5
    }
  }, "Muschiul creste in zilele de pauza, nu la sala. Astazi nu ai nimic de facut.")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowReguli(!showReguli),
    style: {
      width: "100%",
      padding: 16,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(239,68,68,.1)",
      border: "2px solid rgba(239,68,68,.3)",
      borderRadius: 12,
      color: "#fca5a5",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "⚠️ REGULI DE SIGURANTA ", showReguli ? "▾" : "▸"), showReguli ? /*#__PURE__*/React.createElement("div", {
    style: cardStyle("rgba(239,68,68,.25)")
  }, REGULI.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.55,
      marginBottom: 12
    }
  }, "• ", r)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "2px solid rgba(239,68,68,.3)",
      fontSize: F.md,
      fontWeight: 900,
      color: "#f87171",
      marginBottom: 10
    }
  }, "OPRESTE-TE IMEDIAT DACA APARE:"), STOP_SEMNE.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: F.md,
      color: "#fecaca",
      lineHeight: 1.5,
      marginBottom: 8
    }
  }, "• ", s)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 14,
      lineHeight: 1.5
    }
  }, "Inainte de a incepe programul, mergi o data la medic pentru un control de rutina — mai ales pentru tensiune si inima.")) : null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowIncalzire(!showIncalzire),
    style: {
      width: "100%",
      padding: 16,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(249,115,22,.1)",
      border: "2px solid rgba(249,115,22,.3)",
      borderRadius: 12,
      color: "#fdba74",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🔥 INCALZIRE (obligatorie) ", showIncalzire ? "▾" : "▸"), showIncalzire && inc ? /*#__PURE__*/React.createElement(PasiLista, {
    data: inc,
    color: "#fdba74"
  }) : null, ex.map((e, i) => /*#__PURE__*/React.createElement(ExCard, {
    key: e.name,
    ex: e,
    idx: i,
    ctx: ctx
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowRelaxare(!showRelaxare),
    style: {
      width: "100%",
      padding: 16,
      marginTop: 6,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(34,211,238,.1)",
      border: "2px solid rgba(34,211,238,.3)",
      borderRadius: 12,
      color: "#67e8f9",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🧊 RELAXARE DUPA ANTRENAMENT ", showRelaxare ? "▾" : "▸"), showRelaxare ? /*#__PURE__*/React.createElement(PasiLista, {
    data: RELAXARE,
    color: "#67e8f9"
  }) : null));
}
/* ═══════════════ TAB: PROGRES ═══════════════ */

function TabProgres({
  ctx
}) {
  const {
    stats,
    muscleXp,
    S,
    level,
    rank,
    streak
  } = ctx;
  const statCol = {
    STR: "#ef4444",
    VIT: "#22c55e",
    AGI: "#22d3ee",
    INT: "#a78bfa",
    PER: "#f59e0b"
  };
  const statNume = {
    STR: "STR — Forta",
    VIT: "VIT — Rezistenta",
    AGI: "AGI — Mobilitate",
    INT: "INT — Minte",
    PER: "PER — Vointa"
  };
  const maxStat = Math.max(20, ...Object.values(stats));
  const zileAntrenate = Object.keys(S.workoutCalendar || {}).length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sect, {
    title: "STATISTICI"
  }, /*#__PURE__*/React.createElement("div", {
    style: cardStyle()
  }, Object.keys(stats).map(k => /*#__PURE__*/React.createElement(StatBar, {
    key: k,
    label: statNume[k],
    value: stats[k],
    max: maxStat,
    color: statCol[k]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      flex: 1,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#93c5fd"
    }
  }, S.totalXp), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, "XP total")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      flex: 1,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#4ade80"
    }
  }, zileAntrenate), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, "zile de sala")))), /*#__PURE__*/React.createElement(Sect, {
    title: "GRUPE MUSCULARE"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Fiecare exercitiu facut adauga puncte grupei lucrate. Asa vezi ce ai neglijat."), MUSCLE_GROUPS.map(mg => {
    const xp = muscleXp[mg.key] || 0;
    const r = getMuscleRank(xp);
    const nx = getNextMuscleRank(xp);
    return /*#__PURE__*/React.createElement("div", {
      key: mg.key,
      style: {
        ...cardStyle(),
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.md,
        fontWeight: 800,
        color: "#e2e8f0"
      }
    }, mg.icon, " ", mg.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.sm,
        fontWeight: 900,
        color: r.color
      }
    }, r.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 10,
        background: "rgba(255,255,255,.07)",
        borderRadius: 5,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        borderRadius: 5,
        background: r.color,
        width: Math.min(100, nx ? xp / nx.min * 100 : 100) + "%"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.xs,
        color: "#64748b",
        marginTop: 6
      }
    }, xp, " puncte", nx ? " · urmatorul rang la " + nx.min : " · rang maxim"));
  })), /*#__PURE__*/React.createElement(Sect, {
    title: "RANGURI"
  }, RANKS.map(r => {
    const activ = r.name === rank.name;
    const atins = level >= r.min;
    return /*#__PURE__*/React.createElement("div", {
      key: r.name,
      style: {
        ...cardStyle(activ ? r.color : "rgba(255,255,255,.08)"),
        opacity: atins ? 1 : 0.5,
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.lg,
        fontWeight: 900,
        color: r.color
      }
    }, r.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.sm,
        color: "#94a3b8",
        fontWeight: 700
      }
    }, "nivel ", r.min, "-", r.max)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.sm,
        color: "#cbd5e1",
        marginTop: 6,
        lineHeight: 1.5
      }
    }, r.desc), activ ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.sm,
        color: r.color,
        marginTop: 8,
        fontWeight: 900
      }
    }, "◀ aici esti acum") : null);
  })), (S.penaltyLog || []).length ? /*#__PURE__*/React.createElement(Sect, {
    title: "PENALIZARI",
    color: "#f87171"
  }, [...S.penaltyLog].reverse().slice(0, 8).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...cardStyle("rgba(239,68,68,.25)"),
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#fca5a5",
      fontWeight: 800
    }
  }, p.date, " · -", p.penalty, " XP"), p.det ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 4
    }
  }, p.det) : null))) : null);
}

/* ═══════════════ TAB: CORP ═══════════════ */

function TabSetari({
  ctx
}) {
  const {
    S,
    g,
    update,
    vacation,
    soundOn,
    setSoundOn,
    setNotif,
    exportStr,
    setExportStr,
    importStr,
    setImportStr,
    lastSaved
  } = ctx;
  const [confirmReset, setConfirmReset] = useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sect, {
    title: "MOD PLECARE / VACANTA",
    color: "#fcd34d"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      marginBottom: 14,
      lineHeight: 1.55
    }
  }, "Cand esti plecat de acasa: antrenamentele de sala sunt inlocuite cu antrenamente cu banda elastica si greutatea corpului, iar mersul pe banda devine mers afara. Penalizarile se opresc complet."), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      update({
        vacation: !vacation
      });
      setNotif(!vacation ? "🏖️ Mod plecare pornit" : "🏋️ Inapoi la programul de sala");
    },
    bg: vacation ? "rgba(245,158,11,.22)" : "rgba(255,255,255,.05)",
    border: vacation ? "rgba(245,158,11,.55)" : "rgba(255,255,255,.18)",
    color: vacation ? "#fcd34d" : "#cbd5e1"
  }, vacation ? "🏖️ MOD PLECARE: PORNIT — apasa ca sa opresti" : "🏖️ PORNESTE MODUL PLECARE")), /*#__PURE__*/React.createElement(Sect, {
    title: "SUNET"
  }, /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setSoundOn(!soundOn),
    bg: soundOn ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.05)",
    border: soundOn ? "rgba(34,197,94,.45)" : "rgba(255,255,255,.18)",
    color: soundOn ? "#86efac" : "#94a3b8"
  }, soundOn ? "🔊 SUNET PORNIT" : "🔇 SUNET OPRIT")), /*#__PURE__*/React.createElement(Sect, {
    title: "SALVARE"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Totul se salveaza singur in telefon, dupa fiecare apasare.", lastSaved ? " Ultima salvare: " + lastSaved + "." : ""), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: async () => {
      const ok = await saveToIDB(g.current);
      setNotif(ok ? "💾 Salvat" : "❌ Salvarea a esuat");
    },
    style: {
      marginBottom: 14
    }
  }, "💾 SALVEAZA ACUM"), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      setExportStr(JSON.stringify(g.current));
      setNotif("📤 Copiaza textul de mai jos");
    },
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1",
    style: {
      marginBottom: 10
    }
  }, "📤 EXPORTA DATELE"), exportStr ? /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: exportStr,
    onFocus: e => e.target.select(),
    style: {
      width: "100%",
      height: 110,
      background: "rgba(0,0,0,.4)",
      color: "#94a3b8",
      border: "2px solid rgba(255,255,255,.14)",
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      fontFamily: "monospace",
      marginBottom: 14,
      boxSizing: "border-box"
    }
  }) : null, /*#__PURE__*/React.createElement("textarea", {
    value: importStr,
    placeholder: "Lipeste aici datele exportate",
    onChange: e => setImportStr(e.target.value),
    style: {
      width: "100%",
      height: 90,
      background: "rgba(0,0,0,.4)",
      color: "#e2e8f0",
      border: "2px solid rgba(255,255,255,.14)",
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      fontFamily: "monospace",
      marginBottom: 10,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      try {
        const d = JSON.parse(importStr);
        const m = {
          ...DEFAULT_STATE
        };
        for (const k of SAVE_FIELDS) if (d[k] !== undefined) m[k] = d[k];
        g.current = m;
        update({});
        setImportStr("");
        setNotif("📥 Date incarcate");
      } catch (e) {
        setNotif("❌ Text invalid");
      }
    },
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1"
  }, "📥 IMPORTA DATELE")), /*#__PURE__*/React.createElement(Sect, {
    title: "STERGE TOT",
    color: "#f87171"
  }, confirmReset ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#fca5a5",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Sigur? Se sterg toate nivelurile, greutatile, somnul si istoricul. Nu se poate reveni."), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      g.current = {
        ...DEFAULT_STATE,
        lastDailyReset: new Date().toISOString().slice(0, 10)
      };
      update({});
      setConfirmReset(false);
      setNotif("Totul a fost sters.");
    },
    bg: "rgba(239,68,68,.22)",
    border: "rgba(239,68,68,.6)",
    color: "#fca5a5",
    style: {
      marginBottom: 10
    }
  }, "DA, STERGE TOT"), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setConfirmReset(false),
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1"
  }, "NU, RENUNTA")) : /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setConfirmReset(true),
    bg: "rgba(239,68,68,.1)",
    border: "rgba(239,68,68,.3)",
    color: "#fca5a5"
  }, "🗑️ STERGE TOATE DATELE")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#475569",
      textAlign: "center",
      marginTop: 20,
      lineHeight: 1.6
    }
  }, "Program de antrenament, nu sfat medical.", /*#__PURE__*/React.createElement("br", null), "La orice durere sau simptom neobisnuit, opreste-te si vorbeste cu medicul."));
}
/* ═══════════════════════════════════════════════════
   APLICATIA PRINCIPALA
   ═══════════════════════════════════════════════════ */

function App() {
  const [loaded, setLoaded] = useState(false);
  const [_v, _fv] = useState(0);
  const forceUpdate = () => _fv(v => v + 1);
  const g = useRef({
    ...DEFAULT_STATE
  });
  const S = g.current;
  const [notif, setNotif] = useState(null);
  const [showLvl, setShowLvl] = useState(false);
  const [questPopup, setQuestPopup] = useState(null);
  const [tab, setTab] = useState("sala");
  const [selDay, setSelDay] = useState(new Date().getDay());
  const [openEx, setOpenEx] = useState(null);
  const [swapModal, setSwapModal] = useState(null);
  const [showIncalzire, setShowIncalzire] = useState(false);
  const [showRelaxare, setShowRelaxare] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [restTimer, setRestTimer] = useState(null);
  const [restElapsed, setRestElapsed] = useState(0);
  const [loggerSets, setLoggerSets] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [exportStr, setExportStr] = useState("");
  const [importStr, setImportStr] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();
  const update = changes => {
    Object.assign(g.current, changes);
    forceUpdate();
    saveToIDB(g.current).then(ok => {
      if (ok) setLastSaved(new Date().toLocaleTimeString("ro-RO"));
    });
  };
  const getWeekId = d => {
    const dt = new Date(d);
    const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() + 4 - day);
    const yr = new Date(dt.getFullYear(), 0, 1);
    return dt.getFullYear() + "-S" + String(Math.ceil(((dt - yr) / 86400000 + 1) / 7)).padStart(2, "0");
  };

  /* ─── INCARCARE + RESETARI ─── */
  useEffect(() => {
    (async () => {
      try {
        const d = await loadFromIDB();
        if (d) {
          const merged = {
            ...DEFAULT_STATE
          };
          for (const k of SAVE_FIELDS) if (d[k] !== undefined) merged[k] = d[k];
          g.current = merged;
        }
        const st = g.current;
        if (!st.startDate) st.startDate = todayStr;

        /* resetare zilnica + penalizari */
        if (st.lastDailyReset && st.lastDailyReset !== todayStr) {
          const yDate = new Date(st.lastDailyReset);
          const yDay = yDate.getDay();
          const wasWeekend = yDay === 0 || yDay === 6;
          const changes = {
            done: [],
            doneEx: [],
            lastDailyReset: todayStr
          };
          if (wasWeekend || st.vacation) {
            changes.streak = st.streak + 1;
            setTimeout(() => setNotif(st.vacation ? "🏖️ Mod plecare — fara penalizari" : "🌙 Weekend — fara penalizari"), 700);
          } else {
            let total = 0,
              missedCount = 0;
            const det = [];
            const yPPL = (st.vacation ? ACASA : PPL)[yDay];
            if (yPPL && yPPL.type !== "ODIHNA") {
              const missedEx = yPPL.exercises.filter(ex => !ex.finisher && !st.doneEx.includes(ex.name));
              if (missedEx.length) {
                const p = missedEx.length * 10;
                total += p;
                missedCount += missedEx.length;
                det.push(missedEx.length + " exercitii (-" + p + ")");
              }
            }
            if (total > 0) {
              const newXp = st.xp - total;
              const newLvl = newXp < 0 ? Math.max(1, st.level - 1) : st.level;
              Object.assign(changes, {
                xp: newXp < 0 ? Math.max(0, getXp(newLvl) + newXp) : newXp,
                level: newLvl,
                totalXp: Math.max(0, st.totalXp - total),
                penaltyLog: [...st.penaltyLog, {
                  date: st.lastDailyReset,
                  missed: missedCount,
                  penalty: total,
                  tip: "zilnic",
                  det: det.join(", ")
                }]
              });
              setTimeout(() => setNotif("⚠️ -" + total + " XP · " + det.join(", ")), 700);
            } else {
              changes.streak = st.streak + 1;
            }
          }
          Object.assign(g.current, changes);
          await saveToIDB(g.current);
        } else if (!st.lastDailyReset) {
          g.current.lastDailyReset = todayStr;
        }

        /* ─── MIGRARE v2: XP recalculat din munca reala ─── */
        if (!g.current.v2) {
          const totalEx = Object.values(g.current.workoutCalendar || {}).reduce((a, b) => a + b, 0);
          let pool = totalEx * 10;
          let lvl = 1;
          while (pool >= getXp(lvl) && lvl < 200) {
            pool -= getXp(lvl);
            lvl++;
          }
          Object.assign(g.current, {
            v2: true,
            level: lvl,
            xp: pool,
            totalXp: totalEx * 10,
            penaltyLog: [],
            done: [],
            doneW: []
          });
          setTimeout(() => setNotif("Nivel recalculat din antrenamentele facute: nivelul " + lvl), 1200);
        }
        await saveToIDB(g.current);
      } catch (e) {
        console.error("Eroare la incarcare", e);
      } finally {
        setLoaded(true);
        forceUpdate();
      }
    })();
  }, []);

  /* ─── CRONOMETRU PAUZA ─── */
  useEffect(() => {
    if (!restTimer) return;
    const iv = setInterval(() => {
      const el = Math.floor((Date.now() - restTimer.startTime) / 1000);
      setRestElapsed(el);
      if (el === restTimer.totalSec) {
        if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
        if (soundOn) playSound("gata");
      }
      if (el === restTimer.totalSec + 30) {
        if (navigator.vibrate) navigator.vibrate([400, 100, 400]);
        if (soundOn) playSound("intarziat");
      }
    }, 250);
    return () => clearInterval(iv);
  }, [restTimer, soundOn]);

  /* ─── XP ─── */
  const level = S.level,
    xp = S.xp,
    stats = S.stats,
    done = S.done,
    doneEx = S.doneEx,
    doneW = S.doneW,
    streak = S.streak,
    muscleXp = S.muscleXp,
    vacation = S.vacation,
    weightLog = S.weightLog,
    liftLog = S.liftLog;
  const rank = getRank(level);
  const xpN = getXp(level);
  const getMult = () => Math.round(getRankMultiplier(level) * getStreakMultiplier(streak) * 10) / 10;
  const calcAdd = (base, stat) => {
    const m = getMult();
    const amt = Math.round(base * m);
    const ns = {
      ...stats,
      [stat]: stats[stat] + 1
    };
    const n = xp + amt;
    if (n >= xpN) return {
      xp: n - xpN,
      level: level + 1,
      stats: ns,
      totalXp: S.totalXp + amt,
      _g: amt,
      _m: m
    };
    return {
      xp: n,
      stats: ns,
      totalXp: S.totalXp + amt,
      _g: amt,
      _m: m
    };
  };
  const calcRem = (base, stat) => {
    const m = getMult();
    const amt = Math.round(base * m);
    const ns = {
      ...stats,
      [stat]: Math.max(0, stats[stat] - 1)
    };
    const n = xp - amt;
    if (n < 0) return {
      xp: Math.max(0, getXp(Math.max(1, level - 1)) + n),
      level: Math.max(1, level - 1),
      stats: ns,
      totalXp: Math.max(0, S.totalXp - amt),
      _g: amt
    };
    return {
      xp: n,
      stats: ns,
      totalXp: Math.max(0, S.totalXp - amt),
      _g: amt
    };
  };
  const popQuest = (amt, m) => {
    const q = CITATE[Math.floor(Math.random() * CITATE.length)];
    setQuestPopup({
      quote: q,
      xpGain: amt,
      multiplier: m
    });
    if (soundOn) playSound("bifa");
  };
  const toggleEx = ex => {
    const nm = {
      ...muscleXp
    };
    if (doneEx.includes(ex.name)) {
      (ex.groups || []).forEach(k => {
        nm[k] = Math.max(0, (nm[k] || 0) - 5);
      });
      const c = calcRem(10, ex.stat || "STR");
      update({
        doneEx: doneEx.filter(x => x !== ex.name),
        muscleXp: nm,
        ...c
      });
      setNotif("↩ Exercitiu anulat · -" + c._g + " XP");
    } else {
      (ex.groups || []).forEach(k => {
        nm[k] = (nm[k] || 0) + 5;
      });
      const c = calcAdd(10, ex.stat || "STR");
      const wc = {
        ...(S.workoutCalendar || {})
      };
      wc[todayStr] = (wc[todayStr] || 0) + 1;
      update({
        doneEx: [...doneEx, ex.name],
        muscleXp: nm,
        workoutCalendar: wc,
        ...c
      });
      if (c.level > level) setShowLvl(true);
      popQuest(c._g, c._m);
    }
  };

  /* ─── JURNAL DE GREUTATI ─── */
  const getLast = name => {
    const e = liftLog[name];
    return e && e.length ? e[e.length - 1] : null;
  };
  const getRecomandare = (name, idx, ex) => {
    const last = getLast(name);
    if (!last || !last.sets || !last.sets[idx]) return null;
    const p = last.sets[idx];
    const kg = parseFloat(p.kg) || 0;
    const reps = parseInt(p.reps) || 0;
    const m = (ex.sets || "").match(/(\d+)\s*-\s*(\d+)\s*repetari/);
    const minR = m ? parseInt(m[1]) : 10;
    const maxR = m ? parseInt(m[2]) : 12;
    const inc = ex.inc || 2.5;
    if (reps >= maxR && kg > 0) return {
      kg: kg + inc,
      reps: minR,
      nota: "creste cu " + inc + " kg"
    };
    return {
      kg: kg,
      reps: reps + 1,
      nota: "o repetare in plus"
    };
  };
  const logSets = (ex, sets) => {
    const name = ex.name;
    const nl = {
      ...liftLog,
      [name]: [...(liftLog[name] || []), {
        date: todayStr,
        sets
      }]
    };
    const changes = {
      liftLog: nl
    };
    if (!doneEx.includes(name)) {
      const nm = {
        ...muscleXp
      };
      (ex.groups || []).forEach(k => {
        nm[k] = (nm[k] || 0) + 5;
      });
      const c = calcAdd(10, ex.stat || "STR");
      const wc = {
        ...(S.workoutCalendar || {})
      };
      wc[todayStr] = (wc[todayStr] || 0) + 1;
      Object.assign(changes, {
        doneEx: [...doneEx, name],
        muscleXp: nm,
        workoutCalendar: wc,
        ...c
      });
      if (c.level > level) setShowLvl(true);
      popQuest(c._g, c._m);
    } else {
      setNotif("💾 Seturi salvate");
    }
    update(changes);
    const ls = {
      ...loggerSets
    };
    delete ls[name];
    setLoggerSets(ls);
  };
  const stergeAzi = ex => {
    const name = ex.name;
    const changes = {};
    if (doneEx.includes(name)) {
      const nm = {
        ...muscleXp
      };
      (ex.groups || []).forEach(k => {
        nm[k] = Math.max(0, (nm[k] || 0) - 5);
      });
      const c = calcRem(10, ex.stat || "STR");
      Object.assign(changes, {
        doneEx: doneEx.filter(x => x !== name),
        muscleXp: nm,
        ...c
      });
    }
    const ll = liftLog || {};
    if (ll[name] && ll[name].some(s => s.date === todayStr)) {
      const f = ll[name].filter(s => s.date !== todayStr);
      const n = {
        ...ll
      };
      if (f.length) n[name] = f;else delete n[name];
      changes.liftLog = n;
    }
    update(changes);
    setNotif("↩ Exercitiul de azi a fost sters");
  };

  /* ─── SCHIMBARE EXERCITIU ─── */
  const swapEx = (orig, nou) => {
    const sw = {
      ...(S.exerciseSwaps || {})
    };
    sw[todayStr + "_" + orig] = nou;
    update({
      exerciseSwaps: sw
    });
    setSwapModal(null);
    setNotif("🔄 Astazi faci: " + nou);
  };
  const revertSwap = orig => {
    const sw = {
      ...(S.exerciseSwaps || {})
    };
    delete sw[todayStr + "_" + orig];
    update({
      exerciseSwaps: sw
    });
  };

  /* ─── CRONOMETRU ─── */
  const startRest = (name, setNum, sec, color) => {
    setRestTimer({
      totalSec: sec,
      name,
      setNum,
      startTime: Date.now(),
      color: color || "#3b82f6"
    });
    setRestElapsed(0);
    if (soundOn) playSound("bifa");
  };
  const stopRest = () => {
    setRestTimer(null);
    setRestElapsed(0);
  };

  /* ─── PROGRAMUL DE AZI ─── */
  const PROG = vacation ? ACASA : PPL;
  const ziSel = PROG[selDay] || PROG[0];
  const ziAzi = PROG[todayDow] || PROG[0];
  const ctx = {
    S,
    g,
    update,
    F,
    level,
    xp,
    xpN,
    rank,
    stats,
    done,
    doneEx,
    doneW,
    streak,
    muscleXp,
    vacation,
    weightLog,
    liftLog,
    todayStr,
    todayDow,
    PROG,
    ziSel,
    ziAzi,
    selDay,
    setSelDay,
    toggleEx,
    logSets,
    stergeAzi,
    getLast,
    getRecomandare,
    swapEx,
    revertSwap,
    swapModal,
    setSwapModal,
    openEx,
    setOpenEx,
    showIncalzire,
    setShowIncalzire,
    showRelaxare,
    setShowRelaxare,
    restTimer,
    restElapsed,
    startRest,
    stopRest,
    setRestTimer,
    loggerSets,
    setLoggerSets,
    soundOn,
    setSoundOn,
    setNotif,
    setTab,
    exportStr,
    setExportStr,
    importStr,
    setImportStr,
    lastSaved,
    setLastSaved,
    getMult
  };
  if (!loaded) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "#a78bfa",
        fontSize: F.xl,
        marginTop: 80
      }
    }, "Se incarca...");
  }
  const tabs = [{
    k: "sala",
    i: "🏋️",
    l: "SALA"
  }, {
    k: "progres",
    i: "📈",
    l: "PROGRES"
  }, {
    k: "setari",
    i: "⚙️",
    l: "SETARI"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0f172a,#020617)",
      color: "#e2e8f0",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      paddingBottom: "calc(120px + env(safe-area-inset-bottom))"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "calc(14px + env(safe-area-inset-top)) 16px 14px",
      background: "linear-gradient(180deg,rgba(15,23,42,.98),rgba(15,23,42,.85))",
      borderBottom: "2px solid rgba(255,255,255,.08)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      lineHeight: 1
    }
  }, "NIVEL ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: rank.color
    }
  }, level)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: rank.color,
      fontWeight: 800,
      marginTop: 4
    }
  }, rank.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 900,
      color: streak > 0 ? "#f59e0b" : "#475569"
    }
  }, "🔥 ", streak), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: "#64748b",
      fontWeight: 700
    }
  }, "zile la rand"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16,
      background: "rgba(255,255,255,.07)",
      borderRadius: 8,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(xp / xpN * 100, 100) + "%",
      background: "linear-gradient(90deg,#3b82f6,#a78bfa)",
      borderRadius: 8,
      transition: "width .5s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, xp, " / ", xpN, " XP"), getMult() > 1 ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#f59e0b",
      fontWeight: 800
    }
  }, "bonus ", getMult(), "x") : null), vacation ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      background: "rgba(245,158,11,.15)",
      border: "2px solid rgba(245,158,11,.4)",
      borderRadius: 10,
      fontSize: F.sm,
      color: "#fcd34d",
      fontWeight: 800,
      textAlign: "center"
    }
  }, "🏖️ MOD PLECARE ACTIV — antrenamente acasa, fara penalizari") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, tab === "sala" && /*#__PURE__*/React.createElement(TabSala, {
    ctx: ctx
  }), tab === "progres" && /*#__PURE__*/React.createElement(TabProgres, {
    ctx: ctx
  }), tab === "setari" && /*#__PURE__*/React.createElement(TabSetari, {
    ctx: ctx
  })), restTimer ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(96px + env(safe-area-inset-bottom))",
      left: 12,
      right: 12,
      zIndex: 500,
      padding: 14,
      borderRadius: 14,
      background: restElapsed >= restTimer.totalSec ? "rgba(34,197,94,.95)" : "rgba(15,23,42,.97)",
      border: "2px solid " + (restElapsed >= restTimer.totalSec ? "#4ade80" : restTimer.color),
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#94a3b8",
      fontWeight: 800
    }
  }, restElapsed >= restTimer.totalSec ? "POTI CONTINUA" : "PAUZA · setul " + restTimer.setNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#e2e8f0",
      lineHeight: 1.1
    }
  }, Math.floor(Math.abs(restTimer.totalSec - restElapsed) / 60), ":", String(Math.abs(restTimer.totalSec - restElapsed) % 60).padStart(2, "0"))), /*#__PURE__*/React.createElement("button", {
    onClick: stopRest,
    style: {
      padding: "16px 20px",
      borderRadius: 12,
      border: "2px solid rgba(255,255,255,.35)",
      background: "rgba(0,0,0,.25)",
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#e2e8f0",
      fontSize: F.md,
      fontWeight: 900,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "GATA")) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 600,
      display: "flex",
      background: "rgba(2,6,23,.98)",
      borderTop: "2px solid rgba(255,255,255,.1)",
      paddingBottom: "env(safe-area-inset-bottom)"
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setTab(t.k),
    style: {
      flex: 1,
      padding: "12px 2px 14px",
      background: "transparent",
      border: "none",
      borderTop: tab === t.k ? "4px solid #3b82f6" : "4px solid transparent",
      color: tab === t.k ? "#93c5fd" : "#64748b",
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      lineHeight: 1.1
    }
  }, t.i), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      marginTop: 3
    }
  }, t.l)))), notif ? /*#__PURE__*/React.createElement(Notif, {
    msg: notif,
    onDone: () => setNotif(null)
  }) : null, showLvl ? /*#__PURE__*/React.createElement(LvlModal, {
    level: level,
    rank: rank,
    onClose: () => setShowLvl(false)
  }) : null, questPopup ? /*#__PURE__*/React.createElement(QuestPopup, {
    quote: questPopup.quote,
    xpGain: questPopup.xpGain,
    multiplier: questPopup.multiplier,
    onClose: () => setQuestPopup(null)
  }) : null, swapModal ? /*#__PURE__*/React.createElement(SwapModal, {
    ctx: ctx
  }) : null);
}
