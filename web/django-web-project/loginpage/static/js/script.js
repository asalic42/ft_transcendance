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

    const allFilled = Array.from(formInput).every(input => input.value.trim() !== '');
    
    formButton.disabled = !allFilled;

    const emailInputs = form.querySelectorAll('input[type="email"]');

    emailInputs.forEach(emailInput => {
        if (emailInput.value.trim() !== '') {
            if (validateEmail(emailInput.value.trim())) {
                emailInput.classList.remove('invalid');
            } else {
                emailInput.classList.add('invalid');
                formButton.disabled = true;
            }
        } else {
            emailInput.classList.remove('invalid');
        }
    });

    // Vérification de la correspondance entre le mot de passe et la confirmation du mot de passe
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmPasswordInput = form.querySelector('input[name="confirm_password"]');
    const mismatchMessage = document.getElementById('password-mismatch-message');

    console.log(passwordInput);
    console.log(confirmPasswordInput);

    if (passwordInput && confirmPasswordInput) {

        if (passwordInput.value === confirmPasswordInput.value) {
            mismatchMessage.classList.remove('show');
            mismatchMessage.style.transition = "all 0.2s ease";
            console.log("same1");  // Affiche "same" si les mots de passe sont identiques
        } else {
            mismatchMessage.classList.add('show');
            mismatchMessage.style.transition = "all 0.5s ease";
            signupSubmitButton.disabled = true;
            console.log("dismatch1");  // Affiche "dismatch" si les mots de passe ne correspondent pas
        }
    }

    if (signupSubmitButton.disabled === false) {
        nextSignFormSignupLink.classList.add('show-animation');
    } else {
        nextSignFormSignupLink.classList.remove('show-animation');
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



document.addEventListener('DOMContentLoaded', function() {
    const imageContainers = document.querySelectorAll('.image-container');

    imageContainers.forEach(container => {
        const image = container.querySelector('.hover-image');
        const line = container.querySelector('.line');
        const textContainer = container.querySelector('.text-container p');
        const text = container.getAttribute('data-text');

        textContainer.textContent = text;

        image.addEventListener('mouseenter', function() {
            line.style.width = '60px'; // Ajustez cette valeur selon la longueur souhaitée
            textContainer.style.opacity = '1';
        });

        image.addEventListener('mouseleave', function() {
            line.style.width = '0';
            textContainer.style.opacity = '0';
        });
    });
});



// Vérifie dès le départ si le formulaire est valide au chargement de la page
checkFormValidity(signinForm, signinInputs, signinSubmitButton);
checkFormValidity(signupForm, signupInputs, signupSubmitButton);
