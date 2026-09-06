# Padel Arena Manager v11 — Core ufficiale

Questo pacchetto NON sostituisce la V11 esistente: la consolida.
La UI già presente su GitHub resta intatta; questi file aggiungono il primo strato architetturale.

## Regole madri congelate

1. Un solo account per persona su tutta la piattaforma.
2. Multi-circolo nativo.
3. Core unico, configurazioni per circolo.
4. Infrastruttura base a costo obbligatorio zero.
5. Permessi prima dei ruoli.
6. Un'unica entità `activity` per partita, lezione, corso, evento, torneo, campionato, blocco e manutenzione.
7. Un'unica entità `resource` per campo, istruttore, sala o altra risorsa prenotabile.
8. `organize` non blocca risorse fino alla soglia minima; `book` blocca subito.
9. La prima organizzazione che raggiunge la soglia minima conferma e blocca le risorse.
10. Notifiche e suggerimenti aiutano a completare, ma non modificano la priorità.
11. Nessun addebito definitivo prima della conferma dell'attività.
12. Audit obbligatorio per le operazioni rilevanti.
13. Solo Admin può vedere anteprime delle altre modalità.

## Motori già congelati

- Identity / Anagrafica
- Ruoli e permessi
- Activity Engine
- Resource / Booking Engine
- Economic Engine
- Communications Engine
- Invitations / Network Engine
- Instructor Engine
- Fixed Court
- Audit / storico

## Livelli giocatore

- Principiante
- Principiante avanzato
- Intermedio
- Avanzato

## Stati attività

- draft
- published
- organizing
- confirmed
- in_progress
- completed
- cancelled

## Modalità

- organize
- book

## Regola di sviluppo

Inventario → specifica → implementazione isolata → test → integrazione → congelamento.
