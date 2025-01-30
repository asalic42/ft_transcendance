# Instructions

Avant de commencer à toucher à Docker, il va falloir configurer deux trois trucs los amigos 👀

1) [Setup le .env](#configurer-le-.env)
2) [Docker time ](#docker-un-vieil-ami)

## Configurer le .env

> Le .env est dédié à ce que l'on nomme "la gestion des secrets". Il contient des variables avec des informations sensibles. Comme je ne suis pas une poucave et que j'ai un honneur, il va falloir le gérer vous-même.

J'ai laissé un `env.example` qui contient l'architecture des variables requises. (Il n'y en a qu'une)

Ça se présente comme suit :
```sh
ENV_VARIABLE1='key1'
ENV_VARIABLE2='key2'
etc
```
Ici, vous devriez trouver
```
DJANGO_SECRET_KEY=""
```

Vous allez devoir générer une clé. Ça tombe bien, Django propose ce qu'il faut pour. Sinon, il aurait fallu utiliser **HashiCorp Vault**, qu'il faudra de toute façon utiliser pour la suite du projet. Mais histoire de faire vite... reprenons le .env, voulez-vous ?

Avant toute manipulation, il va falloir se loger bien chaudement dans un environnement virtuel. POUR CE FAIRE :

Mettez-vous en dehors de la racine du projet. Une racine au-dessus suffit.

- Si vous n'avez pas venv d'installé, ce qui baisse votre statut à gueu :
```bash
sudo apt install python3-venv -y
```
- Construisons l'environnement virtuel :
```bash
python3 -m venv djenv (djenv ou ce que vous voulez)
```
- Activons-le :
```bash
source djenv/bin/activate
```

Normalement ici, il ne devrait pas y avoir de problèmes, sinon pensez à une reconversion.

>  [Ps] Si vous voulez sortir du venv, tapez juste `deactivate`. 

Bien, à la racine où se trouve le fichier `manage.py`, cette fois, tapez les instructions suivantes :

- Pour toucher directement en manuel, il faut installer Django :
```bash
pip3 install django (assurer-vous d'avoir pip d'installé)
```

-  Connectez-vous au shell Django :
```bash
python3 manage.py shell
```
- Faisons apparaître la clé :
```py
>>> from django.core.management.utils import get_random_secret_key as newkey
>>> print(newkey())
```
La clé est générée, il ne reste plus qu'à la récupérer et la mettre en tant que valeur de la variable dans le `env.example`

Une fois fait, il ne reste plus qu'à créer le vrai .env avec le contenu de `env.example`

Normalement, vous savez faire, mais au cas où :

```bash
cp env.example .env
```
Ou
```bash
mv env.example .env
```
Ou
```bash
cat env.example > .env
```
Enfin bref, je ne vais pas tous les faire non plus. Il faudra juste supprimer le `env.example` après.

Normalement, question clé secrète, tout est configuré. Passons à Docker.

## Docker un vieil ami

Avant de poursuivre, assurez-vous d'avoir docker et docker-compose.

Pour vous faciliter la tâche, car je suis un bon et musclé, je vous ai créé un petit script `log.sh`.

"Mais comment on utilise ce script, Toto ?" Ohhh, j'y viens ! Du calme ! Mal éduqués ces gosses-là...

Si vous voulez accéder à l'option "Help", il vous suffit de lancer le script sans arguments.

Pour une première utilisation :
```bash
(Tout est expliqué dans l'option help.)

./log.sh b-all
./log.sh l
```

Normalement tout est géré automatiquement. 👌
