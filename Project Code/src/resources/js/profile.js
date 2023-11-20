document.addEventListener('DOMContentLoaded', function () {
    var editProfileBtn = document.getElementById('editProfileBtn');
    var editProfileForm = document.getElementById('editProfileForm');

    // Add click event listener to the button
    editProfileBtn.addEventListener('click', function () {
        // Toggle the "hidden" class to show/hide the form
        editProfileForm.classList.toggle('hidden');
        
        // Get the height of the form
        var formHeight = document.getElementById('editProfileForm').offsetHeight;

        // Adjust the height of the profileContainer
        document.getElementById('profileContainer').style.height = (formHeight + 500) + 'px';
    });

    editProfileForm.addEventListener('submit', function (event) {
        editProfileForm.classList.toggle('hidden');
        document.getElementById('profileContainer').style.height = '500px';
    });
});