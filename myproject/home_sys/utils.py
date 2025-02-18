# utils.py
import json
from django.http import JsonResponse
from .models import Users, Pong

def add_pong_logic(data):
    """
    Extrait la logique de création d'une partie.
    Retourne un dictionnaire avec les données de la partie créée ou lève une exception.
    """
    user = Users.objects.get(user_id=data.get('id_p1'))
    # Si id_p2 est fourni, on récupère l'utilisateur correspondant
    if data.get('id_p2') is not None:
        data['id_p2'] = Users.objects.get(user_id=data.get('id_p2'))
    
    data['id_p1'] = user

    new_game = Pong.objects.create(**data)
    return {
        'pk': new_game.pk,
        'id_p1': new_game.id_p1.id,
        'id_p2': new_game.id_p2.id if new_game.id_p2 else None,
        'is_bot_game': new_game.is_bot_game,
        'score_p1': new_game.score_p1,
        'score_p2': new_game.score_p2,
        'date': new_game.date.isoformat(),
        'difficulty': new_game.difficulty,
        'bounce_nb': new_game.bounce_nb,
    }
