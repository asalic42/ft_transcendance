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

let is_username_taken = {value: false};
let is_email_taken = {value: false};
let is_password_strong_enough = {value: false};
let is_form_valid = {value: 0};
let emailFormatIsValid = {value: false};

let is_username_len_respected = {value: true};
let is_email_len_respected = {value: true};

// Fonction pour vérifier la validité des champs et activer/désactiver le bouton
function checkFormValidity(form, formInput, formButton) {

    const allFilled = Array.from(formInput).every(input => input.value.trim() !== '');

    const SigninAllFilled = Array.from(signinInputs).every(input => input.value.trim() !== '');

    signinSubmitButton.disabled = !SigninAllFilled;

    is_form_valid.value = 0;

    if (!allFilled)
        is_form_valid.value = -1;

    const emailInputs = form.querySelectorAll('input[type="email"]');

    emailInputs.forEach(emailInput => {
        if (emailInput.value.trim() !== '') {
            if (validateEmail(emailInput.value.trim())) {
                
                if (emailInput.id === "email2")
                {
                    is_form_valid.value++;
                    emailFormatIsValid.value = true;
                }
                else
                {
                    emailInput.classList.remove('invalid');
                }
            } else {
                emailInput.classList.add('invalid');
                formButton.disabled = true;
                if (emailInput.id === "email2")
                    emailFormatIsValid.value = false;
            }
        } else {
            emailInput.classList.remove('invalid');
            is_form_valid.value = 0;
        }
    });

    // Vérification de la correspondance entre le mot de passe et la confirmation du mot de passe
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('.pass_conf');
    const mismatchMessage = document.getElementById('password-mismatch-message');


    if (passwordInput.value && confirmPasswordInput.value) {

        if (passwordInput.value === confirmPasswordInput.value) {
            mismatchMessage.classList.remove('show');

            if (is_password_strong_enough === true)
                confirmPasswordInput.classList.add('colored');

            mismatchMessage.style.transition = "all 0.2s ease";
            is_form_valid.value++;
        } else {
            mismatchMessage.classList.add('show');
            confirmPasswordInput.classList.remove('colored');
            mismatchMessage.style.transition = "all 0.5s ease";
            signupSubmitButton.disabled = true;
        }
    }
    else {
        confirmPasswordInput.classList.remove('colored');
        mismatchMessage.classList.remove('show');
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

function signup_button_condition() {

    if (is_username_taken.value === true                || 
            is_email_taken.value === true               || 
            is_password_strong_enough === false         ||
            is_username_len_respected.value === false   ||
            is_email_len_respected.value === false)

        signupSubmitButton.disabled = true;

    else if (is_form_valid.value === 2) {
        signupSubmitButton.disabled = false;
    }

    if (signupSubmitButton.disabled === false) {
        nextSignFormSignupLink.classList.add('show-animation');
    } else {
        nextSignFormSignupLink.classList.remove('show-animation');
    }

}

setInterval(signup_button_condition, 1);

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


// Fonction générique pour gérer la vérification du pseudo
function verifierDisponibilitePseudo(baliseInput, chemin_fetch, taken_bool, baliseInputSpan, len_respected) {
    const baliseContent = baliseInput.value.trim();

    if (baliseContent.length > 0) {
        // Effectuer la requête AJAX pour vérifier si le pseudo est disponible
        fetch(`${chemin_fetch}=${baliseContent}`)
            .then(response => response.json())
            .then(data => {
                // Mise à jour de l'interface utilisateur selon la disponibilité
                if (data.is_taken) {
                    baliseInput.classList.add("invalid");
                    baliseInputSpan.classList.add("invalid");
                    taken_bool.value = true;
                } else {
                    if (len_respected.value === true)
                    {
                        baliseInput.classList.remove("invalid");
                        baliseInputSpan.classList.remove("invalid");    
                    }
                    taken_bool.value = false;
                }
            })
            .catch(error => {
                console.error('Erreur lors de la vérification du pseudo:', error);
            });
    } else {
        if (len_respected.value === true)
        {
            baliseInput.classList.remove("invalid");
            baliseInputSpan.classList.remove("invalid");
        }
    }
}

// Attacher l'événement keyup
const UsernameInput = document.getElementById("username2");

UsernameInput.addEventListener('keyup', function() {
    const UsernameInputSpan = UsernameInput.nextElementSibling;

    if (UsernameInput.value.length > 24) {
        is_username_len_respected.value = false;
        UsernameInput.classList.add("invalid");
        UsernameInputSpan.classList.add("invalid");
    }
    else {
        is_username_len_respected.value = true;
    }

    verifierDisponibilitePseudo(UsernameInput,
        'check_username/?username',
        is_username_taken,
        UsernameInputSpan,
        is_username_len_respected);
});


const emailSignup = document.getElementById("email2");

emailSignup.addEventListener('keyup', function() {

    const emailSignupSpan = emailSignup.nextElementSibling;


    if (emailSignup.value.length > 24) {
        is_email_len_respected.value = false;
        emailSignup.classList.add("invalid");
        emailSignupSpan.classList.add("invalid");
    }
    else {
        is_email_len_respected.value = true;
    }

    if (emailFormatIsValid.value === true)
    {    
        verifierDisponibilitePseudo(emailSignup,
            'check_email/?email',
            is_email_taken,
            emailSignupSpan,
            is_email_len_respected);
    }
});




function verif_password_solidity(baliseInput, chemin_fetch) {
    const baliseContent = baliseInput.value.trim();

    if (baliseContent.length > 0) {
        // Effectuer la requête AJAX pour vérifier si le pseudo est disponible
        fetch(`${chemin_fetch}=${baliseContent}`)
            .then(response => response.json())
            .then(data => {

                baliseInput.classList.remove(...baliseInput.classList);
                switch (data.data)
                {
                    case 0:
                        baliseInput.classList.add("s0");
                        is_password_strong_enough = false;
                        break;
                    case 1:
                        baliseInput.classList.add("s1");
                        is_password_strong_enough = false;
                        break;
                    case 2:
                        baliseInput.classList.add("s2");
                        is_password_strong_enough = false;
                        break;
                    case 3:
                        baliseInput.classList.add("s3");
                        is_password_strong_enough = false;
                        break;
                    case 4:
                        baliseInput.classList.add("s4");
                        is_password_strong_enough = true;
                        break;
                }
            })
    }
    else
    {
        baliseInput.classList.remove(...baliseInput.classList);
    }
}


const PasswordSingup = document.getElementById("password2");

PasswordSingup.addEventListener('keyup', function() {

    verif_password_solidity(PasswordSingup, 'check_password_solidity/?password', is_password_strong_enough);
});


let is_video_has_been_watched = {value : false};

document.addEventListener('DOMContentLoaded', function() {
    const videoContainer = document.querySelector('.video-container');
    const myVideo = document.getElementById('videoIntroTransition');

    // Vérifiez si la vidéo a déjà été jouée
    if (localStorage.getItem('videoPlayed') === 'true') {
        // Si oui, cacher la vidéo
        videoContainer.style.opacity = 0;
        videoContainer.style.display = 'none';
        is_video_has_been_watched.value = true;
    } else {
        // Si non, afficher et jouer la vidéo
        videoContainer.style.display = 'block';
        myVideo.play();

        // Ajouter un écouteur d'événement pour la fin de la vidéo
        myVideo.addEventListener('ended', function() {
            if (videoContainer) {
                videoContainer.parentNode.removeChild(videoContainer);
            }

            // Marquer la vidéo comme jouée
            localStorage.setItem('videoPlayed', 'true');
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const backgroundContainer = document.querySelector('.background-container');
    const signinContainer = document.querySelector('.signin-container');
    
    // Vérifie si l'utilisateur a déjà visité le site
    if (is_video_has_been_watched.value === false)
    {
        if (!localStorage.getItem('visited')) {

            signinContainer.style.opacity = 0;

            // Si c'est la première visite, applique l'animation
            backgroundContainer.style.animationDelay = '5s';
            signinContainer.style.animationDelay = '6s';

            backgroundContainer.classList.add('animate');
            signinContainer.classList.add('animate');

            setTimeout(function() {
                signinContainer.style.opacity = 1;
            }, 6500);
        }
    }
    else {
        // Marque l'utilisateur comme ayant visité le site
        localStorage.setItem('visited', 'true');
    }
});

// Add this to script.js
signinForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(signinForm);

    fetch(signinForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = data.redirect;
        } else {
            // Trigger shake animation
            const signinContainer = document.querySelector('.signin-container');
            const signupContainer = document.querySelector('.signup-container');

            signinContainer.classList.add('shake');
            signupContainer.classList.add('shake');
            setTimeout(() => signinContainer.classList.remove('shake'), 500);
            setTimeout(() => signupContainer.classList.remove('shake'), 500);
            
            // Show error message
            //const errorDiv = document.createElement('div');
            //errorDiv.textContent = data.message || 'Login failed';
            //errorDiv.className = 'error-signin';
            //errorDiv.style.color = "red";
            //errorDiv.style.fontSize = "14px";
            //errorDiv.style.zIndex = "100";
            //errorDiv.style.opacity = "1";
            //errorDiv.style.transition = "all 1s ease";
            //errorDiv.style.marginBottom = "4px";
            //signinContainer.prepend(errorDiv);
            //setTimeout(() => {
            //    errorDiv.style.opacity = 1;  // Appliquer l'opacité à 1 pour faire apparaître le message
            //}, 10);  // Petit délai pour assurer que la transition commence correctement
            //// Supprimer le message après un certain temps avec une transition
            //setTimeout(() => {
            //    errorDiv.style.opacity = 0;  // Transition vers la transparence
            //}, 2500);
            //setTimeout(() => {
            //    errorDiv.remove();
            //}, 3000);
        }
    })
    .catch(error => {
        
        console.error('Error:', error);
        document.querySelector('.signin-container').classList.add('shake');
        document.querySelector('.signup-container').classList.add('shake');

        setTimeout(() => document.querySelector('.signin-container').classList.remove('shake'), 500);
        setTimeout(() => document.querySelector('.signup-container').classList.remove('shake'), 500);
    });
});