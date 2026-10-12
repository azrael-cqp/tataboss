# Sistem Antrenament — versiunea 2 (12 octombrie 2026)

## Fisiere
1. **app.compiled.js** — aplicatia (singurul fisier schimbat)
2. **index.html** — neschimbat fata de prima versiune
3. **INSTRUCTIUNI.md** — acest fisier

## Deploy
1. Drag & drop `app.compiled.js` peste cel existent, in repo (nume exact, cu PUNCT).
2. Commit, astepti 2-3 minute, deschizi in Safari privat sau dai clear cache.
3. Datele raman intacte. Istoricul de greutati la sala nu se pierde.

## Ce s-a schimbat

### Scos complet
- Misiunile zilnice: cei 10.000 de pasi si proteina. Nu se bifau.
- Obiectivele saptamanale (sauna).
- Somnul si fereastra obligatorie de somn.
- Cantarirea si fereastra de luni. Greutatea se tine pe cantarul cu bioimpedanta, separat.
- Taburile AZI si CORP. Au ramas trei: **SALA · PROGRES · SETARI**.

### Penalizari
Acum se penalizeaza doar exercitiile sarite dintr-o zi de antrenament, cate 10 XP.
Exercitiile de abdomen si mersul pe banda nu se penalizeaza niciodata.
Weekendul si modul plecare raman fara penalizari.

### Nivel recalculat
La prima deschidere, aplicatia recalculeaza nivelul din antrenamentele chiar facute
(122 de exercitii logate pana acum) si sterge istoricul vechi de penalizari.
**Trece de la nivelul 2 la nivelul 8, RANG D.** Apare o notificare care anunta asta.
Se intampla o singura data.

### Intensitate marita
Primele doua exercitii ale fiecarei zile: **4 serii** in loc de 3.
Exercitiile de izolare: **3 serii** in loc de 2.

| Zi | Inainte | Acum |
|---|---|---|
| Luni, Marti, Joi, Vineri | 16 serii | 20 serii |
| Miercuri | 16 serii | 19 serii |

Regula de progresie e scrisa acum explicit in aplicatie:
**intai o repetare in plus, apoi o serie in plus, abia la final kilograme.**

### Plank
Varianta normala, pe varfuri, nu pe genunchi. **3 × 30-45 secunde.**
Si plank-ul lateral e acum pe talpi, 3 × 30 secunde pe parte.
Varianta pe genunchi a ramas scrisa la "DACA E PREA GREU".

### Bird dog scos
Il apasa pe genunchi. Inlocuit cu **Dead bug** (culcat pe spate, brat si picior opus),
care lucreaza exact aceiasi muschi stabilizatori, dar cu zero presiune pe genunchi.
Schimbat si in programul de acasa.

### Core nou miercurea
**Mers cu gantera intr-o mana** (farmer carry pe o parte), 3 × 30 de pasi pe parte.
Lucreaza lateralele abdomenului si muschii care tin coloana dreapta — acelasi lucru
ca atunci cand cari o sacosa grea. Se face in picioare, fara nimic pe genunchi.
Ca sa nu iasa ziua prea lunga, am scos puntea de fese din miercuri — presa de picioare
si ridicarile de pe scaun acopera deja fesierii.

### Mers pe banda, 20 de minute, luni-vineri
Apare ca ultim exercitiu in fiecare zi de antrenament, dupa greutati.
- 4,5-5,5 km/h, inclinatie 2-4 %, fara alergare
- Ritmul corect: inca poate vorbi, dar nu ar putea canta
- Fara tinut de bare
- Da puncte la VIT si la grupa Inima / Cardio
- In modul plecare devine **mers alert afara, 20 de minute**

Sambata si duminica raman complet libere.

## De verificat dupa deploy
- La prima deschidere apare notificarea cu nivelul recalculat (nivelul 8).
- Jos sunt doar trei butoane: SALA, PROGRES, SETARI.
- Miercuri: apar "Mers cu gantera intr-o mana" si "Mers pe banda 20 de minute".
- Luni: plank-ul scrie 3 × 30-45 secunde.
- Marti: in loc de bird dog apare dead bug.
