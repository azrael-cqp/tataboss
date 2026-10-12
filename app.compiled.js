const {
  useState,
  useEffect,
  useRef
} = React;

// ─── INDEXEDDB STORAGE ───
const DB_NAME = "SoloLevelingDB";
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
    console.error("Save failed", e);
    return false;
  }
}
async function loadFromIDB() {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(DATA_KEY);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  } catch (e) {
    return null;
  }
}
const SAVE_FIELDS = ["level", "xp", "stats", "done", "doneEx", "doneW", "doneLessons", "totalXp", "qC", "streak", "wLog", "socialLog", "weightLog", "bookTitle", "bookPages", "bookRead", "bookLog", "muscleXp", "lastDailyReset", "lastWeeklyReset", "penaltyLog", "dailyLessonDone", "liftLog", "vacation", "activeBoss", "bossHistory", "sleepLog", "workoutCalendar", "exerciseSwaps", "plankLevel", "kbLevel", "agiUnlocked", "sleepFmtV2", "plankBwV1", "cleanupV4"];
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
  doneLessons: [],
  totalXp: 0,
  qC: 0,
  streak: 0,
  wLog: [],
  socialLog: [],
  weightLog: [{
    date: "Start",
    weight: 115,
    fat: null,
    muscle: null
  }],
  bookTitle: "",
  bookPages: 0,
  bookRead: 0,
  bookLog: [],
  muscleXp: {
    chest: 0,
    back: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    quads: 0,
    hamstrings: 0,
    glutes: 0,
    calves: 0,
    core: 0,
    cardio: 0
  },
  lastDailyReset: null,
  lastWeeklyReset: null,
  penaltyLog: [],
  dailyLessonDone: false,
  liftLog: {},
  vacation: false,
  activeBoss: null,
  bossHistory: [],
  sleepLog: [],
  workoutCalendar: {},
  exerciseSwaps: {},
  plankLevel: 1,
  kbLevel: 1,
  agiUnlocked: false,
  sleepFmtV2: false,
  plankBwV1: false,
  cleanupV4: false
};

// ─── SOMN: ore + minute (HH:MM) ───
function hmToDec(h, m) {
  const hh = parseInt(h, 10) || 0;
  const mm = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
  return Math.round((hh + mm / 60) * 1000) / 1000;
}
function fmtSleep(dec) {
  const n = parseFloat(dec);
  if (isNaN(n)) return "--";
  let total = Math.round(n * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h + "h" + String(m).padStart(2, "0") + "m";
}

// ─── CONSTANTS ───
const RANKS = [{
  name: "E-Rank",
  min: 1,
  max: 5,
  color: "#6b7280"
}, {
  name: "D-Rank",
  min: 6,
  max: 15,
  color: "#22d3ee"
}, {
  name: "C-Rank",
  min: 16,
  max: 30,
  color: "#34d399"
}, {
  name: "B-Rank",
  min: 31,
  max: 50,
  color: "#a78bfa"
}, {
  name: "A-Rank",
  min: 51,
  max: 75,
  color: "#f59e0b"
}, {
  name: "S-Rank",
  min: 76,
  max: 100,
  color: "#ef4444"
}, {
  name: "National",
  min: 101,
  max: 999,
  color: "#ec4899"
}];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PPL = {
  1: {
    day: "Monday",
    type: "PUSH",
    color: "#ef4444",
    icon: "🔴",
    exercises: [{
      name: "Bench Press",
      sets: "4×6-8",
      muscle: "Chest",
      rest: 180,
      desc: "⭐ PRIORITATE PIEPT. Culcat, priza putin mai lata decat umerii. Coboara controlat la piept, impinge exploziv. FARA SPOTTER: plafonul de siguranta e 100kg — peste, progresezi din repetari, nu din greutate."
    }, {
      name: "DB Incline Bench Press",
      sets: "4×8-10",
      muscle: "Upper Chest",
      rest: 120,
      desc: "Banca la 30-45 grade. Coboara ganterele adanc pe langa piept, impinge in sus si usor spre interior. Amplitudine mai mare decat la haltera — principalul constructor de piept superior."
    }, {
      name: "Overhead Press",
      sets: "3×8-10",
      muscle: "Shoulders",
      rest: 150,
      desc: "In picioare, bara la nivelul umerilor. Impinge drept deasupra capului, blocheaza cotul sus. Abdomen contractat tot setul, fara arcuire lombara."
    }, {
      name: "Cable Flyes",
      sets: "3×12-15",
      muscle: "Chest",
      rest: 75,
      desc: "⭐ VOLUM PIEPT. Cablurile la nivelul umerilor. Adu manerele in fata pieptului ca o imbratisare, strange puternic 1s la mijloc. Tensiune constanta — nu lasa greutatea sa cada."
    }, {
      name: "Lateral Raises",
      sets: "3×12-15",
      muscle: "Side Delts",
      rest: 60,
      desc: "Ganterele pe langa corp. Ridica lateral pana la nivelul umerilor, cot usor indoit. Greutati mici, control total — fara balans din solduri."
    }, {
      name: "Tricep Pushdowns",
      sets: "3×12-15",
      muscle: "Triceps",
      rest: 75,
      desc: "Cablu sus, coarda sau bara. Coatele lipite de corp, impinge in jos pana la extensie completa, strange tricepsul."
    }, {
      name: "Cable Crunches",
      sets: "3×15",
      muscle: "Core",
      rest: 60,
      finisher: true,
      desc: "🎯 CORE FINISHER (5 min). Ingenuncheat la cablu, coarda langa cap. Ruleaza coloana in jos contractand abdomenul, nu tragi cu bratele."
    }]
  },
  2: {
    day: "Tuesday",
    type: "PULL",
    color: "#3b82f6",
    icon: "🔵",
    exercises: [{
      name: "Pull-ups",
      sets: "4×5-8",
      muscle: "Lats",
      rest: 150,
      repsOnly: true,
      desc: "⭐ EXERCITIUL PRINCIPAL DE SPATE. Neasistat, cu greutatea corpului. Priza mai lata decat umerii, atarnare completa jos (brate intinse), trage pana barbia trece de bara, coborare controlata 2-3 secunde. Fara balans, fara kipping. PROGRESIE DOAR PRIN REPETARI — nu adaugi greutate. Cand faci 4×8 curat, urmatorul pas e sa cresti la 4×10, apoi se discuta greutatea adaugata."
    }, {
      name: "Chest-Supported Row",
      sets: "4×10-12",
      muscle: "Upper Back",
      rest: 120,
      desc: "APARAT cu piept sprijinit. Trage manerele spre solduri, strange omoplatii 1s la varf. Mijlocul complet descarcat — coloana nu sustine nimic. Se logheaza DOAR placile."
    }, {
      name: "Seated Cable Row",
      sets: "3×10-12",
      muscle: "Mid Back",
      rest: 90,
      desc: "Tors fix la 90 grade tot setul. Trage manerul la abdomenul inferior, strange omoplatii, revenire controlata. Nu te lasa pe spate."
    }, {
      name: "Face Pulls",
      sets: "3×15-18",
      muscle: "Rear Delts",
      rest: 45,
      desc: "Cablu la nivelul fetei cu coarda. Trage spre frunte desfacand coarda, rotatie externa la final. Sanatatea umarului."
    }, {
      name: "Cable Curls",
      sets: "3×10-12",
      muscle: "Biceps",
      rest: 75,
      desc: "La scripete, cu bara dreapta sau EZ. Coatele lipite de corp, fara balans din sold. Tensiune constanta pe toata amplitudinea — de aceea greutatea e mai mica decat la haltera si NU e regresie. Controleaza coborarea 2s, strange sus 1s."
    }, {
      name: "Hammer Curls",
      sets: "3×10-12",
      muscle: "Biceps",
      rest: 60,
      desc: "Priza neutra, palmele fata in fata. Lucreaza si brahialul si antebratul. Asezat pentru control maxim."
    }, {
      name: "Hanging Leg Raises",
      sets: "3×12-20",
      muscle: "Core",
      rest: 60,
      finisher: true,
      repsOnly: true,
      desc: "🎯 CORE FINISHER. Atarnat de bara, doar greutatea corpului. Ridica picioarele controlat pana la 90 grade, coboara lent fara sa te balansezi. PROGRESIE DOAR PRIN REPETARI — fara gantera intre picioare. Abdomen inferior, exact zona ta problematica."
    }]
  },
  3: {
    day: "Wednesday",
    type: "LEGS",
    color: "#22c55e",
    icon: "🟢",
    exercises: [{
      name: "Squats",
      sets: "4×6-8",
      muscle: "Quads/Glutes",
      rest: 180,
      desc: "⭐ ZIUA GREA DE PICIOARE. Bara pe trapez, picioarele la latimea umerilor. Coboara pana coapsa e paralela sau sub, impinge din calcaie, pieptul sus."
    }, {
      name: "Leg Press",
      sets: "3×10-12",
      muscle: "Quads",
      rest: 120,
      desc: "Picioarele la latimea umerilor pe platforma. Coboara pana genunchii ajung la ~90 grade. Impinge din toata talpa, nu bloca genunchii complet."
    }, {
      name: "Leg Extension",
      sets: "3×12-15",
      muscle: "Quads",
      rest: 90,
      desc: "Izolare cvadriceps, zero incarcare axiala. Spatele lipit de scaun, pauza 1s sus, coborare lenta."
    }, {
      name: "Leg Curls",
      sets: "3×12-15",
      muscle: "Hamstrings",
      rest: 90,
      desc: "Culcat sau asezat. Indoaie genunchii contractand ischiogambierii, pauza sus, negativ lent. Sursa principala de hamstrings din program."
    }, {
      name: "Walking Lunges",
      sets: "3×12 /picior",
      muscle: "Quads/Glutes",
      rest: 90,
      desc: "Pas inainte in fandare, genunchiul din spate aproape de podea. Impinge din calcaiul din fata spre pasul urmator. Tors vertical."
    }, {
      name: "Calf Raises",
      sets: "4×15-20",
      muscle: "Calves",
      rest: 60,
      desc: "In picioare pe treapta, gantera intr-o mana. Calcaiul coboara sub nivelul treptei pentru intindere completa, ridicare maxima pe varfuri, pauza 1s sus."
    }, {
      name: "Plank",
      sets: "3×45-90s",
      muscle: "Core",
      rest: 60,
      finisher: true,
      hold: true,
      repsOnly: true,
      desc: "🎯 CORE FINISHER. Plank pe antebrate, doar greutatea corpului — fara disc pe spate. Corp in linie dreapta de la calcaie la cap, fund jos, abdomen si fesieri contractati. PROGRESIE DOAR PRIN SECUNDE: se logheaza durata in campul de repetari. Cand tii 3×90s curat, treci la variante mai grele (plank cu un brat ridicat)."
    }]
  },
  4: {
    day: "Thursday",
    type: "UPPER",
    color: "#f97316",
    icon: "🟠",
    exercises: [{
      name: "DB Bench Press",
      sets: "4×8-10",
      muscle: "Chest",
      rest: 150,
      desc: "⭐ A DOUA ZI DE PIEPT. Ganterele permit amplitudine mai mare decat haltera. Coboara adanc, impinge in sus si usor spre interior. Sigur si fara spotter."
    }, {
      name: "Chest-Supported Row",
      sets: "3×10-12",
      muscle: "Upper Back",
      rest: 120,
      desc: "APARAT. Al doilea stimul de tragere al saptamanii, volum moderat. Torsul sprijinit tot setul. Se logheaza DOAR placile."
    }, {
      name: "Arnold Press",
      sets: "3×10-12",
      muscle: "Shoulders",
      rest: 120,
      desc: "Pornesti cu palmele spre tine la nivelul umerilor. Roteste palmele in exterior in timp ce impingi sus. Invers la coborare."
    }, {
      name: "Cable Flyes",
      sets: "3×12-15",
      muscle: "Chest",
      rest: 75,
      desc: "⭐ VOLUM PIEPT. A doua sedinta din saptamana. Poti varia unghiul: cabluri sus (piept inferior) sau jos (piept superior)."
    }, {
      name: "Cable Pullover",
      sets: "3×12-15",
      muscle: "Lats",
      rest: 75,
      desc: "In picioare la cablu sus, bara dreapta. Trage in arc pana la coapse cu bratele aproape intinse. Simti intinderea dorsalului."
    }, {
      name: "Reverse Flyes",
      sets: "3×15",
      muscle: "Rear Delts",
      rest: 45,
      desc: "Aplecat sau pe banca inclinata. Ridica ganterele lateral strangand deltoidul posterior. Greutate mica, control mare."
    }, {
      name: "Skull Crushers",
      sets: "3×10-12",
      muscle: "Triceps",
      rest: 75,
      desc: "Culcat, bara sau ganterele deasupra fetei. Indoaie doar din coate coborand spre frunte, apoi extinde. Coatele nemiscate."
    }, {
      name: "Incline Curls",
      sets: "3×10-12",
      muscle: "Biceps",
      rest: 60,
      desc: "Banca la ~45 grade, bratele atarna liber. Inclinarea pre-intinde bicepsul pentru activare maxima."
    }, {
      name: "Cable Woodchoppers",
      sets: "3×12-15 / parte",
      muscle: "Core",
      rest: 45,
      finisher: true,
      desc: "🎯 CORE FINISHER. Cablu sus, picioarele departate, trage diagonal de sus spre soldul opus cu bratele aproape intinse. Rotatia vine din trunchi, nu din brate. 12-15 pe fiecare parte. Flancuri sub incarcare — singurul exercitiu de core din saptamana care poate progresa cu greutate."
    }]
  },
  5: {
    day: "Friday",
    type: "LOWER",
    color: "#a855f7",
    icon: "🟣",
    exercises: [{
      name: "Bulgarian Split Squat",
      sets: "3×10-12 /picior",
      muscle: "Quads/Glutes",
      rest: 120,
      desc: "⭐ UNILATERAL. Piciorul din spate pe banca DOAR pentru echilibru — nu impinge cu el. Tors drept pentru accent cvadriceps. Incepe cu piciorul mai slab si fa acelasi numar de reps si cu celalalt. Zero compresie pe coloana."
    }, {
      name: "Leg Press",
      sets: "3×12-15",
      muscle: "Quads",
      rest: 120,
      desc: "Repetari mai multe decat miercuri, greutate mai mica. Zi de volum, nu de forta maximala."
    }, {
      name: "Leg Curls",
      sets: "3×12-15",
      muscle: "Hamstrings",
      rest: 90,
      desc: "A doua sedinta de ischiogambieri a saptamanii. Tempo lent pe negativ, 3 secunde la coborare."
    }, {
      name: "Leg Extension",
      sets: "3×15",
      muscle: "Quads",
      rest: 75,
      desc: "Finisher cvadriceps. Repetari mari, pauza 1s sus pe fiecare repetare."
    }, {
      name: "Hip Thrust",
      sets: "3×12",
      muscle: "Glutes",
      rest: 90,
      desc: "Spatele sus pe banca, bara pe solduri cu burete. Impinge din calcaie pana corpul e paralel cu podeaua, strange fesele 1s sus. Fesieri fara hinge si fara incarcare pe coloana."
    }, {
      name: "Calf Raises",
      sets: "4×18-20",
      muscle: "Calves",
      rest: 60,
      desc: "A doua sedinta de gambe. Repetari mai multe decat miercuri. Amplitudine completa, pauza jos in intindere."
    }, {
      name: "Russian Twists",
      sets: "3×20",
      muscle: "Core",
      rest: 45,
      finisher: true,
      desc: "🎯 CORE FINISHER. Asezat, picioarele ridicate, disc in maini. Roteste trunchiul controlat, atinge podeaua langa sold. Flancuri — zona ta android."
    }]
  },
  6: {
    day: "Saturday",
    type: "REST",
    color: "#475569",
    icon: "⚫",
    exercises: []
  },
  0: {
    day: "Sunday",
    type: "REST",
    color: "#475569",
    icon: "⚫",
    exercises: []
  }
};

// ─── NO GYM WORKOUTS (hotel / vacanta) ───
// 5 zile: greutate corporala + benzi elastice plate (Theraband)
// NOTA BENZI: benzile plate au rezistenta mica. Ca sa creasca dificultatea:
// dublezi banda (2 straturi), o scurtezi (prinzi mai aproape de ancora),
// sau treci pe banda mai tare (negru > gri > portocaliu).
const NO_GYM = {
  1: {
    day: "Monday",
    type: "PUSH (Hotel)",
    color: "#ef4444",
    icon: "🔴",
    exercises: [{
      name: "Push-ups",
      sets: "4×15-20",
      muscle: "Chest",
      desc: "CUM: Palmele pe podea, ceva mai larg decat umerii. Corpul o linie dreapta de la cap la calcaie, abdomen contractat. Coboara controlat pana pieptul aproape atinge podeaua, coatele la ~45° fata de corp (nu lipite, nu perpendiculare). Impinge inapoi fara sa lasi soldul sa cada. LUCREAZA: piept, triceps, deltoid anterior, core stabilizator. GRESELI: sold lasat sau ridicat, coate prea in exterior (stres pe umar), coborare incompleta. MAI GREU: picioarele pe scaun/pat (decline), sau banda pe spate trecuta pe sub palme. MAI USOR: genunchii pe podea sau palmele pe scaun (incline)."
    }, {
      name: "Pike Push-ups",
      sets: "3×8-12",
      muscle: "Shoulders",
      desc: "CUM: Din poziție de flotare, ridica soldul sus si adu picioarele spre mani pana formezi un V intors (ca 'downward dog'). Capul intre mani, privirea spre podea in spate. Coboara varful capului spre podea intre palme, apoi impinge. LUCREAZA: deltoid anterior si median, triceps — cel mai bun inlocuitor bodyweight pentru presa deasupra capului. GRESELI: sold prea jos (devine flotare normala), coborare doar din gat fara sa indoi coatele. MAI GREU: picioarele mai sus, pe scaun sau pat. MAI USOR: sold mai jos, amplitudine mai mica."
    }, {
      name: "Diamond Push-ups",
      sets: "3×8-12",
      muscle: "Triceps",
      desc: "CUM: Palmele lipite sub piept, degetele mari si aratatoarele formeaza un romb (diamant). Coboara pieptul spre mani cu coatele aproape de corp, apoi impinge. LUCREAZA: triceps intens (cel mai bun exercitiu de triceps fara echipament), plus pieptul interior. GRESELI: coate desfacute in laterale (pierzi tot accentul pe triceps), amplitudine scurta. MAI GREU: picioarele ridicate pe scaun. MAI USOR: genunchii pe podea, sau mainile doar apropiate (nu lipite complet)."
    }, {
      name: "Banded Tricep Extension",
      sets: "3×15-20",
      muscle: "Triceps",
      desc: "CUM: Prinde banda in partea de sus a usii (nod la capat, usa inchisa peste el) SAU tine-o cu o mana deasupra capului si trage cu cealalta. Coatele fixe langa cap, extinde antebratele in jos/inainte pana la blocare, contracta tricepsul 1 secunda, revino lent. LUCREAZA: triceps, cel mai apropiat de pushdown-ul de la sala. GRESELI: coatele se depart de corp, folosesti umerii ca sa tragi. BANDA: dubleaz-o sau prinde mai aproape pentru mai multa tensiune. Inlocuieste dips pe scaun — mai bun pentru tricep, fara stres pe umar."
    }, {
      name: "Band Pull-Aparts",
      sets: "3×15-20",
      muscle: "Rear Delts",
      desc: "CUM: Tine banda intinsa in fata, la nivelul pieptului, mainile la lațimea umerilor. Trage capetele in laterale pana banda atinge pieptul, strangand omoplatii. Revino foarte lent. LUCREAZA: deltoid posterior, trapez mijlociu, romboizi — exact muschii care contrabalanseaza toate impingerile si iti tin umarul sanatos. GRESELI: ridici umerii spre urechi, folosesti elan. BANDA: aici rezistenta mica e perfecta — mergi pe reps si control, nu pe forta. Cel mai valoros exercitiu cu banda pentru tine."
    }, {
      name: "Plank",
      sets: "3×60s",
      muscle: "Core",
      desc: "CUM: Antebratele pe podea, coatele sub umeri, corpul o linie dreapta. Contracta abdomenul ca si cand ai primi un pumn, strange fesele, bagă bazinul usor sub tine (fara arcuire lombara). Respira normal. LUCREAZA: anti-extensie — abdomenul rezista tendintei spatelui de a se arcui. GRESELI: sold lasat (stres pe lombar), fund ridicat (usurezi), retinerea respiratiei. Peste 60s nu urca timpul — treci la varianta mai grea (un picior ridicat, sau coatele mai in fata). Progresia completa e in bonus quest-ul de Plank."
    }]
  },
  2: {
    day: "Tuesday",
    type: "PULL (Hotel)",
    color: "#3b82f6",
    icon: "🔵",
    exercises: [{
      name: "Towel Rows (Door)",
      sets: "4×12-15",
      muscle: "Back",
      desc: "CUM: Prosop gros trecut peste clanta (usa INCHISA si blocata, verifica intai!). Prinde ambele capete, picioarele in fata ta, lasa-te pe spate cu bratele intinse. Trage-te spre usa ducand coatele pe langa corp si strangand omoplatii. Revino lent. LUCREAZA: lat, trapez mijlociu, romboizi, biceps. GRESELI: tragi doar din brate fara sa strangi omoplatii, corpul se indoaie la sold. MAI GREU: picioarele mai in fata (unghi mai orizontal). ATENTIE: banda nu poate inlocui asta — rezistenta ei e prea mica fata de cat tragi tu la sala (90kg+). Prosopul rămâne cea mai buna varianta la hotel."
    }, {
      name: "Inverted Rows (Table)",
      sets: "3×10-12",
      muscle: "Lats",
      desc: "CUM: Doar masa solida! Testeaza-o intai cu greutatea ta. Intra pe sub, prinde marginea, corpul drept de la cap la calcaie, trage pieptul spre masa. LUCREAZA: lat, spate mijlociu, biceps, core. GRESELI: sold lasat, tras incomplet. ALTERNATIVA daca masa e fragila: doua scaune cu o coada de matura intre ele, sau mai multe serii de Towel Rows. MAI USOR: genunchii indoiti, picioarele mai aproape."
    }, {
      name: "Banded Rows",
      sets: "3×15-20",
      muscle: "Back",
      desc: "CUM: Banda ancorata la nivelul pieptului (nod in usa) SAU stai pe podea cu banda trecuta pe sub talpi. Trage coatele pe langa corp, strange omoplatii 1 secunda, revino lent controlat. LUCREAZA: spate mijlociu, romboizi, biceps. Nu inlocuieste tragerile grele, dar adauga volum si tensiune constanta pe contractie. GRESELI: te lasi pe spate ca sa compensezi, dai drumul brusc la revenire. BANDA: dubleaz-o sau scurteaz-o pentru mai multa rezistenta — la tine banda simpla va fi prea usoara."
    }, {
      name: "Superman Hold",
      sets: "3×30-45s",
      muscle: "Lower Back",
      desc: "CUM: Intins pe burta, bratele intinse in fata. Ridica simultan pieptul, bratele si picioarele de pe podea. Tine pozitia, privirea in jos (nu pe spate). Strange fesele. LUCREAZA: erectori spinali, fesieri, hamstring superior, deltoid posterior. GRESELI: privirea in sus (comprima cervicala), ridicare prea agresiva. MAI USOR: ridica doar bratele, apoi doar picioarele, alternativ."
    }, {
      name: "Face Pulls cu banda",
      sets: "3×15-20",
      muscle: "Rear Delts",
      desc: "CUM: Banda ancorata la nivelul ochilor (nod in usa). Trage capetele spre fata, coatele sus si in exterior, mainile ajung la nivelul tamplelor cu palmele in fata. Strange omoplatii si roteste extern umerii la final. Revino lent. LUCREAZA: deltoid posterior, rotatori externi, trapez — sanatatea umarului si postura. GRESELI: tragi jos spre piept (devine row), coatele cad. Inlocuieste Reverse Snow Angels: acelasi target, cu rezistenta reala."
    }, {
      name: "Banded Curls",
      sets: "3×15-20",
      muscle: "Biceps",
      desc: "CUM: Calca banda cu ambele picioare, prinde capetele cu palmele in sus. Coatele lipite de corp, ridica antebratele pana la contractie maxima, strange bicepsul, coboara foarte lent (partea excentrica e unde banda da cel mai mult). LUCREAZA: biceps, brahial. GRESELI: te lasi pe spate, coatele migreaza in fata, cobori brusc. BANDA: la tine (18-20kg gantere) o singura banda e usoara — dubleaz-o sau stai cu picioarele mai depart pentru tensiune mai mare. Inlocuieste Doorway Curls."
    }]
  },
  3: {
    day: "Wednesday",
    type: "LEGS (Hotel)",
    color: "#22c55e",
    icon: "🟢",
    exercises: [{
      name: "Bodyweight Squats",
      sets: "4×20-25",
      muscle: "Quads/Glutes",
      desc: "CUM: Picioarele la lațimea umerilor, varfurile usor in exterior. Coboara ducand soldul in spate si jos, pana coapsele sunt paralele cu podeaua (sau mai jos daca poti). Genunchii urmeaza direcția varfurilor. Impinge prin calcaie. LUCREAZA: quadriceps, fesieri, adductori. GRESELI: genunchii cad spre interior, calcaiele se ridica, spatele se rotunjeste jos. MAI GREU: coboara in 3 secunde (tempo), sau banda peste umeri/sub talpi. Volum mare aici, fiindca nu ai greutate."
    }, {
      name: "Bulgarian Split Squats",
      sets: "3×12 fiecare",
      muscle: "Quads/Glutes",
      desc: "CUM: Piciorul din spate sprijinit pe scaun/pat, cel din fata la ~60cm in fata. Coboara drept in jos pana genunchiul din spate aproape atinge podeaua. Toata greutatea pe piciorul din fata, impinge prin calcai. LUCREAZA: quadriceps si fesier al piciorului din fata, plus echilibru si stabilitate de sold. Brutal — un picior odata construieste forta reala. GRESELI: te apleci mult in fata, piciorul din fata prea aproape (genunchiul trece mult peste varf). MAI USOR: tine-te cu o mana de perete pentru echilibru."
    }, {
      name: "Walking Lunges",
      sets: "3×20 pasi",
      muscle: "Quads/Glutes",
      rest: 90,
      desc: "CUM: Pas mare in fata, coboara pana ambii genunchi sunt la ~90°, genunchiul din spate aproape de podea. Impinge prin calcaiul din fata si pasesti direct in urmatoarea fandare. Torsul drept, privirea in fata. LUCREAZA: quadriceps, fesieri, hamstring, plus stabilitate. Holurile de hotel sunt perfecte. GRESELI: pas prea scurt (genunchiul depaseste mult varful), torsul aplecat, dezechilibru. MAI GREU: tine rucsacul plin in mana sau pe spate."
    }, {
      name: "Banded Good Mornings",
      sets: "3×15-20",
      muscle: "Hams/Glutes",
      desc: "CUM: Calca banda, treci celalalt capat peste ceafa/umeri. Genunchii usor indoiti si FIXI, impinge soldul in spate si coboara torsul spre paralel cu podeaua, cu spatele drept. Simti intinderea in hamstring. Revino strangand fesele. LUCREAZA: hamstring si fesieri (hinge — acelasi tipar ca RDL-ul tau de 97.5kg). GRESELI: indoi genunchii ca la squat, rotunjesti spatele. BANDA: dubleaz-o pentru tensiune reala. Adaugat pentru hamstring — inainte aveai doar glute bridges."
    }, {
      name: "Single-leg Glute Bridges",
      sets: "3×15 fiecare",
      muscle: "Glutes/Hams",
      desc: "CUM: Intins pe spate, un picior cu talpa pe podea (genunchi indoit), celalalt intins in sus. Impinge soldul in sus prin calcaiul de sprijin, strange fesa tare 1 secunda la varf, coboara controlat. LUCREAZA: fesier mare, hamstring, plus corectare de asimetrii. GRESELI: impingi din lombar in loc de fesa (te arcuiesti), amplitudine mica. Concentreaza-te sa simti fesa, nu spatele."
    }, {
      name: "Calf Raises",
      sets: "5×30",
      muscle: "Calves",
      rest: 60,
      desc: "CUM: Pe marginea unei trepte sau a unei cărti groase, doar varfurile pe suport. Coboara calcaiele sub nivel (intindere completa), apoi ridica-te maxim pe varfuri si tine 1 secunda sus. LUCREAZA: gastrocnemian si solear. Reps mari fiindca nu ai greutate. GRESELI: sarituri rapide fara amplitudine, nu cobori sub nivel. MAI GREU: pe un picior odata. PRIORITATE: gambele sunt cea mai slaba grupa la tine (89 XP) — nu sari peste."
    }, {
      name: "Wall Sit",
      sets: "3×60-90s",
      muscle: "Quads",
      desc: "CUM: Spatele lipit complet de perete, aluneca in jos pana coapsele sunt paralele cu podeaua (90° la genunchi). Genunchii deasupra calcaielor, nu mai in fata. Tine. LUCREAZA: quadriceps izometric — arde intens. GRESELI: sold prea sus (prea usor), sprijin cu mainile pe genunchi. Creste timpul cu 10s la fiecare sesiune."
    }]
  },
  4: {
    day: "Thursday",
    type: "FULL BODY HIIT",
    color: "#a855f7",
    icon: "🟣",
    exercises: [{
      name: "Burpees",
      sets: "5×10",
      muscle: "Full Body",
      desc: "CUM: Din stand, ghemuit si palmele pe podea, sari cu picioarele in spate in plank, o flotare, sari cu picioarele inapoi la mani, ridica-te si sari in sus cu bratele deasupra. LUCREAZA: tot corpul plus conditie cardiovasculara — regele exercitiilor bodyweight. GRESELI: soldul cade in partea de plank, aterizare pe picioare drepte (absoarbe cu genunchii). MAI USOR: fara saritura finala si fara flotare (step-back burpee). La 105kg, prioritizeaza aterizarea moale."
    }, {
      name: "Mountain Climbers",
      sets: "4×30s",
      muscle: "Core/Cardio",
      desc: "CUM: Poziție de plank pe palme. Adu alternativ genunchii spre piept, rapid, fara sa ridici soldul. Umerii rămân deasupra palmelor. LUCREAZA: core (anti-rotatie), flexori de sold, plus cardio serios. GRESELI: soldul urca si coboara, prea rapid fara control. MAI USOR: incetineste, du genunchiul controlat."
    }, {
      name: "Jump Squats",
      sets: "4×15",
      muscle: "Quads/Power",
      desc: "CUM: Squat normal, apoi exploziv sari cat de sus poti. Aterizeaza moale pe toata talpa, absorbind cu genunchii, si intra direct in urmatorul squat. LUCREAZA: quadriceps, fesieri, putere explosiva, plus ardere calorica mare. GRESELI: aterizare rigida pe picioare drepte, genunchii cad spre interior. La greutatea ta, fa-le controlat si daca simti genunchii, inlocuieste cu squat normal in tempo lent."
    }, {
      name: "Plank to Push-up",
      sets: "3×10",
      muscle: "Core/Chest",
      desc: "CUM: Pornesti in plank pe antebrate. Ridica-te pe o palma, apoi pe cealalta, pana ajungi in poziție de flotare. Coboara inapoi pe antebrate, alternand bratul care conduce. LUCREAZA: core anti-rotatie (partea grea — sa nu te legeni), piept, triceps, umeri. GRESELI: soldul se leagana lateral, fund ridicat. MAI USOR: genunchii pe podea."
    }, {
      name: "High Knees",
      sets: "4×30s",
      muscle: "Cardio",
      desc: "CUM: Alergare pe loc, ducand genunchii pana la nivelul soldului. Pompeaza bratele. Aterizare pe pingea, nu pe calcai. LUCREAZA: cardio intens, flexori de sold, gambe. 30s all-out, 30s pauza. GRESELI: genunchii prea jos, aterizare grea pe calcaie. MAI USOR: mers cu genunchii sus, fara alergare."
    }, {
      name: "Russian Twists",
      sets: "3×30",
      muscle: "Obliques",
      desc: "CUM: Sezand, torsul inclinat pe spate ~45°, picioarele ridicate sau talpile pe podea. Roteste torsul stanga-dreapta, ducand mainile langa sold. Rotatia vine din tors, nu din brate. LUCREAZA: obliqui, core rotational. GRESELI: doar bratele se mișca, spatele rotunjit, prea rapid. MAI GREU: o carte grea sau bidonul de apa in mani, picioarele ridicate de pe podea."
    }]
  },
  5: {
    day: "Friday",
    type: "CARDIO + CORE",
    color: "#3b82f6",
    icon: "🔵",
    exercises: [{
      name: "Run/Walk Outside",
      sets: "30-40 min",
      muscle: "Cardio",
      desc: "CUM: Ritm constant Zona 2 — poti purta o conversatie fara sa gafai. Mers rapid, jogging usor, sau banda din sala hotelului. LUCREAZA: baza aerobica, arde grasime, tine cardio-ul in forma cat esti in vacanta. NU sprinturi maximale — asta e volum, nu intensitate. La greutatea ta, mersul rapid in panta e mai bun pentru articulatii decat alergarea."
    }, {
      name: "Hollow Hold",
      sets: "3×30-45s",
      muscle: "Core",
      desc: "CUM: Intins pe spate. Lipeste lombarul de podea (asta e cheia — contracta abdomenul si bagă buricul spre coloana). Ridica umerii si capul usor, picioarele intinse la unghi mic, bratele pe langa urechi. Corpul in forma de banana. Respira controlat. LUCREAZA: tot peretele abdominal, anti-extensie — cel mai bun exercitiu de core fara echipament. GRESELI: lombarul se ridica de pe podea (atunci ai ieșit din exercitiu). MAI USOR: genunchii la piept (tuck), apoi un picior intins, apoi ambele."
    }, {
      name: "Bicycle Crunches",
      sets: "3×30",
      muscle: "Core/Obliques",
      desc: "CUM: Pe spate, mainile usor la ceafa (nu tragi de cap), picioarele ridicate. Adu cotul opus spre genunchiul opus, extinzand celalalt picior. Alterneaza lent si controlat. LUCREAZA: drept abdominal, obliqui. GRESELI: tragi de cap cu mainile, mergi prea rapid, nu roteste torsul (doar coatele). Calitate peste viteza."
    }, {
      name: "Leg Raises",
      sets: "3×15-20",
      muscle: "Lower Abs",
      desc: "CUM: Intins pe spate, mainile pe langa corp sau sub sold pentru sprijin. Ridica picioarele intinse pana la vertical, apoi coboara LENT fara sa atingi podeaua. Lombarul rămâne lipit. LUCREAZA: abdomen inferior — exact zona ta problematica (WHR android). GRESELI: lombarul se arcuiește la coborare, folosesti elan. MAI USOR: genunchii indoiti, sau coboara doar pana la 45°."
    }, {
      name: "Side Plank",
      sets: "3×45s fiecare parte",
      muscle: "Obliques",
      desc: "CUM: Pe o parte, sprijin pe antebrat, cotul sub umar. Ridica soldul pana corpul e o linie dreapta din profil. Tine. Schimba partea. LUCREAZA: obliqui, anti-flexie laterala, stabilitate de sold. GRESELI: soldul cade, corpul se rotește in fata sau in spate. MAI USOR: genunchiul de jos pe podea."
    }, {
      name: "Pallof Press cu banda",
      sets: "3×12 fiecare parte",
      muscle: "Core Anti-Rotatie",
      desc: "CUM: Banda ancorata la nivelul pieptului, lateral fata de tine (nod in clanta). Stai perpendicular pe banda, prinde-o cu ambele mani la piept. Impinge bratele drept in fata si REZISTA tendintei benzii de a-ti roti torsul. Tine 2 secunde intins, revino. LUCREAZA: core anti-rotatie — stabilitate profunda, exact ce lipseste din programul tau. GRESELI: torsul se rotește, soldul se mișca, impingi cu umerii ridicati. Aici rezistenta mica a benzii e perfecta. Unul dintre cele mai valoroase exercitii de core."
    }]
  },
  6: {
    day: "Saturday",
    type: "REST",
    color: "#475569",
    icon: "⚫",
    exercises: []
  },
  0: {
    day: "Sunday",
    type: "REST",
    color: "#475569",
    icon: "⚫",
    exercises: []
  }
};
const DAILY_Q = [{
  id: "protein_shake1",
  label: "Shake Whey #1 (2 scoops · 45g)",
  stat: "VIT",
  xp: 5,
  icon: "🥤",
  subgroup: "protein"
}, {
  id: "protein_shake2",
  label: "Shake Whey #2 (2 scoops · 45g)",
  stat: "VIT",
  xp: 5,
  icon: "🥤",
  subgroup: "protein"
}, {
  id: "protein_jerky",
  label: "Beef Jerky (50g · 22g protein)",
  stat: "VIT",
  xp: 5,
  icon: "🥩",
  subgroup: "protein"
}, {
  id: "protein_bar",
  label: "Baton ASAP (50g · 25g protein)",
  stat: "VIT",
  xp: 5,
  icon: "🍫",
  subgroup: "protein"
}, {
  id: "protein_meat",
  label: "Carne 280-310g gatit (~83g protein)",
  stat: "VIT",
  xp: 5,
  icon: "🍗",
  subgroup: "protein"
}];

// Learning rotation: Mon=📖, Tue=🤖, Wed=🗣️, Thu=📖, Fri=🤖
const LEARNING_ROTATION = {
  1: {
    id: "reading",
    label: "Read 30 Pages",
    stat: "INT",
    xp: 25,
    icon: "📖",
    desc: "Today's learning focus: Reading"
  },
  2: {
    id: "ai_learn",
    label: "Claude / AI Learning (30 min)",
    stat: "INT",
    xp: 40,
    icon: "🤖",
    desc: "Today's learning focus: AI & Claude"
  },
  3: {
    id: "language",
    label: "Language Practice (30 min)",
    stat: "INT",
    xp: 35,
    icon: "🗣️",
    desc: "Today's learning focus: New Language"
  },
  4: {
    id: "reading",
    label: "Read 30 Pages",
    stat: "INT",
    xp: 25,
    icon: "📖",
    desc: "Today's learning focus: Reading"
  },
  5: {
    id: "ai_learn",
    label: "Claude / AI Learning (30 min)",
    stat: "INT",
    xp: 40,
    icon: "🤖",
    desc: "Today's learning focus: AI & Claude"
  }
};

// Get today's learning quest
function getTodayLearning() {
  const dow = new Date().getDay();
  return LEARNING_ROTATION[dow] || null; // null on weekends
}
const LIFE_Q_FIXED = [];

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// `days` array = ce zile apare quest-ul; lipsa = oricand
const BONUS_Q = [{
  id: "weightedplank",
  label: "Plank",
  stat: "VIT",
  xp: 30,
  icon: "🪨",
  days: [1, 4],
  hold: true,
  progression: true,
  desc: "Core priority - post Push day. Acasa cu vesta la nivel 4."
}, {
  id: "farmercarry",
  label: "Hollow Body Hold",
  stat: "VIT",
  xp: 30,
  icon: "🌙",
  days: [2, 5],
  hold: true,
  desc: "Core anti-extensie - post Pull day. Lombarul lipit de podea, corpul in forma de banana. Progresie: tuck (genunchi la piept) → un picior intins → ambele picioare → full (brate+picioare intinse). Daca lombarul se ridica, indoi picioarele. 3×30s."
}, {
  id: "pushups",
  label: "Push-ups la refuz (3 seturi)",
  stat: "STR",
  xp: 30,
  chestBonus: true,
  icon: "💪",
  days: [2],
  desc: "🧡 BONUS PIEPT. 3 seturi la refuz, pauza 90s intre ele. Pieptul e odihnit dupa Push-ul de luni. Corp drept ca o scandura, coboara pana la 2cm de podea."
}, {
  id: "inclinepush",
  label: "Incline Push-ups (3x15)",
  stat: "STR",
  xp: 25,
  icon: "🧡",
  days: [3],
  chestBonus: true,
  desc: "🧡 BONUS PIEPT. Mainile pe canapea sau pe masa, corpul inclinat. Accent pe pieptul inferior. Usor — nu incarca recuperarea inaintea zilei de Upper."
}, {
  id: "diamondpush",
  label: "Diamond Push-ups (3 seturi)",
  stat: "STR",
  xp: 25,
  icon: "💎",
  days: [5],
  chestBonus: true,
  desc: "🧡 BONUS PIEPT + TRICEPS. Mainile apropiate, degetele mari si aratatoarele formeaza un romb. Coatele lipite de corp. Piept interior si triceps."
}, {
  id: "squats",
  label: "100 Bodyweight Squats",
  stat: "STR",
  xp: 30,
  icon: "🦵",
  days: [4],
  desc: "Thursday - light activation"
}, {
  id: "calfblitz",
  label: "Calf Raises (100+ reps)",
  stat: "STR",
  xp: 25,
  icon: "🦶",
  days: [5],
  desc: "Friday - calves recovery from Wed"
}, {
  id: "extrardl",
  label: "Extra Leg Extension (2x15)",
  stat: "STR",
  xp: 30,
  icon: "🦵",
  days: [6],
  desc: "Saturday off-day - booster cvadriceps, zero incarcare pe coloana"
}, {
  id: "situps",
  label: "100 Sit-ups",
  stat: "VIT",
  xp: 25,
  icon: "🔥",
  days: [6, 0],
  desc: "Weekend core finisher"
}, {
  id: "swimsauna",
  label: "Inot",
  stat: "VIT",
  xp: 30,
  icon: "🏊",
  days: [6],
  desc: "30-45 min inot ritm confortabil (NU cursa). Recuperare activa: zero impact pe articulatii, mobilitate umar, core postural."
}, {
  id: "padel",
  label: "Padel",
  stat: "AGI",
  xp: 45,
  icon: "🎾",
  desc: "Tinta: 2x pe saptamana, fara zile fixe — bifezi in ziua in care ai jucat. Zona 1 la ~105 bpm, deci e NEAT, nu antrenament: nu incarca recuperarea de la forta. Doua sesiuni = ~1400 cal pe saptamana, mananca peste in zilele alea. Incalzeste gleznele si soldurile inainte — opriri bruste la 100kg. Daca se poate dimineata, mai bine: sesiunile de seara taie din somn."
}, {
  id: "mobility",
  label: "Mobility 5 min (acasa)",
  stat: "AGI",
  xp: 15,
  icon: "🤸",
  desc: "Singura sursa de AGI. Seara, pe covor, fara echipament.",
  steps: [{
    n: "1",
    name: "90/90 Hip Switch",
    time: "90 secunde",
    how: "Asezat pe podea, ambii genunchi indoiti la 90 grade — unul in fata, unul lateral. Roteste lent soldurile in partea cealalta, fara sa ridici fundul de pe podea. Inainte si inapoi, lent."
  }, {
    n: "2",
    name: "Rotatii toracice",
    time: "60 secunde",
    how: "In patrupedie, o mana la ceafa. Roteste cotul in sus spre tavan cat poti, urmareste-l cu privirea. Coboara controlat sub piept. 8 repetari pe fiecare parte."
  }, {
    n: "3",
    name: "Ankle Rocks",
    time: "60 secunde",
    how: "In fandare, genunchiul din fata impins peste varful piciorului, calcaiul LIPIT de podea. Balanseaza inainte si inapoi. 10 pe fiecare picior. Direct util la squat."
  }, {
    n: "4",
    name: "Cat-Cow",
    time: "60 secunde",
    how: "In patrupedie. Inspira si lasa burta jos arcuind spatele, expira si rotunjeste coloana impingand spre tavan. Lent, 10 cicluri."
  }]
}];

// Plank progression - built-in 4 levels. Cresti NIVELUL, nu timpul peste 60s.
const PLANK_LEVELS = [{
  lvl: 1,
  name: "Bodyweight",
  target: "3×60s",
  desc: "Plank clasic pe coate. Sold jos, abdomen contractat, corp drept. Tinta: 3×60s controlat, fara tremurat necontrolat.",
  next: "Cand faci 3×60s curat → treci la Nivel 2"
}, {
  lvl: 2,
  name: "Long-lever / un picior",
  target: "3×45-60s",
  desc: "Coatele mai in fata (long-lever) SAU ridica alternativ un picior. Mult mai greu fara echipament.",
  next: "Cand stapanesti 3×60s → treci la Nivel 3"
}, {
  lvl: 3,
  name: "RKC Plank",
  target: "3×30-45s",
  desc: "Contractie maxima: fund strans tare, abdomen contractat total, coatele 'trag' spre picioare. Intens, timp scurt intentionat.",
  next: "Cand e solid 3×45s → treci la Nivel 4"
}, {
  lvl: 4,
  name: "Weighted (vesta/disc)",
  target: "45-60s",
  desc: "Cu vesta cu greutate sau disc pe spate. De AICI cresti GREUTATEA, nu timpul. Progressive overload real.",
  next: "Nivel maxim - creste greutatea progresiv"
}];

// Kettlebell Pavel — progresie pe 4 niveluri, se deblocheaza treptat.
// Stil Pavel: nu la epuizare. Daca poti 10 reps, fa 5.
const KB_LEVELS = [{
  lvl: 1,
  name: "Swings + Windmill",
  target: "Swings 5×10 · Windmill 3×5/parte",
  desc: "SWING: e hinge, NU squat. Soldul in spate, kettlebell-ul intre picioare, apoi explozie din sold si fese — bratele doar ghideaza, nu ridica. Se opreste la nivelul pieptului. WINDMILL: kettlebell sus intr-o mana, privirea la el, impinge soldul lateral si coboara cealalta mana spre podea cu picioarele drepte. Mobilitate umar + sold, anti-flexie laterala (da AGI).",
  next: "Dupa 2-3 sambete, cand tiparul de hinge e sigur → Nivel 2"
}, {
  lvl: 2,
  name: "+ Clean & Press",
  target: "Swings 5×10 · Windmill 3×5 · C&P 3×5/parte",
  desc: "CLEAN: din swing, ghideaza kettlebell-ul in poziție de rack (la piept, cotul lipit) fara sa-l lasi sa loveasca antebratul. PRESS: impinge deasupra capului, blocheaza cotul, coboara controlat. Forta pe umeri si triceps, plus core stabilizator.",
  next: "Cand C&P e curat pe ambele parti → Nivel 3"
}, {
  lvl: 3,
  name: "+ Renegade Rows",
  target: "Toate 4 miscari",
  desc: "RENEGADE ROW: poziție de flotare cu mainile pe kettlebell-uri (sau gantere). Trage unul spre coasta fara sa lasi soldul sa se roteasca. Plank + tras — mai greu decat pare. La core 141 XP, incepe usor sau cu genunchii pe podea.",
  next: "Cand toate 4 sunt solide → Nivel 4"
}, {
  lvl: 4,
  name: "Complex complet",
  target: "4 miscari, greutate mai mare",
  desc: "Toate 4 in circuit, cu kettlebell mai greu. Tot in stil Pavel: reps mici, fara epuizare, calitate maxima. De aici cresti greutatea, nu volumul.",
  next: "Nivel maxim — creste greutatea kettlebell-ului"
}];

// Daily podcast rotation — cycles through categories
const PODCAST_SCHEDULE = [{
  day: 0,
  cat: "💰 Business",
  pick: "My First Million",
  desc: "Sam Parr & Shaan Puri brainstorm million-dollar ideas",
  url: "https://www.youtube.com/@MyFirstMillionPod",
  alt: [{
    name: "Alex Hormozi",
    url: "https://www.youtube.com/@AlexHormozi"
  }, {
    name: "Diary of a CEO",
    url: "https://www.youtube.com/@TheDiaryOfACEO"
  }]
}, {
  day: 1,
  cat: "📈 Investing",
  pick: "We Study Billionaires",
  desc: "World's largest stock investing podcast — how billionaires invest",
  url: "https://www.youtube.com/@TheInvestorsPodcastNetwork",
  alt: [{
    name: "All-In Podcast",
    url: "https://www.youtube.com/@alaboratory"
  }, {
    name: "Motley Fool Money",
    url: "https://www.youtube.com/@MotleyFoolMoney"
  }]
}, {
  day: 2,
  cat: "🤖 AI & Tech",
  pick: "Matt Wolfe",
  desc: "Weekly AI tool roundups and practical trends",
  url: "https://www.youtube.com/@MattWolfe",
  alt: [{
    name: "Wes Roth",
    url: "https://www.youtube.com/@WesRoth"
  }, {
    name: "Sabrina Ramonov",
    url: "https://www.youtube.com/@SabrinaRamonov"
  }]
}, {
  day: 3,
  cat: "🧠 Self-Improvement",
  pick: "Chris Williamson",
  desc: "Modern Wisdom — psychology, performance, becoming better",
  url: "https://www.youtube.com/@ChrisWillx",
  alt: [{
    name: "Andrew Huberman",
    url: "https://www.youtube.com/@hubaboratory"
  }, {
    name: "Iman Gadzhi",
    url: "https://www.youtube.com/@ImanGadzhi"
  }]
}, {
  day: 4,
  cat: "🏋️ Training",
  pick: "Jeff Nippard",
  desc: "Science-based muscle building, PPL programs, form guides",
  url: "https://www.youtube.com/@JeffNippard",
  alt: [{
    name: "Dr. Mike (RP)",
    url: "https://www.youtube.com/@RenaissancePeriodization"
  }, {
    name: "Greg Doucette",
    url: "https://www.youtube.com/@GregDoucette"
  }]
}, {
  day: 5,
  cat: "📊 Sales & Growth",
  pick: "Alex Hormozi",
  desc: "Sales tactics, scaling businesses, making more money",
  url: "https://www.youtube.com/@AlexHormozi",
  alt: [{
    name: "Valuetainment",
    url: "https://www.youtube.com/@valuetainment"
  }, {
    name: "Jordan Belfort",
    url: "https://www.youtube.com/@JordanBelfort"
  }]
}, {
  day: 6,
  cat: "💡 Trends & Money",
  pick: "Diary of a CEO",
  desc: "Deep interviews with top performers on business & life",
  url: "https://www.youtube.com/@TheDiaryOfACEO",
  alt: [{
    name: "My First Million",
    url: "https://www.youtube.com/@MyFirstMillionPod"
  }, {
    name: "All-In Podcast",
    url: "https://www.youtube.com/@alaboratory"
  }]
}];
const WEEKLY_OBJ = [];
const MUSCLE_RANKS = [{
  name: "Bronze",
  min: 0,
  color: "#92400e",
  bg: "#78350f"
}, {
  name: "Silver",
  min: 10,
  color: "#94a3b8",
  bg: "#475569"
}, {
  name: "Gold",
  min: 25,
  color: "#f59e0b",
  bg: "#92400e"
}, {
  name: "Platinum",
  min: 50,
  color: "#22d3ee",
  bg: "#155e75"
}, {
  name: "Diamond",
  min: 80,
  color: "#a78bfa",
  bg: "#5b21b6"
}, {
  name: "Master",
  min: 120,
  color: "#f472b6",
  bg: "#831843"
}, {
  name: "Mythic",
  min: 175,
  color: "#ef4444",
  bg: "#7f1d1d"
}, {
  name: "Legend",
  min: 250,
  color: "#fbbf24",
  bg: "#451a03"
}];
const MUSCLE_GROUPS = [{
  key: "chest",
  name: "Chest",
  icon: "🫁",
  exercises: ["Bench Press", "DB Bench Press", "DB Incline Bench Press", "Incline DB Press", "Cable Flyes"]
}, {
  key: "back",
  name: "Back",
  icon: "🔙",
  exercises: ["Pull-ups", "Pull-ups / Lat Pulldown", "Chest-Supported Row", "Seated Cable Row", "Single Arm DB Row", "Cable Pullover"]
}, {
  key: "shoulders",
  name: "Shoulders",
  icon: "🔺",
  exercises: ["Overhead Press", "Arnold Press", "Lateral Raises", "Front Raises", "Cable Front Raises", "Face Pulls", "Reverse Flyes"]
}, {
  key: "biceps",
  name: "Biceps",
  icon: "💪",
  exercises: ["Cable Curls", "Barbell Curls", "Hammer Curls", "Incline Curls", "Concentration Curls"]
}, {
  key: "triceps",
  name: "Triceps",
  icon: "🔱",
  exercises: ["Tricep Pushdowns", "Rope Pushdown", "Overhead Tricep Ext.", "Skull Crushers"]
}, {
  key: "quads",
  name: "Quads",
  icon: "🦵",
  exercises: ["Squats", "Leg Press", "Walking Lunges", "Leg Extension", "Bulgarian Split Squat"]
}, {
  key: "hamstrings",
  name: "Hamstrings",
  icon: "🦿",
  exercises: ["Leg Curls"]
}, {
  key: "glutes",
  name: "Glutes",
  icon: "🍑",
  exercises: ["Squats", "Walking Lunges", "Bulgarian Split Squat", "Hip Thrust"]
}, {
  key: "calves",
  name: "Calves",
  icon: "🦶",
  exercises: ["Calf Raises"]
}, {
  key: "core",
  name: "Core",
  icon: "🔥",
  exercises: ["Cable Crunches", "Decline Sit-ups", "Hanging Leg Raises", "Hollow Hold", "Hollow Body Hold", "Plank", "Russian Twists", "Ab Wheel / Plank", "Turkish Get-Up / Windmill", "Windmill / Turkish Get-Up", "Pallof Press cu banda", "Side Plank", "Leg Raises", "Bicycle Crunches"]
}, {
  key: "cardio",
  name: "Cardio",
  icon: "🫀",
  exercises: []
}];

// ─── EXERCISE ALTERNATIVES (when equipment busy or hurting) ───
const EXERCISE_ALTERNATIVES = {
  "Bench Press": [{
    name: "DB Bench Press",
    reason: "Same chest activation, more stabilization"
  }, {
    name: "Push-ups Weighted",
    reason: "No equipment needed, bodyweight + plate"
  }, {
    name: "Smith Machine Press",
    reason: "Stabilized version"
  }],
  "DB Incline Bench Press": [{
    name: "Incline Smith Press",
    reason: "If DBs too heavy"
  }, {
    name: "Incline Push-ups",
    reason: "Bodyweight option"
  }, {
    name: "Cable Chest Press High",
    reason: "Cables"
  }],
  "DB Bench Press": [{
    name: "Bench Press (barbell)",
    reason: "Heavier loading"
  }, {
    name: "Push-ups",
    reason: "Bodyweight"
  }, {
    name: "Cable Chest Press",
    reason: "Constant tension"
  }],
  "Overhead Press": [{
    name: "DB Shoulder Press",
    reason: "Less lower back stress"
  }, {
    name: "Arnold Press",
    reason: "Variation"
  }, {
    name: "Pike Push-ups",
    reason: "Bodyweight option"
  }],
  "Arnold Press": [{
    name: "DB Shoulder Press",
    reason: "Standard version"
  }, {
    name: "Lateral Raises (heavier)",
    reason: "Isolation focus"
  }],
  "Incline DB Press": [{
    name: "Incline Bench Press",
    reason: "Barbell version"
  }, {
    name: "Cable Chest Press",
    reason: "Cables alternative"
  }],
  "Cable Flyes": [{
    name: "DB Flyes",
    reason: "On bench"
  }, {
    name: "Push-ups deficit",
    reason: "Stretch focus"
  }],
  "Front Raises": [{
    name: "Cable Front Raise",
    reason: "Constant tension"
  }, {
    name: "Plate Front Raise",
    reason: "Different feel"
  }],
  "Lateral Raises": [{
    name: "Cable Lateral",
    reason: "Constant tension"
  }, {
    name: "Machine Lateral Raise",
    reason: "Strict form"
  }],
  "Tricep Pushdowns": [{
    name: "Skull Crushers",
    reason: "More stretch"
  }, {
    name: "Diamond Push-ups",
    reason: "Bodyweight"
  }, {
    name: "Overhead Tricep Ext.",
    reason: "Long head focus"
  }],
  "Overhead Tricep Ext.": [{
    name: "Tricep Pushdowns",
    reason: "Cables"
  }, {
    name: "Skull Crushers",
    reason: "Compound"
  }],
  "Skull Crushers": [{
    name: "Tricep Pushdowns",
    reason: "Less elbow stress"
  }, {
    name: "Overhead Tricep Ext.",
    reason: "Long head focus"
  }],
  "Pull-ups": [{
    name: "Assisted Pull-ups",
    reason: "Daca nu iesi 5 reps curate"
  }, {
    name: "Negative Pull-ups",
    reason: "Doar faza de coborare, 5s"
  }, {
    name: "Lat Pulldown",
    reason: "Daca bara e ocupata"
  }],
  "Pull-ups / Lat Pulldown": [{
    name: "Assisted Pull-ups",
    reason: "If too heavy"
  }, {
    name: "Inverted Rows",
    reason: "Bodyweight horizontal"
  }, {
    name: "Cable Pulldown",
    reason: "Different angle"
  }],
  "Chest-Supported Row": [{
    name: "DB Rows",
    reason: "Single arm focus"
  }, {
    name: "T-Bar Rows",
    reason: "Different machine"
  }, {
    name: "Seated Cable Row",
    reason: "Cablu, tors fix"
  }],
  "Seated Cable Row": [{
    name: "Chest-Supported Row",
    reason: "Tors sprijinit"
  }, {
    name: "DB Rows",
    reason: "Unilateral"
  }, {
    name: "T-Bar Rows",
    reason: "Plate-loaded"
  }],
  "Single Arm DB Row": [{
    name: "Cable Single Row",
    reason: "Constant tension"
  }, {
    name: "Chest-Supported Row",
    reason: "Bilateral"
  }, {
    name: "Seated Cable Row",
    reason: "Machine version"
  }],
  "Cable Pullover": [{
    name: "DB Pullover",
    reason: "On bench"
  }, {
    name: "Lat Pulldown",
    reason: "Compound"
  }],
  "Face Pulls": [{
    name: "Reverse Flyes",
    reason: "DB version"
  }, {
    name: "Band Pull-Aparts",
    reason: "With band"
  }, {
    name: "Cable Reverse Fly",
    reason: "Lower cable"
  }],
  "Reverse Flyes": [{
    name: "Face Pulls",
    reason: "Cable version"
  }, {
    name: "Cable Reverse Fly",
    reason: "Constant tension"
  }],
  "Leg Extension": [{
    name: "Bulgarian Split Squat",
    reason: "Unilateral, fara compresie"
  }, {
    name: "Sissy Squat",
    reason: "Bodyweight"
  }, {
    name: "Leg Press (picioare jos)",
    reason: "Accent cvadriceps"
  }],
  "Squats": [{
    name: "Front Squats",
    reason: "More quad focus"
  }, {
    name: "Goblet Squats",
    reason: "With DB if no rack"
  }, {
    name: "Bulgarian Split Squats",
    reason: "Unilateral"
  }, {
    name: "Leg Press Heavy",
    reason: "Less stress"
  }],
  "Leg Press": [{
    name: "Hack Squat",
    reason: "Different angle"
  }, {
    name: "Squats",
    reason: "Free weight"
  }, {
    name: "Bulgarian Split Squats",
    reason: "Unilateral"
  }],
  "Walking Lunges": [{
    name: "Reverse Lunges",
    reason: "Less knee stress"
  }, {
    name: "Bulgarian Split Squats",
    reason: "Stationary version"
  }, {
    name: "Step-ups",
    reason: "Different angle"
  }],
  "Leg Curls": [{
    name: "Seated Leg Curl",
    reason: "Alt unghi"
  }, {
    name: "Glute-Ham Raise",
    reason: "Bodyweight"
  }, {
    name: "Nordic Curl",
    reason: "Excentric"
  }],
  "Calf Raises": [{
    name: "Seated Calf Raises",
    reason: "Soleus focus"
  }, {
    name: "Single-leg Calf Raises",
    reason: "Unilateral"
  }, {
    name: "Donkey Calf Raises",
    reason: "Stretch focus"
  }],
  "Barbell Curls": [{
    name: "DB Curls",
    reason: "Each arm independent"
  }, {
    name: "Cable Curls",
    reason: "Constant tension"
  }, {
    name: "EZ Bar Curls",
    reason: "Less wrist stress"
  }],
  "Hammer Curls": [{
    name: "Cable Hammer Curls",
    reason: "With rope"
  }, {
    name: "Cross-body Curls",
    reason: "Different angle"
  }],
  "Incline Curls": [{
    name: "DB Curls",
    reason: "Standard"
  }, {
    name: "Cable Curls",
    reason: "Constant tension"
  }],
  "Concentration Curls": [{
    name: "Spider Curls",
    reason: "On bench"
  }, {
    name: "Cable Curls",
    reason: "Standing version"
  }]
};

// ─── BOSS FIGHTS LIBRARY (Solo Leveling themed) ───
const BOSS_LIBRARY = [{
  id: "bench_demon",
  name: "The Bench Plateau Demon",
  emoji: "👹",
  theme: "Shadow Monarch's Trial",
  description: "Defeat the demon guarding the 92.5kg gate.",
  target: {
    type: "lift",
    exercise: "Bench Press",
    kg: 92.5,
    reps: 5
  },
  durationDays: 14,
  reward: {
    xp: 200,
    badge: "Demon Slayer"
  },
  lore: "For weeks the demon has whispered 'You cannot pass 90kg'. Today, prove it wrong."
}, {
  id: "squat_titan",
  name: "The Iron Titan",
  emoji: "🗿",
  theme: "Demon King's Challenge",
  description: "Conquer the 75kg squat fortress.",
  target: {
    type: "lift",
    exercise: "Squats",
    kg: 75,
    reps: 6
  },
  durationDays: 21,
  reward: {
    xp: 250,
    badge: "Titan Crusher"
  },
  lore: "The Iron Titan stands at 75kg. Push past or be crushed."
}, {
  id: "streak_wraith",
  name: "The Streak Wraith",
  emoji: "💀",
  theme: "Endurance of the Hunter",
  description: "Maintain 14 consecutive days of activity.",
  target: {
    type: "streak",
    days: 14
  },
  durationDays: 14,
  reward: {
    xp: 300,
    badge: "Wraith Hunter"
  },
  lore: "Skip a day and the wraith feeds. Stay consistent and banish it."
}, {
  id: "core_champion",
  name: "Core Champion's Trial",
  emoji: "🛡️",
  theme: "Test of the Core Spirit",
  description: "Reach 50 Core XP through bonus quests.",
  target: {
    type: "muscleXp",
    muscle: "core",
    amount: 50
  },
  durationDays: 21,
  reward: {
    xp: 200,
    badge: "Core Champion"
  },
  bossQuests: [{
    id: "bq_plank",
    label: "Weighted Plank (3x60s)",
    stat: "VIT",
    muscle: "core",
    xp: 15,
    icon: "🪨"
  }, {
    id: "bq_hangleg",
    label: "Hanging Leg Raises (3x12)",
    stat: "VIT",
    muscle: "core",
    xp: 15,
    icon: "🔥"
  }, {
    id: "bq_carry",
    label: "Hollow Body Hold (3x30s)",
    stat: "VIT",
    muscle: "core",
    xp: 15,
    icon: "🌙"
  }],
  lore: "The weakest pillar must become the strongest. Forge your core."
}, {
  id: "agi_shadow",
  name: "The Stiff Shadow",
  emoji: "🌀",
  theme: "Awakening of Agility",
  description: "Ridica AGI prin mobility zilnic + yoga.",
  target: {
    type: "muscleXp",
    muscle: "cardio",
    amount: 0,
    statTarget: "AGI",
    statAmount: 25
  },
  durationDays: 21,
  reward: {
    xp: 220,
    badge: "Shadow Bender"
  },
  bossQuests: [{
    id: "bq_mobility",
    label: "Mobility Work (10 min)",
    stat: "AGI",
    xp: 15,
    icon: "🤸"
  }, {
    id: "bq_yoga",
    label: "Stretching 15 min (acasa)",
    stat: "AGI",
    xp: 15,
    icon: "🧘"
  }, {
    id: "bq_hipopener",
    label: "Hip Openers + Thoracic (5 min)",
    stat: "AGI",
    xp: 10,
    icon: "🦵"
  }],
  lore: "Rigid as stone, slow as the grave. Stretch and the shadow yields."
}, {
  id: "hams_hydra",
  name: "Hamstring Hydra",
  emoji: "🐉",
  theme: "Posterior Chain Awakening",
  description: "Boost hamstring XP to 75+ with focused work.",
  target: {
    type: "muscleXp",
    muscle: "hamstrings",
    amount: 75
  },
  durationDays: 28,
  reward: {
    xp: 250,
    badge: "Hydra Slayer"
  },
  bossQuests: [{
    id: "bq_rdl",
    label: "Extra Leg Curls (2x15)",
    stat: "STR",
    muscle: "hamstrings",
    xp: 15,
    icon: "🦿"
  }, {
    id: "bq_legcurl",
    label: "Leg Curls Burnout (2x20)",
    stat: "STR",
    muscle: "hamstrings",
    xp: 15,
    icon: "🦵"
  }],
  lore: "Three heads of weakness: Hams, Glutes, Lower Back. Cut them all."
}, {
  id: "calf_kraken",
  name: "The Calf Kraken",
  emoji: "🐙",
  theme: "From the Depths",
  description: "Reach 50 Calves XP through high-rep work.",
  target: {
    type: "muscleXp",
    muscle: "calves",
    amount: 50
  },
  durationDays: 21,
  reward: {
    xp: 180,
    badge: "Kraken Hunter"
  },
  bossQuests: [{
    id: "bq_calf_blitz",
    label: "Calf Raises (100+ reps)",
    stat: "STR",
    muscle: "calves",
    xp: 15,
    icon: "🦶"
  }, {
    id: "bq_calf_single",
    label: "Single-Leg Calf Raises (3x15/leg)",
    stat: "STR",
    muscle: "calves",
    xp: 12,
    icon: "🦶"
  }],
  lore: "Tentacles of fatigue. Every rep severs one."
}, {
  id: "bench_breaker",
  name: "The Plateau Demon",
  emoji: "⛓️",
  theme: "Breaking the Iron Gate",
  description: "Sparge plateau-ul: DB Incline progresie + accesorii piept.",
  target: {
    type: "lift",
    exercise: "DB Incline Bench Press",
    kg: 36,
    reps: 8
  },
  durationDays: 28,
  reward: {
    xp: 260,
    badge: "Gate Breaker"
  },
  bossQuests: [{
    id: "bq_db_incline",
    label: "DB Incline focus (progresie reps)",
    stat: "STR",
    muscle: "chest",
    xp: 15,
    icon: "🏋️"
  }, {
    id: "bq_cable_fly",
    label: "Cable Flyes burnout (2x15)",
    stat: "STR",
    muscle: "chest",
    xp: 12,
    icon: "🎯"
  }],
  lore: "92.5kg has held you for weeks. Build the angles, break the gate."
}, {
  id: "deload_phoenix",
  name: "The Deload Phoenix",
  emoji: "🔥",
  theme: "Rebirth Through Recovery",
  description: "Complete 7 days at 70% intensity (deload week).",
  target: {
    type: "deload",
    days: 7
  },
  durationDays: 7,
  reward: {
    xp: 150,
    badge: "Phoenix Risen"
  },
  lore: "Sometimes the strongest move is to step back. Rise renewed."
}, {
  id: "core_leviathan",
  name: "The Abyssal Leviathan",
  emoji: "🐙",
  theme: "Depths of the Core",
  description: "Zdrobeste flancurile si abdomenul inferior — zona ta cea mai slaba.",
  target: {
    type: "muscleXp",
    muscle: "core",
    amount: 80
  },
  durationDays: 28,
  reward: {
    xp: 280,
    badge: "Leviathan Slayer"
  },
  bossQuests: [{
    id: "bq_hanging_raise",
    label: "Hanging Leg Raises (3x12)",
    stat: "VIT",
    muscle: "core",
    xp: 15,
    icon: "🔥"
  }, {
    id: "bq_cable_crunch",
    label: "Cable Crunches (3x15)",
    stat: "VIT",
    muscle: "core",
    xp: 15,
    icon: "⚓"
  }, {
    id: "bq_side_plank",
    label: "Side Plank (2x45s / parte)",
    stat: "VIT",
    muscle: "core",
    xp: 12,
    icon: "🌊"
  }],
  lore: "Din adancuri se ridica leviatanul. Doar un core de otel il poate infrunta."
}, {
  id: "agi_serpent",
  name: "The Coiled Serpent",
  emoji: "🐍",
  theme: "Path of the Serpent",
  description: "Creste AGI la 30 prin yoga + mobilitate zilnica.",
  target: {
    type: "muscleXp",
    muscle: "cardio",
    amount: 0,
    statTarget: "AGI",
    statAmount: 30
  },
  durationDays: 30,
  reward: {
    xp: 240,
    badge: "Serpent's Grace"
  },
  bossQuests: [{
    id: "bq_yoga_flow",
    label: "Mobility Flow (15 min)",
    stat: "AGI",
    xp: 15,
    icon: "🧘"
  }, {
    id: "bq_deep_squat",
    label: "Deep Squat Hold (3x60s)",
    stat: "AGI",
    xp: 12,
    icon: "🐍"
  }, {
    id: "bq_thoracic",
    label: "Thoracic + Hip Openers (8 min)",
    stat: "AGI",
    xp: 10,
    icon: "🌀"
  }],
  lore: "Rigid nu supravietuieste. Sarpele se indoaie, deci nu se rupe niciodata."
}, {
  id: "calf_golem",
  name: "The Stone Golem",
  emoji: "🗿",
  theme: "Forging the Foundation",
  description: "Ridica gambele (calves) — piloni neglijati — la 75 XP.",
  target: {
    type: "muscleXp",
    muscle: "calves",
    amount: 75
  },
  durationDays: 28,
  reward: {
    xp: 220,
    badge: "Golem Breaker"
  },
  bossQuests: [{
    id: "bq_standing_calf",
    label: "Standing Calf Raises (4x15 slow)",
    stat: "STR",
    muscle: "calves",
    xp: 12,
    icon: "🗿"
  }, {
    id: "bq_seated_calf",
    label: "Seated Calf Raises (3x20)",
    stat: "STR",
    muscle: "calves",
    xp: 12,
    icon: "⛰️"
  }],
  lore: "O statuie e la fel de puternica precum baza ei. Toarna piatra in gambe."
}, {
  id: "hams_reaper",
  name: "The Silent Reaper",
  emoji: "🌾",
  theme: "Harvest of the Chain",
  description: "Intareste lantul posterior: Leg Curls progresie constanta.",
  target: {
    type: "lift",
    exercise: "Leg Curls",
    kg: 55,
    reps: 15
  },
  durationDays: 28,
  reward: {
    xp: 260,
    badge: "Reaper's Chain"
  },
  bossQuests: [{
    id: "bq_rdl_focus",
    label: "Leg Curls — tempo lent, control excentric",
    stat: "STR",
    muscle: "hamstrings",
    xp: 15,
    icon: "🌾"
  }, {
    id: "bq_leg_curl",
    label: "Leg Curls burnout (2x15)",
    stat: "STR",
    muscle: "hamstrings",
    xp: 12,
    icon: "🔗"
  }],
  lore: "Lantul posterior e cositorul tacut al fortei reale. Nu-l ignora."
}, {
  id: "chest_colossus",
  name: "The Bronze Colossus",
  emoji: "🗿",
  theme: "Forge of the Chest",
  description: "Construieste pieptul: acumuleaza XP pe chest din orice zi de Push.",
  target: {
    type: "muscleXp",
    muscle: "chest",
    amount: 60
  },
  durationDays: 21,
  reward: {
    xp: 240,
    badge: "Bronze Colossus"
  },
  bossQuests: [{
    id: "bq_db_press_focus",
    label: "DB Bench — pauza 1s pe piept",
    stat: "STR",
    muscle: "chest",
    xp: 15,
    icon: "🗿"
  }, {
    id: "bq_flye_stretch",
    label: "Cable Flyes — intindere maxima",
    stat: "STR",
    muscle: "chest",
    xp: 12,
    icon: "🦅"
  }],
  lore: "Bronzul nu se toarna intr-o zi. Fiecare repetare adauga un strat."
}, {
  id: "back_hydra",
  name: "The Iron Hydra",
  emoji: "🐉",
  theme: "Wrath of the Back",
  description: "Largeste spatele: acumuleaza XP pe back din zilele de Pull.",
  target: {
    type: "muscleXp",
    muscle: "back",
    amount: 60
  },
  durationDays: 21,
  reward: {
    xp: 240,
    badge: "Hydra Slayer"
  },
  bossQuests: [{
    id: "bq_row_squeeze",
    label: "Rows — strange omoplatii 1s",
    stat: "STR",
    muscle: "back",
    xp: 15,
    icon: "🐉"
  }, {
    id: "bq_pullup_focus",
    label: "Pull-ups — control total, coborare 3s",
    stat: "STR",
    muscle: "back",
    xp: 15,
    icon: "🔱"
  }],
  lore: "Taie un cap si cresc doua. Doar volumul constant o ingenuncheaza."
}, {
  id: "quad_titan",
  name: "The Granite Titan",
  emoji: "🦏",
  theme: "Pillars of Stone",
  description: "Picioare de granit: acumuleaza XP pe quads din zilele de Legs.",
  target: {
    type: "muscleXp",
    muscle: "quads",
    amount: 55
  },
  durationDays: 21,
  reward: {
    xp: 250,
    badge: "Granite Legs"
  },
  bossQuests: [{
    id: "bq_squat_depth",
    label: "Squat / Leg Press — adancime completa",
    stat: "STR",
    muscle: "quads",
    xp: 15,
    icon: "🦏"
  }, {
    id: "bq_leg_ext",
    label: "Leg Extensions — burnout 2x20",
    stat: "STR",
    muscle: "quads",
    xp: 12,
    icon: "🪨"
  }],
  lore: "Un colos fara picioare e doar o statuie ce asteapta sa cada."
}, {
  id: "consistency_phantom",
  name: "The Fading Phantom",
  emoji: "👻",
  theme: "Discipline of the Hunter",
  description: "Nu rata nicio zi: mentine un streak lung ca sa alungi fantoma.",
  target: {
    type: "streak",
    days: 14
  },
  durationDays: 21,
  reward: {
    xp: 220,
    badge: "Unbroken"
  },
  bossQuests: [{
    id: "bq_daily_check",
    label: "Completeaza quest-urile zilnice",
    stat: "VIT",
    xp: 10,
    icon: "✅"
  }, {
    id: "bq_no_skip",
    label: "Zero zile sarite",
    stat: "VIT",
    xp: 10,
    icon: "🔥"
  }],
  lore: "Fantoma se hraneste din zilele pierdute. Consistenta o face sa dispara."
}, {
  id: "delt_valkyrie",
  name: "The Steel Valkyrie",
  emoji: "⚡",
  theme: "Wings of Steel",
  description: "Umeri 3D: acumuleaza XP pe shoulders din zilele de Push.",
  target: {
    type: "muscleXp",
    muscle: "shoulders",
    amount: 55
  },
  durationDays: 21,
  reward: {
    xp: 235,
    badge: "Steel Wings"
  },
  bossQuests: [{
    id: "bq_arnold_focus",
    label: "Arnold Press — rotatie completa",
    stat: "STR",
    muscle: "shoulders",
    xp: 15,
    icon: "⚡"
  }, {
    id: "bq_lat_raise",
    label: "Lateral Raises — 3x15 controlat",
    stat: "STR",
    muscle: "shoulders",
    xp: 12,
    icon: "🪽"
  }],
  lore: "Aripile de otel se forjeaza lateral, o ridicare pura pe rand."
}, {
  id: "agi_djinn",
  name: "The Bound Djinn",
  emoji: "🌀",
  theme: "Chains of Stiffness",
  description: "Elibereaza mobilitatea: creste AGI prin Turkish Get-Up, Windmill si kettlebell.",
  target: {
    type: "muscleXp",
    muscle: "cardio",
    amount: 0,
    statTarget: "AGI",
    statAmount: 20
  },
  durationDays: 28,
  reward: {
    xp: 230,
    badge: "Chain Breaker"
  },
  bossQuests: [{
    id: "bq_tgu",
    label: "Turkish Get-Up (3x5/parte)",
    stat: "AGI",
    xp: 15,
    icon: "🌀"
  }, {
    id: "bq_windmill",
    label: "Windmill (3x5/parte)",
    stat: "AGI",
    xp: 15,
    icon: "🌬️"
  }, {
    id: "bq_kb_sat",
    label: "Kettlebell sambata (stil Pavel)",
    stat: "AGI",
    xp: 12,
    icon: "🔔"
  }],
  lore: "Djinnul e prizonier in propriile lanturi de rigiditate. Fiecare miscare controlata slabeste o veriga."
}];

// ─── MOBILITY DATA (with images & YouTube links) ───
// ─── WARM-UP & COOL-DOWN (hand-drawn SVG figures + text, per day type) ───
// Simple stick-figure SVGs drawn inline. Each returns a React SVG element.
function StretchFig(pose, color) {
  const c = color || "#93c5fd";
  const S = (children) => /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 60 60",
    width: 54,
    height: 54,
    style: { flexShrink: 0 }
  }, children);
  const ln = (x1, y1, x2, y2, w) => /*#__PURE__*/React.createElement("line", {
    x1, y1, x2, y2,
    stroke: c,
    strokeWidth: w || 2.4,
    strokeLinecap: "round"
  });
  const head = (cx, cy) => /*#__PURE__*/React.createElement("circle", {
    cx, cy, r: 5,
    fill: "none",
    stroke: c,
    strokeWidth: 2.4
  });
  switch (pose) {
    case "armcircle":
      // arms out doing circles
      return S([head(30, 12), ln(30, 17, 30, 38), ln(30, 22, 12, 16), ln(30, 22, 48, 16), ln(30, 38, 23, 52), ln(30, 38, 37, 52),
        /*#__PURE__*/React.createElement("path", { key: "a", d: "M10 10 A6 6 0 0 1 16 6", fill: "none", stroke: c, strokeWidth: 1.5 })]);
    case "legswing":
      return S([head(30, 12), ln(30, 17, 30, 40), ln(30, 24, 18, 30), ln(30, 24, 42, 30), ln(30, 40, 24, 54), ln(30, 40, 44, 44),
        /*#__PURE__*/React.createElement("path", { key: "s", d: "M44 44 q6 4 4 10", fill: "none", stroke: c, strokeWidth: 1.3, strokeDasharray: "2 2" })]);
    case "bandpull":
      // arms pulling apart
      return S([head(30, 12), ln(30, 17, 30, 40), ln(30, 23, 14, 23), ln(30, 23, 46, 23), ln(14, 23, 10, 20), ln(46, 23, 50, 20), ln(30, 40, 24, 54), ln(30, 40, 36, 54)]);
    case "cat":
      // cat-cow on all fours
      return S([/*#__PURE__*/React.createElement("path", { key: "b", d: "M12 40 Q30 26 48 40", fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" }), head(50, 40), ln(14, 40, 14, 54), ln(24, 38, 24, 54), ln(38, 38, 38, 54), ln(46, 40, 46, 54)]);
    case "hip":
      // deep squat / hip opener
      return S([head(30, 12), ln(30, 17, 30, 30), ln(30, 22, 20, 28), ln(30, 22, 40, 28), ln(30, 30, 18, 40), ln(18, 40, 22, 54), ln(30, 30, 42, 40), ln(42, 40, 38, 54)]);
    case "chest":
      // chest/doorway stretch, arm on wall
      return S([head(26, 12), ln(26, 17, 26, 40), ln(26, 22, 44, 16), ln(44, 16, 48, 22), ln(26, 40, 20, 54), ln(26, 40, 32, 54), ln(48, 10, 48, 50, 2)]);
    case "cross":
      // cross-body shoulder stretch
      return S([head(30, 12), ln(30, 17, 30, 40), ln(30, 23, 46, 30), ln(30, 23, 40, 20), ln(46, 30, 40, 20), ln(30, 40, 24, 54), ln(30, 40, 36, 54)]);
    case "hamstring":
      // forward fold hamstring
      return S([/*#__PURE__*/React.createElement("path", { key: "h", d: "M22 12 Q26 28 22 40", fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" }), head(24, 10), ln(22, 40, 22, 54), ln(22, 28, 30, 48), ln(22, 28, 14, 48)]);
    case "quad":
      // standing quad stretch
      return S([head(28, 12), ln(28, 17, 28, 40), ln(28, 24, 40, 20), ln(28, 40, 22, 54), ln(28, 40, 40, 46), ln(40, 46, 40, 32), ln(40, 32, 28, 30)]);
    case "calf":
      // calf stretch against wall
      return S([head(20, 12), ln(20, 17, 26, 36), ln(20, 24, 30, 22), ln(26, 36, 18, 52), ln(26, 36, 40, 50), ln(48, 8, 48, 52, 2), ln(30, 22, 46, 18)]);
    case "child":
      // child's pose
      return S([/*#__PURE__*/React.createElement("path", { key: "cp", d: "M10 46 Q26 44 34 40 L46 30", fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" }), head(48, 28), ln(10, 46, 10, 40), ln(20, 46, 34, 44)]);
    case "twist":
      // seated spinal twist
      return S([head(30, 12), ln(30, 17, 30, 36), ln(30, 24, 40, 30), ln(30, 24, 22, 20), ln(30, 36, 18, 40), ln(30, 36, 44, 40), ln(18, 40, 26, 52), ln(44, 40, 40, 52)]);
    case "cobra":
      // cobra / back extension
      return S([/*#__PURE__*/React.createElement("path", { key: "co", d: "M10 50 Q28 50 40 34", fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" }), head(44, 28), ln(10, 50, 20, 50), ln(30, 46, 30, 50)]);
    default:
      return S([head(30, 12), ln(30, 17, 30, 38), ln(30, 22, 18, 30), ln(30, 22, 42, 30), ln(30, 38, 24, 54), ln(30, 38, 36, 54)]);
  }
}
const WARMUP_DATA = {
  PUSH: {
    warmup: [
      { pose: "armcircle", name: "Arm Circles", time: "30s x 2", text: "Brate intinse lateral, cercuri mari inainte apoi inapoi. Incalzeste umerii inainte de presari." },
      { pose: "bandpull", name: "Band Pull-Aparts", time: "2x15", text: "Banda elastica in fata, trage-o apart pana la piept, strange omoplatii. Activeaza umerii posteriori." },
      { pose: "chest", name: "Doorway Chest Opener", time: "30s x 2", text: "Antebratul pe tocul usii, pas inainte, deschide pieptul. Pregateste pectoralii." }
    ],
    cooldown: [
      { pose: "chest", name: "Chest Stretch", time: "30s / parte", text: "Bratul pe perete, roteste corpul in directia opusa. Intinde pectoralul." },
      { pose: "cross", name: "Cross-Body Shoulder", time: "30s / parte", text: "Trage bratul peste piept cu celalalt brat. Intinde deltoidul posterior." },
      { pose: "child", name: "Child's Pose", time: "45s", text: "Sezi pe calcaie, bratele intinse in fata, fruntea la sol. Relaxeaza umerii si spatele." }
    ]
  },
  PULL: {
    warmup: [
      { pose: "armcircle", name: "Arm Circles", time: "30s x 2", text: "Cercuri mari cu bratele. Incalzeste centura scapulara." },
      { pose: "bandpull", name: "Band Pull-Aparts", time: "2x15", text: "Activeaza spatele superior si deltoizii posteriori inainte de tras." },
      { pose: "cat", name: "Cat-Cow", time: "8 reps", text: "In patru labe, alterneaza arcuire si rotunjire a coloanei. Mobilizeaza spatele." }
    ],
    cooldown: [
      { pose: "cross", name: "Cross-Body Shoulder", time: "30s / parte", text: "Intinde deltoidul posterior si trapezul." },
      { pose: "child", name: "Child's Pose (extended)", time: "45s", text: "Bratele intinse mult in fata, simte intinderea in lats (dorsali)." },
      { pose: "twist", name: "Seated Twist", time: "30s / parte", text: "Sezand, roteste trunchiul, cotul opus pe genunchi. Decompreseaza coloana." }
    ]
  },
  LEGS: {
    warmup: [
      { pose: "legswing", name: "Leg Swings", time: "12 / picior", text: "Sprijin cu o mana, balanseaza piciorul inainte-inapoi apoi lateral. Incalzeste soldurile." },
      { pose: "hip", name: "Deep Squat Hold", time: "3x30s", text: "Coboara in genoflexiune completa, coatele impinge genunchii afara. Deschide soldurile." },
      { pose: "cat", name: "Cat-Cow", time: "8 reps", text: "Mobilizeaza coloana si bazinul inainte de squat/RDL." }
    ],
    cooldown: [
      { pose: "hamstring", name: "Standing Forward Fold", time: "45s", text: "Picioarele drepte, apleaca-te si atinge varfurile. Intinde ischiogambierii." },
      { pose: "quad", name: "Standing Quad Stretch", time: "30s / parte", text: "Prinde glezna la fund, genunchii lipiti. Intinde cvadricepsul." },
      { pose: "calf", name: "Calf Stretch (wall)", time: "30s / parte", text: "Mainile pe perete, un picior in spate drept, calcaiul jos. Intinde gamba." }
    ]
  },
  CORE: {
    warmup: [
      { pose: "cat", name: "Cat-Cow", time: "8 reps", text: "Mobilizeaza coloana inainte de core." },
      { pose: "twist", name: "Torso Rotations", time: "10 / parte", text: "Roteste trunchiul controlat. Activeaza obliquii." }
    ],
    cooldown: [
      { pose: "cobra", name: "Cobra Stretch", time: "30s", text: "Culcat pe burta, impinge in maini, deschide abdomenul. Contra-intinde dupa crunches." },
      { pose: "child", name: "Child's Pose", time: "45s", text: "Relaxeaza spatele lombar." }
    ]
  }
};
// Map a day type to a warmup key
function warmupKeyFor(type) {
  if (!type) return null;
  if (type.indexOf("PUSH") >= 0) return "PUSH";
  if (type.indexOf("PULL") >= 0) return "PULL";
  if (type.indexOf("LEG") >= 0) return "LEGS";
  if (type.indexOf("CORE") >= 0 || type.indexOf("HIIT") >= 0 || type.indexOf("CARDIO") >= 0) return "CORE";
  return null;
}
const MOBILITY_DATA = {
  morning: {
    title: "Morning Activation",
    duration: "5 min",
    icon: "☀️",
    description: "Wake up your joints and prepare your body for the day.",
    exercises: [{
      name: "Hip Circles",
      duration: "30 sec each side",
      emoji: "🦵",
      description: "Stand tall, hands on hips. Make large circles with your hips, 15 forward then 15 backward. Switch direction. Wakes up the hip joint completely.",
      img: "https://www.acefitness.org/images/exerciseLibraryDetail/3_hip_circle_360_360.jpg"
    }, {
      name: "Cat-Cow Flow",
      duration: "1 min (10 reps)",
      emoji: "🐱",
      description: "On hands and knees. Inhale: arch back, look up (cow). Exhale: round spine, tuck chin (cat). Slow and controlled.",
      img: "https://www.yogajournal.com/wp-content/uploads/2007/08/cat-cow.jpg"
    }, {
      name: "Arm Circles",
      duration: "30 sec",
      emoji: "💪",
      description: "Stand with arms extended. Make large circles forward 15 reps, then backward 15 reps. Activates shoulders.",
      img: "https://www.acefitness.org/images/exerciseLibraryDetail/126_arm_circle_360_360.jpg"
    }, {
      name: "Leg Swings",
      duration: "1 min (30 sec each leg)",
      emoji: "🤸",
      description: "Hold a wall for support. Swing one leg forward and backward 15 times. Switch legs. Loosens hips and hamstrings.",
      img: "https://www.verywellfit.com/thmb/Hyl-EwkLWqYsR65zEsAqfXqYRww=/1500x0/leg-swings.jpg"
    }, {
      name: "Torso Twists",
      duration: "1 min",
      emoji: "🔄",
      description: "Feet shoulder-width apart, hands at chest. Rotate torso left and right slowly. 20 total rotations. Spine mobility.",
      img: "https://www.acefitness.org/images/exerciseLibraryDetail/180_torso_twist.jpg"
    }, {
      name: "Neck Rolls",
      duration: "30 sec",
      emoji: "🦒",
      description: "Slow circles with the head, 5 clockwise then 5 counter-clockwise. Never force, just let gravity guide.",
      img: "https://www.healthline.com/neck-rolls.jpg"
    }]
  },
  evening: {
    title: "Evening Recovery",
    duration: "5 min",
    icon: "🌙",
    description: "Static stretches to recover and prepare for sleep.",
    exercises: [{
      name: "Hamstring Stretch",
      duration: "1 min (30 sec each leg)",
      emoji: "🦵",
      description: "Sit on floor, one leg extended, other bent. Reach toward extended foot. Hold. ⭐ PRIORITY for you (Hamstrings 40 XP weak).",
      img: "https://www.verywellfit.com/thmb/hamstring-stretch.jpg"
    }, {
      name: "Pigeon Pose",
      duration: "1 min (30 sec each leg)",
      emoji: "🍑",
      description: "From plank, bring one knee forward, extend other leg behind. Lower hips, lean forward over front leg. Deep glute stretch.",
      img: "https://www.yogajournal.com/wp-content/pigeon-pose.jpg"
    }, {
      name: "Quad Stretch",
      duration: "1 min (30 sec each leg)",
      emoji: "💺",
      description: "Stand tall, grab one ankle and pull heel toward butt. Keep knees together. Switch legs.",
      img: "https://www.verywellfit.com/quad-stretch.jpg"
    }, {
      name: "Shoulder Stretch",
      duration: "1 min",
      emoji: "🌍",
      description: "Bring one arm across chest, use other arm to pull it closer. Hold 30 sec each side. ⭐ Important after Push days.",
      img: "https://www.acefitness.org/shoulder-stretch.jpg"
    }, {
      name: "Child's Pose",
      duration: "1 min",
      emoji: "🐱",
      description: "Kneel on floor, sit back on heels, arms forward, forehead to floor. Total relaxation for lower back.",
      img: "https://www.yogajournal.com/childs-pose.jpg"
    }]
  },
  youtube: [{
    name: "Yoga With Adriene - Daily Mobility",
    url: "https://www.youtube.com/results?search_query=yoga+with+adriene+10+minute+mobility",
    description: "Gentle, accessible routines for every day. 10-15 min average."
  }, {
    name: "Tom Merrick - Athlete Mobility",
    url: "https://www.youtube.com/results?search_query=tom+merrick+daily+stretching",
    description: "For athletes. Technical and effective. Great after lifting."
  }, {
    name: "Athlean-X - Mobility Daily",
    url: "https://www.youtube.com/results?search_query=athlean+x+daily+mobility",
    description: "No BS approach. Practical and quick."
  }, {
    name: "GMB - Joint Mobility",
    url: "https://www.youtube.com/results?search_query=GMB+fitness+joint+mobility",
    description: "Focus on joint health and pain-free movement."
  }]
};

// ─── SOUND FX (Web Audio API beeps + Speech Synthesis) ───
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === "setLogged") {
      // Subtle ding
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 800;
      o.type = "sine";
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      o.start();
      o.stop(ctx.currentTime + 0.2);
    } else if (type === "ready") {
      // ARISE! - Use Speech Synthesis with low pitch for anime effect
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance("Arise!");
        u.rate = 0.85;
        u.pitch = 0.6;
        u.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const jpVoice = voices.find(v => v.lang.startsWith("ja"));
        if (jpVoice) u.voice = jpVoice;
        window.speechSynthesis.speak(u);
      }
      // Also play epic chord
      [330, 415, 494].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = freq;
        o.type = "sawtooth";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
        g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6 + i * 0.05);
        o.start(ctx.currentTime + i * 0.05);
        o.stop(ctx.currentTime + 0.6 + i * 0.05);
      });
    } else if (type === "overdue") {
      // Warning beep
      [600, 400].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = freq;
        o.type = "square";
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1 + i * 0.15);
        o.start(ctx.currentTime + i * 0.15);
        o.stop(ctx.currentTime + 0.15 + i * 0.15);
      });
    } else if (type === "levelUp") {
      // Epic fanfare
      [261, 329, 392, 523].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = freq;
        o.type = "triangle";
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05 + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4 + i * 0.1);
        o.start(ctx.currentTime + i * 0.1);
        o.stop(ctx.currentTime + 0.4 + i * 0.1);
      });
    } else if (type === "bossDamage") {
      // Sword slash
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.setValueAtTime(800, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      o.type = "sawtooth";
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      o.start();
      o.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Audio failed:", e);
  }
}
function getMuscleRank(xp) {
  for (let i = MUSCLE_RANKS.length - 1; i >= 0; i--) if (xp >= MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return MUSCLE_RANKS[0];
}
function getNextMuscleRank(xp) {
  for (let i = 0; i < MUSCLE_RANKS.length; i++) if (xp < MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return null;
}
const LP = [{
  week: 1,
  title: "Week 1 — Foundations",
  color: "#6b7280",
  lessons: [{
    day: 1,
    title: "What is AI?",
    desc: "The big picture of artificial intelligence.",
    full: "Artificial Intelligence is the broad field of making machines that can perform tasks that typically require human intelligence. Within AI, Machine Learning (ML) is the approach where systems learn from data instead of being explicitly programmed. Deep Learning is a subset of ML using neural networks with many layers. Large Language Models (LLMs) like Claude are a specific type of deep learning model trained on vast amounts of text data.\n\nKey concepts to understand:\n• AI > Machine Learning > Deep Learning > LLMs\n• LLMs predict the next most likely token (word/piece of word)\n• They're trained on internet text, books, code, and more\n• They don't 'think' like humans — they're pattern recognition at massive scale\n\nToday's task: Ask Claude to explain what it is and how it works. Compare its answer with what you learned here."
  }, {
    day: 2,
    title: "How Claude Works",
    desc: "Transformers, tokens, and text generation.",
    full: "Claude is built on the Transformer architecture, invented in 2017. Here's how it processes your messages:\n\n1. TOKENIZATION: Your text is broken into tokens (roughly 3/4 of a word each). 'Hello world' might become ['Hello', ' world'].\n\n2. CONTEXT WINDOW: Claude can 'see' up to 200K tokens at once — that's roughly 150K words or a full novel. Everything in your conversation sits in this window.\n\n3. ATTENTION: The transformer looks at relationships between ALL tokens simultaneously. This is what makes it powerful — it understands context.\n\n4. GENERATION: Claude produces one token at a time, choosing the most appropriate next token based on everything it's seen. This is why it 'streams' text.\n\n5. RLHF: Claude was fine-tuned using Reinforcement Learning from Human Feedback to be helpful, harmless, and honest.\n\nToday's task: Ask Claude 'How many tokens is this message?' and experiment with how it handles different input sizes."
  }, {
    day: 3,
    title: "Your First Prompts",
    desc: "Basic prompting patterns and practice.",
    full: "Prompting is how you communicate with Claude. Better prompts = better results. Here are 10 prompt types to practice today:\n\n1. QUESTION: 'What causes inflation?'\n2. INSTRUCTION: 'Summarize this article in 3 bullet points'\n3. BRAINSTORM: 'Give me 10 business ideas for someone who loves fitness'\n4. ANALYSIS: 'What are the pros and cons of remote work?'\n5. CREATION: 'Write a professional email declining a meeting'\n6. EXPLANATION: 'Explain quantum computing like I'm 12'\n7. TRANSLATION: 'Translate this to Spanish and explain the grammar'\n8. ROLEPLAY: 'Act as a personal trainer and create a meal plan'\n9. DEBUGGING: 'Why isn't this code working? [paste code]'\n10. COMPARISON: 'Compare React vs Vue for a beginner'\n\nNotice how each prompt type gives Claude a clear task. The more specific you are, the better Claude performs.\n\nToday's task: Try all 10 prompt types. Note which ones give you the best results and why."
  }, {
    day: 4,
    title: "Prompt Structure",
    desc: "Role, task, context, format framework.",
    full: "The RTCF framework will transform your prompts:\n\nR — ROLE: Tell Claude who to be\n'You are an experienced fitness coach specializing in strength training'\n\nT — TASK: What exactly should Claude do?\n'Create a 4-week progressive overload plan'\n\nC — CONTEXT: Give background information\n'I'm 30 years old, intermediate lifter, training 5 days/week PPL split, goal is hypertrophy'\n\nF — FORMAT: How should the output look?\n'Present as a table with Week, Exercise, Sets, Reps, Weight columns'\n\nFull example:\n'You are an experienced fitness coach. Create a 4-week progressive overload plan for bench press. I currently bench 80kg for 4×8. I want to reach 90kg. Present as a weekly table with sets, reps, and target weight.'\n\nSee how much better that is than just 'help me get stronger at bench press'?\n\nToday's task: Rewrite 5 of yesterday's prompts using RTCF. Compare the quality of responses."
  }, {
    day: 5,
    title: "Claude vs Other Models",
    desc: "Understand the AI landscape.",
    full: "The main players in 2025-2026:\n\nCLAUDE (Anthropic): Known for thoughtful, nuanced responses. Excellent at long documents, analysis, coding, and following complex instructions. Strong safety focus. Large context window (200K tokens).\n\nGPT-4/ChatGPT (OpenAI): The most well-known. Great general purpose, strong at coding, plugins ecosystem. ChatGPT Plus includes image generation.\n\nGEMINI (Google): Integrated with Google services. Strong at multimodal tasks (text + image + video). Good for research with Google Search integration.\n\nWhen to use Claude:\n• Long document analysis\n• Complex writing tasks\n• Coding with detailed explanations\n• Tasks requiring careful reasoning\n• When you need honesty about limitations\n\nToday's task: Ask the same complex question to Claude and another AI. Compare the depth, accuracy, and helpfulness of responses."
  }, {
    day: 6,
    title: "AI Ethics & Safety",
    desc: "Responsible use of AI tools.",
    full: "As an AI user, you need to understand:\n\nHALLUCINATIONS: AI can generate confident-sounding but false information. Always verify critical facts. Claude is trained to say 'I don't know' but it's not perfect.\n\nBIAS: AI models reflect biases in their training data. Be aware of this in hiring decisions, legal advice, medical information, etc.\n\nPRIVACY: Don't share sensitive personal data, passwords, or confidential business information in AI chats unless you understand the privacy policy.\n\nCOPYRIGHT: AI-generated content exists in a legal grey area. Don't claim AI writing as your own in academic settings.\n\nDEPENDENCY: Use AI as a tool to augment your abilities, not replace your thinking. The goal is AI + Human > either alone.\n\nANTHROPIC'S APPROACH: Anthropic (Claude's creator) focuses on AI safety research. Claude is designed to be helpful, harmless, and honest — it will refuse harmful requests.\n\nToday's task: Try to get Claude to do something it shouldn't (it will politely decline). Understand WHY these boundaries exist."
  }, {
    day: 7,
    title: "Week 1 Review",
    desc: "Practice challenges and review.",
    full: "Congratulations on completing Week 1! Let's solidify your knowledge:\n\nCHALLENGE 1: Explain to a friend (or Claude) the difference between AI, ML, Deep Learning, and LLMs in your own words.\n\nCHALLENGE 2: Write a prompt using RTCF that helps you with a real task you need done this week.\n\nCHALLENGE 3: Have Claude help you create a study plan for something you want to learn (other than AI).\n\nCHALLENGE 4: Ask Claude to analyze a document or article you've been meaning to read. Note how it handles summarization.\n\nCHALLENGE 5: Write a prompt that combines at least 3 of the 10 prompt types from Day 3.\n\nREFLECTION:\n• What surprised you most about AI this week?\n• Which prompt technique gave you the best results?\n• How will you use Claude in your daily life going forward?\n\nNext week: Prompt Engineering — you'll learn advanced techniques that will make you significantly more effective."
  }]
}, {
  week: 2,
  title: "Week 2 — Prompt Engineering",
  color: "#22d3ee",
  lessons: [{
    day: 1,
    title: "Zero-shot vs Few-shot",
    desc: "When to give examples vs not.",
    full: "ZERO-SHOT: Ask Claude to do something with NO examples.\n'Classify this email as spam or not spam: [email text]'\n\nFEW-SHOT: Provide examples first, then ask.\n'Here are some examples:\nEmail: You won $1M! → Spam\nEmail: Meeting at 3pm tomorrow → Not Spam\nEmail: Your order shipped → Not Spam\n\nNow classify: Congratulations! Claim your prize →'\n\nWhen to use each:\n• Zero-shot: Simple tasks, Claude usually gets them right\n• Few-shot: Complex classification, specific formatting, unusual patterns, when you want consistent style\n\nPro tip: 3-5 examples is usually enough. More doesn't always help. Make sure examples cover edge cases.\n\nToday: Try classifying your own emails/messages both ways. See where few-shot makes a difference."
  }, {
    day: 2,
    title: "Chain of Thought",
    desc: "Step-by-step reasoning.",
    full: "Chain of Thought (CoT) prompting asks Claude to think step-by-step. This dramatically improves accuracy on complex tasks.\n\nWITHOUT CoT:\n'What's 15% tip on a $87.50 bill split 3 ways?'\n→ Claude might jump to answer and make errors\n\nWITH CoT:\n'Calculate the 15% tip on $87.50 split 3 ways. Show your step-by-step reasoning.'\n→ Claude: Step 1: 15% of $87.50 = $13.13... Step 2: Total = $100.63... Step 3: Split by 3 = $33.54 each\n\nMagic phrases that trigger CoT:\n• 'Think step by step'\n• 'Show your reasoning'\n• 'Walk me through your thought process'\n• 'Let's solve this systematically'\n\nCoT works best for: math, logic puzzles, debugging, complex analysis, planning, comparing options.\n\nToday: Take a complex problem and solve it with and without CoT. Compare accuracy."
  }, {
    day: 3,
    title: "System Prompts",
    desc: "Control Claude's behavior.",
    full: "A system prompt sets Claude's 'personality' and rules for the entire conversation. Think of it as programming Claude's behavior.\n\nExample system prompt:\n'You are a concise technical writer. Always:\n- Use bullet points\n- Include code examples\n- Keep explanations under 100 words\n- Ask clarifying questions before giving advice\nNever:\n- Use jargon without defining it\n- Give opinions, only facts'\n\nOn claude.ai, you can set this in your User Preferences. In the API, it's the system parameter.\n\nPro tips:\n• Be specific about what you want AND don't want\n• Give Claude a persona relevant to your task\n• Include formatting rules\n• Set the tone (formal, casual, technical)\n• Define how Claude should handle uncertainty\n\nToday: Create 3 different system prompts — one for coding help, one for fitness coaching, one for writing. Test each."
  }, {
    day: 4,
    title: "Output Formatting",
    desc: "Control Claude's response structure.",
    full: "You can control exactly how Claude formats its responses:\n\nJSON:\n'Return the result as a JSON object with fields: name, category, score'\n\nMARKDOWN TABLE:\n'Present this as a markdown table with columns: Feature, Pros, Cons'\n\nXML:\n'Wrap your analysis in <analysis> tags and your recommendation in <recommendation> tags'\n\nNUMBERED STEPS:\n'Give me exactly 5 steps, numbered 1-5, each under 20 words'\n\nSPECIFIC LENGTH:\n'Respond in exactly 3 paragraphs of 50 words each'\n\nPro tip: Combine format instructions with examples for best results. Claude is excellent at matching patterns you show it.\n\nToday: Ask Claude the same question 5 different ways, each with a different output format. See how it adapts."
  }, {
    day: 5,
    title: "Prompt Chaining",
    desc: "Multi-step workflows.",
    full: "Prompt chaining breaks complex tasks into sequential steps, where each output feeds into the next prompt.\n\nExample — Blog Post Pipeline:\nPrompt 1: 'Generate 5 blog post ideas about AI in fitness'\nPrompt 2: 'Take idea #3 and create a detailed outline with 5 sections'\nPrompt 3: 'Write section 1 based on this outline: [outline]'\nPrompt 4: 'Now write section 2, maintaining the same tone as section 1: [section 1]'\nPrompt 5: 'Review the full post for consistency and suggest edits'\n\nWhy chain?\n• Each step gets Claude's full attention\n• You can course-correct between steps\n• Complex tasks become manageable\n• Quality improves dramatically\n\nChaining patterns:\n• Generate → Refine → Format\n• Research → Analyze → Recommend\n• Draft → Critique → Revise\n• Plan → Execute → Review\n\nToday: Chain 3+ prompts to complete a real task. A report, meal plan, or project plan."
  }, {
    day: 6,
    title: "Long Documents",
    desc: "Working with Claude's context window.",
    full: "Claude can handle ~200K tokens (roughly 500 pages). Here's how to use this effectively:\n\nSUMMARIZATION:\n'Summarize this document in 3 levels:\n1. One sentence\n2. One paragraph\n3. Key points with details'\n\nEXTRACTION:\n'Extract all dates, names, and action items from this document. Present as a table.'\n\nANALYSIS:\n'Read this contract and identify: risks, unusual clauses, and missing protections.'\n\nQ&A:\n'Based on this document only, answer: [specific question]. Quote the relevant section.'\n\nTips for long documents:\n• Put the document first, instructions after\n• Be specific about what you want extracted\n• Ask Claude to cite which section it's referencing\n• For very long docs, process in sections\n\nToday: Upload a long document (PDF, article, etc.) to Claude and practice all four techniques above."
  }, {
    day: 7,
    title: "Week 2 Project",
    desc: "Build your personal prompt library.",
    full: "Create a prompt library — 10 reusable templates you'll actually use:\n\nBuild templates for:\n1. Email drafting (professional tone)\n2. Meeting summary / action items\n3. Code review / debugging\n4. Content creation (blog/social)\n5. Research / comparison analysis\n6. Learning / explanation\n7. Decision making framework\n8. Workout / meal planning\n9. Language learning exercises\n10. Daily planning / productivity\n\nFor each template:\n• Write the system prompt\n• Include 1-2 examples\n• Define the output format\n• Test with a real use case\n• Save the best version\n\nStore these somewhere accessible (notes app, document) so you can copy-paste them into Claude whenever needed.\n\nThis library will save you hours every week. Invest the time now.\n\nNext week: We'll use these templates for real-world productivity!"
  }]
}, {
  week: 3,
  title: "Week 3 — Productivity",
  color: "#34d399",
  lessons: [{
    day: 1,
    title: "Writing with Claude",
    desc: "Master Claude as a writing partner.",
    full: "Claude excels at writing tasks. Here's your toolkit:\n\nDRAFTING: 'Write a [type] about [topic] in [tone] for [audience]. Length: [words].'\n\nREWRITING: 'Rewrite this to be more [concise/formal/engaging/simple]: [text]'\n\nTONE SHIFT: 'Convert this casual message into a professional email: [text]'\n\nEDITING: 'Proofread this for grammar, clarity, and flow. Explain each change.'\n\nSTYLE MATCHING: 'Write in the style of [describe style]. Here's a sample: [example]'\n\nPro workflow: Draft fast → Claude refines → You finalize. Never start from a blank page again.\n\nToday: Take something you need to write this week and use Claude as a collaborative writing partner."
  }, {
    day: 2,
    title: "Research & Analysis",
    desc: "Deep research with Claude.",
    full: "Turn Claude into your research assistant:\n\n1. TOPIC OVERVIEW: 'Give me a comprehensive overview of [topic]. Include key concepts, current debates, and recent developments.'\n\n2. SOURCE ANALYSIS: 'Analyze this article. What are the main claims? What evidence supports them? What's missing?'\n\n3. COMPARISON: 'Compare [A] vs [B] across these dimensions: cost, effectiveness, ease of use, scalability.'\n\n4. SYNTHESIS: 'I've read these 3 articles [summaries]. What are the common themes and contradictions?'\n\n5. FACT CHECK: 'I believe [claim]. What's the evidence for and against this?'\n\nRemember: Claude can make mistakes. For critical research, always verify key claims with primary sources.\n\nToday: Research a topic you're curious about using all 5 techniques."
  }, {
    day: 3,
    title: "Data Tasks",
    desc: "Spreadsheets, CSV, and data analysis.",
    full: "Claude can handle data work surprisingly well:\n\nFORMULAS: 'Write an Excel formula that [describes what you need]'\n\nDATA CLEANING: Paste messy data → 'Clean this data: fix formatting, remove duplicates, standardize dates'\n\nANALYSIS: 'Here's my sales data for 6 months [data]. What trends do you see? What should I do differently?'\n\nVISUALIZATION: 'What chart type best represents this data? Create it as a React component.' (Claude can build interactive charts!)\n\nCSV WORK: Paste CSV data → 'Add a column calculating [metric]. Sort by [field]. Filter where [condition].'\n\nToday: Take real data from your life (budget, workout log, anything) and have Claude analyze it."
  }, {
    day: 4,
    title: "Email & Communication",
    desc: "Never stare at a blank email again.",
    full: "Communication templates:\n\nCOLD OUTREACH: 'Write a cold email to [person/role] at [company] about [reason]. Keep under 100 words. Include a specific ask.'\n\nFOLLOW UP: 'Write a follow-up email. Original context: [what happened]. Tone: [urgent/casual/professional]. Goal: [what you want].'\n\nDIFFICULT MESSAGES: 'I need to tell [person] about [situation]. Help me communicate this clearly and empathetically.'\n\nNEGOTIATION: 'Draft a response to this offer: [details]. I want to counter with [your position]. Keep it professional.'\n\nPro tip: Always tell Claude the GOAL of the communication, not just what to write. 'I want them to schedule a call' vs 'write a nice email.'\n\nToday: Draft 3 real emails or messages you've been putting off."
  }, {
    day: 5,
    title: "Study Assistant",
    desc: "Claude as your personal tutor.",
    full: "Learning acceleration techniques:\n\nFEYNMAN TECHNIQUE: 'Explain [concept] as if I'm 10 years old. Then explain it at an expert level. Then help me explain it back to you.'\n\nFLASHCARDS: 'Create 20 flashcards for [topic]. Format: Q: [question] | A: [answer]'\n\nQUIZ ME: 'Ask me 10 progressively harder questions about [topic]. Wait for my answer before revealing if I'm correct.'\n\nCONNECT CONCEPTS: 'How does [new thing] relate to [thing I already know]?'\n\nSPACED REPETITION: 'I studied [topic] 3 days ago. Quiz me on the key concepts I should remember.'\n\nToday: Pick something you're learning (language, skill, etc.) and use these techniques with Claude."
  }, {
    day: 6,
    title: "Decision Making",
    desc: "Structured thinking with Claude.",
    full: "Decision frameworks via Claude:\n\nPROS/CONS PLUS: 'Analyze this decision: [options]. For each, list pros, cons, risks, and what I'd need to believe for this to be the right choice.'\n\nSECOND-ORDER THINKING: 'If I choose [option], what happens next? And what happens after that? Think 3 steps ahead.'\n\n10/10/10: 'How will I feel about this decision in 10 minutes, 10 months, and 10 years?'\n\nPRE-MORTEM: 'Imagine I chose [option] and it failed completely. What went wrong?'\n\nWEIGHTED MATRIX: 'Help me create a weighted decision matrix for [options] with criteria: [list criteria and importance].'\n\nToday: Use one of these frameworks on a real decision you're facing."
  }, {
    day: 7,
    title: "Week 3 Project",
    desc: "Automate 5 recurring tasks.",
    full: "Identify 5 things you do repeatedly and build Claude workflows:\n\nExamples:\n1. Weekly meal prep planning\n2. Meeting notes → action items → follow-up emails\n3. Social media content calendar\n4. Budget review and analysis\n5. Language learning daily exercises\n\nFor each:\n• Document the current manual process\n• Create a prompt template\n• Test it with real data\n• Refine until it saves you time\n• Save the template to your prompt library\n\nGoal: Save at least 2 hours per week through Claude workflows.\n\nNext week: We go technical — Claude API!"
  }]
}, {
  week: 4,
  title: "Week 4 — API Basics",
  color: "#a78bfa",
  lessons: [{
    day: 1,
    title: "API Concepts",
    desc: "What is an API and how to get started.",
    full: "An API (Application Programming Interface) lets your code talk to Claude directly. Instead of typing in a chat box, your program sends messages and receives responses.\n\nWhy use the API?\n• Build custom apps powered by Claude\n• Automate workflows\n• Process data in bulk\n• Integrate Claude into existing tools\n\nGetting started:\n1. Go to console.anthropic.com\n2. Create an account\n3. Get your API key (keep it secret!)\n4. Install: pip install anthropic (Python) or npm install @anthropic-ai/sdk (Node.js)\n\nKey concepts:\n• Endpoint: The URL you send requests to\n• API Key: Your authentication credential\n• Request: What you send (your message)\n• Response: What Claude sends back\n• Tokens: How usage is measured and billed\n\nToday: Create your Anthropic account and get your API key. Read the first page of docs.anthropic.com."
  }, {
    day: 2,
    title: "First API Call",
    desc: "Send your first message to Claude via code.",
    full: "Python example:\n\nimport anthropic\nclient = anthropic.Anthropic()\nmessage = client.messages.create(\n    model='claude-sonnet-4-20250514',\n    max_tokens=1024,\n    messages=[{'role': 'user', 'content': 'Hello Claude!'}]\n)\nprint(message.content[0].text)\n\nThat's it! You just called Claude from code.\n\nKey parts:\n• model: Which Claude model to use\n• max_tokens: Maximum response length\n• messages: Array of conversation messages\n• role: 'user' (you) or 'assistant' (Claude)\n\nThe response object contains:\n• content: Claude's response (array of blocks)\n• usage: Token counts (input + output)\n• stop_reason: Why Claude stopped\n\nToday: Run this code. Modify the message. Try different questions. Get comfortable with the basic pattern."
  }, {
    day: 3,
    title: "Parameters",
    desc: "Control Claude's output precisely.",
    full: "Key parameters:\n\nMODEL: 'claude-sonnet-4-20250514' (fast, good), 'claude-opus-4-20250514' (smartest)\n\nMAX_TOKENS: Limits response length. 1 token ≈ 0.75 words. Set to 1024 for short, 4096 for long responses.\n\nTEMPERATURE (0-1): Controls randomness.\n• 0 = deterministic, same answer every time\n• 0.3 = slight variation, good for most tasks\n• 0.7+ = creative, more diverse outputs\n• Use 0 for factual/code, higher for creative writing\n\nSYSTEM: Sets Claude's behavior for the whole conversation.\nsystem='You are a helpful fitness coach'\n\nSTOP_SEQUENCES: Strings that make Claude stop generating.\nstop_sequences=['END', '---']\n\nToday: Experiment with temperature settings. Send the same creative prompt at temp 0 vs 0.7 vs 1.0. See the difference."
  }, {
    day: 4,
    title: "Conversations",
    desc: "Multi-turn conversation management.",
    full: "For a conversation, send the FULL history each time:\n\nmessages=[\n  {'role': 'user', 'content': 'My name is Hunter'},\n  {'role': 'assistant', 'content': 'Nice to meet you, Hunter!'},\n  {'role': 'user', 'content': 'What did I just tell you?'}\n]\n\nClaude sees the entire conversation and responds: 'You told me your name is Hunter.'\n\nKey principles:\n• Claude has NO memory between API calls\n• YOU manage the conversation history\n• Append each new exchange to the messages array\n• The context window limits total conversation length\n\nConversation management:\n• Store messages in an array\n• Append user message → call API → append assistant response\n• Trim old messages when approaching token limit\n• Summarize old context to save tokens\n\nToday: Build a simple loop that maintains conversation history across multiple exchanges."
  }, {
    day: 5,
    title: "Streaming",
    desc: "Real-time response streaming.",
    full: "Instead of waiting for the full response, streaming shows text as it's generated — just like the chat interface.\n\nPython streaming:\nwith client.messages.stream(\n    model='claude-sonnet-4-20250514',\n    max_tokens=1024,\n    messages=[{'role': 'user', 'content': 'Tell me a story'}]\n) as stream:\n    for text in stream.text_stream:\n        print(text, end='', flush=True)\n\nWhy stream?\n• Better user experience (no waiting)\n• Lower perceived latency\n• Can process/display partial results\n• Can cancel mid-response if needed\n\nStream events include: message_start, content_block_start, content_block_delta (the text chunks), content_block_stop, message_stop.\n\nToday: Modify yesterday's chatbot to use streaming. See how much more responsive it feels."
  }, {
    day: 6,
    title: "Error Handling",
    desc: "Production-ready patterns.",
    full: "Things will go wrong. Be ready:\n\nCOMMON ERRORS:\n• 400: Bad request (check your message format)\n• 401: Invalid API key\n• 429: Rate limited (too many requests)\n• 500: Server error (retry)\n• 529: Overloaded (retry with backoff)\n\nRETRY PATTERN:\nimport time\nfor attempt in range(3):\n    try:\n        response = client.messages.create(...)\n        break\n    except anthropic.RateLimitError:\n        time.sleep(2 ** attempt)  # exponential backoff\n\nCOST CONTROL:\n• Monitor token usage (response.usage)\n• Set max_tokens appropriately\n• Use cheaper models for simple tasks\n• Cache responses when possible\n\nToday: Deliberately trigger errors (wrong API key, too many requests) and handle them gracefully."
  }, {
    day: 7,
    title: "Week 4 Project",
    desc: "Build a CLI chatbot.",
    full: "Build a command-line chatbot that:\n\n1. Maintains conversation history\n2. Uses streaming for responses\n3. Has a system prompt (e.g., fitness coach)\n4. Handles errors gracefully\n5. Shows token usage after each response\n6. Has /clear and /quit commands\n7. Saves conversation to a file\n\nBonus features:\n• Let user change the system prompt with /persona\n• Add a /cost command showing total tokens used\n• Support pasting multi-line input\n• Add conversation memory/summarization\n\nThis is a real, useful tool you'll keep using. Take your time, make it good.\n\nNext week: Tool Use & Agents — Claude starts taking actions!"
  }]
}, {
  week: 5,
  title: "Week 5 — Tools & Agents",
  color: "#f59e0b",
  lessons: [{
    day: 1,
    title: "AI Tools Explained",
    desc: "How Claude can use external tools.",
    full: "Tools (also called function calling) let Claude interact with the outside world. Instead of just generating text, Claude can:\n\n• Call a calculator for precise math\n• Look up real-time weather data\n• Search a database\n• Send an email\n• Create calendar events\n\nHow it works:\n1. You define tools Claude can use (name, description, parameters)\n2. Claude decides when to use a tool based on the conversation\n3. Claude outputs a 'tool use' block with the function name and arguments\n4. YOUR code executes the function and returns results\n5. Claude uses the results to form its final response\n\nClaude doesn't actually run code — it tells you WHAT to run, and you feed results back.\n\nToday: Read the tool use documentation at docs.anthropic.com. Understand the flow conceptually."
  }, {
    day: 2,
    title: "Tool Schemas",
    desc: "Defining tools for Claude.",
    full: "Tools are defined with JSON Schema:\n\ntools=[{\n  'name': 'get_weather',\n  'description': 'Get current weather for a location',\n  'input_schema': {\n    'type': 'object',\n    'properties': {\n      'city': {'type': 'string', 'description': 'City name'},\n      'units': {'type': 'string', 'enum': ['celsius', 'fahrenheit']}\n    },\n    'required': ['city']\n  }\n}]\n\nKey principles:\n• GOOD DESCRIPTIONS matter more than anything. Claude reads them to decide when/how to use tools.\n• Required vs optional parameters\n• Use enums to limit options\n• Keep tools focused — one clear purpose each\n\nToday: Define 3 tool schemas on paper: a calculator, a todo list manager, and a unit converter. Focus on clear descriptions."
  }, {
    day: 3,
    title: "First Tool",
    desc: "Build and connect a working tool.",
    full: "Complete working example:\n\n1. Define tool:\ntools = [{'name': 'calculate', 'description': 'Evaluate a math expression', 'input_schema': {'type': 'object', 'properties': {'expression': {'type': 'string'}}, 'required': ['expression']}}]\n\n2. Call Claude with tools:\nresponse = client.messages.create(model='claude-sonnet-4-20250514', max_tokens=1024, tools=tools, messages=[{'role': 'user', 'content': 'What is 15% of 847?'}])\n\n3. Check if Claude wants to use a tool:\nfor block in response.content:\n    if block.type == 'tool_use':\n        result = eval(block.input['expression'])  # Execute it\n        # Send result back to Claude\n\n4. Feed result back and get final answer.\n\nToday: Implement this calculator tool end-to-end. Then add a second tool (e.g., string length counter)."
  }, {
    day: 4,
    title: "Multi-Tool Workflows",
    desc: "Multiple tools working together.",
    full: "Give Claude several tools and let it orchestrate:\n\ntools = [\n  calculator_tool,    # Math\n  weather_tool,       # Weather API\n  notes_tool,         # Save/read notes\n  web_search_tool     # Search the web\n]\n\nUser: 'What's the temperature in Paris in Fahrenheit? Save it to my notes with today's date.'\n\nClaude will:\n1. Call weather_tool(city='Paris')\n2. Call calculator_tool('(celsius * 9/5) + 32')\n3. Call notes_tool(action='save', content='...')\n\nClaude intelligently chains tools based on the task. Your job is to:\n• Define tools clearly\n• Execute them when called\n• Return clean results\n• Handle errors gracefully\n\nToday: Build a system with 3+ tools. Test with complex queries that require multiple tool calls."
  }, {
    day: 5,
    title: "Agentic Patterns",
    desc: "Build AI agents that reason and act.",
    full: "An agent is Claude in a loop: Think → Act → Observe → Repeat.\n\nReAct Pattern:\nwhile not done:\n  response = claude.think('Given [context], what should I do next?')\n  action = extract_action(response)\n  result = execute(action)\n  context.append(result)\n  if is_complete(result): done = True\n\nKey patterns:\n\n1. PLANNING: Ask Claude to make a plan before acting\n2. REFLECTION: After each step, ask 'Did that work? What should I do differently?'\n3. TOOL SELECTION: Claude picks the right tool for each sub-task\n4. ERROR RECOVERY: When something fails, Claude tries alternative approaches\n\nImportant: Set a maximum loop count to prevent infinite loops. Always have a human-in-the-loop for important actions.\n\nToday: Build a simple agent that can research a topic using search, take notes, and produce a summary."
  }, {
    day: 6,
    title: "MCP Protocol",
    desc: "Connect Claude to any service.",
    full: "MCP (Model Context Protocol) is Anthropic's standard for connecting AI to external services.\n\nThink of MCP as a universal adapter. Instead of building custom integrations for every service, MCP provides a standard protocol.\n\nMCP Servers provide:\n• Tools (functions Claude can call)\n• Resources (data Claude can read)\n• Prompts (templates for common tasks)\n\nExamples of MCP servers:\n• File system access\n• Database queries\n• GitHub integration\n• Slack messaging\n• Google Drive\n• Custom business tools\n\nClaude Code (CLI tool) uses MCP extensively — it can read/write files, run commands, and interact with your dev environment.\n\nToday: Read the MCP documentation at modelcontextprotocol.io. Understand the architecture. If you have Claude Code, explore its MCP capabilities."
  }, {
    day: 7,
    title: "Week 5 Project",
    desc: "Build a personal AI agent.",
    full: "Build an agent that combines everything:\n\nYOUR AGENT SHOULD:\n1. Accept a natural language goal\n2. Break it into steps\n3. Use tools to accomplish each step\n4. Handle errors and retry\n5. Report back with results\n\nSuggested tools:\n• Web search (use a free API)\n• Note taking (file read/write)\n• Calculator\n• Timer/reminder\n\nExample use cases:\n• 'Research the best protein powder under $50 and summarize top 3 options'\n• 'Calculate my macros for a 2500 calorie day and save as a meal plan'\n• 'Find 5 articles about [topic] and create a summary document'\n\nThis is your first real AI agent. Take pride in it!\n\nNext week: Advanced techniques — RAG, embeddings, vision, and more."
  }]
}, {
  week: 6,
  title: "Week 6 — Advanced",
  color: "#ef4444",
  lessons: [{
    day: 1,
    title: "RAG",
    desc: "Give Claude your own knowledge.",
    full: "RAG (Retrieval Augmented Generation) lets Claude answer questions using YOUR documents.\n\nThe flow:\n1. CHUNK: Split your documents into smaller pieces (200-500 words each)\n2. EMBED: Convert each chunk into a vector (list of numbers) using an embedding model\n3. STORE: Save vectors in a vector database\n4. QUERY: When user asks a question, embed the question too\n5. RETRIEVE: Find the most similar document chunks\n6. GENERATE: Send those chunks + question to Claude\n\nWhy RAG?\n• Claude answers from YOUR data, not just training\n• Reduces hallucination (Claude cites sources)\n• Works with private/proprietary information\n• Keeps data up-to-date without retraining\n\nSimple implementation: You can start with just text files and basic string matching before moving to proper vector search.\n\nToday: Take 5 documents you own and manually create a simple RAG system (even just copy-paste relevant sections into the prompt)."
  }, {
    day: 2,
    title: "Embeddings",
    desc: "Semantic search and similarity.",
    full: "Embeddings convert text into numbers that capture meaning.\n\n'I love dogs' → [0.2, -0.5, 0.8, ...]\n'I adore puppies' → [0.19, -0.48, 0.82, ...] (very similar!)\n'The stock market crashed' → [-0.7, 0.3, -0.1, ...] (very different)\n\nUse cases:\n• Semantic search (find similar documents)\n• Clustering (group similar items)\n• Recommendation (find related content)\n• Deduplication (find near-duplicates)\n\nPopular embedding models:\n• Voyage AI (recommended by Anthropic)\n• OpenAI text-embedding-3\n• Cohere embed\n\nVector databases:\n• Pinecone (managed, easy)\n• ChromaDB (local, free)\n• Weaviate (open source)\n• pgvector (PostgreSQL extension)\n\nToday: Generate embeddings for 10 sentences and calculate similarity scores between them. See which pairs are most/least similar."
  }, {
    day: 3,
    title: "Code Generation",
    desc: "Claude as a coding partner.",
    full: "Claude is an exceptional programmer. Use it effectively:\n\nDEBUGGING: Paste error + code → 'Explain this error and fix it'\n\nREFACTORING: 'Refactor this code to be more readable and efficient: [code]'\n\nGENERATION: 'Write a Python function that [description]. Include type hints, docstring, and error handling.'\n\nREVIEW: 'Review this code for bugs, security issues, and performance problems: [code]'\n\nTESTING: 'Write unit tests for this function: [code]'\n\nPro tips:\n• Give context: language, framework, purpose\n• Ask Claude to explain its code\n• Request multiple approaches\n• Specify coding style/conventions\n• Ask for edge case handling\n\nClaude Code (CLI) takes this further — it can read your entire codebase, run tests, and make changes directly.\n\nToday: Use Claude to write, debug, and test a small project in your preferred language."
  }, {
    day: 4,
    title: "Vision & Multimodal",
    desc: "Image analysis with Claude.",
    full: "Claude can see and analyze images:\n\nCAPABILITIES:\n• Describe image content in detail\n• Read text in images (OCR)\n• Analyze charts and graphs\n• Compare multiple images\n• Answer questions about images\n• Extract data from screenshots\n\nAPI usage:\nmessages=[{\n  'role': 'user',\n  'content': [\n    {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64_string}},\n    {'type': 'text', 'text': 'What do you see in this image?'}\n  ]\n}]\n\nUse cases:\n• Receipt scanning → expense tracking\n• Whiteboard photos → structured notes\n• UI screenshots → code generation\n• Document photos → text extraction\n\nToday: Send Claude 5 different types of images and explore its visual understanding capabilities."
  }, {
    day: 5,
    title: "Structured Output",
    desc: "Reliable data extraction.",
    full: "Getting consistent structured data from Claude:\n\nJSON MODE:\nSystem: 'Always respond with valid JSON only. No markdown, no explanation.'\nUser: 'Extract: name, date, amount from this receipt: [image]'\n\nSCHEMA ENFORCEMENT:\n'Return a JSON object matching this exact schema:\n{\n  \"items\": [{\"name\": string, \"quantity\": int, \"price\": float}],\n  \"total\": float,\n  \"date\": \"YYYY-MM-DD\"\n}'\n\nVALIDATION LOOP:\nGet response → Parse JSON → Validate against schema → If invalid, ask Claude to fix → Repeat\n\nPro tips:\n• Include the schema in the prompt\n• Give an example of valid output\n• Use try/catch for JSON parsing\n• Strip markdown code fences before parsing\n• Validate required fields exist\n\nToday: Build a pipeline that extracts structured data from 5 different text inputs with 100% valid JSON output."
  }, {
    day: 6,
    title: "Evaluation",
    desc: "Measuring AI quality.",
    full: "How do you know if your AI system is good? You measure it.\n\nTYPES OF EVALS:\n1. AUTOMATED: Code checks output format, accuracy against known answers\n2. HUMAN: People rate quality on a scale\n3. MODEL-BASED: Use Claude to evaluate Claude's outputs\n4. A/B TESTING: Compare two approaches on the same inputs\n\nBUILDING AN EVAL:\n1. Create a test set (50-100 examples with expected outputs)\n2. Run your prompt/system on all examples\n3. Score results (accuracy, quality, format compliance)\n4. Calculate metrics (% correct, average quality score)\n\nMODEL-AS-JUDGE:\n'Rate this response 1-5 on: accuracy, helpfulness, conciseness. Explain each rating.'\n\nThis is how professionals improve AI systems. The prompt that scores 85% gets iterated until it scores 95%.\n\nToday: Create a 10-question eval for one of your prompt templates. Score it. Improve the prompt. Score again."
  }, {
    day: 7,
    title: "Week 6 Project",
    desc: "Build a RAG knowledge base.",
    full: "Build a searchable knowledge base with your own documents:\n\n1. Collect 10-20 documents (notes, articles, PDFs)\n2. Chunk them into smaller pieces\n3. Create a simple search function (start with keyword matching, upgrade to embeddings later)\n4. Build a Claude-powered Q&A interface\n5. Claude answers questions using ONLY your documents\n6. Include source citations in responses\n\nBonus:\n• Add a 'I don't know' response when no relevant context is found\n• Support adding new documents dynamically\n• Create a web interface\n\nThis is a genuinely useful tool. Many companies pay thousands for exactly this capability.\n\nNext week: Building real products with AI!"
  }]
}, {
  week: 7,
  title: "Week 7 — Products",
  color: "#ec4899",
  lessons: [{
    day: 1,
    title: "AI Product Design",
    desc: "When and how to use AI in products.",
    full: "Not everything needs AI. Good AI products follow these principles:\n\nWHEN TO USE AI:\n• Task is language-heavy (writing, analysis, conversation)\n• Input is unstructured (free text, images, audio)\n• Perfect accuracy isn't required\n• Human-in-the-loop is possible\n• The task would take a human significant time\n\nWHEN NOT TO USE AI:\n• Simple CRUD operations\n• Precise calculations\n• Real-time requirements (<100ms)\n• When wrong answers are dangerous\n\nUX PRINCIPLES:\n• Show confidence levels\n• Allow easy correction\n• Explain AI reasoning\n• Graceful degradation when AI fails\n• Set clear expectations\n\nToday: Analyze 3 AI products you use. What works? What doesn't? How would you improve them?"
  }, {
    day: 2,
    title: "AI Web Apps",
    desc: "Building React + Claude apps.",
    full: "Build interactive AI features for the web:\n\nStack: React frontend + Claude API backend\n\nExample architecture:\nUser → React UI → Your API server → Claude API → Response → UI update\n\nKey considerations:\n• NEVER put your API key in frontend code\n• Use a backend server to proxy Claude requests\n• Implement streaming for better UX\n• Add loading states and error handling\n• Rate limit your users\n\nSimple patterns:\n• Chat interface (most common)\n• Form → AI analysis → Results\n• Upload → Processing → Output\n• Interactive editor with AI suggestions\n\nToday: Sketch out (on paper or in a doc) an AI-powered web app you'd want to build. Define the user flow, API calls, and UI components."
  }, {
    day: 3,
    title: "Artifacts",
    desc: "Build apps inside Claude.",
    full: "Claude's Artifact system lets you create interactive apps right inside the conversation:\n\n• React components with full interactivity\n• HTML/CSS/JS pages\n• Data visualizations with charts\n• Games and tools\n• SVG graphics\n\nAvailable libraries: React, Tailwind CSS, Recharts, D3, Three.js, Lucide icons, shadcn/ui, Chart.js, and more.\n\nBest practices:\n• Keep state in React hooks (useState, useEffect)\n• Use Tailwind for styling\n• Make it interactive and responsive\n• Add animations for polish\n• THIS APP you're using right now is an artifact!\n\nToday: Ask Claude to build you an interactive artifact. Start simple (a calculator, quiz, or timer), then get creative."
  }, {
    day: 4,
    title: "Batch Processing",
    desc: "Process data at scale.",
    full: "Sometimes you need to process hundreds or thousands of items:\n\nBATCH API: Anthropic offers a batch API for large jobs:\n• Submit many messages at once\n• 50% cheaper than individual calls\n• Results delivered within 24 hours\n• Great for classification, extraction, analysis\n\nDIY BATCHING:\nresults = []\nfor item in items:\n    response = claude.create(messages=[{'role':'user','content':f'Classify: {item}'}])\n    results.append(parse(response))\n    time.sleep(0.1)  # respect rate limits\n\nPARALLEL PROCESSING:\nUse asyncio or threading to process multiple items simultaneously. Respect rate limits (check your tier).\n\nToday: Take a dataset of at least 20 items and batch-process them with Claude. Compare individual vs batch approaches."
  }, {
    day: 5,
    title: "Cost Optimization",
    desc: "Save money at scale.",
    full: "Real-world cost strategies:\n\nMODEL SELECTION:\n• Haiku: Fastest, cheapest. Great for simple tasks, classification.\n• Sonnet: Best balance. Most tasks.\n• Opus: Smartest. Complex reasoning only.\nRoute simple tasks to cheaper models!\n\nPROMPT CACHING:\nReuse the same system prompt/documents across calls. Anthropic caches repeated content — you pay less for cached tokens.\n\nTOKEN BUDGETING:\n• Set appropriate max_tokens\n• Ask for concise responses\n• Summarize long contexts instead of sending full text\n• Remove unnecessary instructions\n\nARCHITECTURE:\n• Cache AI responses for identical queries\n• Use traditional code for deterministic parts\n• Only call Claude when AI reasoning is needed\n\nToday: Audit one of your existing Claude workflows. Calculate cost per task. Optimize to reduce cost by 50%."
  }, {
    day: 6,
    title: "Safety & Moderation",
    desc: "Deploy AI responsibly.",
    full: "Before shipping AI to users:\n\nINPUT SAFETY:\n• Validate user input length and format\n• Detect and block prompt injection attempts\n• Sanitize inputs (remove malicious content)\n• Rate limit per user\n\nOUTPUT SAFETY:\n• Use Claude's built-in safety features\n• Add content filters for your specific domain\n• Review outputs before showing to other users\n• Log and monitor for concerning patterns\n\nSYSTEM PROMPT SECURITY:\n• Don't expose your system prompt\n• Test against prompt extraction attacks\n• Use separate validation layer\n\nMONITORING:\n• Track usage patterns\n• Flag unusual behavior\n• Review edge cases\n• Collect user feedback\n\nToday: Try to 'break' one of your AI systems with adversarial inputs. Fix the vulnerabilities you find."
  }, {
    day: 7,
    title: "Week 7 Project",
    desc: "Ship a real AI feature.",
    full: "Build and share something real:\n\nOPTION A: AI-powered tool (resume reviewer, meal planner, study quiz generator)\nOPTION B: Claude Artifact (interactive dashboard, game, utility)\nOPTION C: Automation (email processor, data pipeline, content generator)\n\nRequirements:\n• Solves a real problem\n• Has error handling\n• Looks polished\n• Someone else could use it\n\nShare it! Post on social media, show friends, or add to your portfolio.\n\nNext week: Final week — mastery, portfolios, and the future of AI."
  }]
}, {
  week: 8,
  title: "Week 8 — Mastery",
  color: "#f97316",
  lessons: [{
    day: 1,
    title: "Claude Code",
    desc: "AI-powered command line development.",
    full: "Claude Code is a CLI tool that turns Claude into a coding agent in your terminal.\n\nInstall: npm install -g @anthropic-ai/claude-code\nRun: claude\n\nCapabilities:\n• Reads and writes files in your project\n• Runs terminal commands\n• Understands your entire codebase\n• Makes multi-file changes\n• Runs tests and fixes failures\n• Uses MCP for external integrations\n\nUse cases:\n• 'Fix the failing tests in this project'\n• 'Add user authentication to this app'\n• 'Refactor this module to use TypeScript'\n• 'Create a REST API for this data model'\n\nClaude Code is the most powerful way to code with AI — it sees your whole project, not just snippets.\n\nToday: Install Claude Code and use it on a real project. Start with small tasks, then try something ambitious."
  }, {
    day: 2,
    title: "Advanced Concepts",
    desc: "Fine-tuning and beyond.",
    full: "When might you go beyond prompting?\n\nFINE-TUNING: Train a model on your specific data\n• When: Consistent style/format needed, specific domain knowledge, high volume of similar tasks\n• Cost: Significant (data prep, training, hosting)\n• Alternative: Often, better prompts + RAG can achieve the same result cheaper\n\nDISTILLATION: Train a smaller model to mimic a larger one\n• Use Opus to generate training data\n• Fine-tune Haiku on that data\n• Get Opus quality at Haiku price/speed\n\nCONSTITUTIONAL AI: Anthropic's approach to safety\n• Train AI using a set of principles\n• AI critiques and revises its own outputs\n• Reduces need for human feedback\n\nToday: Evaluate whether any of your current AI workflows would benefit from fine-tuning vs better prompting."
  }, {
    day: 3,
    title: "Multi-Agent Systems",
    desc: "AI agents working together.",
    full: "Multiple specialized agents collaborating:\n\nPATTERNS:\n1. PIPELINE: Agent A → Agent B → Agent C (each does one task)\n2. DEBATE: Two agents argue for different approaches, a third decides\n3. HIERARCHY: Manager agent delegates to specialist agents\n4. SWARM: Many agents work in parallel on sub-tasks\n\nEXAMPLE — Research Pipeline:\nAgent 1 (Researcher): Finds relevant sources\nAgent 2 (Analyst): Evaluates source quality\nAgent 3 (Writer): Synthesizes findings\nAgent 4 (Editor): Reviews and polishes\n\nChallenges:\n• Coordination overhead\n• Error propagation\n• Cost multiplication\n• Debugging complexity\n\nStart simple: two agents is plenty for most tasks.\n\nToday: Build a 2-agent system where one creates content and another critiques/improves it."
  }, {
    day: 4,
    title: "Staying Current",
    desc: "The AI landscape changes fast.",
    full: "How to keep learning after this course:\n\nDAILY (5 min):\n• Follow @AnthropicAI on Twitter/X\n• Check Hacker News AI section\n\nWEEKLY (30 min):\n• Anthropic blog: anthropic.com/research\n• Read one AI paper summary (papers.cool or arxiv-sanity)\n• Try one new Claude feature or technique\n\nMONTHLY:\n• Build something new with AI\n• Attend an AI meetup or webinar\n• Review and update your prompt library\n\nCOMMUNITIES:\n• Anthropic Discord\n• r/ClaudeAI on Reddit\n• AI Twitter/X community\n• Local AI meetup groups\n\nNEWSLETTERS:\n• The Batch (Andrew Ng)\n• Ben's Bites\n• The Neuron\n\nToday: Set up your learning infrastructure. Subscribe to 2-3 sources. Schedule weekly AI learning time."
  }, {
    day: 5,
    title: "Portfolio",
    desc: "Show what you can do.",
    full: "Document your AI journey:\n\n1. GITHUB REPO: Collect all your projects\n   • CLI chatbot (Week 4)\n   • AI agent (Week 5)\n   • RAG system (Week 6)\n   • AI product (Week 7)\n\n2. WRITE-UPS: For each project:\n   • Problem it solves\n   • Technical approach\n   • Challenges and solutions\n   • Results and screenshots\n\n3. PROMPT LIBRARY: Your curated collection shows expertise\n\n4. BLOG POSTS: Write about what you learned\n   • 'How I built a RAG system for my personal notes'\n   • 'Prompt engineering tips that actually work'\n   • '8 weeks learning AI: what I wish I knew from day 1'\n\n5. DEMO VIDEO: Record a 2-minute walkthrough of your best project\n\nToday: Start organizing your portfolio. Pick your best 3 projects and write descriptions."
  }, {
    day: 6,
    title: "Future of AI",
    desc: "Where we're heading.",
    full: "What's coming in AI (and your role in it):\n\nNEAR TERM (2025-2026):\n• AI agents becoming mainstream\n• Multimodal models (text + image + audio + video)\n• AI in every software product\n• Better reasoning and planning capabilities\n• Computer use and browser automation\n\nMEDIUM TERM (2026-2028):\n• Truly autonomous AI agents\n• AI-native applications\n• Personalized AI that knows you deeply\n• Scientific discovery acceleration\n• New job categories around AI\n\nYOUR COMPETITIVE ADVANTAGE:\nMost people will use AI passively. You now understand HOW it works, can build with it, and can push its limits. This puts you ahead of 95% of people.\n\nThe people who thrive will be those who combine domain expertise + AI skills. You're building both.\n\nToday: Write down 3 ways AI will change YOUR specific field/career in the next 2 years. Start preparing."
  }, {
    day: 7,
    title: "Final Project",
    desc: "Your AI masterpiece.",
    full: "Build something that combines everything you've learned:\n\nIDEAS:\n• Personal AI assistant with tools, RAG, and memory\n• AI-powered app that solves a real problem for real people\n• Multi-agent system for a complex workflow\n• Open-source tool that helps others learn AI\n\nREQUIREMENTS:\n• Uses at least 3 techniques from this course\n• Solves a genuine problem\n• Is polished enough to show others\n• Includes documentation\n\nSHARE IT:\n• Post on GitHub\n• Write a blog post\n• Share on social media\n• Present to friends or colleagues\n\nYou started 8 weeks ago not knowing what a token was. Now you can build AI-powered systems. That's a massive transformation.\n\nThe System has made you stronger. Now go use this power.\n\nArise, Hunter. 🔥"
  }]
}];
function getRank(l) {
  for (let i = RANKS.length - 1; i >= 0; i--) if (l >= RANKS[i].min) return RANKS[i];
  return RANKS[0];
}
function getXp(l) {
  return Math.floor(100 * Math.pow(1.15, l - 1));
}
function StatBar({
  label,
  value,
  max = 100,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 2,
      fontSize: 11,
      color: "#94a3b8"
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color
    }
  }, value)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      background: "rgba(255,255,255,0.05)",
      borderRadius: 3,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${Math.min(value / max * 100, 100)}%`,
      background: `linear-gradient(90deg,${color},${color}88)`,
      borderRadius: 3,
      boxShadow: `0 0 8px ${color}66`,
      transition: "width 0.6s ease"
    }
  })));
}
function Notif({
  msg,
  onDone
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(90px + env(safe-area-inset-bottom))",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "12px 24px",
      background: "linear-gradient(135deg,rgba(15,23,42,0.97),rgba(30,41,59,0.97))",
      border: "1px solid rgba(59,130,246,0.5)",
      borderRadius: 8,
      color: "#93c5fd",
      fontFamily: "'Courier New',monospace",
      fontSize: 12,
      letterSpacing: 1,
      boxShadow: "0 0 30px rgba(59,130,246,0.3)",
      animation: "notifIn 0.4s ease-out",
      textAlign: "center",
      maxWidth: "90vw"
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
      background: "rgba(0,0,0,0.88)",
      animation: "fadeIn 0.3s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      textAlign: "center",
      animation: "levelUp 0.6s ease-out"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      letterSpacing: 6,
      color: "#3b82f6",
      marginBottom: 12,
      textTransform: "uppercase"
    }
  }, "\u25B8 SYSTEM ALERT \u25C2"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      fontWeight: 900,
      color: "#e2e8f0",
      fontFamily: "'Georgia',serif",
      textShadow: `0 0 40px ${rank.color}`,
      marginBottom: 8
    }
  }, "LEVEL ", level), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: rank.color,
      letterSpacing: 3,
      marginBottom: 8
    }
  }, rank.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#475569"
    }
  }, "[ TAP TO CONTINUE ]")));
}

// ─── XP MULTIPLIERS ───
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

// ─── MOTIVATIONAL QUOTES ───
const QUEST_QUOTES = [{
  text: "I alone level up.",
  color: "#3b82f6"
}, {
  text: "Arise.",
  color: "#ef4444"
}, {
  text: "The weak have no right to choose how they die.",
  color: "#a78bfa"
}, {
  text: "I am not the same person I was yesterday.",
  color: "#22c55e"
}, {
  text: "Every step forward is a step toward the top.",
  color: "#f59e0b"
}, {
  text: "Pain is just weakness leaving the body.",
  color: "#ef4444"
}, {
  text: "The System has acknowledged your effort.",
  color: "#3b82f6"
}, {
  text: "You have gotten stronger.",
  color: "#22c55e"
}, {
  text: "A hunter must always be prepared.",
  color: "#a78bfa"
}, {
  text: "The shadows obey the strong.",
  color: "#475569"
}, {
  text: "Your power is growing. Do not stop.",
  color: "#f59e0b"
}, {
  text: "Today's pain is tomorrow's power.",
  color: "#ef4444"
}, {
  text: "Discipline is the bridge between goals and results.",
  color: "#22d3ee"
}, {
  text: "No shortcuts. Only grinding.",
  color: "#f97316"
}, {
  text: "The dungeon awaits. Will you enter?",
  color: "#a78bfa"
}, {
  text: "Status: Getting Dangerous.",
  color: "#ec4899"
}, {
  text: "Quest complete. But the journey continues.",
  color: "#3b82f6"
}, {
  text: "Every rep. Every page. Every lesson. XP.",
  color: "#22c55e"
}, {
  text: "Rest is for the weak. Recovery is for the strong.",
  color: "#f59e0b"
}, {
  text: "The System rewards those who show up.",
  color: "#3b82f6"
}];
function QuestPopup({
  quote,
  xpGain,
  multiplier,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
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
      background: "rgba(0,0,0,0.75)",
      animation: "fadeIn 0.2s ease",
      pointerEvents: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      animation: "levelUp 0.4s ease-out",
      padding: "0 30px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\u2694\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: quote.color,
      fontFamily: "'Georgia',serif",
      fontStyle: "italic",
      lineHeight: 1.6,
      marginBottom: 12,
      textShadow: `0 0 20px ${quote.color}44`
    }
  }, "\"", quote.text, "\""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      color: "#4ade80",
      fontFamily: "'Courier New',monospace",
      textShadow: "0 0 15px rgba(74,222,128,0.4)"
    }
  }, "+", xpGain, " XP"), multiplier > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#f59e0b",
      marginTop: 4
    }
  }, "\u2726 ", multiplier, "x multiplier active")));
}
function SleepLogger({
  logSleep
}) {
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  const [rating, setRating] = useState(0);
  const [readiness, setReadiness] = useState("");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    min: "0",
    max: "14",
    value: hours,
    placeholder: "ore",
    onChange: e => setHours(e.target.value.replace(/[^0-9]/g, "")),
    style: {
      flex: 1,
      padding: "7px 8px",
      background: "rgba(0,0,0,.3)",
      border: "1px solid rgba(99,102,241,.3)",
      borderRadius: 5,
      color: "#e2e8f0",
      fontSize: 12,
      fontFamily: "'Courier New',monospace",
      outline: "none",
      boxSizing: "border-box",
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b",
      fontSize: 13,
      fontWeight: 700
    }
  }, ":"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    min: "0",
    max: "59",
    value: mins,
    placeholder: "min",
    onChange: e => setMins(e.target.value.replace(/[^0-9]/g, "").slice(0, 2)),
    style: {
      flex: 1,
      padding: "7px 8px",
      background: "rgba(0,0,0,.3)",
      border: "1px solid rgba(99,102,241,.3)",
      borderRadius: 5,
      color: "#e2e8f0",
      fontSize: 12,
      fontFamily: "'Courier New',monospace",
      outline: "none",
      boxSizing: "border-box",
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, [1, 2, 3, 4, 5].map(r => /*#__PURE__*/React.createElement("button", {
    key: r,
    onClick: () => setRating(r),
    style: {
      width: 22,
      height: 22,
      padding: 0,
      background: r <= rating ? "rgba(99,102,241,.3)" : "rgba(0,0,0,.3)",
      border: `1px solid ${r <= rating ? "#a5b4fc" : "rgba(255,255,255,.1)"}`,
      borderRadius: 4,
      color: r <= rating ? "#fbbf24" : "#475569",
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u2605")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: "#64748b",
      letterSpacing: 1,
      flexShrink: 0
    }
  }, "READINESS"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    min: "0",
    max: "100",
    value: readiness,
    placeholder: "Oura 0-100 (optional)",
    onChange: e => setReadiness(e.target.value.replace(/[^0-9]/g, "").slice(0, 3)),
    style: {
      flex: 1,
      padding: "7px 8px",
      background: "rgba(0,0,0,.3)",
      border: "1px solid rgba(99,102,241,.3)",
      borderRadius: 5,
      color: "#e2e8f0",
      fontSize: 12,
      fontFamily: "'Courier New',monospace",
      outline: "none",
      boxSizing: "border-box",
      textAlign: "center"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!hours && !mins || rating === 0) {
        alert("Introdu ore + minute si rating");
        return;
      }
      logSleep(hmToDec(hours, mins), rating, readiness);
      setHours("");
      setMins("");
      setRating(0);
      setReadiness("");
    },
    style: {
      width: "100%",
      padding: "7px",
      background: "linear-gradient(135deg,rgba(99,102,241,.2),rgba(168,85,247,.1))",
      border: "1px solid rgba(99,102,241,.4)",
      borderRadius: 5,
      color: "#a5b4fc",
      fontSize: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      letterSpacing: 1
    }
  }, "\uD83D\uDCA4 LOG SLEEP"));
}
function App() {
  const [loaded, setLoaded] = useState(false);
  const [_v, _fv] = useState(0);
  const forceUpdate = () => _fv(v => v + 1);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [questPopup, setQuestPopup] = useState(null);

  // ─── ALL GAME STATE LIVES IN A REF ───
  const g = useRef({
    ...DEFAULT_STATE
  });

  // Mutate state + save to IndexedDB + re-render
  const update = changes => {
    Object.assign(g.current, changes);
    setDirty(true);
    forceUpdate();
    saveToIDB(g.current).then(ok => {
      if (ok) {
        setDirty(false);
        setLastSaved(new Date().toLocaleTimeString());
      }
    });
  };

  // Manual save — the reliable fallback
  const manualSave = async () => {
    const ok = await saveToIDB(g.current);
    if (ok) {
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString());
      setNotif("💾 Progress saved!");
    } else setNotif("❌ Save failed — try again");
  };

  // UI-only state (not saved)
  const [notif, setNotif] = useState(null);
  const [showLvl, setShowLvl] = useState(false);
  // Blocking reminder modal: null | "sleep" | "weight"
  const [reminderModal, setReminderModal] = useState(null);
  const [rmSleepH, setRmSleepH] = useState("");
  const [rmSleepM, setRmSleepM] = useState("");
  const [rmSleepR, setRmSleepR] = useState(0);
  const [rmWeight, setRmWeight] = useState("");
  const [rmFat, setRmFat] = useState("");
  const [rmMuscle, setRmMuscle] = useState("");
  const [showWarmup, setShowWarmup] = useState(false);
  const [showCooldown, setShowCooldown] = useState(false);
  const [tab, setTab] = useState("quests");
  const [cEx, setCEx] = useState("");
  const [cS, setCS] = useState("");
  const [cR, setCR] = useState("");
  const [selPPL, setSelPPL] = useState(new Date().getDay());
  const [lW, setLW] = useState(0);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [sN, setSN] = useState("");
  const [sT, setST] = useState("message");
  const [newWeight, setNewWeight] = useState("");
  const [newFat, setNewFat] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [exportStr, setExportStr] = useState("");
  const [importStr, setImportStr] = useState("");
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [editingEx, setEditingEx] = useState(null);
  // Rest timer state
  const [restTimer, setRestTimer] = useState(null);
  const [restElapsed, setRestElapsed] = useState(0);
  const [restHistory, setRestHistory] = useState([]);
  // Exercise pause timer (between exercises)
  const [exerciseRestTimer, setExerciseRestTimer] = useState(null);
  const [exerciseRestElapsed, setExerciseRestElapsed] = useState(0);
  // Swap exercise modal
  const [swapModal, setSwapModal] = useState(null);
  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);
  // Tracking which sets failed
  const [failedSets, setFailedSets] = useState({});
  // Persistent per-exercise set-logger state (survives timer re-renders — fixes reset bug)
  const [loggerSets, setLoggerSets] = useState({});

  // Shortcuts to read game state
  const S = g.current;
  const START_DATE = new Date("2026-04-13");
  const daysSinceStart = Math.max(0, Math.floor((new Date() - START_DATE) / (1000 * 60 * 60 * 24)));
  const todayStr = new Date().toISOString().slice(0, 10);
  const getWeekId = d => {
    const dt = new Date(d);
    const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() + 4 - day);
    const yr = new Date(dt.getFullYear(), 0, 1);
    return dt.getFullYear() + "-W" + String(Math.ceil(((dt - yr) / 86400000 + 1) / 7)).padStart(2, "0");
  };
  const currentWeekId = getWeekId(new Date());
  const PENALIZABLE_DAILY = [...DAILY_Q, ...LIFE_Q_FIXED];
  const LIFE_Q = [...LIFE_Q_FIXED];
  const ALL_QUESTS = [...DAILY_Q, ...LIFE_Q, ...BONUS_Q];
  const yesterdayDow = new Date(Date.now() - 86400000).getDay();
  const yesterdayPPL = PPL[yesterdayDow];
  const trainingPenaltyPerExercise = 10;
  const LEARNING_PENALTY = 45;

  // Convenience aliases from game state
  const level = S.level,
    xp = S.xp,
    stats = S.stats,
    done = S.done,
    doneEx = S.doneEx,
    doneW = S.doneW,
    doneLessons = S.doneLessons,
    totalXp = S.totalXp,
    qC = S.qC,
    streak = S.streak,
    wLog = S.wLog,
    socialLog = S.socialLog,
    weightLog = S.weightLog,
    bookTitle = S.bookTitle,
    bookPages = S.bookPages,
    bookRead = S.bookRead,
    bookLog = S.bookLog,
    muscleXp = S.muscleXp,
    lastDailyReset = S.lastDailyReset,
    lastWeeklyReset = S.lastWeeklyReset,
    penaltyLog = S.penaltyLog,
    dailyLessonDone = S.dailyLessonDone,
    liftLog = S.liftLog,
    vacation = S.vacation;

  // Load saved data from IndexedDB on mount, then run resets
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

          // ─── MIGRARE v2: somn HH:MM + curatare intrari eronate ───
          let _migDone = false;
          try {
            _migDone = localStorage.getItem("slv_sleepFmtV2") === "1";
          } catch (e) {}
          if (!g.current.sleepFmtV2 && !_migDone) {
            const convH = v => {
              const str = String(v);
              if (str.indexOf(".") === -1) return parseFloat(str) || 0;
              const parts = str.split(".");
              const whole = parseInt(parts[0], 10) || 0;
              const mins = parseInt((parts[1] + "0").slice(0, 2), 10);
              if (isNaN(mins) || mins > 59) return parseFloat(str) || 0;
              return Math.round((whole + mins / 60) * 1000) / 1000;
            };
            g.current.sleepLog = (g.current.sleepLog || []).map(x => ({
              ...x,
              hours: convH(x.hours)
            }));
            const ll = {
              ...(g.current.liftLog || {})
            };
            if (ll["Barbell Rows"]) ll["Barbell Rows"] = ll["Barbell Rows"].filter(e => e.date !== "2026-09-01");
            if (ll["Romanian Deadlift"]) ll["Romanian Deadlift"] = ll["Romanian Deadlift"].filter(e => e.date !== "2026-09-02");
            g.current.liftLog = ll;
            g.current.sleepFmtV2 = true;
            try {
              localStorage.setItem("slv_sleepFmtV2", "1");
            } catch (e) {}
            await saveToIDB(g.current);
          }

          // ─── MIGRARE v3: Plank bodyweight (fuziune Weighted Plank -> Plank) ───
          let _plankDone = false;
          try {
            _plankDone = localStorage.getItem("slv_plankBwV1") === "1";
          } catch (e) {}
          if (!g.current.plankBwV1 && !_plankDone) {
            const ll2 = {
              ...(g.current.liftLog || {})
            };
            const wp = ll2["Weighted Plank"] || [];
            const pl = ll2["Plank"] || [];
            if (wp.length || pl.length) {
              ll2["Plank"] = [...pl, ...wp].map(e => ({
                date: e.date,
                sets: (e.sets || []).map(x => ({
                  kg: 0,
                  reps: parseInt(x.reps) || 0,
                  failed: !!x.failed
                }))
              })).sort((a, b) => String(a.date).localeCompare(String(b.date)));
            }
            delete ll2["Weighted Plank"];
            // Hanging Leg Raises: scot greutatea adaugata din istoric
            if (ll2["Hanging Leg Raises"]) {
              ll2["Hanging Leg Raises"] = ll2["Hanging Leg Raises"].map(e => ({
                date: e.date,
                sets: (e.sets || []).map(x => ({
                  kg: 0,
                  reps: parseInt(x.reps) || 0,
                  failed: !!x.failed
                }))
              }));
            }
            g.current.liftLog = ll2;
            g.current.plankBwV1 = true;
            try {
              localStorage.setItem("slv_plankBwV1", "1");
            } catch (e) {}
            await saveToIDB(g.current);
          }

          // ─── MIGRARE v4: boss dezactivat, cardio + kettlebell scoase ───
          let _v4Done = false;
          try {
            _v4Done = localStorage.getItem("slv_cleanupV4") === "1";
          } catch (e) {}
          if (!g.current.cleanupV4 && !_v4Done) {
            if (g.current.activeBoss) {
              g.current.bossHistory = [...(g.current.bossHistory || []), {
                ...g.current.activeBoss,
                result: "abandoned",
                completedDate: new Date().toISOString().slice(0, 10)
              }];
              g.current.activeBoss = null;
            }
            const _gone = ["treadmill", "kettlebell"];
            g.current.done = (g.current.done || []).filter(x => _gone.indexOf(x) === -1);
            g.current.cleanupV4 = true;
            try {
              localStorage.setItem("slv_cleanupV4", "1");
            } catch (e) {}
            await saveToIDB(g.current);
          }
        }

      // ─── AUTO DAILY RESET + PENALTY (runs after load) ───
      const S = g.current;
      const today = new Date().toISOString().slice(0, 10);
      if (S.lastDailyReset && S.lastDailyReset !== today) {
        // Check if yesterday was a weekend or vacation — no penalties
        const yesterdayDate = new Date(S.lastDailyReset);
        const yDay = yesterdayDate.getDay(); // 0=Sun, 6=Sat
        const wasWeekend = yDay === 0 || yDay === 6;
        const wasVacation = S.vacation;
        const changes = {
          done: [],
          doneEx: [],
          dailyLessonDone: false,
          lastDailyReset: today
        };
        if (wasWeekend || wasVacation) {
          // No penalties on weekends/vacation — just reset tasks, keep streak
          changes.streak = S.streak + 1;
          const reason = wasVacation ? "🏖️ Vacation mode — no penalties" : "🌙 Weekend — no penalties";
          setTimeout(() => setNotif(reason), 500);
        } else {
          // Compute yesterday's penalizable quests
          const yPenalizable = [...DAILY_Q, ...LIFE_Q_FIXED];
          let totalPenalty = 0,
            missedCount = 0;
          const details = [];
          const missedQuests = yPenalizable.filter(q => !S.done.includes(q.id));
          if (missedQuests.length > 0) {
            const p = missedQuests.reduce((s, q) => s + q.xp, 0);
            totalPenalty += p;
            missedCount += missedQuests.length;
            details.push(`${missedQuests.length} quests (-${p})`);
          }
          const yDow = new Date(Date.now() - 86400000).getDay();
          const yPPL = PPL[yDow];
          if (yPPL && yPPL.type !== "REST") {
            const missedEx = yPPL.exercises.filter(ex => !ex.finisher && !S.doneEx.includes(ex.name));
            if (missedEx.length > 0) {
              const p = missedEx.length * 10;
              totalPenalty += p;
              missedCount += missedEx.length;
              details.push(`${missedEx.length} exercises (-${p})`);
            }
          }
          if (totalPenalty > 0) {
            const newXp = S.xp - totalPenalty;
            const newLvl = newXp < 0 ? Math.max(1, S.level - 1) : S.level;
            Object.assign(changes, {
              xp: newXp < 0 ? Math.max(0, getXp(newLvl) + newXp) : newXp,
              level: newLvl,
              totalXp: Math.max(0, S.totalXp - totalPenalty),
              penaltyLog: [...S.penaltyLog, {
                date: S.lastDailyReset,
                missed: missedCount,
                penalty: totalPenalty,
                type: "daily",
                details: details.join(", ")
              }]
            });
            setTimeout(() => setNotif(`⚠️ -${totalPenalty} XP! ${details.join(", ")}`), 500);
          } else {
            changes.streak = S.streak + 1;
          }
        }
        Object.assign(g.current, changes);
        await saveToIDB(g.current);
      } else if (!S.lastDailyReset) {
        g.current.lastDailyReset = today;
        await saveToIDB(g.current);
      }

      // ─── AUTO WEEKLY RESET + PENALTY ───
      const wkId = getWeekId(new Date());
      if (g.current.lastWeeklyReset && g.current.lastWeeklyReset !== wkId) {
        const changes = {
          doneW: [],
          lastWeeklyReset: wkId
        };
        if (!g.current.vacation) {
          const missed = WEEKLY_OBJ.filter(q => !g.current.doneW.includes(q.id));
          if (missed.length > 0) {
            const penalty = missed.reduce((s, q) => s + q.xp, 0);
            const newXp = g.current.xp - penalty;
            const newLvl = newXp < 0 ? Math.max(1, g.current.level - 1) : g.current.level;
            Object.assign(changes, {
              xp: newXp < 0 ? Math.max(0, getXp(newLvl) + newXp) : newXp,
              level: newLvl,
              totalXp: Math.max(0, g.current.totalXp - penalty),
              penaltyLog: [...g.current.penaltyLog, {
                date: g.current.lastWeeklyReset,
                missed: missed.length,
                penalty,
                type: "weekly"
              }]
            });
            setTimeout(() => setNotif(`⚠️ -${penalty} XP weekly penalty!`), 1500);
          }
        }
        Object.assign(g.current, changes);
        await saveToIDB(g.current);
      } else if (!g.current.lastWeeklyReset) {
        g.current.lastWeeklyReset = wkId;
        await saveToIDB(g.current);
      }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoaded(true);
        forceUpdate();
      }
    })();
  }, []);

  // ─── REMINDERS (blocking modal · sleep daily on open · weight+BF on Thursdays) ───
  useEffect(() => {
    if (!loaded) return;
    if (reminderModal) return;
    const today = new Date().toISOString().slice(0, 10);
    const sl = g.current.sleepLog || [];
    const yKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const sleptLogged = sl.some(s => s.date === yKey || s.date === today);
    // Sleep reminder once per day, if not logged
    if (g.current._lastSleepReminder !== today && !sleptLogged) {
      g.current._lastSleepReminder = today;
      setTimeout(() => setReminderModal("sleep"), 800);
      return;
    } else if (g.current._lastSleepReminder !== today) {
      g.current._lastSleepReminder = today;
    }
    // Thursday weight+BF reminder (getDay 4 = Thursday)
    if (new Date().getDay() === 4) {
      const wl = (g.current.weightLog || []).filter(w => {
        const d = new Date().toLocaleDateString();
        return w.date === d;
      });
      if (g.current._lastWeightReminder !== today && wl.length === 0) {
        g.current._lastWeightReminder = today;
        setTimeout(() => setReminderModal("weight"), 800);
      }
    }
  }, [loaded, reminderModal]);
  const rank = getRank(level);
  const xpN = getXp(level);
  const tPPL = PPL[new Date().getDay()];

  // ─── XP helpers with multipliers ───
  const getMultiplier = () => {
    const rm = getRankMultiplier(level);
    const sm = getStreakMultiplier(streak);
    return Math.round(rm * sm * 10) / 10;
  };
  const calcXpAdd = (baseAmt, stat) => {
    const mult = getMultiplier();
    const amt = Math.round(baseAmt * mult);
    const newStats = {
      ...stats,
      [stat]: stats[stat] + 1
    };
    const newTotal = totalXp + amt;
    const n = xp + amt;
    if (n >= xpN) return {
      xp: n - xpN,
      level: level + 1,
      stats: newStats,
      totalXp: newTotal,
      _xpGain: amt,
      _mult: mult
    };
    return {
      xp: n,
      stats: newStats,
      totalXp: newTotal,
      _xpGain: amt,
      _mult: mult
    };
  };
  const calcXpRemove = (baseAmt, stat) => {
    const mult = getMultiplier();
    const amt = Math.round(baseAmt * mult);
    const newStats = {
      ...stats,
      [stat]: Math.max(0, stats[stat] - 1)
    };
    const newTotal = Math.max(0, totalXp - amt);
    const n = xp - amt;
    if (n < 0) return {
      xp: Math.max(0, getXp(Math.max(1, level - 1)) + n),
      level: Math.max(1, level - 1),
      stats: newStats,
      totalXp: newTotal,
      _xpGain: amt
    };
    return {
      xp: n,
      stats: newStats,
      totalXp: newTotal,
      _xpGain: amt
    };
  };
  const showQuestComplete = (xpGain, mult) => {
    const quote = QUEST_QUOTES[Math.floor(Math.random() * QUEST_QUOTES.length)];
    setQuestPopup({
      quote,
      xpGain,
      multiplier: mult
    });
  };
  const toggleQ = id => {
    const q = ALL_QUESTS.find(x => x.id === id);
    if (!q) return;
    const muscleMap = {
      pushups: ["chest", "triceps", "shoulders"],
      squats: ["quads", "glutes"],
      situps: ["core"],
      treadmill: ["cardio"],
      plank: ["core"],
      extrarun: ["cardio"],
      nosugar: [],
      farmercarry: ["core"],
      kettlebell: ["core"],
      swimsauna: ["cardio"],
      weightedplank: ["core"],
      calfblitz: ["calves"],
      extrardl: ["quads"],
      protein: [],
      mobility: [],
      inclinepush: ["chest", "triceps"],
      diamondpush: ["chest", "triceps"]
    };
    if (done.includes(id)) {
      const newMxp = {
        ...muscleXp
      };
      (muscleMap[id] || []).forEach(m => {
        newMxp[m] = Math.max(0, (newMxp[m] || 0) - 3);
      });
      const xpC = calcXpRemove(q.xp, q.stat);
      update({
        done: done.filter(x => x !== id),
        qC: Math.max(0, qC - 1),
        muscleXp: newMxp,
        ...xpC
      });
      setNotif(`↩ -${xpC._xpGain} XP · ${q.stat} reverted`);
    } else {
      const newMxp = {
        ...muscleXp
      };
      (muscleMap[id] || []).forEach(m => {
        newMxp[m] = (newMxp[m] || 0) + 3;
      });
      const xpC = calcXpAdd(q.xp, q.stat);
      update({
        done: [...done, id],
        qC: qC + 1,
        muscleXp: newMxp,
        ...xpC
      });
      if (xpC.level > level) setShowLvl(true);
      showQuestComplete(xpC._xpGain, xpC._mult);
    }
  };
  const toggleBossQ = bq => {
    const id = bq.id;
    if (done.includes(id)) {
      const newMxp = {
        ...muscleXp
      };
      if (bq.muscle) newMxp[bq.muscle] = Math.max(0, (newMxp[bq.muscle] || 0) - 5);
      const xpC = calcXpRemove(bq.xp, bq.stat);
      update({
        done: done.filter(x => x !== id),
        qC: Math.max(0, qC - 1),
        muscleXp: newMxp,
        ...xpC
      });
      setNotif(`↩ -${xpC._xpGain} XP · boss quest revenit`);
    } else {
      const newMxp = {
        ...muscleXp
      };
      if (bq.muscle) newMxp[bq.muscle] = (newMxp[bq.muscle] || 0) + 5;
      const xpC = calcXpAdd(bq.xp, bq.stat);
      update({
        done: [...done, id],
        qC: qC + 1,
        muscleXp: newMxp,
        ...xpC
      });
      if (xpC.level > level) setShowLvl(true);
      showQuestComplete(xpC._xpGain, xpC._mult);
    }
  };
  const toggleEx = n => {
    const newMxp = {
      ...muscleXp
    };
    if (doneEx.includes(n)) {
      MUSCLE_GROUPS.forEach(mg => {
        if (mg.exercises.includes(n)) newMxp[mg.key] = Math.max(0, (newMxp[mg.key] || 0) - 5);
      });
      const xpC = calcXpRemove(10, "STR");
      update({
        doneEx: doneEx.filter(x => x !== n),
        muscleXp: newMxp,
        ...xpC
      });
      setNotif("↩ -" + xpC._xpGain + " XP · STR reverted");
    } else {
      MUSCLE_GROUPS.forEach(mg => {
        if (mg.exercises.includes(n)) newMxp[mg.key] = (newMxp[mg.key] || 0) + 5;
      });
      const xpC = calcXpAdd(10, "STR");
      update({
        doneEx: [...doneEx, n],
        muscleXp: newMxp,
        ...xpC
      });
      if (xpC.level > level) setShowLvl(true);
      showQuestComplete(xpC._xpGain, xpC._mult);
    }
  };
  // Anuleaza un exercitiu bifat din greseala: scoate din doneEx, reverseaza XP/muscle,
  // si sterge sesiunea logata AZI pentru acel exercitiu (daca exista).
  const undoExercise = n => {
    const changes = {};
    // Reverse XP + muscleXp + doneEx
    if (doneEx.includes(n)) {
      const newMxp = {
        ...muscleXp
      };
      MUSCLE_GROUPS.forEach(mg => {
        if (mg.exercises.includes(n)) newMxp[mg.key] = Math.max(0, (newMxp[mg.key] || 0) - 5);
      });
      const xpC = calcXpRemove(10, "STR");
      Object.assign(changes, {
        doneEx: doneEx.filter(x => x !== n),
        muscleXp: newMxp,
        ...xpC
      });
    }
    // Remove today's logged session for this exercise (if any)
    const ll = g.current.liftLog || {};
    if (ll[n] && ll[n].some(s => s.date === todayStr)) {
      const filtered = ll[n].filter(s => s.date !== todayStr);
      const newLL = {
        ...ll
      };
      if (filtered.length) newLL[n] = filtered;else delete newLL[n];
      changes.liftLog = newLL;
      // Decrement workout calendar count for today
      const wc = {
        ...(g.current.workoutCalendar || {})
      };
      if (wc[todayStr]) {
        wc[todayStr] = Math.max(0, wc[todayStr] - 1);
        if (!wc[todayStr]) delete wc[todayStr];
        changes.workoutCalendar = wc;
      }
    }
    // Clear any failed-set marker
    if (failedSets[`${todayStr}_${n}`]) {
      const fs = {
        ...failedSets
      };
      delete fs[`${todayStr}_${n}`];
      setFailedSets(fs);
    }
    update(changes);
    setNotif("\u21A9 Exercitiu anulat \xB7 XP si set-urile de azi eliminate");
  };
  const toggleW = id => {
    const q = WEEKLY_OBJ.find(x => x.id === id);
    if (!q) return;
    if (doneW.includes(id)) {
      const xpC = calcXpRemove(q.xp, q.stat);
      update({
        doneW: doneW.filter(x => x !== id),
        ...xpC
      });
      setNotif(`↩ -${xpC._xpGain} XP · Weekly reverted`);
    } else {
      const xpC = calcXpAdd(q.xp, q.stat);
      update({
        doneW: [...doneW, id],
        ...xpC
      });
      if (xpC.level > level) setShowLvl(true);
      showQuestComplete(xpC._xpGain, xpC._mult);
    }
  };
  const completeL = (wk, dy) => {
    const k = `${wk}-${dy}`;
    if (doneLessons.includes(k)) return;
    const xpC = calcXpAdd(45, "INT");
    update({
      doneLessons: [...doneLessons, k],
      dailyLessonDone: true,
      ...xpC
    });
    if (xpC.level > level) setShowLvl(true);
    showQuestComplete(xpC._xpGain, xpC._mult);
  };
  const addSoc = () => {
    if (!sN) return;
    const xpC = calcXpAdd(20, "PER");
    update({
      socialLog: [...socialLog, {
        name: sN,
        type: sT,
        date: new Date().toLocaleDateString()
      }],
      ...xpC
    });
    setSN("");
    if (xpC.level > level) setShowLvl(true);
    showQuestComplete(xpC._xpGain, xpC._mult);
  };
  const addWeightEntry = () => {
    if (!newWeight) return;
    update({
      weightLog: [...weightLog, {
        date: new Date().toLocaleDateString(),
        weight: parseFloat(newWeight),
        fat: newFat ? parseFloat(newFat) : null,
        muscle: newMuscle ? parseFloat(newMuscle) : null
      }]
    });
    setNewWeight("");
    setNewFat("");
    setNewMuscle("");
    setNotif("📊 Weight logged!");
  };

  // Lift logging
  const getLastSession = exName => {
    const entries = liftLog[exName];
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1];
  };
  // Progressive overload: detect if top set kg+reps unchanged across last N sessions
  const getStagnation = exName => {
    const entries = liftLog[exName];
    if (!entries || entries.length < 3) return null;
    const topOf = sess => {
      if (!sess.sets || !sess.sets.length) return null;
      let best = sess.sets[0];
      for (const s of sess.sets) {
        if (!s.isFail && ((parseFloat(s.kg) || 0) > (parseFloat(best.kg) || 0))) best = s;
      }
      return {
        kg: parseFloat(best.kg) || 0,
        reps: parseInt(best.reps) || 0
      };
    };
    const last3 = entries.slice(-3).map(topOf);
    if (last3.some(t => !t)) return null;
    const same = last3.every(t => t.kg === last3[0].kg && t.reps === last3[0].reps);
    if (same && last3[0].kg > 0) {
      return {
        kg: last3[0].kg,
        reps: last3[0].reps,
        n: 3
      };
    }
    return null;
  };
  // Increment-uri pe tip de exercitiu:
  // DB exercises: doar din 2 in 2 kg (ganterele Rafa)
  // Barbell exercises: din 2.5 in 2.5 kg (placa minima 1.25kg/parte)
  // Machines (cable, smith, leg press, etc): din 2.5 in 2.5 (sau 5 daca placi mari)
  const getKgIncrement = exName => {
    // DB / Dumbbell exercises - increment 2kg
    const dbExercises = ["DB Bench Press", "DB Incline Bench Press", "Incline DB Press", "Arnold Press", "Single Arm DB Row", "Lateral Raises", "Front Raises", "Hammer Curls", "Incline Curls", "Concentration Curls", "Reverse Flyes", "Bulgarian Split Squat"];
    // Light isolation barbell/EZ - increment 2.5kg
    // Compound barbell - increment 2.5-5kg
    const heavyCompound = ["Bench Press", "Squats", "Overhead Press", "Leg Press", "Hip Thrust"];
    if (dbExercises.includes(exName)) return 2;
    if (heavyCompound.includes(exName)) return 2.5;
    return 2.5; // default: cables, isolation, etc
  };
  const getRecommendation = (exName, setIdx) => {
    const last = getLastSession(exName);
    if (!last || !last.sets || !last.sets[setIdx]) return null;
    const prev = last.sets[setIdx];
    const prevKg = parseFloat(prev.kg) || 0;
    const prevReps = parseInt(prev.reps) || 0;
    let maxReps = 12;
    let minReps = 8;
    let isRepsOnly = false;
    for (const day of Object.values(PPL)) {
      for (const ex of day.exercises || []) {
        if (ex.name === exName) {
          const m = ex.sets.match(/\d+[×x](\d+)(?:-(\d+))?/);
          if (m) {
            minReps = parseInt(m[1]);
            maxReps = parseInt(m[2] || m[1]);
          }
          if (ex.repsOnly) isRepsOnly = true;
          break;
        }
      }
    }
    // Bodyweight: progresie exclusiv prin repetari, niciodata prin greutate
    if (isRepsOnly) return {
      kg: 0,
      reps: prevReps + 1,
      note: "\u2192 +1 rep"
    };
    const inc = getKgIncrement(exName);
    // Daca a atins max reps cu form bun → creste greutate
    if (prevReps >= maxReps) return {
      kg: prevKg + inc,
      reps: minReps,
      note: `↑ +${inc}kg`
    };
    // Altfel, mai 1 rep (double progression)
    return {
      kg: prevKg,
      reps: prevReps + 1,
      note: "→ +1 rep"
    };
  };
  const logExerciseSets = (exName, sets) => {
    const newLiftLog = {
      ...liftLog,
      [exName]: [...(liftLog[exName] || []), {
        date: todayStr,
        sets
      }]
    };
    const changes = {
      liftLog: newLiftLog
    };
    // Track workout calendar
    const wc = {
      ...(g.current.workoutCalendar || {})
    };
    wc[todayStr] = (wc[todayStr] || 0) + 1;
    changes.workoutCalendar = wc;
    if (!doneEx.includes(exName)) {
      const newMxp = {
        ...muscleXp
      };
      MUSCLE_GROUPS.forEach(mg => {
        if (mg.exercises.includes(exName)) newMxp[mg.key] = (newMxp[mg.key] || 0) + 5;
      });
      const xpC = calcXpAdd(10, "STR");
      Object.assign(changes, {
        doneEx: [...doneEx, exName],
        muscleXp: newMxp,
        ...xpC
      });
      showQuestComplete(xpC._xpGain, xpC._mult);
    }
    // Check active boss progress
    const ab = g.current.activeBoss;
    if (ab && ab.target.type === "lift" && ab.target.exercise === exName) {
      const maxSet = sets.reduce((m, s) => s.kg >= ab.target.kg && s.reps >= ab.target.reps && (!m || s.kg > m.kg) ? s : m, null);
      if (maxSet) {
        // VICTORY!
        const newBoss = null;
        const completed = {
          ...ab,
          completedDate: todayStr,
          result: "victory"
        };
        Object.assign(changes, {
          activeBoss: newBoss,
          bossHistory: [...(g.current.bossHistory || []), completed]
        });
        const xpReward = calcXpAdd(ab.reward.xp, "STR");
        Object.assign(changes, xpReward);
        if (soundOn) playSound("levelUp");
        setNotif(`🏆 BOSS DEFEATED! +${ab.reward.xp} XP · "${ab.reward.badge}" earned!`);
      } else if (soundOn) playSound("bossDamage");
    }
    update(changes);
    setEditingEx(null);
  };

  // Boss helpers
  const acceptBoss = boss => {
    // Snapshot baselines so progress counts only work done DURING this boss.
    // Muscle XP accumulates from ALL sources (PPL exercises, finishers, bonus
    // quests, boss quests), so a muscle-target boss is fed by every exercise
    // on that group that day, not just its own boss quests.
    const t = boss.target || {};
    const baseMuscle = t.muscle ? (g.current.muscleXp && g.current.muscleXp[t.muscle]) || 0 : 0;
    const baseStat = t.statTarget ? (g.current.stats && g.current.stats[t.statTarget]) || 0 : 0;
    const baseStreak = g.current.streak || 0;
    update({
      activeBoss: {
        ...boss,
        acceptedDate: new Date().toISOString().slice(0, 10),
        damageDone: 0,
        baseMuscle,
        baseStat,
        baseStreak
      }
    });
    setNotif(`⚔️ Boss accepted: ${boss.name}!`);
  };
  const cancelBoss = () => {
    if (!g.current.activeBoss) return;
    const ab = {
      ...g.current.activeBoss,
      result: "abandoned",
      completedDate: new Date().toISOString().slice(0, 10)
    };
    update({
      activeBoss: null,
      bossHistory: [...(g.current.bossHistory || []), ab]
    });
    setNotif("Boss abandoned. No penalty.");
  };
  const claimBossVictory = () => {
    const ab = g.current.activeBoss;
    if (!ab) return;
    const completed = {
      ...ab,
      result: "victory",
      completedDate: new Date().toISOString().slice(0, 10)
    };
    const changes = {
      activeBoss: null,
      bossHistory: [...(g.current.bossHistory || []), completed]
    };
    const statForReward = ab.target && ab.target.statTarget ? ab.target.statTarget : "STR";
    Object.assign(changes, calcXpAdd(ab.reward.xp, statForReward));
    update(changes);
    if (soundOn) playSound("levelUp");
    setNotif(`🏆 BOSS DEFEATED! +${ab.reward.xp} XP · "${ab.reward.badge}" earned!`);
  };
  const checkBossProgress = () => {
    const ab = g.current.activeBoss;
    if (!ab) return null;
    if (ab.target.type === "streak") {
      const base = ab.baseStreak || 0;
      const gained = Math.max(0, (g.current.streak || 0) - base);
      return Math.min(100, gained / ab.target.days * 100);
    }
    if (ab.target.type === "muscleXp") {
      // Stat-only muscleXp bosses (e.g. AGI) key off the stat delta
      if (ab.target.statTarget && ab.target.statAmount) {
        const baseS = ab.baseStat || 0;
        const gainedS = Math.max(0, ((g.current.stats && g.current.stats[ab.target.statTarget]) || 0) - baseS);
        return Math.min(100, gainedS / ab.target.statAmount * 100);
      }
      // Muscle-group bosses: progress = XP gained on that group SINCE accepting,
      // fed by every exercise on the group (PPL, finishers, bonus, boss quests).
      const base = ab.baseMuscle || 0;
      const gained = Math.max(0, ((g.current.muscleXp && g.current.muscleXp[ab.target.muscle]) || 0) - base);
      return Math.min(100, gained / ab.target.amount * 100);
    }
    if (ab.target.type === "lift") {
      const lifts = g.current.liftLog[ab.target.exercise] || [];
      const lastSession = lifts[lifts.length - 1];
      if (!lastSession) return 0;
      const max = Math.max(...lastSession.sets.map(s => s.kg));
      return Math.min(100, max / ab.target.kg * 100);
    }
    return 0;
  };

  // Sleep tracker
  const logSleep = (hours, rating, readiness) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const existing = (g.current.sleepLog || []).filter(s => s.date !== todayKey);
    const entry = {
      date: todayKey,
      hours: parseFloat(hours),
      rating: parseInt(rating)
    };
    const rd = parseInt(readiness);
    if (!isNaN(rd) && rd > 0) entry.readiness = Math.min(100, rd);
    const newLog = [...existing, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
    update({
      sleepLog: newLog
    });
    setNotif(`😴 Somn logat: ${fmtSleep(hours)} · ${rating}/5${readiness ? ` · R${readiness}` : ""}`);
  };

  // Exercise swap
  const swapExercise = (originalName, newName) => {
    const swaps = {
      ...(g.current.exerciseSwaps || {})
    };
    swaps[`${todayStr}_${originalName}`] = newName;
    update({
      exerciseSwaps: swaps
    });
    setSwapModal(null);
    setNotif(`🔄 Schimbat in ${newName} pentru azi`);
  };
  const revertSwap = originalName => {
    const swaps = {
      ...(g.current.exerciseSwaps || {})
    };
    delete swaps[`${todayStr}_${originalName}`];
    update({
      exerciseSwaps: swaps
    });
    setSwapModal(null);
    setNotif(`↩️ Revenit la ${originalName}`);
  };
  const exportSave = () => {
    const str = btoa(encodeURIComponent(JSON.stringify({
      ...g.current,
      exportDate: new Date().toISOString()
    })));
    setExportStr(str);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(str).then(() => setNotif("📋 Copied!")).catch(() => setNotif("📋 Ready — long press to copy"));
    } else setNotif("📋 Ready — long press to copy");
  };
  const importSave = () => {
    try {
      const raw = JSON.parse(decodeURIComponent(atob(importStr.trim())));
      const merged = {
        ...DEFAULT_STATE
      };
      for (const k of SAVE_FIELDS) if (raw[k] !== undefined) merged[k] = raw[k];
      update(merged);
      setImportStr("");
      setShowImportConfirm(false);
      setNotif("✅ Save imported!");
    } catch (e) {
      setNotif("❌ Invalid save code.");
    }
  };
  const resetAllData = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(DATA_KEY);
    } catch (e) {}
    update({
      ...DEFAULT_STATE
    });
    setNotif("🔄 All data reset. Fresh start, Hunter.");
  };
  const dC = DAILY_Q.filter(q => done.includes(q.id)).length;
  const allD = PENALIZABLE_DAILY.every(q => done.includes(q.id));
  const lC = LIFE_Q.filter(q => done.includes(q.id)).length;
  const ACTIVE_SPLIT = vacation ? NO_GYM : PPL;
  const vPPLraw = ACTIVE_SPLIT[selPPL];
  // Apply today's exercise swaps so the rendered exercise IS the swapped one
  const vPPL = (() => {
    if (!vPPLraw || !vPPLraw.exercises) return vPPLraw;
    const swaps = g.current.exerciseSwaps || {};
    let changed = false;
    const exercises = vPPLraw.exercises.filter(ex => !ex.agiFinisher || g.current.agiUnlocked).map(ex => {
      const newName = swaps[`${todayStr}_${ex.name}`];
      if (newName && newName !== ex.name) {
        changed = true;
        const altInfo = (EXERCISE_ALTERNATIVES[ex.name] || []).find(a => a.name === newName);
        return {
          ...ex,
          name: newName,
          swappedFrom: ex.name,
          desc: altInfo ? `Inlocuieste ${ex.name} (${altInfo.reason}). ${ex.desc}` : ex.desc
        };
      }
      return ex;
    });
    return changed ? {
      ...vPPLraw,
      exercises
    } : vPPLraw;
  })();
  const wC = WEEKLY_OBJ.filter(q => doneW.includes(q.id)).length;
  const tLC = doneLessons.length;
  const curWk = Math.min(Math.floor(tLC / 7), 7);
  const latestW = weightLog[weightLog.length - 1];
  const goalW = 105;
  const startW = 115;
  // Phase 2: after hitting 105kg, target flips to BF <=20%
  const phase2 = latestW.weight <= goalW;
  const bfGoal = 20;
  const latestBf = typeof latestW.fat === "number" ? latestW.fat : null;
  const progress = phase2 ? (latestBf !== null ? Math.max(0, Math.min(100, (30 - latestBf) / (30 - bfGoal) * 100)) : 0) : Math.max(0, Math.min(100, (startW - latestW.weight) / (startW - goalW) * 100));
  const IS = {
    width: "100%",
    padding: "10px 12px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "'Courier New',monospace",
    outline: "none",
    boxSizing: "border-box"
  };
  const tabs = [{
    k: "quests",
    i: "⚔️",
    l: "QUESTS"
  }, {
    k: "training",
    i: "🏋️",
    l: "PPL"
  }, {
    k: "progress",
    i: "📈",
    l: "STATS"
  }, {
    k: "health",
    i: "⚖️",
    l: "BODY"
  }, {
    k: "rank",
    i: "📊",
    l: "RANK"
  }, {
    k: "settings",
    i: "⚙️",
    l: "SAVE"
  }];

  // ─── REST TIMER LOGIC (with sound) ───
  useEffect(() => {
    if (!restTimer || restTimer.paused) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - restTimer.startTime) / 1000);
      setRestElapsed(elapsed);
      if (elapsed === restTimer.totalSec) {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        if (soundOn) playSound("ready");
      }
      if (elapsed === restTimer.totalSec + 30) {
        if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
        if (soundOn) playSound("overdue");
      }
    }, 200);
    return () => clearInterval(interval);
  }, [restTimer, soundOn]);

  // ─── EXERCISE PAUSE TIMER LOGIC ───
  useEffect(() => {
    if (!exerciseRestTimer) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - exerciseRestTimer.startTime) / 1000);
      setExerciseRestElapsed(elapsed);
      if (elapsed === exerciseRestTimer.totalSec) {
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
        if (soundOn) playSound("ready");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [exerciseRestTimer, soundOn]);
  const startRest = (exerciseName, setNum, seconds, color) => {
    setRestTimer({
      totalSec: seconds,
      exerciseName,
      setNum,
      startTime: Date.now(),
      paused: false,
      color: color || "#3b82f6"
    });
    setRestElapsed(0);
    if (soundOn) playSound("setLogged");
  };
  const stopRest = (logIt = true) => {
    if (restTimer && logIt) {
      const actual = Math.floor((Date.now() - restTimer.startTime) / 1000);
      setRestHistory(h => [...h, {
        exerciseName: restTimer.exerciseName,
        setNum: restTimer.setNum,
        plannedSec: restTimer.totalSec,
        actualSec: actual,
        date: new Date().toISOString().slice(0, 16)
      }].slice(-50));
    }
    setRestTimer(null);
    setRestElapsed(0);
  };
  const addTime = seconds => {
    if (!restTimer) return;
    setRestTimer({
      ...restTimer,
      totalSec: restTimer.totalSec + seconds
    });
  };
  const startExerciseRest = (nextExerciseName, seconds, color) => {
    setExerciseRestTimer({
      totalSec: seconds,
      nextExerciseName,
      startTime: Date.now(),
      color: color || "#a855f7"
    });
    setExerciseRestElapsed(0);
    if (soundOn) playSound("setLogged");
  };
  const stopExerciseRest = () => {
    setExerciseRestTimer(null);
    setExerciseRestElapsed(0);
  };
  if (!loaded) return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#020617",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#3b82f6",
      fontFamily: "'Courier New',monospace",
      fontSize: 14,
      letterSpacing: 2
    }
  }, "\u25C6 LOADING SYSTEM... \u25C6");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "linear-gradient(180deg,#020617 0%,#0f172a 40%,#020617 100%)",
      color: "#e2e8f0",
      fontFamily: "'Courier New',monospace",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes questFlash{from{opacity:1}to{opacity:0}}@keyframes notifIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes levelUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes gridPulse{0%,100%{opacity:.03}50%{opacity:.06}}input::placeholder{color:#334155}`), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      backgroundImage: "linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px)",
      backgroundSize: "40px 40px",
      animation: "gridPulse 4s ease infinite",
      pointerEvents: "none"
    }
  }), notif && /*#__PURE__*/React.createElement(Notif, {
    msg: notif,
    onDone: () => setNotif(null)
  }), reminderModal && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 10001,
      background: "rgba(2,6,23,0.88)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 360,
      background: "linear-gradient(160deg,rgba(15,23,42,0.99),rgba(30,41,59,0.99))",
      border: `1px solid ${reminderModal === "sleep" ? "rgba(99,102,241,0.5)" : "rgba(34,197,94,0.5)"}`,
      borderRadius: 14,
      padding: "20px 18px",
      boxShadow: "0 0 40px rgba(0,0,0,0.6)",
      fontFamily: "'Courier New',monospace"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      textAlign: "center",
      marginBottom: 6
    }
  }, reminderModal === "sleep" ? "\uD83D\uDE34" : "\u2696\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: reminderModal === "sleep" ? "#a5b4fc" : "#4ade80",
      textAlign: "center",
      letterSpacing: 1,
      marginBottom: 4,
      fontWeight: 700
    }
  }, reminderModal === "sleep" ? "SOMN — NOAPTEA TRECUTA" : "JOI — GREUTATE + BF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#64748b",
      textAlign: "center",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, reminderModal === "sleep" ? "Somnul e factorul #1 pentru retentia musculara. Logheaza sau amana." : "Masuratoare saptamanala. Introdu datele de pe cantar."),
  // ── SLEEP FIELDS ──
  reminderModal === "sleep" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    autoComplete: "off",
    autoCorrect: "off",
    value: rmSleepH,
    placeholder: "ore",
    onChange: e => setRmSleepH(e.target.value.replace(/[^0-9]/g, "").slice(0, 2)),
    style: {
      width: "100%",
      padding: "10px",
      background: "rgba(0,0,0,.35)",
      border: "1px solid rgba(99,102,241,.35)",
      borderRadius: 6,
      color: "#e2e8f0",
      fontSize: 13,
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#64748b",
      fontSize: 16,
      fontWeight: 700
    }
  }, ":"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    autoComplete: "off",
    autoCorrect: "off",
    value: rmSleepM,
    placeholder: "min",
    onChange: e => setRmSleepM(e.target.value.replace(/[^0-9]/g, "").slice(0, 2)),
    style: {
      width: "100%",
      padding: "10px",
      background: "rgba(0,0,0,.35)",
      border: "1px solid rgba(99,102,241,.35)",
      borderRadius: 6,
      color: "#e2e8f0",
      fontSize: 13,
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
      textAlign: "center"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#64748b",
      textAlign: "center",
      marginBottom: 4
    }
  }, "Calitate somn"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "center",
      marginBottom: 16
    }
  }, [1, 2, 3, 4, 5].map(r => /*#__PURE__*/React.createElement("button", {
    key: r,
    onClick: () => setRmSleepR(r),
    style: {
      width: 34,
      height: 34,
      padding: 0,
      background: r <= rmSleepR ? "rgba(99,102,241,.3)" : "rgba(0,0,0,.3)",
      border: `1px solid ${r <= rmSleepR ? "#a5b4fc" : "rgba(255,255,255,.1)"}`,
      borderRadius: 6,
      color: r <= rmSleepR ? "#fbbf24" : "#475569",
      fontSize: 16,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u2605")))),
  // ── WEIGHT FIELDS ──
  reminderModal === "weight" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, [{
    v: rmWeight,
    set: setRmWeight,
    ph: "Greutate kg (ex: 107.5)"
  }, {
    v: rmFat,
    set: setRmFat,
    ph: "Grasime % (BF)"
  }, {
    v: rmMuscle,
    set: setRmMuscle,
    ph: "Muschi kg (optional)"
  }].map((f, i) => /*#__PURE__*/React.createElement("input", {
    key: i,
    type: "text",
    inputMode: "decimal",
    autoComplete: "off",
    autoCorrect: "off",
    value: f.v,
    placeholder: f.ph,
    onChange: e => f.set(e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "")),
    style: {
      width: "100%",
      padding: "10px",
      background: "rgba(0,0,0,.35)",
      border: "1px solid rgba(34,197,94,.3)",
      borderRadius: 6,
      color: "#e2e8f0",
      fontSize: 13,
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 8,
      textAlign: "center"
    }
  }))),
  // ── BUTTONS ──
  /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setReminderModal(null);
      setRmSleepH("");
      setRmSleepM("");
      setRmSleepR(0);
      setRmWeight("");
      setRmFat("");
      setRmMuscle("");
    },
    style: {
      flex: 1,
      padding: "11px",
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.1)",
      borderRadius: 7,
      color: "#94a3b8",
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Amana"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (reminderModal === "sleep") {
        if (!rmSleepH && !rmSleepM || rmSleepR === 0) {
          setNotif("Introdu ore + minute si rating, sau apasa Amana");
          return;
        }
        logSleep(hmToDec(rmSleepH, rmSleepM), rmSleepR);
      } else {
        if (!rmWeight) {
          setNotif("Introdu cel putin greutatea, sau apasa Amana");
          return;
        }
        update({
          weightLog: [...weightLog, {
            date: new Date().toLocaleDateString(),
            weight: parseFloat(rmWeight),
            fat: rmFat ? parseFloat(rmFat) : null,
            muscle: rmMuscle ? parseFloat(rmMuscle) : null
          }]
        });
        setNotif("\uD83D\uDCCA Greutate logata!");
      }
      setReminderModal(null);
      setRmSleepH("");
      setRmSleepM("");
      setRmSleepR(0);
      setRmWeight("");
      setRmFat("");
      setRmMuscle("");
    },
    style: {
      flex: 2,
      padding: "11px",
      background: reminderModal === "sleep" ? "linear-gradient(135deg,rgba(99,102,241,.35),rgba(168,85,247,.2))" : "linear-gradient(135deg,rgba(34,197,94,.35),rgba(59,130,246,.2))",
      border: `1px solid ${reminderModal === "sleep" ? "rgba(99,102,241,.5)" : "rgba(34,197,94,.5)"}`,
      borderRadius: 7,
      color: reminderModal === "sleep" ? "#c7d2fe" : "#86efac",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Salveaza")))), questPopup && /*#__PURE__*/React.createElement(QuestPopup, {
    quote: questPopup.quote,
    xpGain: questPopup.xpGain,
    multiplier: questPopup.multiplier,
    onClose: () => setQuestPopup(null)
  }), showLvl && /*#__PURE__*/React.createElement(LvlModal, {
    level: level,
    rank: rank,
    onClose: () => setShowLvl(false)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 440,
      margin: "0 auto",
      padding: "14px 14px 100px",
      position: "relative",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 14,
      paddingTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      letterSpacing: 6,
      color: "#3b82f6",
      textTransform: "uppercase",
      animation: "pulse 3s ease infinite"
    }
  }, "\u25C6 SYSTEM INTERFACE \u25C6"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#334155",
      marginTop: 4,
      letterSpacing: 1
    }
  }, "STARTED APR 13, 2026 \xB7 DAY ", daysSinceStart + 1)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",
      border: "1px solid rgba(59,130,246,.15)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 16,
      height: 16,
      borderTop: "2px solid rgba(59,130,246,.4)",
      borderLeft: "2px solid rgba(59,130,246,.4)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 16,
      height: 16,
      borderTop: "2px solid rgba(59,130,246,.4)",
      borderRight: "2px solid rgba(59,130,246,.4)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: 16,
      height: 16,
      borderBottom: "2px solid rgba(59,130,246,.4)",
      borderLeft: "2px solid rgba(59,130,246,.4)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 16,
      height: 16,
      borderBottom: "2px solid rgba(59,130,246,.4)",
      borderRight: "2px solid rgba(59,130,246,.4)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      fontFamily: "'Georgia',serif",
      color: "#f1f5f9"
    }
  }, "HUNTER"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: rank.color,
      letterSpacing: 2,
      marginTop: 2
    }
  }, rank.name.toUpperCase())), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 900,
      color: rank.color,
      fontFamily: "'Georgia',serif",
      textShadow: `0 0 20px ${rank.color}44`,
      animation: "float 3s ease infinite"
    }
  }, level)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 9,
      color: "#475569",
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", null, "EXP"), /*#__PURE__*/React.createElement("span", null, xp, "/", xpN)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 7,
      background: "rgba(255,255,255,.05)",
      borderRadius: 4,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${xp / xpN * 100}%`,
      background: "linear-gradient(90deg,#1e40af,#3b82f6)",
      borderRadius: 4,
      boxShadow: "0 0 12px rgba(59,130,246,.4)",
      transition: "width .6s ease"
    }
  }))), /*#__PURE__*/React.createElement(StatBar, {
    label: "STR",
    value: stats.STR,
    color: "#ef4444"
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "VIT",
    value: stats.VIT,
    color: "#22c55e"
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "AGI",
    value: stats.AGI,
    color: "#eab308"
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "INT",
    value: stats.INT,
    color: "#3b82f6"
  }), /*#__PURE__*/React.createElement(StatBar, {
    label: "PER",
    value: stats.PER,
    color: "#a855f7"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10,
      paddingTop: 8,
      borderTop: "1px solid rgba(255,255,255,.04)",
      flexWrap: "wrap",
      fontSize: 9,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD25", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f59e0b"
    }
  }, streak)), /*#__PURE__*/React.createElement("span", null, "\u2694\uFE0F", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, qC)), /*#__PURE__*/React.createElement("span", null, "\u2726", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#93c5fd"
    }
  }, totalXp)), /*#__PURE__*/React.createElement("span", null, "\u2696\uFE0F", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#22c55e"
    }
  }, latestW.weight, "kg")), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCDA", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#a78bfa"
    }
  }, "W", curWk + 1)), /*#__PURE__*/React.createElement("span", null, "\u26A1", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fbbf24"
    }
  }, getMultiplier(), "x")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      marginBottom: 12,
      overflowX: "auto",
      paddingBottom: 2
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setTab(t.k),
    style: {
      flex: "0 0 auto",
      padding: "6px 8px",
      background: tab === t.k ? "rgba(59,130,246,.12)" : "rgba(255,255,255,.02)",
      border: tab === t.k ? "1px solid rgba(59,130,246,.3)" : "1px solid rgba(255,255,255,.05)",
      borderRadius: 6,
      color: tab === t.k ? "#93c5fd" : "#475569",
      fontSize: 8,
      cursor: "pointer",
      textAlign: "center",
      minWidth: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, t.i), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 1,
      letterSpacing: .3
    }
  }, t.l)))), vacation && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(245,158,11,.1),rgba(245,158,11,.04))",
      border: "1px solid rgba(245,158,11,.3)",
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 10,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#fbbf24"
    }
  }, "\uD83C\uDFD6\uFE0F VACATION MODE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#92400e",
      marginTop: 2
    }
  }, "Penalties paused \xB7 Streak preserved")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      update({
        vacation: false
      });
      setNotif("⚔️ Back to the grind, Hunter!");
    },
    style: {
      padding: "6px 12px",
      background: "rgba(34,197,94,.15)",
      border: "1px solid rgba(34,197,94,.3)",
      borderRadius: 6,
      color: "#86efac",
      fontSize: 9,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace"
    }
  }, "END")), !vacation && (new Date().getDay() === 0 || new Date().getDay() === 6) && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(168,85,247,.06)",
      border: "1px solid rgba(168,85,247,.15)",
      borderRadius: 8,
      padding: "8px 14px",
      marginBottom: 10,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#c084fc"
    }
  }, "\uD83C\uDF19 Weekend \u2014 no penalties today"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#475569",
      marginTop: 2
    }
  }, "You can still complete tasks for bonus XP")), !vacation && !(new Date().getDay() === 0 || new Date().getDay() === 6) && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      update({
        vacation: true
      });
      setNotif("🏖️ Vacation mode ON — enjoy your rest, Hunter!");
    },
    style: {
      width: "100%",
      padding: "6px",
      marginBottom: 10,
      background: "rgba(245,158,11,.04)",
      border: "1px solid rgba(245,158,11,.1)",
      borderRadius: 6,
      color: "#92400e",
      fontSize: 8,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace",
      textAlign: "center"
    }
  }, "\uD83C\uDFD6\uFE0F Tap to enable vacation mode"), tab === "quests" && /*#__PURE__*/React.createElement("div", null, g.current.activeBoss && g.current.activeBoss.bossQuests && g.current.activeBoss.bossQuests.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(239,68,68,.1),rgba(168,85,247,.06))",
      border: "1px solid rgba(239,68,68,.3)",
      borderRadius: 8,
      padding: "10px 12px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#fca5a5",
      letterSpacing: 1,
      marginBottom: 2,
      fontWeight: 700
    }
  }, g.current.activeBoss.emoji, " BOSS BATTLE \u2014 ", g.current.activeBoss.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#94a3b8",
      marginBottom: 8
    }
  }, "Fa astea zilnic ca sa infrangi boss-ul"), g.current.activeBoss.bossQuests.map(bq => {
    const isDone = done.includes(bq.id);
    return /*#__PURE__*/React.createElement("button", {
      key: bq.id,
      onClick: () => toggleBossQ(bq),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "9px 10px",
        marginBottom: 5,
        background: isDone ? "rgba(34,197,94,.12)" : "rgba(0,0,0,.25)",
        border: `1px solid ${isDone ? "rgba(34,197,94,.4)" : "rgba(239,68,68,.25)"}`,
        borderRadius: 6,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        color: "inherit"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, isDone ? "✅" : bq.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 11,
        color: isDone ? "#22c55e" : "#e2e8f0",
        textDecoration: isDone ? "line-through" : "none"
      }
    }, bq.label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "#fbbf24"
      }
    }, "+", bq.xp, " ", bq.stat));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: allD ? "linear-gradient(135deg,rgba(34,197,94,.08),rgba(34,197,94,.02))" : "rgba(255,255,255,.02)",
      border: allD ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(255,255,255,.05)",
      borderRadius: 8,
      padding: "10px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      letterSpacing: 1
    }
  }, "DAILY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: allD ? "#22c55e" : "#475569",
      marginTop: 2
    }
  }, allD ? "✦ ALL COMPLETE" : `${PENALIZABLE_DAILY.filter(q => done.includes(q.id)).length}/${PENALIZABLE_DAILY.length} penalizable`)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#475569",
      textAlign: "right"
    }
  }, "Auto-reset")), (() => {
    const todayPPL = ACTIVE_SPLIT[new Date().getDay()];
    const missedQ = PENALIZABLE_DAILY.filter(q => !done.includes(q.id)).reduce((s, q) => s + q.xp, 0);
    const missedEx = todayPPL && todayPPL.type !== "REST" ? todayPPL.exercises.filter(ex => !ex.finisher && !doneEx.includes(ex.name)).length * 10 : 0;
    const missedLesson = 0;
    const totalRisk = missedQ + missedEx;
    if (totalRisk > 0) return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6,
        padding: "6px 8px",
        background: "rgba(239,68,68,.06)",
        border: "1px solid rgba(239,68,68,.12)",
        borderRadius: 5,
        fontSize: 8,
        color: "#f87171",
        lineHeight: 1.6
      }
    }, "\u26A0\uFE0F At risk: ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#ef4444",
        fontWeight: 700
      }
    }, "-", totalRisk, " XP"), " if not completed", missedQ > 0 && /*#__PURE__*/React.createElement("span", null, " \xB7 Quests: -", missedQ), missedEx > 0 && /*#__PURE__*/React.createElement("span", null, " \xB7 Training: -", missedEx), missedLesson > 0 && /*#__PURE__*/React.createElement("span", null, " \xB7 Lesson: -", missedLesson));
    return null;
  })()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 6
    }
  }, "\u25B8 DAILY TRAINING"), DAILY_Q.filter(q => !q.subgroup).map(q => /*#__PURE__*/React.createElement("button", {
    key: q.id,
    onClick: () => toggleQ(q.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "10px 12px",
      marginBottom: 4,
      background: done.includes(q.id) ? "rgba(59,130,246,.08)" : "rgba(255,255,255,.02)",
      border: done.includes(q.id) ? "1px solid rgba(59,130,246,.3)" : "1px solid rgba(255,255,255,.06)",
      borderRadius: 7,
      cursor: "pointer",
      textAlign: "left",
      color: "inherit",
      fontFamily: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 4,
      border: done.includes(q.id) ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: done.includes(q.id) ? "rgba(59,130,246,.15)" : "transparent"
    }
  }, done.includes(q.id) && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#3b82f6",
      fontSize: 12
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      flexShrink: 0
    }
  }, q.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: done.includes(q.id) ? "#64748b" : "#e2e8f0",
      textDecoration: done.includes(q.id) ? "line-through" : "none"
    }
  }, q.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginTop: 1
    }
  }, "+", q.xp, "XP \xB7 ", q.stat)))), (() => {
    const proteinItems = DAILY_Q.filter(q => q.subgroup === "protein");
    const proteinValues = {
      protein_shake1: 45,
      protein_shake2: 45,
      protein_jerky: 22,
      protein_bar: 25,
      protein_meat: 83
    };
    const consumed = proteinItems.filter(q => done.includes(q.id)).reduce((s, q) => s + (proteinValues[q.id] || 0), 0);
    const target = 220;
    const pct = Math.min(100, consumed / target * 100);
    const color = consumed >= target ? "#22c55e" : consumed >= target * 0.7 ? "#f59e0b" : "#3b82f6";
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#334155",
        letterSpacing: 2,
        marginTop: 14,
        marginBottom: 6,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", null, "\u25B8 PROTEIN INTAKE"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color,
        fontWeight: 700
      }
    }, consumed, "g / ", target, "g")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        background: "rgba(0,0,0,.3)",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: "width .4s ease"
      }
    })), consumed >= target && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#22c55e",
        textAlign: "center",
        marginBottom: 6,
        letterSpacing: 1
      }
    }, "\u2713 TARGET HIT \u2014 MUSCLE PRESERVATION ACTIVE"), consumed < target && consumed > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#f59e0b",
        textAlign: "center",
        marginBottom: 6,
        letterSpacing: 1
      }
    }, "\u26A0 ", target - consumed, "g remaining"), proteinItems.map(q => /*#__PURE__*/React.createElement("button", {
      key: q.id,
      onClick: () => toggleQ(q.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 12px",
        marginBottom: 4,
        background: done.includes(q.id) ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.02)",
        border: done.includes(q.id) ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(255,255,255,.06)",
        borderRadius: 7,
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        fontFamily: "inherit"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 4,
        border: done.includes(q.id) ? "2px solid #22c55e" : "2px solid rgba(255,255,255,.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: done.includes(q.id) ? "rgba(34,197,94,.15)" : "transparent"
      }
    }, done.includes(q.id) && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#22c55e",
        fontSize: 12
      }
    }, "\u2713")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16,
        flexShrink: 0
      }
    }, q.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: done.includes(q.id) ? "#64748b" : "#e2e8f0",
        textDecoration: done.includes(q.id) ? "line-through" : "none"
      }
    }, q.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: done.includes(q.id) ? "#22c55e" : "#475569",
        marginTop: 1
      }
    }, "+", q.xp, "XP \xB7 ", q.stat)))));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginTop: 14,
      marginBottom: 6,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u25B8 BONUS (TODAY)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 7,
      color: "#64748b"
    }
  }, DOW[new Date().getDay()])), (() => {
    const todayDow = new Date().getDay();
    const todaysBonus = BONUS_Q.filter(q => !q.days || q.days.includes(todayDow));
    if (todaysBonus.length === 0) return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.04)",
        borderRadius: 7,
        fontSize: 10,
        color: "#64748b",
        textAlign: "center"
      }
    }, "No bonus quests today \u2014 recovery focus \uD83D\uDCA4");
    return todaysBonus.map(q => {
      const isPlank = q.progression && q.id === "weightedplank";
      const isKb = q.kbProgression && q.id === "kettlebell";
      const hasProg = isPlank || isKb;
      const hasSteps = Array.isArray(q.steps) && q.steps.length > 0;
      const hasPanel = hasProg || hasSteps;
      const LVLS = isKb ? KB_LEVELS : PLANK_LEVELS;
      const lvlKey = isKb ? "kbLevel" : "plankLevel";
      const pLvl = (isKb ? g.current.kbLevel : g.current.plankLevel) || 1;
      const pInfo = LVLS[Math.min(pLvl, LVLS.length) - 1];
      return /*#__PURE__*/React.createElement("div", {
        key: q.id
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => toggleQ(q.id),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "10px 12px",
          marginBottom: hasPanel ? 0 : 4,
          background: done.includes(q.id) ? "rgba(59,130,246,.08)" : "rgba(255,255,255,.02)",
          border: done.includes(q.id) ? "1px solid rgba(59,130,246,.3)" : "1px solid rgba(255,255,255,.06)",
          borderRadius: hasPanel ? "7px 7px 0 0" : 7,
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          fontFamily: "inherit"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 20,
          height: 20,
          borderRadius: 4,
          border: done.includes(q.id) ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done.includes(q.id) ? "rgba(59,130,246,.15)" : "transparent"
        }
      }, done.includes(q.id) && /*#__PURE__*/React.createElement("span", {
        style: {
          color: "#3b82f6",
          fontSize: 12
        }
      }, "\u2713")), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 16,
          flexShrink: 0
        }
      }, q.icon), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: done.includes(q.id) ? "#64748b" : "#e2e8f0",
          textDecoration: done.includes(q.id) ? "line-through" : "none"
        }
      }, q.label, hasProg ? ` — Lvl ${pLvl}: ${pInfo.name}` : q.hold ? " (3×30s)" : ""), q.desc && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 8,
          color: "#475569",
          marginTop: 1
        }
      }, hasProg ? `${pInfo.target} · ${pInfo.desc}` : q.desc), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#475569",
          marginTop: 1
        }
      }, "+", q.xp, "XP \xB7 ", q.stat, q.hold ? " · secunde" : ""))), hasProg && /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 12px",
          marginBottom: 4,
          background: "rgba(234,179,8,.05)",
          border: "1px solid rgba(234,179,8,.15)",
          borderTop: "none",
          borderRadius: "0 0 7px 7px"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 8,
          color: "#a16207",
          flex: 1
        }
      }, "🎯 ", pInfo.next), pLvl < LVLS.length && /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          update({
            [lvlKey]: pLvl + 1
          });
          setNotif(`${q.icon} ${q.label} → Nivel ${pLvl + 1}: ${LVLS[pLvl].name}`);
        },
        style: {
          fontSize: 8,
          padding: "4px 8px",
          background: "rgba(234,179,8,.15)",
          border: "1px solid rgba(234,179,8,.4)",
          borderRadius: 5,
          color: "#eab308",
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0
        }
      }, "NIVEL URMATOR ▸"), pLvl > 1 && /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          update({
            [lvlKey]: pLvl - 1
          });
          setNotif(`${q.icon} ${q.label} → Nivel ${pLvl - 1}`);
        },
        style: {
          fontSize: 8,
          padding: "4px 6px",
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 5,
          color: "#64748b",
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0
        }
      }, "◂")), hasSteps && /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "10px 12px",
          marginBottom: 4,
          background: "rgba(168,85,247,.05)",
          border: "1px solid rgba(168,85,247,.2)",
          borderTop: "none",
          borderRadius: "0 0 7px 7px"
        }
      }, q.steps.map(st => /*#__PURE__*/React.createElement("div", {
        key: st.n,
        style: {
          marginBottom: 9
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 3
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: "#c4b5fd"
        }
      }, st.n, ". ", st.name), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          color: "#7c3aed"
        }
      }, st.time)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          lineHeight: 1.5,
          color: "#94a3b8"
        }
      }, st.how)))));
    });
  })(), WEEKLY_OBJ.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginTop: 14,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u25B8 WEEKLY (", wC, "/", WEEKLY_OBJ.length, ")"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 7,
      color: wC === WEEKLY_OBJ.length ? "#22c55e" : "#ef4444"
    }
  }, wC === WEEKLY_OBJ.length ? "✓ ALL DONE" : `⚠️ -${WEEKLY_OBJ.filter(q => !doneW.includes(q.id)).reduce((s, q) => s + q.xp, 0)}XP if missed`)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 7,
      color: "#334155",
      marginTop: 2
    }
  }, "Auto-resets every Monday")), WEEKLY_OBJ.map(q => /*#__PURE__*/React.createElement("button", {
    key: q.id,
    onClick: () => toggleW(q.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "10px 12px",
      marginBottom: 4,
      background: doneW.includes(q.id) ? "rgba(168,85,247,.08)" : "rgba(255,255,255,.02)",
      border: doneW.includes(q.id) ? "1px solid rgba(168,85,247,.3)" : "1px solid rgba(255,255,255,.06)",
      borderRadius: 7,
      cursor: "pointer",
      textAlign: "left",
      color: "inherit",
      fontFamily: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 4,
      border: doneW.includes(q.id) ? "2px solid #a855f7" : "2px solid rgba(255,255,255,.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: doneW.includes(q.id) ? "rgba(168,85,247,.15)" : "transparent"
    }
  }, doneW.includes(q.id) && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#a855f7",
      fontSize: 12
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      flexShrink: 0
    }
  }, q.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: doneW.includes(q.id) ? "#64748b" : "#e2e8f0",
      textDecoration: doneW.includes(q.id) ? "line-through" : "none"
    }
  }, q.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginTop: 1
    }
  }, "+", q.xp, "XP \xB7 ", q.stat, " \xB7 WEEKLY")))), penaltyLog.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#ef4444",
      letterSpacing: 2,
      marginBottom: 6
    }
  }, "\u25B8 PENALTY HISTORY"), penaltyLog.slice().reverse().slice(0, 5).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "6px 10px",
      marginBottom: 2,
      background: "rgba(239,68,68,.04)",
      border: "1px solid rgba(239,68,68,.1)",
      borderRadius: 4,
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, p.date), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#ef4444",
      fontWeight: 700
    }
  }, "-", p.penalty, " XP")), p.details && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#6b7280",
      marginTop: 2
    }
  }, p.details))))), tab === "training" && /*#__PURE__*/React.createElement("div", null, vacation && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10,
      padding: "8px 12px",
      background: "linear-gradient(135deg,rgba(168,85,247,.15),rgba(168,85,247,.05))",
      border: "1px solid rgba(168,85,247,.3)",
      borderRadius: 7,
      fontSize: 11,
      color: "#c4b5fd",
      textAlign: "center",
      letterSpacing: 1
    }
  }, "\uD83C\uDFD6\uFE0F VACATION MODE \u2014 Hotel/Bodyweight workouts active"), !vacation && !g.current.agiUnlocked && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      update({
        agiUnlocked: true
      });
      setNotif("\uD83C\uDF00 AGI Finisher deblocat pe Marti si Joi");
    },
    style: {
      width: "100%",
      padding: "8px 12px",
      marginBottom: 8,
      background: "rgba(168,85,247,.08)",
      border: "1px dashed rgba(168,85,247,.35)",
      borderRadius: 7,
      color: "#a855f7",
      fontSize: 9,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace",
      textAlign: "left"
    }
  }, "\uD83C\uDF00 AGI FINISHER (blocat) \u2014 Turkish Get-Up / Windmill pe Marti + Joi. Invata tiparul cu o gantera usoara, apoi apasa aici sa deblochezi."), !vacation && g.current.agiUnlocked && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (confirm("Blochezi din nou AGI Finisher?")) {
        update({
          agiUnlocked: false
        });
        setNotif("AGI Finisher blocat");
      }
    },
    style: {
      width: "100%",
      padding: "5px 12px",
      marginBottom: 8,
      background: "rgba(168,85,247,.05)",
      border: "1px solid rgba(168,85,247,.2)",
      borderRadius: 7,
      color: "#7e22ce",
      fontSize: 8,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace"
    }
  }, "\uD83C\uDF00 AGI Finisher activ \u00B7 tap pentru a bloca"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      marginBottom: 14
    }
  }, [1, 2, 3, 4, 5, 6, 0].map(d => {
    const p = ACTIVE_SPLIT[d];
    const iS = d === selPPL;
    const iT = d === new Date().getDay();
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      onClick: () => setSelPPL(d),
      style: {
        flex: 1,
        padding: "7px 2px",
        borderRadius: 5,
        cursor: "pointer",
        background: iS ? `${p.color}18` : "rgba(255,255,255,.02)",
        border: iS ? `1px solid ${p.color}55` : iT ? "1px solid rgba(59,130,246,.2)" : "1px solid rgba(255,255,255,.04)",
        color: iS ? p.color : "#475569",
        fontSize: 8,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, DOW[d]), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 6,
        marginTop: 1
      }
    }, p.type));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",
      border: `1px solid ${vPPL.color}33`,
      borderRadius: 10,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 900,
      color: vPPL.color,
      fontFamily: "'Georgia',serif",
      marginBottom: 2
    }
  }, vPPL.icon, " ", vPPL.type, " DAY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginBottom: 12
    }
  }, vPPL.day), (() => {
    const wk = warmupKeyFor(vPPL.type);
    const wd = wk && WARMUP_DATA[wk];
    if (!wd) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12,
        border: "1px solid rgba(251,191,36,.25)",
        borderRadius: 8,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setShowWarmup(v => !v),
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 12px",
        background: "rgba(251,191,36,.08)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#fbbf24",
        letterSpacing: 1,
        fontWeight: 700
      }
    }, "\uD83D\uDD25 WARM-UP \u2014 5 min"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#fbbf24"
      }
    }, showWarmup ? "\u25BE" : "\u25B8")), showWarmup && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "6px 10px 10px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#78716c",
        marginBottom: 8,
        lineHeight: 1.5
      }
    }, "Fa asta INAINTE de antrenament. Pregateste articulatiile si muschii zilei."), wd.warmup.map((m, mi) => /*#__PURE__*/React.createElement("div", {
      key: mi,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "6px 0",
        borderBottom: mi < wd.warmup.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none"
      }
    }, StretchFig(m.pose, "#fbbf24"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#e2e8f0",
        fontWeight: 700
      }
    }, m.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        color: "#fbbf24"
      }
    }, m.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        marginTop: 2,
        lineHeight: 1.4
      }
    }, m.text))))));
  })(), vPPL.type === "REST" ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "16px 0",
      color: "#334155",
      fontSize: 11
    }
  }, "Recovery day. Rest well, Hunter.") : vPPL.exercises.map((ex, i) => {
    const dn = doneEx.includes(ex.name);
    const isExp = expandedLesson === `ex-${selPPL}-${i}`;
    const isEditing = editingEx === `${selPPL}-${i}`;
    const lastSess = getLastSession(ex.name);
    // Parse number of sets from ex.sets like "4×8-10"
    const numSets = parseInt(ex.sets.match(/(\d+)[×x]/)?.[1]) || 4;
    return /*#__PURE__*/React.createElement("div", {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 10px",
        marginBottom: 2,
        background: dn ? `${vPPL.color}10` : "rgba(255,255,255,.02)",
        border: dn ? `1px solid ${vPPL.color}33` : "1px solid rgba(255,255,255,.04)",
        borderRadius: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 16,
        height: 16,
        borderRadius: 3,
        flexShrink: 0,
        border: dn ? `2px solid ${vPPL.color}` : "2px solid rgba(255,255,255,.12)",
        background: dn ? `${vPPL.color}22` : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, dn && /*#__PURE__*/React.createElement("span", {
      style: {
        color: vPPL.color,
        fontSize: 9
      }
    }, "\u2713")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: dn ? "#64748b" : "#e2e8f0",
        textDecoration: dn ? "line-through" : "none"
      }
    }, ex.name, ex.finisher && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 7,
        color: "#fbbf24",
        background: "rgba(251,191,36,.12)",
        border: "1px solid rgba(251,191,36,.3)",
        borderRadius: 3,
        padding: "1px 4px",
        letterSpacing: 0.5,
        verticalAlign: "middle"
      }
    }, "FINISHER")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#334155"
      }
    }, ex.muscle), lastSess && !isEditing && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#475569",
        marginTop: 2
      }
    }, "Last: ", lastSess.sets.map((s, si) => ex.repsOnly ? `${s.reps} reps` : `${s.kg}kg×${s.reps}`).join(" · ")), (() => {
      if (ex.repsOnly) return null;
      const stag = getStagnation(ex.swappedFrom || ex.name);
      return stag && !isEditing && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 8,
          color: "#f59e0b",
          marginTop: 3,
          padding: "3px 6px",
          background: "rgba(245,158,11,.1)",
          border: "1px solid rgba(245,158,11,.3)",
          borderRadius: 4,
          lineHeight: 1.4
        }
      }, `⚠️ Plateau: ${stag.kg}kg×${stag.reps} de ${stag.n} sesiuni. Creste greutatea, reps, sau swap.`);
    })()), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#475569"
      }
    }, ex.sets), !dn && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, EXERCISE_ALTERNATIVES[ex.swappedFrom || ex.name] && /*#__PURE__*/React.createElement("button", {
      onClick: () => setSwapModal(ex.swappedFrom || ex.name),
      style: {
        fontSize: 8,
        color: ex.swappedFrom ? "#fbbf24" : "#a78bfa",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontFamily: "'Courier New',monospace"
      }
    }, ex.swappedFrom ? "🔄 Swapped" : "🔄 Swap"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setEditingEx(isEditing ? null : `${selPPL}-${i}`),
      style: {
        fontSize: 8,
        color: vPPL.color,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontFamily: "'Courier New',monospace"
      }
    }, isEditing ? "▾ Close" : "▸ Log sets")), dn && /*#__PURE__*/React.createElement("button", {
      onClick: () => undoExercise(ex.name),
      style: {
        fontSize: 8,
        color: "#f87171",
        background: "rgba(248,113,113,.08)",
        border: "1px solid rgba(248,113,113,.25)",
        borderRadius: 5,
        cursor: "pointer",
        padding: "3px 8px",
        marginTop: 2,
        fontFamily: "'Courier New',monospace"
      }
    }, "\u21A9 Anuleaza"))), isEditing && (() => {
      const logKey = `${todayStr}_${ex.name}`;
      const SetLogger = () => {
        // Persistent across re-renders: read from parent loggerSets, init once
        const sets = loggerSets[logKey] || (() => {
          const arr = [];
          for (let s = 0; s < numSets; s++) {
            const rec = getRecommendation(ex.name, s);
            const last = lastSess?.sets?.[s];
            arr.push({
              kg: rec ? String(rec.kg) : last ? String(last.kg) : "",
              reps: rec ? String(rec.reps) : last ? String(last.reps) : "",
              logged: false
            });
          }
          return arr;
        })();
        // Ensure parent has the initial array stored
        if (!loggerSets[logKey]) {
          setTimeout(() => setLoggerSets(prev => prev[logKey] ? prev : {
            ...prev,
            [logKey]: sets
          }), 0);
        }
        const setSets = updater => {
          setLoggerSets(prev => {
            const cur = prev[logKey] || sets;
            const next = typeof updater === "function" ? updater(cur) : updater;
            return {
              ...prev,
              [logKey]: next
            };
          });
        };
        const restSec = ex.rest || 90;
        // Add a fail-set: lighter weight (~35% less), to failure, editable + removable
        const addFailSet = () => {
          setSets(cur => {
            if (cur.some(s => s.isFail)) return cur;
            const lastLogged = [...cur].reverse().find(s => s.kg);
            const baseKg = lastLogged ? parseFloat(lastLogged.kg) || 0 : 0;
            const failKg = baseKg ? Math.max(0, Math.round(baseKg * 0.65)) : "";
            return [...cur, {
              kg: failKg === "" ? "" : String(failKg),
              reps: "",
              logged: false,
              isFail: true,
              failed: true
            }];
          });
          setNotif("🔥 Fail set adaugat · greutate redusa ~35% · mergi pana la fail");
        };
        const removeFailSet = () => {
          setSets(cur => cur.filter(s => !s.isFail));
        };
        const repsOnly = !!ex.repsOnly;
        const logSingleSet = si => {
          const s = sets[si];
          if (repsOnly ? !s.reps : !s.kg || !s.reps) {
            setNotif(repsOnly ? "Enter reps for this set" : "Enter kg and reps for this set");
            return;
          }
          const newSets = [...sets];
          newSets[si] = {
            ...s,
            logged: true
          };
          setSets(newSets);
          // Start rest timer (don't start after last set)
          if (si < sets.length - 1) {
            startRest(ex.name, si + 1, restSec, vPPL.color);
            setNotif(`✓ Set ${si + 1} logged · Rest ${Math.floor(restSec / 60)}:${String(restSec % 60).padStart(2, "0")}`);
          } else {
            setNotif(`✓ Set ${si + 1} logged · Workout complete!`);
          }
        };
        const logAll = () => {
          const valid = sets.filter(s => repsOnly ? s.reps : s.kg && s.reps);
          if (valid.length === 0) {
            setNotif(repsOnly ? "Enter at least 1 set (reps)" : "Enter at least 1 set");
            return;
          }
          // Mark failed sets
          const failed = sets.map(s => !!s.failed).filter(Boolean).length;
          if (failed > 0) setFailedSets({
            ...failedSets,
            [logKey]: failed
          });
          logExerciseSets(ex.name, sets.map(s => ({
            kg: parseFloat(s.kg) || 0,
            reps: parseInt(s.reps) || 0,
            failed: !!s.failed
          })));
          // Clear the persistent buffer for this exercise after saving
          setLoggerSets(prev => {
            const n = {
              ...prev
            };
            delete n[logKey];
            return n;
          });
          // Start exercise pause (3 min between exercises)
          const allExercises = vPPL.exercises;
          const currentIdx = allExercises.findIndex(e => e.name === ex.name);
          const nextEx = allExercises[currentIdx + 1];
          if (nextEx) startExerciseRest(nextEx.name, 180, vPPL.color);
        };
        return /*#__PURE__*/React.createElement("div", {
          style: {
            padding: "10px",
            marginBottom: 4,
            background: `${vPPL.color}08`,
            border: `1px solid ${vPPL.color}22`,
            borderRadius: 6
          }
        }, lastSess && /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 8,
            color: "#22c55e",
            marginBottom: 6,
            textAlign: "center"
          }
        }, "\uD83D\uDCC8 Recommendations based on last session"), !lastSess && /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 8,
            color: "#475569",
            marginBottom: 6,
            textAlign: "center"
          }
        }, "First time \u2014 enter your working weights"), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 8,
            color: "#64748b",
            marginBottom: 6,
            textAlign: "center",
            letterSpacing: .5
          }
        }, "\u23F1 Rest between sets: ", Math.floor(restSec / 60), ":", String(restSec % 60).padStart(2, "0")), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 8,
            color: "#475569",
            marginBottom: 6,
            textAlign: "center",
            letterSpacing: .3,
            padding: "4px 8px",
            background: "rgba(0,0,0,.2)",
            borderRadius: 4
          }
        }, (() => {
          if (ex.repsOnly) return `🤸 Bodyweight · progresezi prin REPS · fara greutate`;
          const inc = getKgIncrement(ex.name);
          const dbExercises = ["DB Bench Press", "DB Incline Bench Press", "Incline DB Press", "Arnold Press", "Single Arm DB Row", "Lateral Raises", "Front Raises", "Hammer Curls", "Incline Curls", "Concentration Curls", "Reverse Flyes", "Bulgarian Split Squat"];
          const isDB = dbExercises.includes(ex.name);
          const isMachine = ["Leg Press", "Seated Cable Row", "Cable Flyes", "Cable Curls", "Tricep Pushdowns", "Cable Pullover", "Face Pulls", "Leg Curls", "Leg Extension", "Chest-Supported Row", "Hip Thrust"].includes(ex.name);
          if (isDB) return `🏋️ DB · log greutate/mana · increment ${inc}kg`;
          if (isMachine) return `⚙️ Masina · log doar placile · increment ${inc}kg`;
          return `🏋️‍♂️ Barbell · log total cu bara 20kg · increment ${inc}kg`;
        })()), /*#__PURE__*/React.createElement("div", {
          style: {
            display: "flex",
            gap: 4,
            marginBottom: 6,
            fontSize: 8,
            color: "#475569"
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            width: 20,
            textAlign: "center"
          }
        }, "#"), !repsOnly && /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1,
            textAlign: "center"
          }
        }, "kg"), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1,
            textAlign: "center"
          }
        }, "Reps"), /*#__PURE__*/React.createElement("div", {
          style: {
            width: 40,
            textAlign: "center"
          }
        }, "Fail"), /*#__PURE__*/React.createElement("div", {
          style: {
            width: 30,
            textAlign: "center"
          }
        }, "Log"), lastSess && /*#__PURE__*/React.createElement("div", {
          style: {
            width: 34,
            textAlign: "center"
          }
        }, "Tip")), sets.map((s, si) => {
          const rec = getRecommendation(ex.name, si);
          return /*#__PURE__*/React.createElement("div", {
            key: si,
            style: {
              display: "flex",
              gap: 4,
              marginBottom: 4,
              alignItems: "center",
              opacity: s.logged ? .5 : 1,
              padding: s.isFail ? "4px" : 0,
              background: s.isFail ? "rgba(239,68,68,.08)" : "transparent",
              border: s.isFail ? "1px dashed rgba(239,68,68,.4)" : "none",
              borderRadius: s.isFail ? 6 : 0
            }
          }, /*#__PURE__*/React.createElement("div", {
            style: {
              width: 20,
              textAlign: "center",
              fontSize: s.isFail ? 9 : 10,
              color: s.isFail ? "#ef4444" : vPPL.color,
              fontWeight: 700
            }
          }, s.isFail ? "🔥" : si + 1), !repsOnly && /*#__PURE__*/React.createElement("input", {
            type: "text",
            inputMode: "decimal",
            autoComplete: "off",
            autoCorrect: "off",
            value: s.kg,
            placeholder: "kg",
            disabled: s.logged,
            onChange: e => {
              // Allow digits, one comma/dot; normalize comma->dot; keep partial input
              let v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
              const parts = v.split(".");
              if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
              const n = [...sets];
              n[si] = {
                ...n[si],
                kg: v
              };
              setSets(n);
            },
            style: {
              flex: 1,
              padding: "7px 6px",
              background: "rgba(0,0,0,.3)",
              border: `1px solid ${vPPL.color}33`,
              borderRadius: 4,
              color: "#e2e8f0",
              fontSize: 12,
              fontFamily: "'Courier New',monospace",
              outline: "none",
              textAlign: "center",
              boxSizing: "border-box"
            }
          }), /*#__PURE__*/React.createElement("input", {
            type: "text",
            inputMode: "numeric",
            autoComplete: "off",
            autoCorrect: "off",
            value: s.reps,
            placeholder: "reps",
            disabled: s.logged,
            onChange: e => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              const n = [...sets];
              n[si] = {
                ...n[si],
                reps: v
              };
              setSets(n);
            },
            style: {
              flex: 1,
              padding: "7px 6px",
              background: "rgba(0,0,0,.3)",
              border: `1px solid ${vPPL.color}33`,
              borderRadius: 4,
              color: "#e2e8f0",
              fontSize: 12,
              fontFamily: "'Courier New',monospace",
              outline: "none",
              textAlign: "center",
              boxSizing: "border-box"
            }
          }), /*#__PURE__*/React.createElement("button", {
            onClick: () => {
              const n = [...sets];
              n[si] = {
                ...n[si],
                failed: !n[si].failed
              };
              setSets(n);
              if (navigator.vibrate) navigator.vibrate(30);
            },
            disabled: s.logged,
            title: "Marcheaza ca fail (ai ajuns la epuizare)",
            style: {
              width: 40,
              height: 38,
              padding: 0,
              background: s.failed ? "rgba(239,68,68,.35)" : "rgba(0,0,0,.3)",
              border: `2px solid ${s.failed ? "#ef4444" : "rgba(255,255,255,.12)"}`,
              borderRadius: 6,
              color: s.failed ? "#ef4444" : "#64748b",
              fontSize: 16,
              cursor: s.logged ? "default" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }
          }, s.failed ? "💀" : "○"), /*#__PURE__*/React.createElement("button", {
            onClick: () => {
              if (s.logged) {
                // Debifare: re-open this set for editing
                const n = [...sets];
                n[si] = {
                  ...n[si],
                  logged: false
                };
                setSets(n);
                setNotif(`✏️ Set ${si + 1} redeschis pentru editare`);
              } else {
                logSingleSet(si);
              }
            },
            title: s.logged ? "Apasa ca sa debifezi si sa editezi" : "Logheaza set",
            style: {
              width: 30,
              padding: "7px 0",
              background: s.logged ? "rgba(34,197,94,.15)" : `${vPPL.color}33`,
              border: `1px solid ${s.logged ? "#22c55e" : vPPL.color}55`,
              borderRadius: 4,
              color: s.logged ? "#22c55e" : vPPL.color,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit"
            }
          }, s.logged ? "✓" : "▶"), lastSess && /*#__PURE__*/React.createElement("div", {
            style: {
              width: 34,
              fontSize: 7,
              color: rec?.note?.includes("↑") ? "#22c55e" : "#f59e0b",
              textAlign: "center"
            }
          }, rec?.note || ""));
        }), /*#__PURE__*/React.createElement("button", {
          onClick: () => sets.some(s => s.isFail) ? removeFailSet() : addFailSet(),
          style: {
            width: "100%",
            marginTop: 6,
            padding: "8px",
            background: sets.some(s => s.isFail) ? "rgba(239,68,68,.12)" : "rgba(239,68,68,.06)",
            border: "1px dashed rgba(239,68,68,.4)",
            borderRadius: 5,
            color: "#ef4444",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "'Courier New',monospace",
            letterSpacing: .5
          }
        }, sets.some(s => s.isFail) ? "\u2715 SCOATE FAIL SET" : "\uD83D\uDD25 + FAIL SET (greutate redusa, pana la fail)"), /*#__PURE__*/React.createElement("button", {
          onClick: logAll,
          style: {
            width: "100%",
            marginTop: 6,
            padding: "9px",
            background: `linear-gradient(135deg,${vPPL.color}33,${vPPL.color}18)`,
            border: `1px solid ${vPPL.color}44`,
            borderRadius: 5,
            color: vPPL.color,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'Courier New',monospace",
            letterSpacing: 1
          }
        }, "\u2713 SAVE TO LOG (+10 XP)"));
      };
      return SetLogger();
    })(), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        setExpandedLesson(isExp ? null : `ex-${selPPL}-${i}`);
      },
      style: {
        width: "100%",
        padding: "4px 10px",
        marginBottom: 4,
        background: "none",
        border: "none",
        color: "#3b82f6",
        fontSize: 9,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "'Courier New',monospace"
      }
    }, isExp ? "▾ Hide guide" : "▸ How to perform"), isExp && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 12px",
        marginBottom: 6,
        background: "rgba(59,130,246,.04)",
        border: "1px solid rgba(59,130,246,.1)",
        borderRadius: 6,
        fontSize: 11,
        color: "#94a3b8",
        lineHeight: 1.5
      }
    }, ex.desc));
  }), vPPL.type !== "REST" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "7px 10px",
      borderRadius: 5,
      background: "rgba(59,130,246,.06)",
      border: "1px solid rgba(59,130,246,.1)",
      fontSize: 9,
      color: "#64748b",
      textAlign: "center"
    }
  }, "\uD83C\uDFC3 Cardio: doar ce e in taskuri \xB7 fara ore extra (protejezi masa musculara)"), (() => {
    const wk = warmupKeyFor(vPPL.type);
    const wd = wk && WARMUP_DATA[wk];
    if (!wd) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        border: "1px solid rgba(96,165,250,.25)",
        borderRadius: 8,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => setShowCooldown(v => !v),
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 12px",
        background: "rgba(96,165,250,.08)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#60a5fa",
        letterSpacing: 1,
        fontWeight: 700
      }
    }, "\uD83E\uDDD8 COOL-DOWN / STRETCH \u2014 5 min"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "#60a5fa"
      }
    }, showCooldown ? "\u25BE" : "\u25B8")), showCooldown && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "6px 10px 10px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#64748b",
        marginBottom: 8,
        lineHeight: 1.5
      }
    }, "Fa asta DUPA antrenament. Intinde muschii lucrati, ajuta recuperarea si mobilitatea."), wd.cooldown.map((m, mi) => /*#__PURE__*/React.createElement("div", {
      key: mi,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "6px 0",
        borderBottom: mi < wd.cooldown.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none"
      }
    }, StretchFig(m.pose, "#60a5fa"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#e2e8f0",
        fontWeight: 700
      }
    }, m.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        color: "#60a5fa"
      }
    }, m.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        marginTop: 2,
        lineHeight: 1.4
      }
    }, m.text))))));
  })()), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 8,
      textTransform: "uppercase"
    }
  }, "\u25B8 VOLUM SAPTAMANA (seturi/grupa)"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 10,
      padding: 14,
      marginBottom: 8
    }
  }, (() => {
    // Count sets per muscle group from liftLog within last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const volByGroup = {};
    MUSCLE_GROUPS.forEach(mg => volByGroup[mg.key] = 0);
    Object.entries(liftLog || {}).forEach(([exName, sessions]) => {
      const mg = MUSCLE_GROUPS.find(g => g.exercises.includes(exName));
      if (!mg) return;
      (sessions || []).forEach(sess => {
        if (sess.date && sess.date >= weekAgo) {
          volByGroup[mg.key] += (sess.sets || []).filter(s => (parseFloat(s.kg) || 0) > 0 || (parseInt(s.reps) || 0) > 0).length;
        }
      });
    });
    // Rough weekly set targets for hypertrophy
    const target = 10;
    return MUSCLE_GROUPS.map(mg => {
      const v = volByGroup[mg.key] || 0;
      const pct = Math.min(100, v / target * 100);
      const color = v >= target ? "#22c55e" : v >= target * 0.5 ? "#f59e0b" : "#ef4444";
      return /*#__PURE__*/React.createElement("div", {
        key: mg.key,
        style: {
          marginBottom: 6
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#cbd5e1",
          marginBottom: 2
        }
      }, /*#__PURE__*/React.createElement("span", null, mg.icon, " ", mg.name), /*#__PURE__*/React.createElement("span", {
        style: {
          color
        }
      }, v, " seturi")), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 4,
          background: "rgba(0,0,0,.4)",
          borderRadius: 2,
          overflow: "hidden"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: `${pct}%`,
          height: "100%",
          background: color
        }
      })));
    });
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 7,
      color: "#475569",
      marginTop: 6,
      textAlign: "center"
    }
  }, "Tinta hipertrofie ~10 seturi/grupa/saptamana")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 8,
      textTransform: "uppercase"
    }
  }, "\u25B8 MUSCLE RANKINGS"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.6))",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 10,
      padding: 14
    }
  }, MUSCLE_GROUPS.map(mg => {
    const mxp = muscleXp[mg.key] || 0;
    const rank = getMuscleRank(mxp);
    const next = getNextMuscleRank(mxp);
    const pct = next ? (mxp - rank.min) / (next.min - rank.min) * 100 : 100;
    return /*#__PURE__*/React.createElement("div", {
      key: mg.key,
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        width: 20,
        textAlign: "center"
      }
    }, mg.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#e2e8f0"
      }
    }, mg.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: rank.color,
        fontWeight: 700,
        letterSpacing: .5
      }
    }, rank.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        color: "#475569"
      }
    }, mxp, "xp"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 28,
        height: 4,
        background: "rgba(255,255,255,.05)",
        borderRadius: 2,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: `linear-gradient(90deg,${rank.color},${rank.color}88)`,
        borderRadius: 2,
        transition: "width .4s ease"
      }
    })), next && /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 28,
        fontSize: 7,
        color: "#334155",
        marginTop: 2
      }
    }, "Next: ", next.name, " at ", next.min, "xp"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "8px 12px",
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.04)",
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#334155",
      letterSpacing: 1,
      marginBottom: 6
    }
  }, "RANK TIERS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4
    }
  }, MUSCLE_RANKS.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    style: {
      fontSize: 8,
      color: r.color,
      padding: "2px 6px",
      background: `${r.color}12`,
      border: `1px solid ${r.color}33`,
      borderRadius: 3
    }
  }, r.name)))))), tab === "boss" && /*#__PURE__*/React.createElement("div", null, (() => {
    const ab = g.current.activeBoss;
    const progress = checkBossProgress();
    const history = g.current.bossHistory || [];
    if (ab) {
      const daysLeft = Math.max(0, ab.durationDays - Math.floor((Date.now() - new Date(ab.acceptedDate).getTime()) / 86400000));
      const isWon = progress >= 100;
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          background: `linear-gradient(135deg,rgba(168,85,247,.15),rgba(127,29,29,.1))`,
          border: "2px solid rgba(168,85,247,.4)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: "center",
          marginBottom: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 48
        }
      }, ab.emoji), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#c084fc",
          letterSpacing: 2,
          marginTop: 4
        }
      }, "\u2694\uFE0F ACTIVE BOSS"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 16,
          color: "#fff",
          fontWeight: 700,
          marginTop: 2
        }
      }, ab.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#a78bfa",
          marginTop: 2,
          fontStyle: "italic"
        }
      }, "\"", ab.theme, "\"")), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "8px 12px",
          background: "rgba(0,0,0,.3)",
          borderRadius: 6,
          marginBottom: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#cbd5e1",
          marginBottom: 4
        }
      }, ab.lore)), /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: "#94a3b8",
          marginBottom: 4
        }
      }, /*#__PURE__*/React.createElement("span", null, "BOSS HP"), /*#__PURE__*/React.createElement("span", {
        style: {
          color: isWon ? "#22c55e" : "#ef4444",
          fontWeight: 700
        }
      }, Math.round(100 - progress), "% remaining")), /*#__PURE__*/React.createElement("div", {
        style: {
          height: 14,
          background: "rgba(0,0,0,.5)",
          borderRadius: 7,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.1)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          height: "100%",
          width: `${100 - progress}%`,
          background: isWon ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#ef4444,#7f1d1d)",
          transition: "width .5s ease"
        }
      }))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          fontSize: 9
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "6px 8px",
          background: "rgba(0,0,0,.3)",
          borderRadius: 5
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          color: "#94a3b8",
          letterSpacing: 1
        }
      }, "OBJECTIVE"), /*#__PURE__*/React.createElement("div", {
        style: {
          color: "#fff",
          marginTop: 2,
          fontSize: 10
        }
      }, ab.target.type === "lift" && `${ab.target.exercise} ${ab.target.kg}kg × ${ab.target.reps} reps`, ab.target.type === "streak" && `${ab.target.days} day streak`, ab.target.type === "muscleXp" && (ab.target.statTarget && ab.target.statAmount ? `+${Math.max(0, ((g.current.stats && g.current.stats[ab.target.statTarget]) || 0) - (ab.baseStat || 0))}/${ab.target.statAmount} ${ab.target.statTarget}` : `${ab.target.muscle}: +${Math.max(0, ((g.current.muscleXp && g.current.muscleXp[ab.target.muscle]) || 0) - (ab.baseMuscle || 0))}/${ab.target.amount} XP`), ab.target.type === "deload" && `${ab.target.days} deload days`)), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "6px 8px",
          background: "rgba(0,0,0,.3)",
          borderRadius: 5
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          color: "#94a3b8",
          letterSpacing: 1
        }
      }, "TIME LEFT"), /*#__PURE__*/React.createElement("div", {
        style: {
          color: daysLeft <= 3 ? "#ef4444" : "#fff",
          marginTop: 2,
          fontSize: 10,
          fontWeight: 700
        }
      }, daysLeft, " days"))), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8,
          padding: "6px 8px",
          background: "rgba(34,197,94,.1)",
          borderRadius: 5,
          fontSize: 9,
          color: "#86efac",
          textAlign: "center"
        }
      }, "\uD83C\uDFC6 Reward: +", ab.reward.xp, " XP \xB7 \"", ab.reward.badge, "\" badge"), isWon && /*#__PURE__*/React.createElement("button", {
        onClick: () => claimBossVictory(),
        style: {
          width: "100%",
          marginTop: 10,
          padding: "12px",
          background: "linear-gradient(135deg,rgba(34,197,94,.35),rgba(22,163,74,.2))",
          border: "1px solid rgba(34,197,94,.6)",
          borderRadius: 6,
          color: "#86efac",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: 1
        }
      }, "\uD83C\uDFC6 CLAIM VICTORY"), /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          if (confirm("Abandon this boss? No penalty.")) cancelBoss();
        },
        style: {
          width: "100%",
          marginTop: 10,
          padding: "8px",
          background: "rgba(239,68,68,.15)",
          border: "1px solid rgba(239,68,68,.3)",
          borderRadius: 6,
          color: "#fca5a5",
          fontSize: 10,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: 1
        }
      }, isWon ? "Abandon anyway" : "ABANDON QUEST")));
    }
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 14px",
        background: "linear-gradient(135deg,rgba(168,85,247,.08),rgba(59,130,246,.05))",
        border: "1px solid rgba(168,85,247,.2)",
        borderRadius: 8,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#c4b5fd",
        letterSpacing: 1,
        marginBottom: 4,
        fontWeight: 700
      }
    }, "\uD83D\uDC79 BOSS FIGHTS"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        lineHeight: 1.5
      }
    }, "Accept a challenge to push past your limits. Win = badge + bonus XP. Lose = no penalty, just opportunity cost. Pick wisely, Hunter.")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#334155",
        letterSpacing: 2,
        marginBottom: 8
      }
    }, "\u25B8 AVAILABLE BOSSES"), BOSS_LIBRARY.map(b => {
      const wonBefore = history.some(h => h.id === b.id && h.result === "victory");
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          padding: "10px 12px",
          background: "rgba(255,255,255,.02)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 7,
          marginBottom: 8,
          opacity: wonBefore ? .5 : 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 32
        }
      }, b.emoji), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "#e2e8f0",
          fontWeight: 700
        }
      }, b.name, wonBefore && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          color: "#22c55e",
          marginLeft: 6
        }
      }, "\u2713 DEFEATED")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 8,
          color: "#a78bfa",
          fontStyle: "italic",
          marginTop: 1
        }
      }, "\"", b.theme, "\""), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#94a3b8",
          marginTop: 4
        }
      }, b.description), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          marginTop: 6,
          fontSize: 8,
          color: "#64748b"
        }
      }, /*#__PURE__*/React.createElement("span", null, "\u23F0 ", b.durationDays, "d"), /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFC6 +", b.reward.xp, " XP"), /*#__PURE__*/React.createElement("span", null, "\uD83C\uDF96\uFE0F ", b.reward.badge)))), !wonBefore && /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          if (confirm(`Accept "${b.name}"?\n\nObjective: ${b.description}\nDuration: ${b.durationDays} days\nReward: +${b.reward.xp} XP`)) acceptBoss(b);
        },
        style: {
          width: "100%",
          marginTop: 8,
          padding: "7px",
          background: "linear-gradient(135deg,rgba(168,85,247,.2),rgba(59,130,246,.1))",
          border: "1px solid rgba(168,85,247,.4)",
          borderRadius: 5,
          color: "#c4b5fd",
          fontSize: 10,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: 1
        }
      }, "\u2694\uFE0F ACCEPT QUEST"));
    }), history.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#334155",
        letterSpacing: 2,
        marginTop: 14,
        marginBottom: 8
      }
    }, "\u25B8 BATTLE HISTORY"), history.slice(-5).reverse().map((h, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: "6px 10px",
        background: "rgba(255,255,255,.02)",
        borderRadius: 5,
        marginBottom: 4,
        fontSize: 9,
        display: "flex",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#cbd5e1"
      }
    }, h.emoji, " ", h.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: h.result === "victory" ? "#22c55e" : "#94a3b8"
      }
    }, h.result === "victory" ? "🏆 WON" : "⚪ ABANDONED")))));
  })()), tab === "progress" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      background: "linear-gradient(135deg,rgba(34,197,94,.08),rgba(59,130,246,.05))",
      border: "1px solid rgba(34,197,94,.2)",
      borderRadius: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#86efac",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, "\uD83D\uDCC8 PROGRESS DASHBOARD"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      marginTop: 2
    }
  }, "Visualize your journey. Charts update in real-time.")), weightLog.length > 1 && (() => {
    const weights = weightLog.filter(w => w.weight).slice(-12);
    const minW = Math.min(...weights.map(w => w.weight)) - 1;
    const maxW = Math.max(...weights.map(w => w.weight)) + 1;
    const range = maxW - minW;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 7,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        letterSpacing: 1,
        marginBottom: 8
      }
    }, "\uD83D\uDCC9 WEIGHT TREND"), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        height: 120,
        paddingLeft: 30,
        paddingBottom: 20
      }
    }, /*#__PURE__*/React.createElement("svg", {
      style: {
        width: "100%",
        height: "100%",
        overflow: "visible"
      },
      viewBox: `0 0 100 100`,
      preserveAspectRatio: "none"
    }, /*#__PURE__*/React.createElement("polyline", {
      points: weights.map((w, i) => `${i / (weights.length - 1) * 100},${100 - (w.weight - minW) / range * 90}`).join(" "),
      stroke: "#22c55e",
      strokeWidth: "0.7",
      fill: "none"
    }), weights.map((w, i) => /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: i / (weights.length - 1) * 100,
      cy: 100 - (w.weight - minW) / range * 90,
      r: "1.5",
      fill: "#22c55e"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        fontSize: 7,
        color: "#475569"
      }
    }, maxW.toFixed(1), "kg"), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        bottom: 20,
        fontSize: 7,
        color: "#475569"
      }
    }, minW.toFixed(1), "kg")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 8,
        color: "#64748b",
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("span", null, weights[0].date.slice(-5)), /*#__PURE__*/React.createElement("span", null, "now: ", weights[weights.length - 1].weight, "kg")));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px",
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 7,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      letterSpacing: 1,
      marginBottom: 8
    }
  }, "\uD83C\uDFAF MUSCLE XP DISTRIBUTION"), MUSCLE_GROUPS.filter(mg => mg.key !== "cardio").sort((a, b) => (muscleXp[b.key] || 0) - (muscleXp[a.key] || 0)).map(mg => {
    const xp = muscleXp[mg.key] || 0;
    const max = Math.max(...Object.values(muscleXp), 50);
    const pct = xp / max * 100;
    const isWeak = xp < 30;
    return /*#__PURE__*/React.createElement("div", {
      key: mg.key,
      style: {
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 9,
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: isWeak ? "#f59e0b" : "#cbd5e1"
      }
    }, mg.icon, " ", mg.name, isWeak && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 7,
        marginLeft: 6,
        color: "#f59e0b"
      }
    }, "WEAK")), /*#__PURE__*/React.createElement("span", {
      style: {
        color: isWeak ? "#f59e0b" : "#94a3b8",
        fontWeight: 700
      }
    }, xp, " XP")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        background: "rgba(0,0,0,.3)",
        borderRadius: 3,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: isWeak ? "linear-gradient(90deg,#f59e0b,#dc2626)" : `linear-gradient(90deg,#3b82f6,#22c55e)`,
        transition: "width .4s"
      }
    })));
  })), (() => {
    const wc = g.current.workoutCalendar || {};
    const today = new Date();
    const cells = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ks = d.toISOString().slice(0, 10);
      cells.push({
        date: ks,
        count: wc[ks] || 0,
        dow: d.getDay(),
        day: d.getDate()
      });
    }
    const totalDays = cells.filter(c => c.count > 0).length;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 7,
        marginBottom: 10
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
        fontSize: 9,
        color: "#94a3b8",
        letterSpacing: 1
      }
    }, "\uD83D\uDCC5 ACTIVITY (LAST 30 DAYS)"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "#22c55e",
        fontWeight: 700
      }
    }, totalDays, "/30")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(15,1fr)",
        gap: 3
      }
    }, cells.map((c, i) => {
      const intensity = c.count === 0 ? c.dow === 0 || c.dow === 6 ? "rest" : "miss" : c.count <= 2 ? "light" : c.count <= 4 ? "medium" : "full";
      const bg = {
        rest: "rgba(255,255,255,.04)",
        miss: "rgba(239,68,68,.2)",
        light: "rgba(34,197,94,.3)",
        medium: "rgba(34,197,94,.6)",
        full: "rgba(34,197,94,.9)"
      }[intensity];
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        title: `${c.date}: ${c.count} exercises`,
        style: {
          aspectRatio: "1",
          background: bg,
          borderRadius: 2,
          fontSize: 6,
          color: c.count > 0 ? "#fff" : "#475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      }, c.day);
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 6,
        fontSize: 7,
        color: "#475569",
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", null, "Less"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        background: "rgba(255,255,255,.04)",
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        background: "rgba(34,197,94,.3)",
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        background: "rgba(34,197,94,.6)",
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        background: "rgba(34,197,94,.9)",
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("span", null, "More")));
  })(), (() => {
    const sleepLog = g.current.sleepLog || [];
    const last7 = sleepLog.slice(-7);
    const avgH = last7.length ? fmtSleep(last7.reduce((s, x) => s + x.hours, 0) / last7.length) : "--";
    const avgR = last7.length ? (last7.reduce((s, x) => s + x.rating, 0) / last7.length).toFixed(1) : "--";
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayLogged = sleepLog.find(s => s.date === todayKey);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: "rgba(99,102,241,.05)",
        border: "1px solid rgba(99,102,241,.2)",
        borderRadius: 7,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#a5b4fc",
        letterSpacing: 1,
        marginBottom: 8
      }
    }, "\uD83D\uDE34 SLEEP TRACKER"), todayLogged ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 10px",
        background: "rgba(34,197,94,.1)",
        borderRadius: 5,
        marginBottom: 8,
        fontSize: 10,
        color: "#86efac",
        textAlign: "center"
      }
    }, "\u2713 Logat azi: ", fmtSleep(todayLogged.hours), " \xB7 ", "⭐".repeat(todayLogged.rating)) : /*#__PURE__*/React.createElement(SleepLogger, {
      logSleep: logSleep
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px",
        background: "rgba(0,0,0,.3)",
        borderRadius: 5,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 7,
        color: "#64748b",
        letterSpacing: 1
      }
    }, "7-DAY AVG HOURS"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        color: "#a5b4fc",
        fontWeight: 700
      }
    }, avgH)), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px",
        background: "rgba(0,0,0,.3)",
        borderRadius: 5,
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 7,
        color: "#64748b",
        letterSpacing: 1
      }
    }, "7-DAY AVG QUALITY"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        color: "#a5b4fc",
        fontWeight: 700
      }
    }, avgR, "/5"))));
  })(), (() => {
    const topLifts = ["Bench Press", "Squats", "DB Bench Press", "Overhead Press", "Leg Press", "Chest-Supported Row"];
    const lifts = topLifts.filter(n => liftLog[n] && liftLog[n].length >= 2);
    if (lifts.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 12px",
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 7
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        letterSpacing: 1,
        marginBottom: 8
      }
    }, "\u26A1 KEY LIFTS PROGRESSION"), lifts.map(n => {
      const sessions = liftLog[n];
      const maxes = sessions.map(s => Math.max(...s.sets.map(set => set.kg)));
      const first = maxes[0];
      const last = maxes[maxes.length - 1];
      const delta = last - first;
      return /*#__PURE__*/React.createElement("div", {
        key: n,
        style: {
          padding: "6px 8px",
          background: "rgba(0,0,0,.2)",
          borderRadius: 5,
          marginBottom: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: "#cbd5e1"
        }
      }, n), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          color: "#475569"
        }
      }, first, "kg \u2192 ", last, "kg"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "#64748b",
          fontWeight: 700
        }
      }, delta > 0 ? "+" : "", delta, "kg")));
    }));
  })()), tab === "mobility" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      background: "linear-gradient(135deg,rgba(251,146,60,.08),rgba(99,102,241,.05))",
      border: "1px solid rgba(251,146,60,.2)",
      borderRadius: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#fdba74",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, "\uD83E\uDD38 MOBILITY GUIDE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      marginTop: 2
    }
  }, "Reference only \xB7 No XP \xB7 Builds AGI when done daily (track in LIFE quest)")), Object.entries(MOBILITY_DATA).filter(([k]) => k !== "youtube").map(([key, section]) => /*#__PURE__*/React.createElement("div", {
    key: key,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px",
      background: key === "morning" ? "linear-gradient(135deg,rgba(251,191,36,.1),rgba(251,146,60,.05))" : "linear-gradient(135deg,rgba(99,102,241,.1),rgba(168,85,247,.05))",
      border: `1px solid ${key === "morning" ? "rgba(251,191,36,.3)" : "rgba(99,102,241,.3)"}`,
      borderRadius: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "#fff",
      fontWeight: 700
    }
  }, section.icon, " ", section.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      marginTop: 2
    }
  }, section.description)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 8px",
      background: "rgba(0,0,0,.3)",
      borderRadius: 5,
      fontSize: 10,
      color: "#cbd5e1",
      letterSpacing: 1
    }
  }, section.duration))), section.exercises.map((ex, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "10px 12px",
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 7,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24
    }
  }, ex.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#e2e8f0",
      fontWeight: 600
    }
  }, i + 1, ". ", ex.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginTop: 1,
      letterSpacing: 1
    }
  }, ex.duration))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      lineHeight: 1.5,
      paddingLeft: 34
    }
  }, ex.description))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginTop: 14,
      marginBottom: 6
    }
  }, "\u25B8 YOUTUBE RESOURCES"), MOBILITY_DATA.youtube.map((y, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: y.url,
    target: "_blank",
    rel: "noopener",
    style: {
      display: "block",
      padding: "10px 12px",
      background: "rgba(239,68,68,.05)",
      border: "1px solid rgba(239,68,68,.2)",
      borderRadius: 7,
      marginBottom: 6,
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20
    }
  }, "\uD83C\uDFA5"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#fca5a5",
      fontWeight: 600
    }
  }, y.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#94a3b8",
      marginTop: 2
    }
  }, y.description)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "#fca5a5"
    }
  }, "\u2197"))))), tab === "learn" && false, tab === "life" && /*#__PURE__*/React.createElement("div", null, false && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 6
    }
  }, "\u25B8 TODAY'S LEARNING FOCUS"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(59,130,246,.06),rgba(168,85,247,.04))",
      border: "1px solid rgba(59,130,246,.15)",
      borderRadius: 8,
      padding: "8px 12px",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#3b82f6",
      marginBottom: 4
    }
  }, "\uD83D\uDCC5 Rotation: Mon=\uD83D\uDCD6 Tue=\uD83E\uDD16 Wed=\uD83D\uDDE3\uFE0F Thu=\uD83D\uDCD6 Fri=\uD83E\uDD16")), (() => {
    const q = getTodayLearning();
    return /*#__PURE__*/React.createElement("button", {
      key: q.id,
      onClick: () => toggleQ(q.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 12px",
        marginBottom: 4,
        background: done.includes(q.id) ? "rgba(59,130,246,.08)" : "rgba(255,255,255,.02)",
        border: done.includes(q.id) ? "1px solid rgba(59,130,246,.3)" : "1px solid rgba(255,255,255,.06)",
        borderRadius: 7,
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
        fontFamily: "inherit"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 4,
        border: done.includes(q.id) ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: done.includes(q.id) ? "rgba(59,130,246,.15)" : "transparent"
      }
    }, done.includes(q.id) && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#3b82f6",
        fontSize: 12
      }
    }, "\u2713")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16,
        flexShrink: 0
      }
    }, q.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: done.includes(q.id) ? "#64748b" : "#e2e8f0",
        textDecoration: done.includes(q.id) ? "line-through" : "none"
      }
    }, q.label), q.desc && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#334155",
        marginTop: 1
      }
    }, q.desc), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#475569",
        marginTop: 1
      }
    }, "+", q.xp, "XP \xB7 ", q.stat, " \xB7 \u26A0\uFE0F PENALIZED")));
  })()), LIFE_Q_FIXED.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginTop: 12,
      marginBottom: 6
    }
  }, "\u25B8 DAILY HABITS"), LIFE_Q_FIXED.map(q => /*#__PURE__*/React.createElement("button", {
    key: q.id,
    onClick: () => toggleQ(q.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "10px 12px",
      marginBottom: 4,
      background: done.includes(q.id) ? "rgba(59,130,246,.08)" : "rgba(255,255,255,.02)",
      border: done.includes(q.id) ? "1px solid rgba(59,130,246,.3)" : "1px solid rgba(255,255,255,.06)",
      borderRadius: 7,
      cursor: "pointer",
      textAlign: "left",
      color: "inherit",
      fontFamily: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 4,
      border: done.includes(q.id) ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: done.includes(q.id) ? "rgba(59,130,246,.15)" : "transparent"
    }
  }, done.includes(q.id) && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#3b82f6",
      fontSize: 12
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      flexShrink: 0
    }
  }, q.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: done.includes(q.id) ? "#64748b" : "#e2e8f0",
      textDecoration: done.includes(q.id) ? "line-through" : "none"
    }
  }, q.label), q.desc && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      marginTop: 1
    }
  }, q.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginTop: 1
    }
  }, "+", q.xp, "XP \xB7 ", q.stat, " \xB7 \u26A0\uFE0F PENALIZED")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginTop: 16,
      marginBottom: 8,
      textTransform: "uppercase"
    }
  }, "\u25B8 TODAY'S PODCAST"), (() => {
    const todayPod = PODCAST_SCHEDULE[new Date().getDay()];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: "linear-gradient(135deg,rgba(168,85,247,.06),rgba(59,130,246,.04))",
        border: "1px solid rgba(168,85,247,.15)",
        borderRadius: 8,
        padding: 14,
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#a78bfa",
        letterSpacing: 1,
        marginBottom: 6
      }
    }, todayPod.cat.toUpperCase(), " DAY"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 28
      }
    }, "\uD83C\uDFA7"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        color: "#e2e8f0",
        fontWeight: 700
      }
    }, todayPod.pick), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        marginTop: 2,
        lineHeight: 1.4
      }
    }, todayPod.desc))), /*#__PURE__*/React.createElement("a", {
      href: todayPod.url,
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        display: "block",
        width: "100%",
        padding: "10px",
        textAlign: "center",
        background: "linear-gradient(135deg,rgba(239,68,68,.15),rgba(239,68,68,.08))",
        border: "1px solid rgba(239,68,68,.3)",
        borderRadius: 6,
        color: "#fca5a5",
        fontSize: 11,
        textDecoration: "none",
        fontFamily: "'Courier New',monospace",
        letterSpacing: 1
      }
    }, "\u25B6 OPEN ON YOUTUBE"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: "#475569",
        marginBottom: 4
      }
    }, "Or try these alternatives:"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        flexWrap: "wrap"
      }
    }, todayPod.alt.map((a, i) => /*#__PURE__*/React.createElement("a", {
      key: i,
      href: a.url,
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        flex: 1,
        padding: "7px 6px",
        textAlign: "center",
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 5,
        color: "#94a3b8",
        fontSize: 9,
        textDecoration: "none",
        fontFamily: "'Courier New',monospace"
      }
    }, a.name)))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        fontSize: 7,
        color: "#334155",
        textAlign: "center"
      }
    }, "Schedule: Mon=Investing \xB7 Tue=AI \xB7 Wed=Mindset \xB7 Thu=Training \xB7 Fri=Sales \xB7 Sat=Trends \xB7 Sun=Business"));
  })(), null), tab === "social" && false, tab === "health" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(34,197,94,.08),rgba(59,130,246,.05))",
      border: "1px solid rgba(34,197,94,.2)",
      borderRadius: 8,
      padding: "12px 14px",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#4ade80",
      letterSpacing: 1,
      marginBottom: 6
    }
  }, "\u2696\uFE0F " + (phase2 ? "BODY FAT GOAL" : "WEIGHT GOAL")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#94a3b8"
    }
  }, phase2 ? (latestBf !== null ? latestBf + "% BF" : latestW.weight + "kg") : latestW.weight + "kg"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#475569"
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#22c55e"
    }
  }, phase2 ? bfGoal + "% BF goal" : goalW + "kg goal")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "rgba(255,255,255,.05)",
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${progress}%`,
      background: "linear-gradient(90deg,#16a34a,#4ade80)",
      borderRadius: 4,
      transition: "width .6s ease"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      textAlign: "center"
    }
  }, progress.toFixed(0), "% to goal \xB7 ", phase2 ? (latestBf !== null ? (latestBf - bfGoal).toFixed(1) + "% BF remaining" : "loghează BF") : (latestW.weight - goalW).toFixed(1) + "kg remaining"), (() => {
    const wl = (weightLog || []).filter(w => w.date && w.date !== "Start" && typeof w.weight === "number");
    if (wl.length < 2) return null;
    // 7-day moving average of weight + BF
    const recent = wl.slice(-14);
    const ma = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
    const last7w = recent.slice(-7).map(w => w.weight);
    const prev7w = recent.slice(-14, -7).map(w => w.weight);
    const wTrend = prev7w.length ? ma(last7w) - ma(prev7w) : 0;
    const bfEntries = wl.filter(w => typeof w.fat === "number");
    const firstBf = bfEntries[0];
    const lastBf = bfEntries[bfEntries.length - 1];
    const muscleEntries = wl.filter(w => typeof w.muscle === "number");
    const firstM = muscleEntries[0];
    const lastM = muscleEntries[muscleEntries.length - 1];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,.08)"
      }
    },
    // Trend line (7d MA)
    /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        marginBottom: 4
      }
    }, "\uD83D\uDCC9 Trend greutate (medie 7 zile)"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: wTrend < 0 ? "#22c55e" : wTrend > 0 ? "#f59e0b" : "#94a3b8",
        marginBottom: 10
      }
    }, wTrend === 0 ? "Stabil" : `${wTrend > 0 ? "+" : ""}${wTrend.toFixed(2)}kg vs saptamana trecuta (zgomotul cantarului filtrat)`),
    // Lean mass watch
    lastM && firstM && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        marginBottom: 4
      }
    }, "\uD83D\uDCAA Lean mass watch (focus recompozitie)"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        marginBottom: 10,
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: (lastM.muscle - firstM.muscle) >= 0 ? "#22c55e" : "#f59e0b"
      }
    }, "Muschi: ", lastM.muscle, "kg (", (lastM.muscle - firstM.muscle) >= 0 ? "+" : "", (lastM.muscle - firstM.muscle).toFixed(1), ")"), lastBf && firstBf && /*#__PURE__*/React.createElement("span", {
      style: {
        color: (lastBf.fat - firstBf.fat) <= 0 ? "#22c55e" : "#f59e0b"
      }
    }, "BF: ", lastBf.fat, "% (", (lastBf.fat - firstBf.fat) <= 0 ? "" : "+", (lastBf.fat - firstBf.fat).toFixed(1), ")"))),
    // Sleep correlation
    (() => {
      const sl = g.current.sleepLog || [];
      if (sl.length < 3) return null;
      const goodNights = sl.filter(s => s.hours >= 7).length;
      const pct = Math.round(goodNights / sl.length * 100);
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#94a3b8",
          marginBottom: 4
        }
      }, "\uD83D\uDE34 Somn \u2194 retentie masa"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10,
          color: pct >= 43 ? "#22c55e" : "#ef4444",
          lineHeight: 1.4
        }
      }, `${goodNights}/${sl.length} nopti ≥7h (${pct}%). `, pct < 43 ? "Sub 3/sapt → risc pierdere masa in deficit." : "Bun — somnul sustine masa musculara."));
    })());
  })()), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 8
    }
  }, "\u25B8 LOG ENTRY"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#475569",
      marginBottom: 3
    }
  }, "Weight (kg)*"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "kg",
    value: newWeight,
    onChange: e => setNewWeight(e.target.value),
    style: {
      ...IS
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#475569",
      marginBottom: 3
    }
  }, "Body Fat %"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "%",
    value: newFat,
    onChange: e => setNewFat(e.target.value),
    style: {
      ...IS
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#475569",
      marginBottom: 3
    }
  }, "Muscle kg"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "kg",
    value: newMuscle,
    onChange: e => setNewMuscle(e.target.value),
    style: {
      ...IS
    }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: addWeightEntry,
    style: {
      width: "100%",
      padding: "9px",
      background: "linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.1))",
      border: "1px solid rgba(34,197,94,.3)",
      borderRadius: 5,
      color: "#86efac",
      fontSize: 11,
      cursor: "pointer",
      letterSpacing: 1
    }
  }, "\uD83D\uDCCA LOG WEIGHT")), weightLog.length > 1 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 6
    }
  }, "\u25B8 HISTORY"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 3,
      height: 80,
      marginBottom: 8
    }
  }, weightLog.slice(-14).map((w, i) => {
    const min = Math.min(goalW - 2, ...weightLog.map(x => x.weight));
    const max = Math.max(...weightLog.map(x => x.weight));
    const h = (w.weight - min) / (max - min) * 100;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 7,
        color: "#475569"
      }
    }, w.weight), /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: `${h}%`,
        minHeight: 4,
        background: w.weight <= goalW ? "#22c55e" : "linear-gradient(180deg,#3b82f6,#1e40af)",
        borderRadius: 2
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: `rgba(34,197,94,.3)`,
      marginBottom: 4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#22c55e",
      textAlign: "center"
    }
  }, "Goal: ", goalW, "kg")), weightLog.slice().reverse().map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 12px",
      marginBottom: 3,
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.04)",
      borderRadius: 5,
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#475569"
    }
  }, w.date), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#e2e8f0"
    }
  }, w.weight, "kg"), w.fat && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f59e0b"
    }
  }, w.fat, "%bf"), w.muscle && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#ef4444"
    }
  }, w.muscle, "kg\uD83D\uDCAA")))))), tab === "rank" && /*#__PURE__*/React.createElement("div", null, RANKS.map(r => {
    const cur = r.name === rank.name;
    const ach = level >= r.min;
    return /*#__PURE__*/React.createElement("div", {
      key: r.name,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        marginBottom: 3,
        background: cur ? "rgba(59,130,246,.08)" : "rgba(255,255,255,.01)",
        border: cur ? `1px solid ${r.color}44` : "1px solid rgba(255,255,255,.03)",
        borderRadius: 7,
        opacity: ach ? 1 : .35
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: ach ? r.color : "transparent",
        border: `2px solid ${r.color}`,
        boxShadow: cur ? `0 0 10px ${r.color}66` : "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: ach ? r.color : "#475569",
        fontWeight: cur ? 700 : 400
      }
    }, r.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#334155"
      }
    }, "Lv ", r.min, r.max < 999 ? `–${r.max}` : "+")), cur && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: r.color
      }
    }, "\u25C0 YOU"), ach && !cur && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#22c55e"
      }
    }, "\u2713"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 14,
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 8,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#64748b",
      lineHeight: 1.6,
      fontStyle: "italic"
    }
  }, "\"Complete your quests. Grow stronger.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#3b82f6"
    }
  }, "Arise."), "\""))), tab === "settings" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 10,
      textTransform: "uppercase"
    }
  }, "\u25B8 PREFERENCES"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 8,
      padding: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#e2e8f0",
      fontWeight: 600
    }
  }, "\uD83D\uDD0A Sound Effects"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#475569",
      marginTop: 2
    }
  }, "\"ARISE!\" voice + ding + slash + level up")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSoundOn(!soundOn);
      if (!soundOn) playSound("ready");
    },
    style: {
      padding: "8px 14px",
      background: soundOn ? "linear-gradient(135deg,rgba(34,197,94,.25),rgba(34,197,94,.1))" : "rgba(255,255,255,.05)",
      border: `1px solid ${soundOn ? "rgba(34,197,94,.5)" : "rgba(255,255,255,.1)"}`,
      borderRadius: 6,
      color: soundOn ? "#86efac" : "#64748b",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, soundOn ? "ON" : "OFF")), soundOn && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => playSound("ready"),
    style: {
      padding: "4px 8px",
      background: "rgba(168,85,247,.15)",
      border: "1px solid rgba(168,85,247,.3)",
      borderRadius: 5,
      color: "#c4b5fd",
      fontSize: 9,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Test ARISE!"), /*#__PURE__*/React.createElement("button", {
    onClick: () => playSound("setLogged"),
    style: {
      padding: "4px 8px",
      background: "rgba(59,130,246,.15)",
      border: "1px solid rgba(59,130,246,.3)",
      borderRadius: 5,
      color: "#93c5fd",
      fontSize: 9,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Test ding"), /*#__PURE__*/React.createElement("button", {
    onClick: () => playSound("levelUp"),
    style: {
      padding: "4px 8px",
      background: "rgba(251,191,36,.15)",
      border: "1px solid rgba(251,191,36,.3)",
      borderRadius: 5,
      color: "#fcd34d",
      fontSize: 9,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Test fanfare"), /*#__PURE__*/React.createElement("button", {
    onClick: () => playSound("bossDamage"),
    style: {
      padding: "4px 8px",
      background: "rgba(239,68,68,.15)",
      border: "1px solid rgba(239,68,68,.3)",
      borderRadius: 5,
      color: "#fca5a5",
      fontSize: 9,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Test slash"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 10,
      textTransform: "uppercase"
    }
  }, "\u25B8 BACKUP & TRANSFER"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(34,197,94,.06),rgba(59,130,246,.04))",
      border: "1px solid rgba(34,197,94,.2)",
      borderRadius: 8,
      padding: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4ade80",
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "\uD83D\uDCE4 EXPORT SAVE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#475569",
      marginBottom: 10,
      lineHeight: 1.5
    }
  }, "Generate a save code containing all your progress. Copy it and keep it safe \u2014 you can use it to restore on any account."), /*#__PURE__*/React.createElement("button", {
    onClick: exportSave,
    style: {
      width: "100%",
      padding: "10px",
      background: "linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.1))",
      border: "1px solid rgba(34,197,94,.3)",
      borderRadius: 6,
      color: "#86efac",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace",
      letterSpacing: 1,
      marginBottom: 8
    }
  }, "\u26A1 GENERATE SAVE CODE"), exportStr && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: exportStr,
    style: {
      width: "100%",
      height: 80,
      padding: 10,
      background: "rgba(0,0,0,.4)",
      border: "1px solid rgba(34,197,94,.2)",
      borderRadius: 6,
      color: "#86efac",
      fontSize: 9,
      fontFamily: "'Courier New',monospace",
      resize: "none",
      outline: "none",
      boxSizing: "border-box",
      wordBreak: "break-all"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#22c55e",
      marginTop: 4,
      textAlign: "center"
    }
  }, "\u2713 Long press the text above to select & copy"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,rgba(59,130,246,.06),rgba(168,85,247,.04))",
      border: "1px solid rgba(59,130,246,.2)",
      borderRadius: 8,
      padding: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#93c5fd",
      letterSpacing: 1,
      marginBottom: 4
    }
  }, "\uD83D\uDCE5 IMPORT SAVE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#475569",
      marginBottom: 10,
      lineHeight: 1.5
    }
  }, "Paste a save code from another account to restore all your progress here."), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Paste your save code here...",
    value: importStr,
    onChange: e => setImportStr(e.target.value),
    style: {
      width: "100%",
      height: 80,
      padding: 10,
      background: "rgba(0,0,0,.4)",
      border: "1px solid rgba(59,130,246,.15)",
      borderRadius: 6,
      color: "#e2e8f0",
      fontSize: 10,
      fontFamily: "'Courier New',monospace",
      resize: "none",
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 8
    }
  }), !showImportConfirm ? /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (importStr.trim()) setShowImportConfirm(true);else setNotif("Paste a save code first");
    },
    style: {
      width: "100%",
      padding: "10px",
      background: "linear-gradient(135deg,rgba(59,130,246,.2),rgba(59,130,246,.1))",
      border: "1px solid rgba(59,130,246,.3)",
      borderRadius: 6,
      color: "#93c5fd",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace",
      letterSpacing: 1
    }
  }, "\uD83D\uDCE5 IMPORT SAVE") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#f59e0b",
      marginBottom: 8,
      textAlign: "center",
      lineHeight: 1.4
    }
  }, "\u26A0\uFE0F This will REPLACE all current data. Are you sure?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: importSave,
    style: {
      flex: 1,
      padding: "10px",
      background: "linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.1))",
      border: "1px solid rgba(34,197,94,.3)",
      borderRadius: 6,
      color: "#86efac",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace"
    }
  }, "\u2713 YES, IMPORT"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowImportConfirm(false),
    style: {
      flex: 1,
      padding: "10px",
      background: "rgba(239,68,68,.1)",
      border: "1px solid rgba(239,68,68,.2)",
      borderRadius: 6,
      color: "#f87171",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace"
    }
  }, "\u2717 CANCEL")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.02)",
      border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 8,
      padding: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#334155",
      letterSpacing: 2,
      marginBottom: 8,
      textTransform: "uppercase"
    }
  }, "\u25B8 SAVE DATA SUMMARY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#94a3b8",
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("div", null, "Level: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#e2e8f0"
    }
  }, level), " (", rank.name, ")"), /*#__PURE__*/React.createElement("div", null, "Total XP: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#93c5fd"
    }
  }, totalXp)), /*#__PURE__*/React.createElement("div", null, "Quests Completed: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#e2e8f0"
    }
  }, qC)), /*#__PURE__*/React.createElement("div", null, "Lessons Done: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#a78bfa"
    }
  }, doneLessons.length, "/56")), /*#__PURE__*/React.createElement("div", null, "Streak: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f59e0b"
    }
  }, streak), " days"), /*#__PURE__*/React.createElement("div", null, "Weight Entries: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#22c55e"
    }
  }, weightLog.length)), /*#__PURE__*/React.createElement("div", null, "Workout Logs: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#e2e8f0"
    }
  }, wLog.length)), /*#__PURE__*/React.createElement("div", null, "Social Connections: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f472b6"
    }
  }, socialLog.length)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(239,68,68,.04)",
      border: "1px solid rgba(239,68,68,.15)",
      borderRadius: 8,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#ef4444",
      letterSpacing: 2,
      marginBottom: 8,
      textTransform: "uppercase"
    }
  }, "\u25B8 DANGER ZONE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#475569",
      marginBottom: 10,
      lineHeight: 1.5
    }
  }, "Reset all progress and start fresh. This cannot be undone \u2014 export your save first if you want to keep it."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (confirm("This will DELETE all your progress permanently. Are you absolutely sure?")) resetAllData();
    },
    style: {
      width: "100%",
      padding: "10px",
      background: "rgba(239,68,68,.1)",
      border: "1px solid rgba(239,68,68,.25)",
      borderRadius: 6,
      color: "#f87171",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "'Courier New',monospace",
      letterSpacing: 1
    }
  }, "\uD83D\uDDD1\uFE0F RESET ALL DATA")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: "8px 14px 14px",
      background: "linear-gradient(0deg,rgba(2,6,23,0.98) 60%,transparent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: manualSave,
    style: {
      flex: 1,
      maxWidth: 440,
      padding: "12px 20px",
      background: dirty ? "linear-gradient(135deg,rgba(245,158,11,.25),rgba(245,158,11,.12))" : "linear-gradient(135deg,rgba(34,197,94,.15),rgba(34,197,94,.06))",
      border: dirty ? "1px solid rgba(245,158,11,.4)" : "1px solid rgba(34,197,94,.3)",
      borderRadius: 8,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: "'Courier New',monospace"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, dirty ? "⚠️" : "💾"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: dirty ? "#fbbf24" : "#86efac",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, dirty ? "UNSAVED — TAP TO SAVE" : "SAVE PROGRESS"))), lastSaved && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 56,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 8,
      color: "#334155",
      zIndex: 99,
      pointerEvents: "none"
    }
  }, "Last saved: ", lastSaved), swapModal && (() => {
    const alts = EXERCISE_ALTERNATIVES[swapModal] || [];
    return /*#__PURE__*/React.createElement("div", {
      onClick: () => setSwapModal(null),
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.85)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(4px)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        maxWidth: 380,
        width: "100%",
        background: "linear-gradient(135deg,#0f172a,#1e293b)",
        border: "2px solid rgba(168,85,247,.4)",
        borderRadius: 12,
        padding: 18,
        maxHeight: "80vh",
        overflow: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#c4b5fd",
        letterSpacing: 1.5,
        fontWeight: 700
      }
    }, "\uD83D\uDD04 SWAP EXERCISE"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setSwapModal(null),
      style: {
        background: "none",
        border: "none",
        color: "#64748b",
        fontSize: 18,
        cursor: "pointer",
        padding: 0
      }
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        marginBottom: 10
      }
    }, "Replace ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#fff"
      }
    }, swapModal), " for today only"), (g.current.exerciseSwaps || {})[`${todayStr}_${swapModal}`] && /*#__PURE__*/React.createElement("button", {
      onClick: () => revertSwap(swapModal),
      style: {
        display: "block",
        width: "100%",
        padding: "10px 12px",
        marginBottom: 6,
        background: "rgba(251,191,36,.1)",
        border: "1px solid rgba(251,191,36,.35)",
        borderRadius: 7,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        color: "#fbbf24",
        fontSize: 11,
        fontWeight: 600
      }
    }, "\u21A9\uFE0F Revino la ", swapModal, " (original)"), alts.map((a, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => swapExercise(swapModal, a.name),
      style: {
        display: "block",
        width: "100%",
        padding: "10px 12px",
        marginBottom: 6,
        background: "rgba(168,85,247,.08)",
        border: "1px solid rgba(168,85,247,.25)",
        borderRadius: 7,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        color: "inherit"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#e2e8f0",
        fontWeight: 600
      }
    }, i + 1, ". ", a.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "#94a3b8",
        marginTop: 2,
        fontStyle: "italic"
      }
    }, a.reason))), alts.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px",
        textAlign: "center",
        color: "#64748b",
        fontSize: 10
      }
    }, "No alternatives configured for this exercise.")));
  })(), exerciseRestTimer && (() => {
    const remaining = exerciseRestTimer.totalSec - exerciseRestElapsed;
    const isReady = remaining <= 0;
    const pct = Math.min(100, exerciseRestElapsed / exerciseRestTimer.totalSec * 100);
    const mm = String(Math.floor(Math.abs(remaining) / 60)).padStart(2, "0");
    const ss = String(Math.abs(remaining) % 60).padStart(2, "0");
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 104,
        left: 8,
        right: 8,
        zIndex: 101,
        background: isReady ? "linear-gradient(135deg,rgba(168,85,247,.95),rgba(76,29,149,.95))" : "linear-gradient(135deg,rgba(15,23,42,.95),rgba(30,41,59,.95))",
        border: `2px solid ${isReady ? "#a855f7" : exerciseRestTimer.color}`,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,.6)",
        backdropFilter: "blur(8px)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: isReady ? "#fff" : "#c4b5fd",
        letterSpacing: 1.5
      }
    }, "\u23F8 EXERCISE PAUSE \xB7 NEXT: ", exerciseRestTimer.nextExerciseName.toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 900,
        color: "#fff",
        fontFamily: "'Courier New',monospace",
        lineHeight: 1
      }
    }, isReady ? "+" : "", mm, ":", ss), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: isReady ? "rgba(255,255,255,.8)" : "#a78bfa",
        marginTop: 1
      }
    }, isReady ? "✓ Ready for next exercise!" : `Target: ${Math.floor(exerciseRestTimer.totalSec / 60)}:${String(exerciseRestTimer.totalSec % 60).padStart(2, "0")}`)), /*#__PURE__*/React.createElement("button", {
      onClick: stopExerciseRest,
      style: {
        padding: "6px 10px",
        background: "rgba(255,255,255,.15)",
        border: "1px solid rgba(255,255,255,.3)",
        borderRadius: 5,
        color: "#fff",
        fontSize: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 700
      }
    }, isReady ? "GO" : "SKIP")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        background: "rgba(0,0,0,.3)",
        borderRadius: 2,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: isReady ? "#fff" : exerciseRestTimer.color,
        transition: "width .5s ease"
      }
    })));
  })(), restTimer && (() => {
    const remaining = restTimer.totalSec - restElapsed;
    const overTime = remaining < 0;
    const pct = Math.min(100, restElapsed / restTimer.totalSec * 100);
    const mm = String(Math.floor(Math.abs(remaining) / 60)).padStart(2, "0");
    const ss = String(Math.abs(remaining) % 60).padStart(2, "0");
    const c = restTimer.color;
    const isReady = remaining <= 0 && remaining > -30;
    const isOverdue = remaining <= -30;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 104,
        left: 8,
        right: 8,
        zIndex: 100,
        background: isOverdue ? "linear-gradient(135deg,rgba(239,68,68,.95),rgba(127,29,29,.95))" : isReady ? "linear-gradient(135deg,rgba(34,197,94,.95),rgba(20,83,45,.95))" : "linear-gradient(135deg,rgba(15,23,42,.95),rgba(30,41,59,.95))",
        border: `2px solid ${isOverdue ? "#ef4444" : isReady ? "#22c55e" : c}`,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,.5)",
        backdropFilter: "blur(8px)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: isReady || isOverdue ? "#fff" : "#94a3b8",
        letterSpacing: 1.5
      }
    }, restTimer.exerciseName.toUpperCase(), " \xB7 SET ", restTimer.setNum), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        fontWeight: 900,
        color: isOverdue ? "#fff" : isReady ? "#fff" : c,
        fontFamily: "'Courier New',monospace",
        lineHeight: 1
      }
    }, overTime ? "+" : "", mm, ":", ss), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: isReady || isOverdue ? "rgba(255,255,255,.8)" : "#475569",
        marginTop: 1
      }
    }, isOverdue ? "⚠️ Resting too long — start next set!" : isReady ? "✓ READY — Start next set!" : `Target: ${Math.floor(restTimer.totalSec / 60)}:${String(restTimer.totalSec % 60).padStart(2, "0")}`)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => addTime(15),
      style: {
        padding: "4px 8px",
        background: "rgba(255,255,255,.1)",
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 4,
        color: "#fff",
        fontSize: 9,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "+15s"), /*#__PURE__*/React.createElement("button", {
      onClick: () => stopRest(true),
      style: {
        padding: "4px 8px",
        background: isReady || isOverdue ? "rgba(255,255,255,.2)" : "rgba(239,68,68,.2)",
        border: `1px solid ${isReady || isOverdue ? "rgba(255,255,255,.4)" : "rgba(239,68,68,.4)"}`,
        borderRadius: 4,
        color: "#fff",
        fontSize: 9,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 700
      }
    }, isReady || isOverdue ? "DONE" : "SKIP"))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        background: "rgba(0,0,0,.3)",
        borderRadius: 2,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: isOverdue ? "#ef4444" : isReady ? "#22c55e" : c,
        transition: "width .3s ease"
      }
    })));
  })());
}