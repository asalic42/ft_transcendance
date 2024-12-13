const signinForm = document.getElementById('id-signin-form');
const signupForm = document.getElementById('id-signup-form');

const signinSubmitButton = document.getElementById('submitButton1');
const signupSubmitButton = document.getElementById('submitButton2');

const signinInputs = signinForm.querySelectorAll('input[required]');
const signupInputs = signupForm.querySelectorAll('input[required]');

const spanBeforeButton = document.getElementsByClassName('span-b')[0];
const spanBeforeButtonContainer = document.getElementsByClassName('span-b-container')[0];

const nextSignFormSignupLink = document.querySelector('.next-sign-form-signup');

// Fonction pour valider l'email avec une expression régulière
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailPattern.test(email);
}

// Fonction pour vérifier la validité des champs et activer/désactiver le bouton
function checkFormValidity(form, formInput, formButton) {
    
    console.log('form : ', form);
    console.log('formInputs : ', formInput);
    console.log('formButton : ', formButton);

    const allFilled = Array.from(formInput).every(input => input.value.trim() !== '');
    
    console.log('# allFilled # : ', allFilled);

    // Active ou désactive le bouton en fonction de la validité des champs
    formButton.disabled = !allFilled;

    // Sélectionne tous les inputs de type email

    const emailInputs = form.querySelectorAll('input[type="email"]');
    console.log(emailInputs);

    // Parcourt chaque input email pour vérifier sa validité
    emailInputs.forEach(emailInput => {
        // Vérifie si l'input n'est pas vide
        if (emailInput.value.trim() !== '') {
            if (validateEmail(emailInput.value.trim())) {
                emailInput.classList.remove('invalid');  // Enlève la classe 'invalid' si l'email est valide
            } else {
                emailInput.classList.add('invalid');  // Ajoute la classe 'invalid' si l'email est invalide
                formButton.disabled = true; // Désactive le bouton de soumission si un email est invalide
            }
        } else {
            emailInput.classList.remove('invalid'); // Si l'input est vide, retire la classe 'invalid'
        }
    });

    if (signupSubmitButton.disabled === false) {
        nextSignFormSignupLink.classList.add('show-animation');  // Ajoute une classe d'animation
    } else {
        nextSignFormSignupLink.classList.remove('show-animation');  // Retire la classe d'animation si désactivé
    }

    if (signinSubmitButton.disabled) {
        spanBeforeButtonContainer.style.marginTop = "8%";
        spanBeforeButton.style.opacity = 1;
        spanBeforeButton.style.fontSize = "12px";
        spanBeforeButton.classList.add('is-required');
    } else {
        spanBeforeButtonContainer.style.marginTop = "-10%";
        spanBeforeButton.style.opacity = 0;
        spanBeforeButton.style.fontSize = "9px";
        spanBeforeButton.classList.remove('is-required');
    }
}

// Fonction d'animation de transition
function test(eventType, element, container, deg) {
    element.addEventListener(eventType, function() {
        container.style.transform = deg;
        container.style.opacity = '1';
    });
}

// Gère les interactions de transition entre SignIn et SignUp
document.addEventListener('DOMContentLoaded', function () {
    const spanNFIN = document.querySelector('.span-nfin');
    const spanNFUP = document.querySelector('.span-nfup');

    const signupContainer = document.querySelector('.signup-container');
    const signinContainer = document.querySelector('.signin-container');

    test('mouseenter', spanNFIN, signupContainer, 'rotate(10deg)');
    test('mouseleave', spanNFIN, signupContainer, 'rotate(0deg)');

    test('mouseenter', spanNFUP, signinContainer, 'rotate(-10deg)');
    test('mouseleave', spanNFUP, signinContainer, 'rotate(0deg)');
});

// Transition SignUp / SignIn
document.querySelector('.trigger-nfin').addEventListener('click', function(e) {
    e.preventDefault();
    const signINContainer = document.querySelector('.signup-container');
    const signUPContainer = document.querySelector('.signin-container');

    setTimeout(function() {
        if (signINContainer.style.zIndex == '4') {
            signINContainer.style.zIndex = '1'; 
            signUPContainer.style.zIndex = '4';
        } else {
            signINContainer.style.zIndex = '4';
            signUPContainer.style.zIndex = '1';
        }
    }, 100);

    signINContainer.classList.add('show');
    setTimeout(function() {
        signINContainer.classList.remove('show');
    }, 200);
});

document.querySelector('.trigger-nfup').addEventListener('click', function(e) {
    e.preventDefault();
    const signUPContainer = document.querySelector('.signin-container');
    const signINContainer = document.querySelector('.signup-container');

    setTimeout(function() {
        if (signUPContainer.style.zIndex == '4') {
            signUPContainer.style.zIndex = '1';
            signINContainer.style.zIndex = '4';
        } else {
            signUPContainer.style.zIndex = '4';
            signINContainer.style.zIndex = '1';
        }
    }, 100);

    signUPContainer.classList.add('show');
    setTimeout(function() {
        signUPContainer.classList.remove('show');
    }, 200);
});

// Ajoute un événement pour chaque champ input afin de vérifier la validité lors de la saisie
signinInputs.forEach(input => {
    input.addEventListener('input', function() {
        checkFormValidity(signinForm, signinInputs, signinSubmitButton);
    });
});

signupInputs.forEach(input => {
    input.addEventListener('input', function() {
        checkFormValidity(signupForm, signupInputs, signupSubmitButton);
    });
});

// Vérifie dès le départ si le formulaire est valide au chargement de la page
checkFormValidity(signinForm, signinInputs, signinSubmitButton);
checkFormValidity(signupForm, signupInputs, signupSubmitButton);
