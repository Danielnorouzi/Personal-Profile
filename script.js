  /* 
	Title: Password validator
	Program Summary: The program allow user to create an acount and later sign in to access writing note option. 
	Functioality: The signup page cannot only save the inputs in the web browser's local storage as an object in an array and check the password meets the criteria. Secondly, login checks the input matches the local storage, and lastly, the notes will save the input straight in an array and save. There are other small functionality such as changing the page through
	Features: Buttons, labels, input, animations, links, and images.
	input and output: The application's first part has various inputs such as names, usernames, emails, and passwords, which with the help of an if condition would provide a true or false output. The second application would save the input as a string in an array in the local storage and later display it as an output for a reminder. 
	
	
	
	algorithm (mapping):

	  if (oldStorage !== null) {
		let storageExists = false;
		for (let i = 0; i < userSignIn.length; i++) {
		  if (JSON.stringify(userSignIn[i]) === oldStorage) {
			storageExists = true;
			break; // Exit loop since oldStorage already exists
		  }
		}
		if (!storageExists) {
		  userSignIn.push(oldStorage);
		}
	  }
-----------------------------------------------------------------------------------------------------------------------------------------------------
	If conditions: 
		  if (passwordInput.length < 8) {
			passwordRequirements.push(' 8 characters'); // Check if password has at least 8 characters
		  }
		  if (!/[A-Z]/.test(passwordInput)) {
			passwordRequirements.push('a capital letter'); // Check if password contains a capital letter
		  }
		  if (!/[a-z]/.test(passwordInput)) {
			passwordRequirements.push('a small letter'); // Check if password contains a small letter
		  }
		  if (!/[0-9]/.test(passwordInput)) {
			passwordRequirements.push('a number'); // Check if password contains a number
		  }
		  if (!/[\W!@#$%^&*()-_={[}\]|]/.test(passwordInput)) {
			passwordRequirements.push('a special character'); // Check if password contains a special character
		  }
------------------------------------------------------------------------------------------------------------------------------------------------
	Function:
		function showPassword() {
		  var passwordField = document.getElementById("password"); // Get password field from HTML
		  var passwordFieldConfirmed = document.getElementById("passwordconfirmed"); // Get password confirmation field from HTML
		  var passwordDisplay = document.getElementById("passwordDisplay"); // Get password display element from HTML

		  if (passwordField.type === "password") {
			passwordFieldConfirmed.type = "text"; // Show password confirmation field
			passwordField.type = "text"; // Show password field
			passwordDisplay.textContent = "Hide Password"; // Update password display text
		  } else {
			passwordFieldConfirmed.type = "password"; // Hide password confirmation field
			passwordField.type = "password"; // Hide password field
			passwordDisplay.textContent = "Show Password"; // Update password display text
		  }
		}
*/ 

//questions: can i return to yuou know

// start of functions


/*
Summary: This function handles the introduction and initialization of the program.
@params: none
@return: none
*/
function introduction() {
	const date = new Date(); // Get the current date
	const todaysDate = date.toLocaleDateString(); // Format the date as a string
	let username; // Initialize variable for username
	console.log('Title : Password Validator'); // Display program title
	console.log('Create task AP computer science principles' + todaysDate); // Display creation date
	console.log('Welcome to Password Validator'); // Display welcome message
	console.log(' ');
	console.log('The program embraces one of the most critical aspects of today\'s web design: the sign-in and login page. This program is a password validator that allows other programmers to use it for their website design.'); // Display program overview
	console.log('The application consists of the login, sign-up, and an additional page. The sign-up page collects basic information such as name, username, and password. One of the key features of this application is the ability to check the password against certain criteria. After sign-up, the website saves the information in local storage and can be accessed later through the last page. The login page validates the input against the stored data. Finally, after logging in, there is a page with a simple design providing user information along with a section for writing notes.'); // Display detailed information about the application
}

/*
Summary: This function handles the sign-up process, including input validation and saving user data.
@params: none
@return: none
*/
function signUp() {  
	  const emailInput = document.getElementById("email").value.toLowerCase(); // Get email input from HTML
	  const usernameInput = document.getElementById("username").value; // Get username input from HTML
	  const nameInput = document.getElementById("name").value; // Get name input from HTML
	  const passwordInput = document.getElementById("password").value; // Get password input from HTML
	  const passwordconfirmation = document.getElementById("passwordconfirmed").value; // Get password confirmation input from HTML
	  var passwordRequirements = passwordValidator(passwordInput); // Check password requirements
	  var oldStorage = localStorage.getItem("userdata"); // Get existing user data from local storage
	  var errorMessage = ''; // Initialize error message
	  let userSignIn = []; // Initialize array to save user data as a string
	  var userDataString = ""; // Initialize user data string
	  
	  const personalInformation = { // Create object with user input values
		username: usernameInput,
		email: emailInput,
		password: passwordInput,
		name: nameInput,
	  } 

	  if (passwordconfirmation !== passwordInput){ 
		alert("the password you entered doesn't match."); 
	  } else if (passwordRequirements.length > 0) {
		errorMessage = ' You are missing ' + passwordRequirements.join(', ');
		console.log(errorMessage); // Log missing password requirements
		alert(errorMessage);
	  } else {
		if (oldStorage !== null) {
		  userSignIn = JSON.parse(oldStorage); // Parse existing user data if available
		}
		userSignIn.push(personalInformation); // Push new sign-up data
		userDataString = JSON.stringify(userSignIn); // Convert user data to string
		localStorage.setItem("userdata", userDataString); // Save user data to local storage
		alert("Thank you for signing up! Your information is now stored successfully!"); // Display sign-up success message
	  }

	  if (oldStorage !== null) {
		let storageExists = false;
		for (let i = 0; i < userSignIn.length; i++) {
		  if (JSON.stringify(userSignIn[i]) === oldStorage) {
			storageExists = true;
			break; // Exit loop since oldStorage already exists
		  }
		}
		if (!storageExists) {
		  userSignIn.push(oldStorage);
		}
	  }
	}


	/*
	Summary: This function validates the password against certain criteria.
	@params: passwordInput - the password input to be validated
	@return: an array of missing password requirements
	*/
function passwordValidator(passwordInput) {
	 var passwordRequirements = []; // Initialize array for missing password requirements

	if (passwordInput.length < 8) {
		passwordRequirements.push(' 8 characters'); // Check if password has at least 8 characters
	}
	if (!/[A-Z]/.test(passwordInput)) {
		passwordRequirements.push('a capital letter'); // Check if password contains a capital letter
	}
	if (!/[a-z]/.test(passwordInput)) {
		passwordRequirements.push('a small letter'); // Check if password contains a small letter
	}
	if (!/[0-9]/.test(passwordInput)) {
		passwordRequirements.push('a number'); // Check if password contains a number
	}
	if (!/[@#$%&*]/.test(passwordInput)) {
		passwordRequirements.push('a special character'); // Check if password contains a special character
	}

	 return passwordRequirements; // Return array of missing password requirements
}

/*
Summary: This function handles the login process, including retrieving user data and validating credentials.
@params: none
@return: none
*/
function login() {
	const emailEntered = document.getElementById("loginEmail").value.toLowerCase(); // Get email input from HTML
	const passwordEntered = document.getElementById("loginPassword").value; // Get password input from HTML
	const userDataString = localStorage.getItem("userdata"); // Get user data from local storage
	const userSignIn = JSON.parse(userDataString); // Parse user data into array
	  
	if (userDataString === null) {
		alert("Sorry for the inconvenience of our website. There is a chance you have never signed up or something else happened."); // Display error message if user data is not found
		return;
	}
	  
	const foundUser = userSignIn.find(user => user.email === emailEntered); // Find user based on email
	  
	if (foundUser && foundUser.password === passwordEntered) {
		alert("Login successful!"); // Display success message for valid login
		window.location.href = "finalPage.html"; // Redirect to final page
	} else {
		alert("Invalid username or password."); // Display error message for invalid login
	}
}

/*
Summary: This function toggles the visibility of the password field.
@params: none
@return: none
*/
function showPassword() {
	var passwordField = document.getElementById("password"); // Get password field from HTML
	var passwordFieldConfirmed = document.getElementById("passwordconfirmed"); // Get password confirmation field from HTML
	var passwordDisplay = document.getElementById("passwordDisplay"); // Get password display element from HTML

	if (passwordField.type === "password") {
		passwordFieldConfirmed.type = "text"; // Show password confirmation field
		passwordField.type = "text"; // Show password field
		passwordDisplay.textContent = "Hide Password"; // Update password display text
	} else {
		passwordFieldConfirmed.type = "password"; // Hide password confirmation field
		passwordField.type = "password"; // Hide password field
		passwordDisplay.textContent = "Show Password"; // Update password display text
	 }
}

/*
Summary: This function saves the notes input to local storage and displays them.
@params: none
@return: none
*/
function saveNotes() {
	const noteInput = document.getElementById("notesHTML").value;

	// Get existing notes from local storage or initialize empty array
	var noteStorage = JSON.parse(localStorage.getItem("notes") || "[]");

	// Add new note to array and remove duplicates
	noteStorage.push(noteInput);
	noteStorage = [...new Set(noteStorage)];

	// Construct HTML string with notes and their indexes
	var noteString = "";
	for (var i = 0; i < noteStorage.length; i++) {
	  noteString += (i + 1) + ". " + noteStorage[i] + "<br/>";
	}

	// Save notes array to local storage
	localStorage.setItem("notes", JSON.stringify(noteStorage));

	// Display saved notes
	document.getElementById("saveThings").innerHTML = noteString;

	// Erase the placeholder text
	document.getElementById("notesHTML").value = "";
}

/*
Summary: This function clears saved notes from local storage and removes them from display.
@params: none
@return: none
*/
function erase(){
	localStorage.removeItem("notes"); // Remove saved notes from local storage
	document.getElementById("saveThings").innerHTML = ""; // Clear displayed notes
}

/*
Summary: This function provides an outro message for the user interface.
@params: none
@return: none
*/
function outro() {  
	console.log("Thank you for visiting our website and trusting us with your information.");
	console.log("We are happy to provide services like this and we hope we can improve our website. For any feedback, please contact me via email at danynorouzi@gmail.com");
}


//End of functions


// Beginning of Main 
introduction();
outro();
// End of Main
// End of Program 










/*
Note:
the thing about our code is like evvery one else it uses local storage and an object so it is not figure out how that part works. What I want to just mention. we tried to use .join("\n") to make the notes in the login page look seperate, or even i decided to push an enter, but it doesn't really work because it is string and the whole thing was one of the bonuses. Other part of code works completly and the thing is that if you look at console, after signing up you can see the array with all of the obects. 


Test Note:
function specialCharacter(input) {  
  const specialchar = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')' ]
    for (i = 0; i < input.length; i++) {
      for (j = 0; j < specialchar.length; j++) { 
        if (input[i] === specialchar[j]) {
          return true
        }
    }
  }
}


function isLongEnough(input) {
  if (input.length > 8) {
    return true
  }
}


function hasCapital(input) {
  for (i = 0; i < input.length; i++) {
    if (input[i] == input[i].toUpperCase()) {
      return true
    } 
  }  
}


function hasLowerCase(input) {
  for (i = 0; i < input.length; i++) {
    if (input[i] == input[i].toLowerCase()) {
      return true
    } 
  }  
}


//try entering a password in the sign in 
function isPasswordValid(input){


  if (((hasCapital(input)) == true) && ((hasLowerCase(input)) == true) && ((isLongEnough(input)) == true) && (specialCharacter(input) == true)) {
    console.log("Valid Password")


  } else if (((hasCapital(input)) == true) && ((hasLowerCase(input)) == true) && ((isLongEnough(input)) == true) && (specialCharacter(input) !== true)) {
    console.log("Make sure you have a special character")

  } else if (((hasCapital(input)) == true) && ((hasLowerCase(input)) == true) && ((isLongEnough(input)) !== true) && (specialCharacter(input) == true)) {
    console.log("Make sure the password is over 8 characters")

  } else if (((hasCapital(input)) == true) && ((hasLowerCase(input)) !== true) && ((isLongEnough(input)) == true) && (specialCharacter(input) == true)) {
    console.log("Make sure your password includes a small letter")

  } else if (((hasCapital(input)) !== true) && ((hasLowerCase(input)) !== true) && ((isLongEnough(input)) == true) && (specialCharacter(input) == true)) {
    console.log("Make sure your password includes a capital letter")

  } else {

  }


}
*/