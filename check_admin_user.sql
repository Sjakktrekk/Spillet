-- Sjekk om admin-brukeren finnes i tabellen
SELECT * FROM admin_users;

-- Sletter brukeren først for å unngå duplikater
DELETE FROM admin_users WHERE user_id = '4105763b-0041-498e-8d7f-a9448565903d';

-- Legger til brukeren på nytt
INSERT INTO admin_users (user_id) 
VALUES ('4105763b-0041-498e-8d7f-a9448565903d');

-- Bekrefter at brukeren er lagt til
SELECT * FROM admin_users; 