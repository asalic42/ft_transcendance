const vlp_signinForm = document.getElementById('id-signin-form');
const vlp_signupForm = document.getElementById('id-signup-form');

const vlp_signinSubmitButton = document.getElementById('submitButton1');
const vlp_signupSubmitButton = document.getElementById('submitButton2');

const vlp_signinInputs = vlp_signinForm.querySelectorAll('input[required]');
const vlp_signupInputs = vlp_signupForm.querySelectorAll('input[required]');

const vlp_spanBeforeButton = document.getElementsByClassName('span-b')[0];
const vlp_spanBeforeButtonContainer = document.getElementsByClassName('span-b-container')[0];

const vlp_nextSignFormSignupLink = document.querySelector('.next-sign-form-signup');

// Fonction pour valider l'email avec une expression régulière
function flp_validateEmail(email) {
    const vlp_emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return vlp_emailPattern.test(email);
}

let vlp_is_username_taken = {value: false};
let vlp_is_email_taken = {value: false};
let vlp_is_password_strong_enough = {value: false};
let vlp_is_form_valid = {value: 0};
let vlp_emailFormatIsValid = {value: false};

let vlp_is_username_len_respected = {value: true};
let vlp_is_email_len_respected = {value: true};

// Fonction pour vérifier la validité des champs et activer/désactiver le bouton
function flp_checkFormValidity(form, formInput, formButton) {

    const vlp_allFilled = Array.from(formInput).every(input => input.value.trim() !== '');

    const vlp_SigninAllFilled = Array.from(vlp_signinInputs).every(input => input.value.trim() !== '');

    vlp_signinSubmitButton.disabled = !vlp_SigninAllFilled;

    vlp_is_form_valid.value = 0;

    if (!vlp_allFilled)
        vlp_is_form_valid.value = -1;

    const vlp_emailInputs = form.querySelectorAll('input[type="email"]');

    vlp_emailInputs.forEach(vlp_emailInput => {
        if (vlp_emailInput.value.trim() !== '') {
            if (flp_validateEmail(vlp_emailInput.value.trim())) {
                
                if (vlp_emailInput.id === "email2")
                {
                    vlp_is_form_valid.value++;
                    vlp_emailFormatIsValid.value = true;
                }
                else
                {
                    vlp_emailInput.classList.remove('invalid');
                }
            } else {
                vlp_emailInput.classList.add('invalid');
                formButton.disabled = true;
                if (vlp_emailInput.id === "email2")
                    vlp_emailFormatIsValid.value = false;
            }
        } else {
            vlp_emailInput.classList.remove('invalid');
            vlp_is_form_valid.value = 0;
        }
    });

    // Vérification de la correspondance entre le mot de passe et la confirmation du mot de passe
    const vlp_passwordInput = form.querySelector('input[name="password"]');
    const vlp_confirmPasswordInput = document.querySelector('.pass_conf');
    const vlp_mismatchMessage = document.getElementById('password-mismatch-message');


    if (vlp_passwordInput.value && vlp_confirmPasswordInput.value) {

        if (vlp_passwordInput.value === vlp_confirmPasswordInput.value) {
            vlp_mismatchMessage.classList.remove('show');

            if (vlp_is_password_strong_enough === true)
                vlp_confirmPasswordInput.classList.add('colored');

            vlp_mismatchMessage.style.transition = "all 0.2s ease";
            vlp_is_form_valid.value++;
        } else {
            vlp_mismatchMessage.classList.add('show');
            vlp_confirmPasswordInput.classList.remove('colored');
            vlp_mismatchMessage.style.transition = "all 0.5s ease";
            vlp_signupSubmitButton.disabled = true;
        }
    }
    else {
        vlp_confirmPasswordInput.classList.remove('colored');
        vlp_mismatchMessage.classList.remove('show');
    }

    if (vlp_signinSubmitButton.disabled) {
        vlp_spanBeforeButtonContainer.style.marginTop = "8%";
        vlp_spanBeforeButton.style.opacity = 1;
        vlp_spanBeforeButton.style.fontSize = "12px";
        vlp_spanBeforeButton.classList.add('is-required');
    } else {
        vlp_spanBeforeButtonContainer.style.marginTop = "-10%";
        vlp_spanBeforeButton.style.opacity = 0;
        vlp_spanBeforeButton.style.fontSize = "9px";
        vlp_spanBeforeButton.classList.remove('is-required');
    }
}

function flp_signup_button_condition() {

    if (vlp_is_username_taken.value === true                || 
            vlp_is_email_taken.value === true               || 
            vlp_is_password_strong_enough === false         ||
            vlp_is_username_len_respected.value === false   ||
            vlp_is_email_len_respected.value === false)

            vlp_signupSubmitButton.disabled = true;

    else if (vlp_is_form_valid.value === 2) {
        vlp_signupSubmitButton.disabled = false;
    }

    if (vlp_signupSubmitButton.disabled === false) {
        vlp_nextSignFormSignupLink.classList.add('show-animation');
    } else {
        vlp_nextSignFormSignupLink.classList.remove('show-animation');
    }

}

setInterval(flp_signup_button_condition, 1);

// Fonction d'animation de transition
function flp_test(eventType, element, container, deg) {
    element.addEventListener(eventType, function() {
        container.style.transform = deg;
        container.style.opacity = '1';
    });
}

// Gère les interactions de transition entre SignIn et SignUp
document.addEventListener('DOMContentLoaded', function () {
    const vlp_spanNFIN = document.querySelector('.span-nfin');
    const vlp_spanNFUP = document.querySelector('.span-nfup');

    const vlp_signupContainer = document.querySelector('.signup-container');
    const vlp_signinContainer = document.querySelector('.signin-container');

    flp_test('mouseenter', vlp_spanNFIN, vlp_signupContainer, 'rotate(10deg)');
    flp_test('mouseleave', vlp_spanNFIN, vlp_signupContainer, 'rotate(0deg)');

    flp_test('mouseenter', vlp_spanNFUP, vlp_signinContainer, 'rotate(-10deg)');
    flp_test('mouseleave', vlp_spanNFUP, vlp_signinContainer, 'rotate(0deg)'); 
});


// Transition SignUp / SignIn
document.querySelector('.trigger-nfin').addEventListener('click', function(e) {
    e.preventDefault();
    const vlp_signINContainer = document.querySelector('.signup-container');
    const vlp_signUPContainer = document.querySelector('.signin-container');

    setTimeout(function() {
        if (vlp_signINContainer.style.zIndex == '4') {
            vlp_signINContainer.style.zIndex = '1'; 
            vlp_signUPContainer.style.zIndex = '4';
        } else {
            vlp_signINContainer.style.zIndex = '4';
            vlp_signUPContainer.style.zIndex = '1';
        }
    }, 100);

    vlp_signINContainer.classList.add('show');
    setTimeout(function() {
        vlp_signINContainer.classList.remove('show');
    }, 200);
});

document.querySelector('.trigger-nfup').addEventListener('click', function(e) {
    e.preventDefault();
    const vlp_signUPContainer = document.querySelector('.signin-container');
    const vlp_signINContainer = document.querySelector('.signup-container');

    setTimeout(function() {
        if (vlp_signUPContainer.style.zIndex == '4') {
            vlp_signUPContainer.style.zIndex = '1';
            vlp_signINContainer.style.zIndex = '4';
        } else {
            vlp_signUPContainer.style.zIndex = '4';
            vlp_signINContainer.style.zIndex = '1';
        }
    }, 100);

    vlp_signUPContainer.classList.add('show');
    setTimeout(function() {
        vlp_signUPContainer.classList.remove('show');
    }, 200);
});

// Ajoute un événement pour chaque champ input afin de vérifier la validité lors de la saisie
vlp_signinInputs.forEach(input => {
    input.addEventListener('input', function() {
        flp_checkFormValidity(vlp_signinForm, vlp_signinInputs, vlp_signinSubmitButton);
    });
});

vlp_signupInputs.forEach(input => {
    input.addEventListener('input', function() {
        flp_checkFormValidity(vlp_signupForm, vlp_signupInputs, vlp_signupSubmitButton);
    });
});



document.addEventListener('DOMContentLoaded', function() {
    const vlp_imageContainers = document.querySelectorAll('.image-container');

    vlp_imageContainers.forEach(container => {
        const vlp_image = container.querySelector('.hover-image');
        const vlp_line = container.querySelector('.line');
        const vlp_textContainer = container.querySelector('.text-container p');
        const vlp_text = container.getAttribute('data-text');

        vlp_textContainer.textContent = vlp_text;

        vlp_image.addEventListener('mouseenter', function() {
            vlp_line.style.width = '60px'; // Ajustez cette valeur selon la longueur souhaitée
            vlp_textContainer.style.opacity = '1';
        });

        vlp_image.addEventListener('mouseleave', function() {
            vlp_line.style.width = '0';
            vlp_textContainer.style.opacity = '0';
        });
    });
});


// Vérifie dès le départ si le formulaire est valide au chargement de la page
flp_checkFormValidity(vlp_signinForm, vlp_signinInputs, vlp_signinSubmitButton);
flp_checkFormValidity(vlp_signupForm, vlp_signupInputs, vlp_signupSubmitButton);


// Fonction générique pour gérer la vérification du pseudo
function flp_verifierDisponibilitePseudo(baliseInput, chemin_fetch, taken_bool, baliseInputSpan, len_respected) {
    const vlp_baliseContent = baliseInput.value.trim();

    if (vlp_baliseContent.length > 0) {
        // Effectuer la requête AJAX pour vérifier si le pseudo est disponible
        fetch(`${chemin_fetch}=${vlp_baliseContent}`)
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
const vlp_UsernameInput = document.getElementById("username2");

vlp_UsernameInput.addEventListener('keyup', function() {
    const vlp_UsernameInputSpan = vlp_UsernameInput.nextElementSibling;

    if (vlp_UsernameInput.value.length > 24) {
        vlp_is_username_len_respected.value = false;
        vlp_UsernameInput.classList.add("invalid");
        vlp_UsernameInputSpan.classList.add("invalid");
    }
    else {
        vlp_is_username_len_respected.value = true;
    }

    flp_verifierDisponibilitePseudo(vlp_UsernameInput,
        'check_username/?username',
        vlp_is_username_taken,
        vlp_UsernameInputSpan,
        vlp_is_username_len_respected);
});


const vlp_emailSignup = document.getElementById("email2");

vlp_emailSignup.addEventListener('keyup', function() {

    const vlp_emailSignupSpan = vlp_emailSignup.nextElementSibling;


    if (vlp_emailSignup.value.length > 24) {
        vlp_is_email_len_respected.value = false;
        vlp_emailSignup.classList.add("invalid");
        vlp_emailSignupSpan.classList.add("invalid");
    }
    else {
        vlp_is_email_len_respected.value = true;
    }

    if (vlp_emailFormatIsValid.value === true)
    {    
        flp_verifierDisponibilitePseudo(vlp_emailSignup,
            'check_email/?email',
            vlp_is_email_taken,
            vlp_emailSignupSpan,
            vlp_is_email_len_respected);
    }
});



function flp_verif_password_solidity(baliseInput, chemin_fetch) {
    const vlp_baliseContent = baliseInput.value.trim();

    if (vlp_baliseContent.length > 0) {
        // Effectuer la requête AJAX pour vérifier si le pseudo est disponible
        fetch(`${chemin_fetch}=${vlp_baliseContent}`)
            .then(response => response.json())
            .then(data => {

                baliseInput.classList.remove(...baliseInput.classList);
                switch (data.data)
                {
                    case 0:
                        baliseInput.classList.add("s0");
                        vlp_is_password_strong_enough = false;
                        break;
                    case 1:
                        baliseInput.classList.add("s1");
                        vlp_is_password_strong_enough = false;
                        break;
                    case 2:
                        baliseInput.classList.add("s2");
                        vlp_is_password_strong_enough = false;
                        break;
                    case 3:
                        baliseInput.classList.add("s3");
                        vlp_is_password_strong_enough = false;
                        break;
                    case 4:
                        baliseInput.classList.add("s4");
                        vlp_is_password_strong_enough = true;
                        break;
                }
            })
    }
    else
    {
        baliseInput.classList.remove(...baliseInput.classList);
    }
}


const vlp_PasswordSingup = document.getElementById("password2");

vlp_PasswordSingup.addEventListener('keyup', function() {

    flp_verif_password_solidity(vlp_PasswordSingup, 'check_password_solidity/?password', vlp_is_password_strong_enough);
});


let vlp_is_video_has_been_watched = {value : false};

document.addEventListener('DOMContentLoaded', function() {
    const vlp_videoContainer = document.querySelector('.video-container');
    const vlp_myVideo = document.getElementById('videoIntroTransition');

    // Vérifiez si la vidéo a déjà été jouée
    if (localStorage.getItem('videoPlayed') === 'true') {
        // Si oui, cacher la vidéo
        vlp_videoContainer.style.opacity = 0;
        vlp_videoContainer.style.display = 'none';
        vlp_is_video_has_been_watched.value = true;
    } else {
        // Si non, afficher et jouer la vidéo
        vlp_videoContainer.style.display = 'block';
        vlp_myVideo.play();

        // Ajouter un écouteur d'événement pour la fin de la vidéo
        vlp_myVideo.addEventListener('ended', function() {
            if (vlp_videoContainer) {
                vlp_videoContainer.parentNode.removeChild(vlp_videoContainer);
            }

            // Marquer la vidéo comme jouée
            localStorage.setItem('videoPlayed', 'true');
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const vlp_backgroundContainer = document.querySelector('.background-container');
    const vlp_signinContainer = document.querySelector('.signin-container');
    
    // Vérifie si l'utilisateur a déjà visité le site
    if (vlp_is_video_has_been_watched.value === false)
    {
        if (!localStorage.getItem('visited')) {

            vlp_signinContainer.style.opacity = 0;

            // Si c'est la première visite, applique l'animation
            vlp_backgroundContainer.style.animationDelay = '5s';
            vlp_signinContainer.style.animationDelay = '6s';

            vlp_backgroundContainer.classList.add('animate');
            vlp_signinContainer.classList.add('animate');

            setTimeout(function() {
                vlp_signinContainer.style.opacity = 1;
            }, 6500);
        }
    }
    else {
        // Marque l'utilisateur comme ayant visité le site
        localStorage.setItem('visited', 'true');
    }
});

// Modify the success handler in the signin form submission
vlp_signinForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // URL pour la connexion
    const url = window.location.origin + "/signin/";
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": getTokenCSRF()
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Server error');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            console.log(">>>> SUCCESS <<<<");
            
            // Explicitly show the navbar before loading new content
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                console.log("Login success - Setting navbar display to flex");
                navbar.style.display = 'flex';
            }
            
            // Then load the home page content
            if (data.html) {
                // Si le serveur renvoie directement le HTML
                document.getElementById('content').innerHTML = data.html;
                history.pushState(null, "", data.redirect);
                
                // Force navbar display after successful login (redundant but ensures it works)
                if (navbar) {
                    setTimeout(() => {
                        navbar.style.display = 'flex';
                        console.log("Delayed navbar display set to flex");
                    }, 100);
                }
                
                // Réinitialiser les gestionnaires d'événements SPA
                window.reinitCoreScripts();
            } else {
                // Sinon, charger la page via la fonction loadPage existante
                window.loadPage(data.redirect);
            }
        } else {
            console.log("Login : failed.");
            // Afficher l'erreur

            const vlp_signinContainer = document.querySelector('.signin-container');
            vlp_signinContainer.classList.add("shake");
                        
            setTimeout(function() {vlp_signinContainer.classList.remove("shake")}, 1000);

            const errorElement = document.querySelector('.login-error');
            if (errorElement) {
                errorElement.textContent = data.message || 'Login failed';
                errorElement.style.display = 'block';
                errorElement.classList.add('show');
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorElement = document.querySelector('.login-error');
        if (errorElement) {
            errorElement.textContent = error.message || 'An error occurred while signing in';
            errorElement.style.display = 'block';
            errorElement.classList.add('active');
        }
    });
});

vlp_signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username2').value;
    const password = document.getElementById('password2').value;
    const email = document.getElementById('email2').value;
    
    // URL for signup
    const url = window.location.origin + "/signup/";
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": getTokenCSRF()
        },
        body: JSON.stringify({ username, password, email })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Server error');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            console.log(">>>> SUCCESS <<<<");
            // Instead of redirecting, load the home page via SPA
            if (data.html) {
                // If the server returns HTML directly
                document.getElementById('content').innerHTML = data.html;
                history.pushState(null, "", data.redirect);
                // Reset SPA event handlers
                reinitCoreScripts();
            } else {
                // Otherwise, load the page via the existing loadPage function
                loadPage(data.redirect);
            }
        } else {
            console.error(">>>> FAILURE <<<<");
            console.error('Signup failed:', data.message || 'Unknown error');

            const errorElement = document.querySelector('.signup-error');
            if (errorElement) {
                errorElement.textContent = data.message || 'Signup failed';
                errorElement.style.display = 'block';
                errorElement.classList.add('active');
            }

        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errorElement = document.querySelector('.signup-error');
        if (errorElement) {
            errorElement.textContent = error.message || 'An error occurred while signing up';
            errorElement.style.display = 'block';
            errorElement.classList.add('active');
        }
    });
});

// Nouvelle fonction pour réinitialiser les composants dynamiques
function initDynamicComponents() {
    // Réinitialiser les tooltips, écouteurs, etc.
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleSPANavigation);
    });
}

/* // Fonction pour gérer le clic sur un lien
document.addEventListener('click', function(event) {
    const vlp_link = event.target.closest('a');  // Trouver l'élément <a> cliqué
    if (link && link.href) {
        event.preventDefault();  // Empêcher le comportement par défaut du lien
        loadPage(link.href);  // Charger la nouvelle page via AJAX
    }
});
 */





// script.js
// Gérer l'historique
window.addEventListener('popstate', function() {
    loadPage(window.location.href);
});
