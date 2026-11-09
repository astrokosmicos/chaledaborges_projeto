document.addEventListener('DOMContentLoaded', () => {

    const menuBtn = document.querySelector('.menu-btn');
    const mainNav = document.querySelector('.main-nav');

    if (menuBtn && mainNav) {
        menuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
});