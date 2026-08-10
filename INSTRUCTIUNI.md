# Sistem Antrenament — instructiuni de instalare

## Fisiere
1. **app.compiled.js** — aplicatia
2. **index.html** — pagina care porneste aplicatia
3. **INSTRUCTIUNI.md** — acest fisier

## Deploy (GitHub Pages)
1. Fa un **repository NOU** (de exemplu `Antrenament-Tata`). Nu il pune peste LvlUP-v3.
2. Urca ambele fisiere: `app.compiled.js` si `index.html` (nume exacte, cu PUNCT la app.compiled.js).
3. Settings → Pages → Branch: main → Save.
4. Asteapta 2-3 minute, apoi deschide linkul in Safari.
5. Share → **Add to Home Screen**, ca sa arate ca o aplicatie adevarata.

> **Important:** baza de date se numeste `AntrenamentRO_DB`, alta decat cea din aplicatia ta
> (`SoloLevelingDB`). Chiar daca ajung pe acelasi cont GitHub Pages, datele NU se amesteca.
> Daca ai fi pastrat acelasi nume, cele doua aplicatii si-ar fi suprascris reciproc salvarile.

## Ce e diferit fata de aplicatia ta

### Text
- Corp de text 21px, titluri 24-34px, cifre mari 46px.
- Butoane inalte, casete de introdus date cu cifre de 24px.
- Pinch-to-zoom permis (am scos `user-scalable=no`).
- Totul in romana, fara diacritice, ca sa nu se strice la niciun copy-paste.

### Scos
- Bosii (tot tabul si toata librăria).
- Bonusurile de antrenament (100 flotari, kettlebell, hollow hold etc.).
- Dusul rece.
- Yoga din obiectivele saptamanale.
- Cardio 30 minute.
- Procentul de grasime — nu apare nicaieri.
- Partea de invatare AI, podcast, carti, social (era deja dezactivata).

### Pastrat
- Niveluri, XP, ranguri, streak, multiplicatori.
- Cele 5 statistici: STR, VIT, AGI, INT, PER.
- Ranguri pe grupa musculara.
- Penalizari zilnice si saptamanale, fara penalizari in weekend si in modul plecare.
- Mod plecare / vacanta cu antrenamente acasa.
- Cronometru de pauza cu sunet si vibratie.
- Jurnal de greutati cu recomandare de progresie.
- Schimbarea unui exercitiu pe ziua respectiva.
- Salvare automata, export si import.

### Adaugat
- **10.000 de pasi** ca misiune zilnica (30 XP).
- **Proteina**: 2 shake-uri + carne 280-310 g. Fara baton, fara jerky.
- **Somnul** — fereastra obligatorie la deschiderea aplicatiei, in fiecare zi.
- **Cantarirea** — fereastra obligatorie LUNEA. Doar greutatea, atat.
  (Ambele au un „Mai tarziu" discret, ca sa nu ramana blocat daca nu are cantarul la indemana.)
- Greutate tinta + grafic de evolutie in tabul CORP.
- Reguli de siguranta si semne la care trebuie sa se opreasca imediat.

## Programul de antrenament

Tot PPL, 5 zile, aceleasi zile ca la tine:

| Zi | Tip |
|----|-----|
| Luni | Impingere (piept, umeri, triceps) |
| Marti | Tragere (spate, biceps) |
| Miercuri | Picioare |
| Joi | Impingere |
| Vineri | Tragere |
| Sambata, Duminica | Odihna — doar pasii si proteina |

Adaptat pentru un om de aproape 60 de ani, supraponderal, la inceput:

- **6 exercitii pe zi**, nu 8. Antrenament de 45-55 de minute.
- **Majoritar aparate**, nu bara libera. Aparatul ghideaza miscarea si iarta greselile de tehnica.
- **Scoase complet**: indreptari de la sol, genuflexiuni cu bara pe spate, ramat aplecat cu bara,
  ridicari de picioare atarnat, abdomene la banca inclinata negativ, rasuciri rusesti cu greutate.
- **In locul lor**: presa de picioare cu amplitudine limitata la 90 de grade, ridicari de pe scaun,
  ramat cu sprijin pe piept, plank pe genunchi, bird dog, presa Pallof.
- **10-15 repetari**, greutati moderate, oprire cand mai poate face 2-3 repetari corecte.
  Niciodata la epuizare.
- **Pauze 90-150 secunde** — mai lungi decat la tine, refacerea e mai lenta la varsta asta.
- Progresia creste cu 1-2,5 kg si doar dupa doua antrenamente curate la rand.

Fiecare exercitiu are explicatie completa, in romana:
**CUM SE FACE · CE LUCREAZA · ATENTIE · DACA E PREA GREU**

### Siguranta
In tabul SALA, deasupra exercitiilor, e un buton rosu cu regulile si cu semnele la care se
opreste imediat: durere in piept, ameteala, respiratie care nu se linisteste, batai neregulate,
durere care coboara in brat. Recomandarea de control medical inainte de start e scrisa acolo.

## Modul plecare
Se porneste din SETARI inainte sa plece. Atunci:
- Antrenamentele de sala se inlocuiesc automat cu 5 zile de antrenament acasa,
  cu banda elastica si greutatea corpului (flotari inclinate, ramat cu banda, ridicari de pe scaun etc.).
- Zero penalizari.
- Pasii si proteina raman la fel.

## De verificat dupa instalare
- La prima deschidere apare fereastra cu somnul.
- Daca e luni, dupa somn apare si cantarirea.
- Tabul SALA arata ziua curenta cu chenar mai deschis in selectorul de sus.
- Apasa pe un exercitiu → se deschide cu explicatia si cu casetele pentru kg si repetari.
- Butonul PAUZA porneste cronometrul; suna si vibreaza cand e gata.
- SETARI → porneste modul plecare → SALA trebuie sa arate antrenamentele cu banda.
