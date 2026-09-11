# V11 — Gestione Corsi e Lezioni v2

Aggiornamento della v1 con gestione iscritti e condivisione multipla.

## Novità

### Admin
- ogni lezione mostra gli iscritti reali;
- mostra quanti giocatori mancano per completarla;
- ogni giocatore iscritto è cliccabile;
- scheda giocatore con anagrafica, livello, pacchetti/abbonamenti e pagamenti;
- selezione multipla delle lezioni tramite checkbox;
- pulsante unico `Condividi lezioni selezionate su WhatsApp`;
- il messaggio WhatsApp contiene un solo link.

### Cliente
- il link WhatsApp può contenere una o più lezioni;
- il giocatore vede tutte le lezioni condivise;
- può selezionare una o più lezioni;
- può prenotarle con un'unica conferma;
- viene impedita la doppia iscrizione alla stessa lezione;
- se una delle lezioni è completa l'operazione viene bloccata prima di scrivere.

### Istruttore
- nuova sezione `Le mie lezioni`;
- iscritti visibili;
- conteggio posti occupati e mancanti per chiudere.

## Dati economici giocatore

Sono predisposte due raccolte:
- `user_packages`
- `payments`

Se sono vuote la scheda mostra correttamente che non ci sono ancora dati registrati.

## File da sostituire

1. `app.js`
2. `firestore.rules`

`index.html` non va modificato.

## Importante

Dopo aver sostituito `firestore.rules` su GitHub, copiare le stesse regole in:
Firebase > Firestore > Regole > Pubblica.
