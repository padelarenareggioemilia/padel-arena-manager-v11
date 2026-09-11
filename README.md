# V11 — Gestione Corsi e Lezioni v1

Questa versione aggiorna il file `app.js` esistente e aggiunge la prima gestione reale
di Corsi e Lezioni per:

**Francesco Lignola — Istruttore Nazionale AICS**

## Cosa fa

- Nuova sezione Admin `Corsi e lezioni`
- Calendario reale 14–26 settembre 2026
- EDEN + Happy Time
- Classi tecniche massimo 4
- X1 massimo 1
- Prezzo classi tecniche 15 € fino al 31/10/2026
- Regola già predisposta a 17 € dal 01/11/2026
- X1 a 35 € oppure pacchetto
- Filtri centro / tipo
- Caricamento programmazione senza duplicati
- Link condivisibile per ogni disponibilità
- Vista Cliente `Lezioni e corsi`
- Prenotazione con chiusura automatica al raggiungimento della capienza
- Livello del cliente salvato nella prenotazione
- Martedì e giovedì pausa pranzo NON pubblicati: restano disponibilità X1/X2 su richiesta

## File da sostituire

1. `app.js` -> sostituire quello nella root del repository.
2. `firestore.rules` -> aggiornare il file nel repository e poi pubblicare le stesse regole nella console Firebase.

`index.html` non va modificato.

## Sequenza consigliata

1. Carica `app.js` su GitHub.
2. Carica `firestore.rules` su GitHub.
3. In Firebase > Firestore > Regole, sostituisci le regole con il contenuto di `firestore.rules` e Pubblica.
4. Apri V11 come Admin.
5. Vai `Corsi e lezioni`.
6. Premi `Carica programmazione 14–26/9`.
7. Controlla le 18 disponibilità.
8. Usa `Condividi` per ottenere il link diretto.

## Nota importante

Il caricamento della programmazione avviene SOLO quando l'Admin preme il pulsante.
Quindi installare il codice non pubblica automaticamente gli slot.
