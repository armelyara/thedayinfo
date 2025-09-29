# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Important: Firestore Indexing

This application uses Firestore queries that require a custom composite index. If the application fails to load articles with a `FAILED_PRECONDITION` error in the logs, it's because this index is missing.

**Please create the index by visiting the following URL:**

[https://console.firebase.google.com/v1/r/project/studio-6400668306-1ec3d/firestore/indexes?create_composite=Clhwcm9qZWN0cy9zdHVkaW8tNjQwMDY2ODMwNi0xZWMzZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXJ0aWNsZXMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaEwoPcHVibGljYXRpb25EYXRlEAIaDAoIX19uYW1lX18QAg](https://console.firebase.google.com/v1/r/project/studio-6400668306-1ec3d/firestore/indexes?create_composite=Clhwcm9qZWN0cy9zdHVkaW8tNjQwMDY2ODMwNi0xZWMzZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXJ0aWNsZXMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaEwoPcHVibGljYXRpb25EYXRlEAIaDAoIX19uYW1lX18QAg)

Click the link, confirm the index details, and click "Create". The index may take a few minutes to build.
## Important : Indexation Firestore pour les brouillons

La tâche cron qui publie les brouillons programmés utilise une requête Firestore qui nécessite un index composite personnalisé. Si la tâche cron échoue avec une erreur `FAILED_PRECONDITION` dans les journaux, c'est parce que cet index est manquant.

**Veuillez créer l'index en visitant l'URL suivante :**

[https://console.firebase.google.com/v1/r/project/studio-6400668306-1ec3d/firestore/indexes?create_composite=Clhwcm9qZWN0cy9zdHVkaW8tNjQwMDY2ODMwNi0xZWMzZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZHJhZnRzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg4KCnNjaGVkdWxlZEZvehpEAEaDAoIX19uYW1lX18QAg](https://console.firebase.google.com/v1/r/project/studio-6400668306-1ec3d/firestore/indexes?create_composite=Clhwcm9qZWN0cy9zdHVkaW8tNjQwMDY2ODMwNi0xZWMzZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZHJhZnRzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg4KCnNjaGVkdWxlZEZvehpEAEaDAoIX19uYW1lX18QAg)

Cliquez sur le lien, confirmez les détails de l'index et cliquez sur « Créer ». La création de l'index peut prendre quelques minutes.
