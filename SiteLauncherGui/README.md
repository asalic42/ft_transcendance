
# Guide pour SiteLauncher

> Un outil de flemmard fait par un flemmard, pour les flemmards.
> Ouais.

## Copiez-collez

Vous connaissez la formule, rien de compliqué.
Pour vous faciliter la tâche, allez dans le répertoire `SiteLauncherGui`
et copiez-collez respectivement :

```bash
python3 -m venv sitelauncherenv
source sitelauncherenv/bin/activate
pip3 install -r requirements.txt
```
Vous devez juste remplir la variable d'environnement
`SCRIPT_ROOT=` dans un `.env` en mettant le chemin du répertoire où se trouve le script `log.sh`

En gros :
Dans un `.env` si le script `log.sh` se trouve dans le répertoire "myproject" qui est à la même racine que le répertoire actuel (SiteLauncherGui) alors :
```
SCRIPT_ROOT="../myproject/"
```

Executez ensuite la commande 
```
sudo visudo
```
Et entrez ces deux lignes à la fin, en mettant votre username :
```
REPLACE_USERNAME ALL=(ALL) NOPASSWD: /usr/bin/docker ps --format='{{.Names}}'
REPLACE_USERNAME ALL=(ALL) NOPASSWD: /usr/bin/docker exec * python3 manage.py collectstatic --noinput
```
Elles vont permettre au script de s'executer dans avoir besoin du mot de passe.

Une fois cette lourde tâche accomplie, lancez le programme avec un simple :
```bash
python3 launcher.py
```
Gardez le terminal ouvert, vous en aurez besoin pour taper le mot de passe sudo si demandé.

Des bisous ? Flemme.
