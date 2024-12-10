const form = document.getElementById('myForm');
const submitButton = document.getElementById('submitButton');
const inputs = form.querySelectorAll('input[required]');
const spanBeforeButton = document.getElementsByClassName('span-b')[0];

// Fonction pour valider l'email avec une expression régulière
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailPattern.test(email);
}

// Fonction pour vérifier la validité des champs et activer/désactiver le bouton
function checkFormValidity() {
    const allFilled = Array.from(inputs).every(input => input.value.trim() !== '');
    // Active ou désactive le bouton en fonction de la validité des champs
    submitButton.disabled = !allFilled;

    // Vérifie si l'email est valide et si l'input n'est pas vide
    const emailInput = document.getElementById('email');
    if (emailInput && emailInput.value.trim() !== '') {
        if (validateEmail(emailInput.value.trim())) {
            emailInput.classList.remove('invalid');  // Enlève la classe invalid si l'email est valide
        } else {
            emailInput.classList.add('invalid');  // Ajoute la classe invalid si l'email est invalide
            submitButton.disabled = true;
        }
    } else {
        emailInput.classList.remove('invalid');
    }

    if (submitButton.disabled) {
        spanBeforeButton.style.opacity = 1;
        spanBeforeButton.style.fontSize = "12px";
        spanBeforeButton.style.transitionDuration = '0.4s';
        spanBeforeButton.classList.add('is-required');
    } else {
        spanBeforeButton.style.opacity = 0;
        spanBeforeButton.style.fontSize = "9px";
        spanBeforeButton.style.transitionDuration = '0s';
        spanBeforeButton.classList.remove('is-required');
    }


    console.log(allFilled); // Facultatif : voir l'état de la validation des champs
}

// Ajoute un événement pour chaque champ input afin de vérifier la validité lors de la saisie
inputs.forEach(input => {
    input.addEventListener('input', checkFormValidity);
});

// Vérifie dès le départ si le formulaire est valide au chargement de la page
checkFormValidity();
