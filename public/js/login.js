/*
 * This file should contain code for the following tasks:
 * 1. Create a new account.
 * 2. Sign in an existing account.
 * 3. Redirect a user to chat.html once they are logged in/signed up.
 */
var signingUp = false;

// Create a new account
var signupForm = document.getElementById("signup-form");
var signupName = document.getElementById("signup-name");
var signupEmail = document.getElementById("signup-email");
var signupPassword = document.getElementById("signup-password");
var signupPasswordConfirm = document.getElementById("signup-password-confirm");
var signupError = document.getElementById("signup-error");
var signupDetails = document.getElementById("signup-details");

signupForm.addEventListener("submit", function (e) {
   e.preventDefault();

   signingUp = true;

   signupError.classList.remove("active");
   signupDetails.classList.remove("active");

    var name = signupName.value;
    var email = signupEmail.value;
    var password = signupPassword.value;
    var passwordConfirm = signupPasswordConfirm.value;

    // Check the password and confirmation password match
    if (password !== passwordConfirm) {
        signupError.textContent = "Passwords do not match.";
        signupError.classList.add("active");
    // Check the password is at least 6 characters long
    } else if(password.length < 6) {
        signupError.textContent = "Password must be at least 6 characters.";
        signupError.classList.add("active");
    } else {
        firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(function (user) {
            // Update user display name and avatar
            user.updateProfile({
                displayName: name,
                photoURL: "https://www.gravatar.com/avatar/" + md5(email)
            }).then(function() {
                // Send the user a verification email
                signupDetails.textContent = "Please wait while we send you a verification email...";
                signupDetails.classList.add("active");
                user.sendEmailVerification().then(function () {
                    signupDetails.textContent = "Email verification sent successfully. Please check your email.";

                    // Redirect to chat page
                    window.location.href = "chat.html"
                }, function (error) {
                    signupDetails.classList.remove("active");
                    signupError.textContent = error.message;
                    signupError.classList.add("active");

                    // Redirect to chat page
                    window.location.href = "chat.html"
                });
            }, function(error) {
                signupError.textContent = error.message;
                signupError.classList.add("active");
            });
        })
        .catch(function (error) {
            signupError.textContent = error.message;
            signupError.classList.add("active");
        });
    }
});

// Sign in with an existing account
var loginForm = document.getElementById("login-form");
var loginEmail = document.getElementById("login-email");
var loginPassword = document.getElementById("login-password");
var loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    loginError.classList.remove("active");

    var email = loginEmail.value;
    var password = loginPassword.value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function () {
        window.location.href = "chat.html";
    })
    .catch(function(error) {
        loginError.textContent = "Username and password combination not recognized."
        loginError.classList.add("active");
    });
});

// Redirect if current user is already logged in
firebase.auth().onAuthStateChanged(function(user) {
    if (user && !signingUp) {
        window.location.href = "chat.html";
    }
});


// Switch between signing up and logging in
var switchToLoginBtn = document.getElementById("switch-to-login");
var switchToSignUpBtn = document.getElementById("switch-to-signup");
var loginForm = document.getElementById("login-form");
var signupForm = document.getElementById("signup-form");
switchToLoginBtn.addEventListener("click", function(e) {
    e.preventDefault();

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

    switchToSignUpBtn.classList.remove("hidden");
    switchToLoginBtn.classList.add("hidden");
});

switchToSignUpBtn.addEventListener("click", function(e) {
    e.preventDefault();

    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");

    switchToSignUpBtn.classList.add("hidden");
    switchToLoginBtn.classList.remove("hidden");
});

