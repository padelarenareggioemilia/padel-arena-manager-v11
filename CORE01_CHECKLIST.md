# Checklist test — Core V11 / Pacchetto 01

## Compatibilità
- [ ] La V11 esistente continua ad aprirsi.
- [ ] Login Firebase esistente continua a funzionare.
- [ ] Admin esistente mantiene accesso al gestionale.
- [ ] Cliente non vede la modalità Admin.
- [ ] Istruttore non vede la modalità Admin.

## Schema
- [ ] Nome e cognome restano separati.
- [ ] I nuovi profili possono usare `roles[]` senza rompere il vecchio `role`.
- [ ] I livelli ammessi sono i 4 congelati.
- [ ] Una activity può essere costruita con `newActivity()`.
- [ ] `organize` resta organizing finché non raggiunge il minimo.
- [ ] `book` può confermare subito se le risorse sono disponibili.
- [ ] Se un partecipante esce e si scende sotto soglia, l'attività torna organizing.
- [ ] Nessun addebito definitivo prima di confirmed.

## Firebase
- [ ] Le regole correnti vengono salvate prima della sostituzione.
- [ ] `firestore.rules` viene pubblicato solo dopo verifica.
- [ ] Un cliente può leggere solo il proprio profilo.
- [ ] Un Admin può leggere i profili.
- [ ] `audit_logs` non è modificabile dopo la creazione.

## Regola di rilascio
Non passare al Pacchetto 02 finché tutti i test applicabili non sono verdi.
