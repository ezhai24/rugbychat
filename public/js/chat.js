/*
 * This file should contain code for the following tasks:
 * 1. Display the list of chat messages.
 * 2. Send a new message.
 * 3. Allow a user to edit and delete their own messages.
 * 4. Allow a user to log out.
 * 5. Redirect a user to index.html if they are not logged in.
 */
var messagesList = document.getElementById("messages");
var messageForm = document.getElementById("message-form");
var messageInput = document.getElementById("message-input");
var chatError = document.getElementById("chat-error");

firebase.auth().onAuthStateChanged(function (user) {
    if(user) {
        // Connect to database
        var database = firebase.database();
        var messages = database.ref("channels/general").limitToLast(100);

        var firstMessage;

        messages.on("child_added", function(data) {
            // Get user data
            var currentUser = firebase.auth().currentUser;
            var uid, name, photoUrl;

            if (currentUser != null) {
                uid = currentUser.uid;
                name = currentUser.displayName;
                photoUrl = currentUser.photoURL;
            }

            // Get message data
            var id = data.key;
            var message = data.val();

            var text = message.text;
            var timestamp = message.timestamp;
            var writeUserId = message.userId;
            var writeUserName = message.userName;

            if(!firstMessage) {
                firstMessage = message;
            }

            // Create HTML elements            
            var messageContainer = document.createElement("div");
            messageContainer.id = id;
            messageContainer.className = "messageContainer";

            var textContainer = document.createElement("div");
            textContainer.className = "messageTextContainer";

            var avatar = document.createElement("img");
            avatar.className = "avatar";
            avatar.src = photoUrl;

            var nameLabel = document.createElement("h4");
            nameLabel.textContent = writeUserName;

            var dateTimeDiv = document.createElement("div");
            dateTimeDiv.className = "timestamp";
            dateTimeDiv.textContent = new Date(timestamp).toLocaleString();  // source: http://ecma-international.org/ecma-262/5.1/#sec-15.9.5.3

            var lastEditDiv = document.createElement("div");
            lastEditDiv.className = "lastEdit";

            var editLink = document.createElement("a");
            editLink.className = "changeLink";
            editLink.textContent = "Edit";

            var editTextArea = document.createElement("textarea");
            editTextArea.className = "editTextArea hidden";

            var saveButton = document.createElement("button");
            saveButton.className = "btn btn-primary confirmButton hidden";
            saveButton.textContent = "Save";

            var cancelButton = document.createElement("button");
            cancelButton.className = "btn btn-default confirmButton hidden";
            cancelButton.textContent = "Cancel";

            var deleteLink = document.createElement("a");
            deleteLink.className = "changeLink";
            deleteLink.textContent = "Delete";

            var messageParagraph = document.createElement("p");
            messageParagraph.className = "message";
            messageParagraph.textContent = text;

            // Append HTML elements to page
            nameLabel.appendChild(dateTimeDiv);
            if(writeUserId === uid) {
                nameLabel.appendChild(editLink);
                nameLabel.appendChild(deleteLink);
            }
            nameLabel.append(lastEditDiv);
            textContainer.appendChild(nameLabel);
            textContainer.appendChild(messageParagraph);
            textContainer.appendChild(editTextArea);
            textContainer.appendChild(saveButton);
            textContainer.appendChild(cancelButton);
            messageContainer.appendChild(avatar);
            messageContainer.appendChild(textContainer);
            // messagesList.appendChild(messageContainer);

            if(message.timestamp < firstMessage.timestamp) {
                firstMessage = message;
                var firstMessageDiv = messagesList.firstChild();
                messagesList.insertBefore(messageContainer, firstMessageDiv);
            } else {
                messagesList.appendChild(messageContainer);
            }

            // Disable messaging functionality if email has not been verified
            if(user.emailVerified){
                // Add editing elements when edit button is clicked
                editLink.addEventListener("click", function (e) {
                    e.preventDefault();

                    // Replace message text with editable textarea containing text
                    messageParagraph.classList.add("hidden");
                    editTextArea.classList.remove("hidden"); 
                    editTextArea.value = messageParagraph.textContent;                   
                    saveButton.classList.remove("hidden");
                    cancelButton.classList.remove("hidden");

                    // Save message edits in Firebase when save button is clicked
                    saveButton.addEventListener("click", function(e) {
                        e.preventDefault();

                        // Connect to message in Firebase
                        messages = database.ref("channels/general/" + id);

                        // Update Firebase with new message and edit timestamp
                        messages.update({
                            text: editTextArea.value,
                            lastEdit: new Date().getTime()
                        });
                    });

                    // Discard message edits when cancel button is clicked
                    cancelButton.addEventListener("click", function (e) {
                        // Remove editing elements
                        editTextArea.classList.add("hidden");
                        saveButton.classList.add("hidden");
                        cancelButton.classList.add("hidden");

                        // Show original message text
                        messageParagraph.classList.remove("hidden");
                    });
                });

                // Remove message from Firebase when delete button is clicked
                deleteLink.addEventListener("click", function (e) {
                    e.preventDefault();

                    // Alert and confirm with user message is to be deleted
                    var deleteConfirm = confirm("Are you sure you want to delete this message?");
                    
                    // Delete message from Firebase if user confirms
                    if(deleteConfirm) {
                        database.ref("channels/general/" + id).remove();
                    }
                });
            } else {
                chatError.textContent = "Please verify your email. Messages may to be sent, modified, or removed until email has been verified.";
                chatError.classList.add("active");
            }
        });

        // Update message on chat page when modified in Firebase
        messages.on("child_changed", function(data) {
            // Get Firebase message information
            var id = data.key;
            var message = data.val();

            // Get HTML message information
            var messageContainer = document.getElementById(id);
            var textContainer = messageContainer.getElementsByClassName("messageTextContainer")[0];
            var lastEditDiv = textContainer.getElementsByClassName("lastEdit")[0];
            var editTextArea = textContainer.getElementsByClassName("editTextArea")[0];
            var saveButton = textContainer.getElementsByClassName("confirmButton")[0];
            var cancelButton = textContainer.getElementsByClassName("confirmButton")[1];
            var messageParagraph = textContainer.getElementsByClassName("message")[0];

            //Update message text
            var text = editTextArea.value;

            // Remove editing elements
            editTextArea.classList.add("hidden");
            saveButton.classList.add("hidden");
            cancelButton.classList.add("hidden");

            // Update timestamp and message text
            lastEditDiv.textContent = "(edited: " + new Date(message.lastEdit).toLocaleString() + ")";
            messageParagraph.textContent = text;

            // Show message text
            messageParagraph.classList.remove("hidden");
        });
    
        // Remove messages on chat page when deleted from Firebase
        messages.on("child_removed", function(data) {
            var id = data.key;
            var messageContainer = document.getElementById(id);

            messagesList.removeChild(messageContainer);
        });

    // Redirect user to login page if not logged in
    } else {
        window.location.href = "index.html";
    }
});

// Add messages to Firebase list from messaging textarea
messageForm.addEventListener("submit", function(e) {
    e.preventDefault();

    // Connect to database
    var database = firebase.database();
    var messages = database.ref("channels/general");

    var user = firebase.auth().currentUser;

    if(user.emailVerified){
        // Get the message the user entered
        var message = messageInput.value;

        // Create and add new message to list
        messages.push({
            text: message,
            timestamp: new Date().getTime(),
            userId: user.uid,
            userName: user.displayName
        })
        .then(function () {
            // Clear textarea
            messageInput.value = "";

            // Focus cursor on textarea
            // source: http://stackoverflow.com/questions/9543967/setting-focus-to-a-textbox-when-a-function-is-called
            messageInput.focus();
        })
        .catch(function (error) {
            chatError.textContent = error.message;
            chatError.classList.add("active");
        });
    }
});

// Logout current user
var logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", function(e) {
    firebase.auth().signOut();
});
