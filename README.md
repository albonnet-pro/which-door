# Y'a quoi derrière la porte ?

Reprise du concept de Squeezie : à chaque round, deux portes et deux dilemmes, dont une mauvaise porte.

Déroulé d'un round :

1. Le joueur choisit une porte, qui s'ouvre.
2. La vidéo cachée derrière se lance. Le bouton « Continuer » ne se débloque qu'à la fin de la vidéo.
3. Le verdict s'affiche : bonne ou mauvaise porte, avec le pourcentage de joueurs pour chaque choix. On peut aussi regarder la vidéo de l'autre porte.
4. Le joueur passe au round suivant. À la fin, un récap affiche son score.

- `/` : accueil
- `/play` : le jeu (les rounds actifs, dans l'ordre défini dans l'admin)
- `/admin` : espace admin **sans authentification**. On y crée, modifie, réordonne, active ou désactive et supprime les rounds, et on remet les votes à zéro. Pour chaque porte, on renseigne une vidéo, soit en uploadant un fichier (mp4, webm, mov, m4v, ogv), soit avec l'URL directe d'un fichier vidéo. Pour chaque round, on désigne la mauvaise porte.

Les vidéos uploadées sont stockées dans `UPLOAD_DIR` (par défaut `./uploads`, et `/app/uploads` dans Docker), avec une taille maximale de `UPLOAD_MAX_MB` (500 Mo par défaut). Une vidéo remplacée ou appartenant à un round supprimé est effacée du disque.

Stack : Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Drizzle ORM avec mysql2, MySQL 8.4.

## Développement

```bash
docker compose -f docker-compose.dev.yml up -d   # MySQL local sur le port 3306
cp .env.example .env.local
npm install
npm run dev
```

Au démarrage du serveur (`src/instrumentation.ts`), les migrations de `src/db/migrate.ts` s'appliquent automatiquement. Si la base est vide, 3 rounds d'exemple sont insérés. Pour changer le schéma, ajoutez une nouvelle migration à la liste et ne modifiez jamais une migration existante.

## Déploiement avec Portainer

Le fichier `docker-compose.yml` sert de stack Portainer :

- `app` : l'image Next en mode standalone, sur le port 3000. Elle est branchée sur le réseau externe **`web`** (pour le reverse proxy) et sur le réseau interne.
- Les vidéos sont dans le volume `uploads`.
- `db` : MySQL 8.4, joignable uniquement sur le réseau interne. Les données sont dans le volume `db-data`.

1. Le réseau doit exister sur l'hôte : `docker network create web`
2. Dans Portainer, allez dans **Stacks**, puis **Add stack**, puis **Repository**. Indiquez ce dépôt Git, qui doit être joignable par Portainer, et le fichier `docker-compose.yml`. Portainer construit l'image à partir du `Dockerfile`.
3. Définissez les variables d'environnement de la stack :
   - `MYSQL_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
   - optionnel : `MYSQL_DATABASE` et `MYSQL_USER` (par défaut `whichdoor`)
   - optionnel : `UPLOAD_MAX_MB`
4. Faites pointer votre reverse proxy (Traefik, Nginx Proxy Manager…) vers `app:3000` sur le réseau `web`. Sans reverse proxy, décommentez la section `ports` du service `app`. Pensez à autoriser des requêtes assez grosses pour l'upload des vidéos, par exemple `client_max_body_size 500m;` sur Nginx ou Nginx Proxy Manager.
