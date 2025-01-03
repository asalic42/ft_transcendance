const increaseButton = document.getElementById('increase');
const decreaseButton = document.getElementById('decrease');
const numberInput = document.getElementById('numberInput');
const forms = document.querySelector('.forms');

function arrowClick(incr) {
    let currentValue = parseInt(numberInput.textContent);
    currentValue += incr;
    
    if (currentValue >= 3 && currentValue <= 10) {
        if (currentValue > parseInt(numberInput.textContent))
            addForm();
        else
            removeForm();
        numberInput.textContent = currentValue;
    }
}

function addForm() {
    const newNumber = parseInt(numberInput.textContent) + 1;
    // creation de la div
    const formPlayer = document.createElement('div');
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
}

function removeForm() {
    const lastFormAdd = forms.lastChild;
    if (lastFormAdd)
        forms.removeChild(lastFormAdd);
}

increaseButton.addEventListener('click', () => arrowClick(1));
decreaseButton.addEventListener('click', () => arrowClick(-1));
