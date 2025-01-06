const increaseButton = document.getElementById('increase');
const decreaseButton = document.getElementById('decrease');
const numberInput = document.getElementById('numberInput');
const forms = document.querySelector('.forms');

// Modifie le nombre de joueurs a participer au tournoi
function arrowClick(incr) {
    let currentValue = parseInt(numberInput.textContent);
    currentValue += incr;
    
    if (currentValue >= 3 && currentValue <= 10) {
        if (currentValue > parseInt(numberInput.textContent)) {
            addForm();
        }
        else
            removeForm();
        numberInput.textContent = currentValue;
    }
    checkInputs();
}

// Check si les inputs sont remplis auquel cas on affiche le boutton play
function    checkInputs() {
    const inputs = document.querySelectorAll(".input-alias");
    const aliases = [];

    for (let input of inputs) {
        if (input.value.trim() === '' || aliases.includes(input.value.trim())) {
            document.getElementById('play').style.display = 'none';
            return;
        }
        aliases.push(input.value.trim());
    }
    document.getElementById('play').style.display = 'inline-block';
}

// Ajoute un formulaire de joueur pour le tournoi
function addForm() {
    const newNumber = parseInt(numberInput.textContent) + 1;
    // creation de la div
    const formPlayer = document.createElement('div');
    if (newNumber > 5)
        formPlayer.classList.add('form-player');
    // creation du titre
    const titlePlayer = document.createElement('h4');
    titlePlayer.id = 'player';
    titlePlayer.textContent = 'Player ' + newNumber + ':' ;

    // creation de l'input pour l'alias du joueur
    const aliasPlayer = document.createElement('input');
    aliasPlayer.classList.add('input-alias');
    aliasPlayer.title = 'Alias';

    formPlayer.appendChild(titlePlayer);
    formPlayer.appendChild(aliasPlayer);

    forms.appendChild(formPlayer);

    aliasPlayer.addEventListener('input', checkInputs);
}

// Supprime un formulaire de joueur pour le tournoi
function removeForm() {
    const lastFormAdd = forms.lastChild;
    if (lastFormAdd)
        forms.removeChild(lastFormAdd);
}

// Check a chaque modif si tous les formulaires sont remplis
document.querySelectorAll('.input-alias').forEach(input => {
    input.addEventListener('input', checkInputs);
});

increaseButton.addEventListener('click', () => arrowClick(1));
decreaseButton.addEventListener('click', () => arrowClick(-1));
