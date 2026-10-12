# DEPLOY — update 12 oct 2026 (patch 5)

## Ce s-a schimbat

### 1. PADEL — activitate bonus
- Apare in sectiunea **BONUS (TODAY)** in fiecare zi, fara zile fixe
- Il bifezi doar in ziua in care ai jucat
- **+45 XP, stat AGI** (cel mai mare bonus din app)
- **Fara penalizare** daca nu joci — bonusurile nu se penalizeaza

### 2. CABLE WOODCHOPPERS — core finisher pe joi
- Joi UPPER era singura zi fara abdomen; acum are
- 3×12-15 pe fiecare parte, pauza 45s, muscle "Core", marcat ca finisher
- Joi are acum 9 exercitii (de la 8)

## Deploy
1. Deschide repo-ul **azrael-cqp/LevelupV4** pe GitHub
2. **Drag & drop** `app.compiled.js` peste fisierul existent — NU copy-paste din iOS (smart quotes strica fisierul)
3. Commit direct pe main
4. Asteapta 2-3 minute, apoi deschide app-ul in **Safari privat** ca sa ocolesti cache-ul

## Verificare dupa deploy
- Tab QUESTS → sectiunea BONUS (TODAY) → apare **Padel** cu iconita de minge
- Tab PPL → selecteaza Thursday → ultimul exercitiu e **Cable Woodchoppers**
- Streak si XP neatinse (nicio migrare, nimic sters)

## Ce NU s-a schimbat
- Protein intake ramane in quest-urile zilnice (ai revenit asupra deciziei)
- Nicio migrare de date — exercitiile noi pornesc cu istoric gol, restul intact

---

<!-- ARHIVA -->

# Solo Leveling System — Deploy Instructions

## Fisiere
1. **app.compiled.js** — aplicatia (singurul fisier care se schimba)
2. **index.html** — neschimbat
3. **DEPLOY_INSTRUCTIONS.md** — acest fisier

## Deploy (GitHub Pages)
1. Repo: github.com/azrael-cqp/LvlUP-v3
2. Drag & drop `app.compiled.js` peste cel existent (nume exact, cu PUNCT)
3. NICIODATA copy-paste din iOS in editorul GitHub
4. Commit → asteapta 2-3 min → Safari privat / clear cache
5. Datele tale (IndexedDB) raman intacte

---

# CHANGELOG — Update 1 Octombrie 2026

Sapte modificari intr-un singur deploy.

## Exercitii bodyweight — progresie doar prin repetari

Trei exercitii nu mai au camp de kg. Vezi doar numarul si repetarile, iar sub titlu scrie `Bodyweight · progresezi prin REPS · fara greutate`. Recomandarea e intotdeauna +1 repetare, niciodata o greutate mai mare.

| | Inainte | Acum |
|---|---|---|
| Spate, marti | Lat Pulldown 4×8-10 | **Pull-ups 4×5-8**, pauza 150s |
| Abdomen | Hanging Leg Raises 3×15 | **3×12-20**, fara gantera |
| Core | Weighted Plank 3×45-60s | **Plank 3×45-90s**, fara disc |

**Pull-ups inlocuieste complet Lat Pulldown** ca prim exercitiu de spate. Alternative daca nu ies cele cinci: Assisted, Negative (doar coborarea, 5 secunde), Lat Pulldown.

Istoricul de Lat Pulldown ramane separat — 115kg pe aparat nu se compara cu tractiuni neasistate. Cele doua istorice de Plank (unul sub "Weighted Plank", altul sub "Plank") au fost fuzionate cronologic, cu greutatile puse la zero. La fel si cele 17.5kg de la Hanging Leg Raises.

## Barbell Curls → Cable Curls

Marti, exercitiul 5. Descriere noua care explica de ce greutatea mai mica **nu e regresie**: la scripete tensiunea e constanta pe toata amplitudinea, inclusiv in varf unde la haltera se pierde.

Istoricul de Barbell Curls ramane separat — altfel aplicatia ti-ar recomanda 45kg la cablu.

## Boss fights — scoase

Tab-ul BOSS a disparut din bara de jos. Ai acum sase tab-uri in loc de sapte: QUESTS, PPL, STATS, BODY, RANK, SAVE.

Daca aveai un boss activ, se inchide automat si trece in istoric ca abandonat, fara penalizare. Victoriile din trecut raman salvate in date.

## Cardio 30 min — scos din quest-urile zilnice

Quest-urile zilnice au ramas cinci, toate pe proteina. Daca il aveai bifat azi, se debifeaza la prima deschidere ca sa nu ramana blocat.

Nota: cardio-ul pe banda la birou nu era cauza pierderii de masa slaba — XP-ul de cardio era blocat la 144 de dinainte de 24 septembrie, iar scaderea a venit din cele zece zile fara antrenamente de forta. Il scoatem pentru simplitate, nu pentru interferenta. Se reintroduce cand vrei.

## Kettlebell Pavel — scos din bonus quests

Sambata au ramas: 100 Sit-ups, Inot, Mobility.

Nivelurile de kettlebell raman salvate in date, deci cand il reintroduci nu pornesti de la zero. Textul de deblocare AGI nu mai trimite la kettlebell — invata Turkish Get-Up cu o gantera usoara.

---

## Verificare dupa deploy

1. **Bara de jos**: sase tab-uri, fara BOSS
2. **Quest-uri zilnice**: cinci, toate proteina, fara cardio
3. **Sambata**: fara Kettlebell Pavel
4. **Marti**: primul exercitiu e Pull-ups (4×5-8), al cincilea e Cable Curls
5. Deschide **Pull-ups**: nu exista coloana kg, doar `#` si `reps`
6. **Miercuri**, ultimul exercitiu se numeste Plank, nu Weighted Plank
7. Istoricul de Plank arata toate sesiunile din iulie incoace intr-un singur loc

Testat inainte de livrare intr-un browser simulat cu datele tale: zero erori de randare, ambele migrari verificate.
