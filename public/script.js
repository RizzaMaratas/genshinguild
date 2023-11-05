document.addEventListener("DOMContentLoaded", function () {
    var menuLinks = document.querySelector('.dropdown-content');
    var menuButton = document.querySelector('.dropbtn');

    // check if the menuLinks and menuButton exist
    if (menuLinks && menuButton) {
        menuButton.addEventListener('click', function () {
            if (menuLinks.style.display === 'block') {
                menuLinks.style.display = 'none';
            } else {
                menuLinks.style.display = 'block';
            }
        });

        // close the menu when clicking outside of it
        document.addEventListener('click', function (event) {
            if (!menuButton.contains(event.target) && !menuLinks.contains(event.target)) {
                menuLinks.style.display = 'none';
            }
        });
    }
});