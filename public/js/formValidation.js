const isFormValid = async (username, options) => {

    // API url
    const url = "http://localhost:4000/get_users";
    // API params
    const params = options ? Qs.stringify(options) : null;

    try {
        // API response object
        const result = fetch(`${url}?${params}`);
        // Response parsing
        const allUsers = await (await result).json();

        // Return false if username already present in application
        return !allUsers.map(user => user.username).includes(username);
    } catch (error) {
        // Log catched error 
        console.log(error);

        // If error return false 
        return false;
    }
};

const goToNextPage = async (form) => {
    // Get username value from form
    const username = document.getElementById('username').value;
    // Wait for username validation
    const isValidUsername = await isFormValid(username, { include: { deleted: false } });

    // Alert for a same username or form submission
    if (!isValidUsername) {
        alert('Username already in use or you are already in');
    } else {
        form.submit();
    }
};
